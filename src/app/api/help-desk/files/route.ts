import { frappeBaseUrl } from "@/lib/api/frappe";
import { jsonFail } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Attachments are screenshots, slips and short voice notes — 30 MB is ample. */
const MAX_BYTES = 30 * 1024 * 1024;

type Kind = "image" | "pdf" | "audio" | "video" | "text" | "other";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|ico|svg)$/i;
const PDF_EXT = /\.pdf$/i;
const MEDIA_EXT = /\.(webm|mp3|m4a|wav|ogg|oga|aac|mp4)$/i;

const startsWith = (bytes: Uint8Array, sig: number[], at = 0) =>
  bytes.length >= at + sig.length && sig.every((value, index) => bytes[at + index] === value);

const ascii = (bytes: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...bytes.subarray(at, at + length));

/**
 * What the bytes really are — deliberately *not* what the URL or the upstream
 * `content-type` claims.
 *
 * The reported bug was an `<img>` that failed with "the bytes did not decode as
 * an image": the proxy had trusted a `200` and streamed a page or an error
 * payload under an image name. Reading the first bytes is the only answer the
 * browser agrees with.
 */
function sniffKind(bytes: Uint8Array, contentType: string): Kind {
  const head = bytes.subarray(0, Math.min(bytes.length, 1024));
  const type = contentType.toLowerCase();

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image"; // png
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image"; // jpeg
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image"; // gif8
  if (startsWith(bytes, [0x42, 0x4d])) return "image"; // bmp
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8, 4) === "WEBP") return "image";
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) return "pdf"; // %PDF
  if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) return "audio"; // OggS
  if (startsWith(bytes, [0x49, 0x44, 0x33])) return "audio"; // ID3
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && ascii(bytes, 8, 4) === "WAVE") return "audio";
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "video"; // matroska/webm
  // ftyp box at offset 4: mp4 / m4a / avif / mov.
  if (bytes.length > 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand.startsWith("avif") || brand.startsWith("heic")) return "image";
    return brand.startsWith("M4A") ? "audio" : "video";
  }

  // An SVG is text that starts with a tag.
  const text = ascii(head, 0, Math.min(head.length, 256)).replace(/^\uFEFF/, "").trimStart().toLowerCase();
  if (text.startsWith("<?xml") || text.startsWith("<svg")) return "image";
  if (text.startsWith("<!doctype html") || text.startsWith("<html") || text.startsWith("<body")) {
    return "text";
  }
  if (type.startsWith("text/html")) return "text";
  if (type.includes("json")) return "text";
  if (type.startsWith("image/")) return bytes.length > 64 ? "image" : "text";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("application/pdf")) return "pdf";
  if (text.startsWith("{") || text.startsWith("[")) return "text";

  return "other";
}

/** Does a body of this kind satisfy a URL with this extension? */
function fits(ext: string, kind: Kind): boolean {
  if (IMAGE_EXT.test(ext)) return kind === "image";
  if (PDF_EXT.test(ext)) return kind === "pdf";
  if (MEDIA_EXT.test(ext)) return kind === "audio" || kind === "video";
  return kind !== "text";
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  avif: "image/avif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  aac: "audio/aac",
  mp4: "video/mp4",
};

/**
 * Private attachment stream.
 *
 * Ticket files uploaded through the portal are Frappe **private** files, which
 * only a signed-in Frappe session can read. The portal browser has a portal
 * cookie, not a Frappe one — so this same-origin route re-reads the file with
 * the portal session's `sid` and streams it back.
 *
 * Only `/files/` and `/private/files/` URLs are accepted: the caller cannot use
 * this route as a general ERP fetcher.
 *
 * Every candidate body is **sniffed before it is served**. A `200` is not a
 * promise: a withdrawn session answers the login page and a refused row can come
 * back as an error payload, and both used to reach the `<img>` as "an image that
 * did not decode". Only bytes that match the extension are streamed; anything
 * else falls through to the ticket-scoped `stream_file` (and then the sibling
 * spelling), and if nothing qualifies the caller gets a typed error instead of
 * garbage.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return jsonFail("Please sign in to continue.", "not_authenticated", 401);

  const base = frappeBaseUrl();
  if (!base) return jsonFail("The portal is not connected to an ERP server yet.", "not_configured", 502);

  const url = new URL(request.url).searchParams.get("url") || "";
  // Accept only a Frappe file path, never a full URL or a traversal.
  if (!url.startsWith("/private/files/") && !url.startsWith("/files/")) {
    return jsonFail("Unknown file.", "not_found", 404);
  }
  if (url.includes("..") || url.includes("\\")) {
    return jsonFail("Unknown file.", "not_found", 404);
  }

  const target = new URL(base);
  const headers: Record<string, string> = {
    cookie: `sid=${sid}`,
    "x-forwarded-host": target.host,
    "x-forwarded-proto": target.protocol.replace(":", ""),
  };

  const load = async (href: string) => {
    try {
      return await fetch(href, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      return null;
    }
  };

  // One upload is written under either prefix — `/private/files/x` (a portal
  // upload) or `/files/x` (a Desk upload) — and a message row can quote the other
  // form than the one the ERP stored. Trying both is what keeps the picture
  // independent of that spelling.
  const sibling = (href: string) => {
    const name = href.split("/").pop() || "";
    if (!name) return null;
    return href.startsWith("/private/files/") ? `/files/${name}` : `/private/files/${name}`;
  };

  const streamUrl = (href: string) =>
    `${base}/api/method/shikkha_os.api.v1.help_desk_files.stream_file?url=${encodeURIComponent(href)}`;

  // Every attempt is recorded so a failure says *where* it failed (403 vs 404 vs
  // a 200 that carried the wrong bytes) instead of a blank "did not load".
  const attempts: { href: string; status: number; via?: string; kind?: Kind }[] = [];

  const ext = (url.split("/").pop() || "").toLowerCase();

  let served: { href: string; bytes: Uint8Array; kind: Kind } | null = null;
  let sawHtml = false;
  // A 2xx that carried something other than the file. It outranks a later 404
  // from the other spelling: "the ERP answered a page" is the real diagnosis.
  let sawWrongBytes = false;
  let lastStatus = 0;

  for (const candidate of [url, sibling(url)].filter((value): value is string => Boolean(value))) {
    for (const [href, via] of [
      [`${base}${candidate}`, undefined],
      [streamUrl(candidate), "stream_file"],
    ] as const) {
      const answer = await load(href);
      lastStatus = answer?.status ?? 0;
      if (!answer || !answer.ok || !answer.body) {
        attempts.push({ href: candidate, status: lastStatus, via, kind: "text" });
        continue;
      }

      const declared = answer.headers.get("content-length");
      if (declared && Number(declared) > MAX_BYTES) {
        attempts.push({ href: candidate, status: answer.status, via, kind: "other" });
        lastStatus = 413;
        continue;
      }

      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await answer.arrayBuffer());
      } catch {
        attempts.push({ href: candidate, status: answer.status, via, kind: "other" });
        continue;
      }
      if (bytes.length > MAX_BYTES) {
        attempts.push({ href: candidate, status: answer.status, via, kind: "other" });
        lastStatus = 413;
        continue;
      }

      const kind = sniffKind(bytes, answer.headers.get("content-type") || "");
      attempts.push({ href: candidate, status: answer.status, via, kind });
      if (kind === "text") sawHtml = true;
      if (fits(ext, kind)) {
        served = { href: candidate, bytes, kind };
        break;
      }
      sawWrongBytes = true;
    }
    if (served) break;
  }

  if (!served) {
    const code =
      lastStatus === 413
        ? "too_large"
        : sawHtml || sawWrongBytes
          ? "not_a_file"
          : lastStatus === 0
            ? "upstream_unreachable"
            : lastStatus === 403 || lastStatus === 404
              ? "not_found"
              : "not_a_file";
    const payload = {
      error:
        code === "not_found"
          ? "The file could not be found."
          : code === "too_large"
            ? "The file is too large to open here."
            : "The file could not be loaded right now.",
      code,
      // `sawHtml` separates "the ERP answered a page" from "the ERP answered 403",
      // which is the difference between a session and a permission problem.
      sawHtml,
      attempts,
    };
    return new Response(JSON.stringify(payload), {
      status: code === "not_found" ? 404 : 502,
      headers: { "content-type": "application/json", "x-content-type-options": "nosniff" },
    });
  }

  const fileName = decodeURIComponent(served.href.split("/").pop() || "attachment");
  const suffix = (fileName.split(".").pop() || "").toLowerCase();
  // The sniffed kind decides the header — Frappe's own mimetype is only a hint.
  const byKind: Record<Kind, string | undefined> = {
    image: "image/png",
    pdf: "application/pdf",
    audio: "audio/mpeg",
    video: "video/mp4",
    text: undefined,
    other: undefined,
  };
  const contentType = MIME_BY_EXT[suffix] || byKind[served.kind] || "application/octet-stream";

  return new Response(served.bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-length": String(served.bytes.length),
      "content-disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=60",
      "x-content-type-options": "nosniff",
    },
  });
}

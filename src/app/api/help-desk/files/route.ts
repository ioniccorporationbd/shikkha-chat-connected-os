import { frappeBaseUrl } from "@/lib/api/frappe";
import { jsonFail } from "@/lib/api/respond";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Every attempt is recorded so a failure says *where* it failed (403 vs 404 vs
  // an unreachable ERP) instead of a blank "did not load".
  const attempts: { href: string; status: number; via?: string }[] = [];
  let upstream: Response | null = null;
  let served = url;

  const streamUrl = (href: string) =>
    `${base}/api/method/shikkha_os.api.v1.help_desk_files.stream_file?url=${encodeURIComponent(href)}`;

  for (const candidate of [url, sibling(url)].filter((value): value is string => Boolean(value))) {
    let answer = await load(`${base}${candidate}`);
    attempts.push({ href: candidate, status: answer?.status ?? 0 });
    if (!answer) continue;

    // An employee's reply attachment lives on an **agent-side** row (Comment /
    // Communication), which a customer session may not read — Frappe answers 403.
    // A withdrawn session instead answers 200 with the login page, which an
    // <img> cannot decode, so HTML is refused here as well.
    const refused = !answer.ok || /text\/html/i.test(answer.headers.get("content-type") || "");
    if (refused) {
      const viaTicket = await load(streamUrl(candidate));
      attempts.push({ href: candidate, status: viaTicket?.status ?? 0, via: "stream_file" });
      if (viaTicket && viaTicket.ok && viaTicket.body) answer = viaTicket;
    }

    if (answer.ok && answer.body && !/text\/html/i.test(answer.headers.get("content-type") || "")) {
      upstream = answer;
      served = candidate;
      break;
    }
    upstream = answer;
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    const status = upstream?.status ?? 0;
    const code = status === 403 || status === 404 ? "not_found" : "upstream_unreachable";
    const payload = {
      error:
        status === 403 || status === 404
          ? "The file could not be found."
          : "The file could not be loaded right now.",
      code,
      attempts,
    };
    return new Response(JSON.stringify(payload), {
      status: status === 403 || status === 404 ? 404 : 502,
      headers: { "content-type": "application/json" },
    });
  }

  const fileName = decodeURIComponent(served.split("/").pop() || "attachment");
  // Frappe usually sends the right type; fall back to the extension so images,
  // PDFs and voice notes still render inline when it is generic.
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const byExt: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    webm: "audio/webm",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };
  const upstreamType = upstream.headers.get("content-type") || "";
  const contentType =
    upstreamType && !/octet-stream/i.test(upstreamType)
      ? upstreamType
      : byExt[ext] || "application/octet-stream";
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=60",
    },
  });
}

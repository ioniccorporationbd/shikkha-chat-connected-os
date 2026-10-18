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
  let upstream: Response;
  try {
    upstream = await fetch(`${base}${url}`, {
      headers: {
        cookie: `sid=${sid}`,
        "x-forwarded-host": target.host,
        "x-forwarded-proto": target.protocol.replace(":", ""),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return jsonFail("The file could not be loaded right now.", "upstream_unreachable", 502);
  }

  if (!upstream.ok || !upstream.body) {
    return jsonFail(
      upstream.status === 403 || upstream.status === 404
        ? "The file could not be found."
        : "The file could not be loaded right now.",
      "not_found",
      upstream.status === 403 || upstream.status === 404 ? 404 : 502
    );
  }

  const fileName = decodeURIComponent(url.split("/").pop() || "attachment");
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/octet-stream",
      "content-disposition": `inline; filename="${fileName.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=60",
    },
  });
}

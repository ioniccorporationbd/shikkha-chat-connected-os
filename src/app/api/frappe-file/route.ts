import { frappeBaseUrl } from "@/lib/api/frappe";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Pictures only — timeline avatars. Anything bigger/other is not proxied. */
const MAX_BYTES = 4 * 1024 * 1024;
/** `raw=1` (the Attachments tab) may hand over any file type, still bounded. */
const MAX_RAW_BYTES = 25 * 1024 * 1024;

/**
 * Resolve a site-relative path (`/files/x.png`, `/private/files/x.png`) to an
 * absolute URL on the ERP host.
 *
 * Returns `null` for anything we will not fetch. The value comes from ERP
 * records (a Comment's `comment_by` user picture), so an absolute URL is only
 * honoured when it points at the ERP host itself — otherwise this route would
 * be an SSRF vector.
 */
function resolveFileUrl(path: string, base: string): string | null {
  const value = (path ?? "").trim();
  if (!value) return null;

  let baseUrl: URL;
  try {
    baseUrl = new URL(base);
  } catch {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const absolute = new URL(value);
      return absolute.host === baseUrl.host ? absolute.toString() : null;
    } catch {
      return null;
    }
  }

  if (!value.startsWith("/") || value.startsWith("//")) return null;

  return new URL(value, baseUrl.origin).toString();
}

/**
 * Same-origin streaming proxy for ERP-hosted pictures.
 *
 * Timeline avatars hold `user_image` values like `/files/sir_shakil_10.jpeg`.
 * The browser cannot load those from the portal's own origin, and without this
 * proxy every avatar renders as a broken image. The route forwards the caller's
 * own session cookie, so private files resolve exactly as they do in Desk.
 *
 * Cases that must fall back to the monogram answer 404: no session, missing
 * file, non-image bytes (a login HTML page served with 200 is refused too).
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return new Response(null, { status: 401 });

  const url = new URL(request.url);
  const remote = resolveFileUrl(url.searchParams.get("path") ?? "", frappeBaseUrl());
  if (!remote) return new Response(null, { status: 404 });

  // `raw=1`: the Attachments tab opens the lead's files (PDFs, sheets, …) in a
  // new tab — those need the caller's session too, so they stream through here
  // instead of exposing the ERP host. Same host-only rule, larger size cap.
  const raw = url.searchParams.get("raw") === "1";

  let upstream: Response;
  try {
    upstream = await fetch(remote, {
      headers: {
        Accept: "image/*",
        Cookie: `${SESSION_COOKIE}=${sid}`,
      },
      cache: "no-store",
      redirect: "follow",
    });
  } catch {
    return new Response(null, { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const declaredLength = Number(upstream.headers.get("content-length") ?? 0);

  // An HTML page served with 200 (Frappe's login wall) must never pass as a file.
  const looksBlocked =
    contentType.includes("text/html") || contentType.includes("application/json");

  if (
    !upstream.ok ||
    looksBlocked ||
    (!raw && !contentType.startsWith("image/")) ||
    declaredLength > (raw ? MAX_RAW_BYTES : MAX_BYTES) ||
    !upstream.body
  ) {
    return new Response(null, { status: 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "private, max-age=300",
      "content-disposition": "inline",
    },
  });
}

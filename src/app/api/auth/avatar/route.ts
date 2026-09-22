import { callFrappe, frappeBaseUrl } from "@/lib/api/frappe";
import { readCookie, SESSION_COOKIE } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A profile picture is a small asset; anything larger is not one we will proxy. */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Resolve the session's `user_image` to an absolute URL on the ERP host.
 *
 * Returns `null` for anything we will not fetch:
 *
 * * no image set on the account,
 * * a path that is not site-relative (`/files/...`),
 * * an absolute URL pointing at some *other* host — the value comes from the
 *   user's own record, so fetching it blindly would be an SSRF vector.
 */
function resolveImageUrl(image: string, base: string): string | null {
  const value = (image ?? "").trim();
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
 * Same-origin picture proxy for the account menu.
 *
 * The ERP serves `user_image` from its own host, so the browser cannot load it
 * directly from the portal. This route reads the caller's own session, asks the
 * ERP where *their* picture lives, and streams the bytes back. It never accepts
 * a URL from the caller, so it cannot be pointed at anything else.
 *
 * A missing/signed-out/refused picture answers 404, which is what makes the
 * monogram fallback in `UserAvatar` take over.
 */
export async function GET(request: Request) {
  const sid = readCookie(request, SESSION_COOKIE);
  if (!sid) return new Response(null, { status: 401 });

  const session = await callFrappe<SessionPayload>("shikkha_os.api.v1.auth.session", { sid });
  if (!session.ok || !session.data?.authenticated) return new Response(null, { status: 404 });

  const url = resolveImageUrl(session.data.user?.user_image ?? "", frappeBaseUrl());
  if (!url) return new Response(null, { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { Accept: "image/*" },
      cache: "no-store",
      redirect: "error",
    });
  } catch {
    return new Response(null, { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const declaredLength = Number(upstream.headers.get("content-length") ?? 0);

  if (
    !upstream.ok ||
    !contentType.startsWith("image/") ||
    declaredLength > MAX_BYTES ||
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

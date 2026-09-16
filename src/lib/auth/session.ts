/**
 * Portal-side session constants and helpers.
 *
 * This module is imported from the Edge middleware, so it must stay free of
 * `next/headers`, `node:*` and any other server-only import.
 */

/** HttpOnly cookie that holds the ERP `sid` for the portal origin. */
export const SESSION_COOKIE = "shikkha_os_sid";

export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/userDashboard";

/** Mirrors the backend default; `login` returns the authoritative value. */
export const DEFAULT_SESSION_SECONDS = 24 * 60 * 60;

type HeaderCarrier = { headers: Headers; url?: string };

/** True when the browser reached the portal over HTTPS. */
export function isSecureRequest(request: HeaderCarrier): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0].trim() === "https";
  }

  if (request.url) {
    try {
      return new URL(request.url).protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}

export function sessionCookieOptions(request: HeaderCarrier, maxAge = DEFAULT_SESSION_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
    maxAge,
  };
}

/** Minimal `Cookie:` header parser - avoids pulling `next/headers` into the Edge. */
export function readCookie(request: { headers: Headers }, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const segment of header.split(";")) {
    const index = segment.indexOf("=");
    if (index === -1) continue;

    if (segment.slice(0, index).trim() === name) {
      return segment.slice(index + 1).trim() || null;
    }
  }

  return null;
}

/** Pull a cookie value out of one or more `Set-Cookie` headers. */
export function extractCookieValue(setCookies: string[], name: string): string | null {
  const pattern = new RegExp(`(?:^|[,\\s])${name}=([^;,\\s]+)`);

  for (const header of setCookies) {
    const match = header.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Only ever return an internal path, so `?next=` cannot be used as an open
 * redirect.
 */
export function safeRedirectPath(candidate: string | null | undefined, fallback = DASHBOARD_PATH): string {
  if (!candidate) return fallback;

  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;

  return value;
}

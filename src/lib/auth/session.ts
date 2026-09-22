/**
 * Portal-side session constants and helpers.
 *
 * This module is imported from the Edge middleware, so it must stay free of
 * `next/headers`, `node:*` and any other server-only import.
 */

/** HttpOnly cookie that holds the ERP `sid` for the portal origin. */
export const SESSION_COOKIE = "shikkha_os_sid";

export const LOGIN_PATH = "/login";

/** Desk-style panel route — System Users land here. */
export const STAFF_DASHBOARD_PATH = "/userDashboard";
/** Client portal route — website/customer users land here. */
export const CLIENT_DASHBOARD_PATH = "/clientDashboard";
/**
 * Default landing route. This stays the *staff* route on purpose: it is the
 * fallback used while a session is still unknown, and the ERP's
 * `dashboard_route` / `user_type` override it as soon as the user is loaded.
 */
export const DASHBOARD_PATH = STAFF_DASHBOARD_PATH;

/** Every route that renders the dashboard shell. */
export const DASHBOARD_PATHS: readonly string[] = [STAFF_DASHBOARD_PATH, CLIENT_DASHBOARD_PATH];

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

/**
 * The fields that decide which dashboard a session belongs to. Structural
 * rather than `SessionUser` on purpose: the Edge middleware imports this module,
 * so it must not pull in the payload types.
 */
export type DashboardPersona =
  | {
      dashboard_route?: string;
      user_type?: string;
      is_admin?: boolean;
      roles?: readonly string[];
    }
  | null
  | undefined;

/** True for any route that renders the dashboard shell. */
export function isDashboardPath(path: string | null | undefined): boolean {
  if (!path) return false;

  return DASHBOARD_PATHS.some((base) => path === base || path.startsWith(`${base}/`));
}

/**
 * Which dashboard a session belongs on.
 *
 * The ERP is authoritative (`dashboard_route`, mirrored in
 * `shikkha_os/utils/profiles.py`): a `System User` gets the desk panel, a
 * `Website User` (customer) gets the client dashboard. The local checks are the
 * fallback for an ERP that has not been updated yet, and they keep the two
 * routes from cross-rendering in either direction.
 */
export function dashboardPathFor(user: DashboardPersona): string {
  const route = (user?.dashboard_route ?? "").trim();
  if (isDashboardPath(route)) return route;

  const userType = (user?.user_type ?? "").trim().toLowerCase();
  if (userType === "system user") return STAFF_DASHBOARD_PATH;
  if (userType === "website user") return CLIENT_DASHBOARD_PATH;

  if (user?.is_admin) return STAFF_DASHBOARD_PATH;
  if ((user?.roles ?? []).includes("Customer")) return CLIENT_DASHBOARD_PATH;

  return STAFF_DASHBOARD_PATH;
}

/**
 * Resolve a post-login destination.
 *
 * A dashboard destination is always chosen by role, never by `?next=` — sending
 * a customer to `/userDashboard` (or staff to `/clientDashboard`) is exactly the
 * bug this guards against. Any other internal path is honoured as-is.
 */
export function preferredRedirect(
  candidate: string | null | undefined,
  user?: DashboardPersona
): string {
  const target = safeRedirectPath(candidate);

  return isDashboardPath(target) ? dashboardPathFor(user) : target;
}

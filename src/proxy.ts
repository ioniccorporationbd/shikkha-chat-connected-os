import { NextResponse, type NextRequest } from "next/server";

import { DASHBOARD_PATH, LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Cheap gate for the dashboard.
 *
 * The cookie's *presence* is only evidence that a session may exist - the page
 * itself re-verifies against the ERP and redirects when the session is really
 * gone. This exists so a visitor with no cookie never sees a dashboard shell.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`.)
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && pathname.startsWith(DASHBOARD_PATH)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/userDashboard", "/userDashboard/:path*"],
};

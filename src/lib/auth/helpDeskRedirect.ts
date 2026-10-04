import { cookies } from "next/headers";

import { callFrappe } from "@/lib/api/frappe";
import {
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";
import { HELP_DESK_SEGMENT } from "@/lib/help-desk/paths";

/**
 * Resolve where a retired public `/help-desk*` URL should now send the visitor.
 *
 * The ticket centre lives inside the dashboard shell, so an old bookmark is
 * forwarded to the caller's role-aware dashboard help-desk route. Guests have
 * no dashboard yet, so they are sent to sign in first (the `next` hop then
 * resolves by role after login).
 *
 * Server-only: it reads the session cookie and calls the ERP.
 */
export async function helpDeskRedirectTarget(suffix = ""): Promise<string> {
  const publicRoot = `/${HELP_DESK_SEGMENT}`;
  const loginTarget = `${LOGIN_PATH}?next=${encodeURIComponent(publicRoot)}`;

  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) return loginTarget;

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", { sid });

  if (!result.ok) {
    if (result.status === 401) return `${loginTarget}&expired=1`;
    // The portal can't tell the role right now — send the visitor to sign in
    // rather than re-entering this same redirect.
    return LOGIN_PATH;
  }

  return `${dashboardPathFor(result.data.user)}/${HELP_DESK_SEGMENT}${suffix}`;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { callFrappe } from "@/lib/api/frappe";
import {
  LOGIN_PATH,
  SESSION_COOKIE,
  STAFF_DASHBOARD_PATH,
  dashboardPathFor,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";
import { HELP_DESK_SEGMENT } from "@/lib/help-desk/paths";

export const dynamic = "force-dynamic";

/**
 * The Messages inbox was retired from the Help Desk on BOTH panels: replies
 * live on the ticket's own timeline, so a second inbox duplicated the
 * conversation and split the unread state. Old bookmarks and deep links land
 * on the role-appropriate overview instead of a dead route.
 */
export default async function RetiredHelpDeskMessages() {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(LOGIN_PATH);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", { sid });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?expired=1`);
  }

  const base = result.ok ? dashboardPathFor(result.data.user) : STAFF_DASHBOARD_PATH;
  redirect(`${base}/${HELP_DESK_SEGMENT}`);
}

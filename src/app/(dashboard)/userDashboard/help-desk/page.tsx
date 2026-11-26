import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  CLIENT_DASHBOARD_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
  STAFF_DASHBOARD_PATH,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";
import { HELP_DESK_SEGMENT } from "@/lib/help-desk/paths";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help Desk · Shikkha Chat",
  description: "Your Shikkha Chat support tickets.",
};

const SUFFIX = "";
const DESK_ROOT = `${STAFF_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}${SUFFIX}`;

/**
 * Dashboard Help Desk (staff): the ticket centre's smart overview, rendered
 * inside the `/userDashboard` shell. Mirrors the dashboard guard exactly —
 * session required, and a portal customer hitting the desk route is sent to the
 * client panel's equivalent help desk.
 */
export default async function UserHelpDeskPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DESK_ROOT)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", { sid });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DESK_ROOT)}&expired=1`);
  }

  if (result.ok && dashboardPathFor(result.data.user) === CLIENT_DASHBOARD_PATH) {
    redirect(`${CLIENT_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}${SUFFIX}`);
  }

  return (
    <DashboardShell
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

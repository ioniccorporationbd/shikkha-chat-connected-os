import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  STAFF_DASHBOARD_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
  CLIENT_DASHBOARD_PATH,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";
import { HELP_DESK_SEGMENT } from "@/lib/help-desk/paths";

const DESK_ROOT = `${STAFF_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}/problems`;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Problem · Shikkha Chat",
};

/** Dashboard Help Desk: problem. */
export default async function UserHelpDeskProblemPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
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
    // Customers have no problem queue; send them to the same ticket in Messages.
    redirect(`${CLIENT_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}/messages/${ticketId}`);
  }

  return (
    <DashboardShell
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

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
  title: "New ticket · Shikkha Chat",
};

const SUFFIX = "/new";
const DESK_ROOT = `${CLIENT_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}${SUFFIX}`;

/** Dashboard Help Desk (client): the New Ticket form inside the client shell. */
export default async function ClientHelpDeskNewPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DESK_ROOT)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", { sid });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DESK_ROOT)}&expired=1`);
  }

  if (result.ok && dashboardPathFor(result.data.user) === STAFF_DASHBOARD_PATH) {
    redirect(`${STAFF_DASHBOARD_PATH}/${HELP_DESK_SEGMENT}${SUFFIX}`);
  }

  return (
    <DashboardShell
      scope="client"
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

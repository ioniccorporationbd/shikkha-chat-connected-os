import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  CLIENT_DASHBOARD_PATH,
  LEADS_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads · Shikkha Chat",
  description: "The CRM lead board, straight from Desk.",
};

/**
 * The CRM lead board on its own URL (`/userDashboard/leads`).
 *
 * Same dashboard shell as the overview — rail, header, profile card and sign-out
 * are identical; only the panel differs. The rows come from the ERP's own
 * `CRM Lead` list through `/api/leads`, so the Desk permissions of the signed-in
 * user decide what is visible.
 */
export default async function LeadsPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(LEADS_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(LEADS_PATH)}&expired=1`);
  }

  // Portal customers belong on `/clientDashboard`: this is the desk shell.
  if (result.ok && dashboardPathFor(result.data.user) === CLIENT_DASHBOARD_PATH) {
    redirect(CLIENT_DASHBOARD_PATH);
  }

  return (
    <DashboardShell
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  dashboardPathFor,
  CLIENT_DASHBOARD_PATH,
  LOGIN_PATH,
  SESSION_COOKIE,
  STAFF_DASHBOARD_PATH,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client dashboard · Shikkha Chat",
  description: "Your Shikkha Chat client panel.",
};

/**
 * Client-facing dashboard (`/clientDashboard`).
 *
 * Same server-rendered payload as `/userDashboard` — the ERP already scopes
 * every number to the account — but the shell renders the client nav. The two
 * pages cross-guard each other: whichever route an account's role does not
 * belong on redirects to the one it does, so the URL and the view always agree.
 */
export default async function ClientDashboardPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CLIENT_DASHBOARD_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CLIENT_DASHBOARD_PATH)}&expired=1`);
  }

  // Desk accounts have their own panel; never render the client shell for them.
  if (result.ok && dashboardPathFor(result.data.user) === STAFF_DASHBOARD_PATH) {
    redirect(STAFF_DASHBOARD_PATH);
  }

  return (
    <DashboardShell
      scope="client"
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

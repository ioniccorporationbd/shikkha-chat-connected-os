import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  CHECKIN_PATH,
  CLIENT_DASHBOARD_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check In / Out · Shikkha Chat",
  description: "Record your daily check in / check out.",
};

/**
 * The Employee Check In / Out card on its own URL
 * (`/userDashboard/check-in-out`).
 *
 * It renders the same dashboard shell as the overview, so the rail, header,
 * profile card and sign-out are identical — only the panel differs.
 */
export default async function CheckInOutPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CHECKIN_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CHECKIN_PATH)}&expired=1`);
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

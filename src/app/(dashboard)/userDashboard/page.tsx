import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import { DASHBOARD_PATH, LOGIN_PATH, SESSION_COOKIE } from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard · Shikkha Chat",
  description: "Your Shikkha Chat panel.",
};

/**
 * Server-rendered dashboard: the ERP payload is fetched here (server-to-server,
 * with the HttpOnly `sid`), so the first paint already has real data. The client
 * shell only takes over for refresh and sign-out.
 */
export default async function UserDashboardPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DASHBOARD_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(DASHBOARD_PATH)}&expired=1`);
  }

  return (
    <DashboardShell
      initialData={result.ok ? result.data : undefined}
      initialError={result.ok ? undefined : result.message}
    />
  );
}

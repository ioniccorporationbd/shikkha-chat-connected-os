import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  CLIENT_DASHBOARD_PATH,
  JOURNAL_ENTRY_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal Entry · Shikkha Chat",
  description: "Create a journal entry — debit and credit accounts in balance.",
};

/**
 * The staff Journal Entry creator on its own URL (`/userDashboard/journal-entry`),
 * directly below Payment Entry in the rail. Renders the same dashboard shell as
 * the overview. A portal customer is bounced to `/clientDashboard`.
 */
export default async function JournalEntryPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(JOURNAL_ENTRY_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(JOURNAL_ENTRY_PATH)}&expired=1`);
  }

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

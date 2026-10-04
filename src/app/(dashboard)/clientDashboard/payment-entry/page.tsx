import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  dashboardPathFor,
  LOGIN_PATH,
  PAYMENT_HISTORY_PATH,
  SESSION_COOKIE,
  STAFF_DASHBOARD_PATH,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment History · Shikkha Chat",
  description: "View the payments recorded against your account.",
};

/**
 * The customer Payment Entry history on its own URL
 * (`/clientDashboard/payment-entry`).
 *
 * It renders the same dashboard shell as the client overview, so the rail,
 * header, profile card and sign-out are identical — only the panel differs. A
 * desk account is sent to its own panel, so the client shell never renders for
 * staff (the same cross-guard `/clientDashboard` uses).
 */
export default async function PaymentHistoryPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(PAYMENT_HISTORY_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(PAYMENT_HISTORY_PATH)}&expired=1`);
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

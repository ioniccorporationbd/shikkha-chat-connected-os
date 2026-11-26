import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  dashboardPathFor,
  LOGIN_PATH,
  PAYMENT_SUCCESS_PATH,
  SESSION_COOKIE,
  STAFF_DASHBOARD_PATH,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Successful · Shikkha Chat",
  description: "Your payment entry was created successfully.",
};

/**
 * The dashboard-themed Payment Success page on its own URL
 * (`/clientDashboard/payment-entry/success?payment=<PAYMENT_ENTRY_ID>`).
 *
 * It renders the SAME client dashboard shell as the Payment Entry history it
 * belongs to — rail, header, profile card, language control, mobile drawer and
 * sign-out are identical; only the panel differs. The Payment Entry id travels
 * in the query string so a refresh re-loads the real record, and the shell
 * (via `DashboardShell`) renders `PaymentSuccessView` for this path. A desk
 * account is sent to its own panel so the client shell never renders for staff.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  // Preserve the Payment Entry id through the login detour, so a signed-out
  // visitor lands back on the SAME payment after signing in.
  const params = await searchParams;
  const payment = typeof params.payment === "string" ? params.payment : "";
  const nextTarget = payment
    ? `${PAYMENT_SUCCESS_PATH}?payment=${encodeURIComponent(payment)}`
    : PAYMENT_SUCCESS_PATH;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(nextTarget)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(nextTarget)}&expired=1`);
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

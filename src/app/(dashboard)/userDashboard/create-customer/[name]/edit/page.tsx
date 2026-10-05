import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { callFrappe } from "@/lib/api/frappe";
import {
  CLIENT_DASHBOARD_PATH,
  CREATE_CUSTOMER_PATH,
  dashboardPathFor,
  LOGIN_PATH,
  SESSION_COOKIE,
} from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Customer · Shikkha Chat",
  description: "Edit a customer in the ERP.",
};

/**
 * The "Edit Customer" form on its own URL
 * (`/userDashboard/create-customer/<name>/edit`). Renders the same dashboard
 * shell; the shell's `CustomerRoutes` container reads the `[name]` segment and
 * mounts the create form in edit mode.
 */
export default async function EditCustomerPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sid) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CREATE_CUSTOMER_PATH)}`);
  }

  const result = await callFrappe<DashboardPayload>("shikkha_os.api.v1.dashboard.overview", {
    sid,
  });

  if (!result.ok && result.status === 401) {
    redirect(`${LOGIN_PATH}?next=${encodeURIComponent(CREATE_CUSTOMER_PATH)}&expired=1`);
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

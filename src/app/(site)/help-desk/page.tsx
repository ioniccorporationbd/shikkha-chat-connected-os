import { redirect } from "next/navigation";

import { helpDeskRedirectTarget } from "@/lib/auth/helpDeskRedirect";

export const dynamic = "force-dynamic";

/**
 * The public `/help-desk` landing is retired — the ticket centre is now a
 * dashboard module. Old links are forwarded to the visitor's role-aware
 * dashboard help-desk route (guests → sign in first).
 */
export default async function RetiredHelpDeskPage() {
  redirect(await helpDeskRedirectTarget(""));
}

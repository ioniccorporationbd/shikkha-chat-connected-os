import { redirect } from "next/navigation";

import { helpDeskRedirectTarget } from "@/lib/auth/helpDeskRedirect";

export const dynamic = "force-dynamic";

/** Retired public `/help-desk/tickets` — forwarded to the dashboard ticket list. */
export default async function RetiredHelpDeskTicketsPage() {
  redirect(await helpDeskRedirectTarget("/tickets"));
}

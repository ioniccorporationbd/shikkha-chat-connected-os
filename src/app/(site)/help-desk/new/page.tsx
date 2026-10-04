import { redirect } from "next/navigation";

import { helpDeskRedirectTarget } from "@/lib/auth/helpDeskRedirect";

export const dynamic = "force-dynamic";

/** Retired public `/help-desk/new` — forwarded to the dashboard help-desk form. */
export default async function RetiredHelpDeskNewPage() {
  redirect(await helpDeskRedirectTarget("/new"));
}

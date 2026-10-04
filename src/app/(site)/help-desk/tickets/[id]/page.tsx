import { redirect } from "next/navigation";

import { helpDeskRedirectTarget } from "@/lib/auth/helpDeskRedirect";

export const dynamic = "force-dynamic";

/** Retired public `/help-desk/tickets/[id]` — forwarded to the dashboard detail view. */
export default async function RetiredHelpDeskTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(await helpDeskRedirectTarget(`/tickets/${encodeURIComponent(id)}`));
}

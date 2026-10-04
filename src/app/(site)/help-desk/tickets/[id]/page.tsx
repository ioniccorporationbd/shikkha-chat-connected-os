"use client";

import { useParams } from "next/navigation";

import HelpDeskShell from "@/components/help-desk/HelpDeskShell";
import TicketDetails from "@/components/help-desk/TicketDetails";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Public Ticket Details route — `/help-desk/tickets/[id]`.
 *
 * Reachable by anyone holding the ticket id (guests track via id + contact on
 * the lookup form). Real per-user ownership enforcement belongs on the backend
 * once it exists.
 */
export default function HelpDeskTicketDetailsPage() {
  const { language } = useLanguage();
  const copy = helpDeskCopyFor(language);
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? decodeURIComponent(params.id) : "";

  return (
    <HelpDeskShell active="tickets">
      <TicketDetails ticketId={id} copy={copy} language={language} />
    </HelpDeskShell>
  );
}

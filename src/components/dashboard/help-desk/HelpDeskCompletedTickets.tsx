"use client";

import type { HelpDeskCopy } from "@/lib/help-desk/messages";

import HelpDeskTicketBoard from "./HelpDeskTicketBoard";

/**
 * Completed tickets section: the same board as Open tickets, restricted to
 * `status = resolved`. Identical table, back button, header card and 10/20/50
 * paging — only the predicate and the copy differ. Backs the client dashboard's
 * "Completed tickets" quick action, whose data source marks a finished ticket
 * as Resolved.
 */
export default function HelpDeskCompletedTickets({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  return <HelpDeskTicketBoard copy={copy} language={language} basePath={basePath} variant="resolved" />;
}

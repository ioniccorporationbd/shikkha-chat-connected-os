"use client";

import type { HelpDeskCopy } from "@/lib/help-desk/messages";

import HelpDeskTicketBoard from "./HelpDeskTicketBoard";

/**
 * Open tickets section: the ticket board restricted to `status = open`.
 *
 * No status chips, no search box — the section shows open tickets and nothing
 * else, so there is nothing to filter. Styled and paged exactly like the solved
 * board (and the Service panel): 10 rows by default, 20 / 50 page sizes.
 */
export default function HelpDeskTickets({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  return <HelpDeskTicketBoard copy={copy} language={language} basePath={basePath} variant="open" />;
}

"use client";

import type { HelpDeskCopy } from "@/lib/help-desk/messages";

import HelpDeskTicketBoard from "./HelpDeskTicketBoard";

/**
 * Solved tickets section: the same board as Open tickets, restricted to
 * `status = closed`. Identical table, back button, header card and 10/20/50
 * paging — only the predicate and the copy differ.
 */
export default function HelpDeskSolvedTickets({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  return <HelpDeskTicketBoard copy={copy} language={language} basePath={basePath} variant="closed" />;
}

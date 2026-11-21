"use client";

import type { HelpDeskCopy } from "@/lib/help-desk/messages";

import HelpDeskTicketBoard from "./HelpDeskTicketBoard";

/**
 * "আপনার উত্তরের অপেক্ষায়" board: the same ticket table restricted to
 * `status = waiting_for_user` — ERP Helpdesk stores that as the "Replied"
 * state (Paused status category). Support has answered; the row's অ্যাকশন
 * button opens that specific ticket so the customer can reply.
 */
export default function HelpDeskWaitingTickets({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  return <HelpDeskTicketBoard copy={copy} language={language} basePath={basePath} variant="waiting" />;
}

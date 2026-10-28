import type { ConversationMessage, ConversationTimelineEvent, Ticket } from "@/lib/help-desk/types";

/**
 * The ticket header the portal draws must agree with the desk's *Assignee* and
 * *Customer* fields — a ticket created from the desk can carry its owner only
 * in the plain `agent` link (Assignments empty), its submitter only in the
 * `customer` / `customerName` columns (no Contact), and an older backend may
 * not ship `createdAt` at all. Each value is resolved here, in the order the
 * desk itself would, and only truly-unassigned tickets end up blank.
 *
 * `timeline` and `messages` are optional fallbacks for the creation stamp: the
 * audit trail's first row is the moment the ticket was opened.
 */
export function resolveTicketHeader(
  ticket: Ticket,
  timeline: ConversationTimelineEvent[] = [],
  messages: ConversationMessage[] = []
): Ticket {
  const loose = ticket as Ticket & {
    agent?: string | null;
    assignee?: string | null;
    customerName?: string | null;
  };
  const createdAt =
    ticket.createdAt || timeline.find((event) => event.type === "created")?.at || messages[0]?.createdAt || null;
  const assignedAgent = ticket.assignedAgent || loose.agent || loose.assignee || null;
  const contact =
    ticket.contact && (ticket.contact.name || ticket.contact.email)
      ? ticket.contact
      : {
          ...(ticket.contact ?? { email: "", mobile: null, preferredContact: "email" as const }),
          name: loose.customerName || ticket.contact?.name || "",
        };
  return {
    ...ticket,
    createdAt: createdAt ?? ticket.createdAt,
    assignedAgent: assignedAgent ?? undefined,
    contact,
  };
}

/** True when both fields the desk shows are still unresolved — worth a report. */
export function missingTicketHeader(ticket: Ticket): boolean {
  const loose = ticket as Ticket & { agent?: string | null; assignee?: string | null };
  return !(ticket.assignedAgent || loose.agent || loose.assignee) || !ticket.createdAt;
}

/**
 * Help Desk — "smart" derivations for the dashboard overview.
 *
 * All helpers are pure and data-driven: summary counts, the smart default
 * sort order (what needs the user's attention first), the latest support reply
 * and the local "unseen reply" bookkeeping. Nothing here invents state — every
 * value is computed from the tickets the service layer returns.
 */

import type { Ticket, TicketMessage, TicketStatus } from "./types";

/**
 * Smart default order — most "needs you" first:
 * waiting-for-user → open → in progress → resolved → closed.
 * Within a status, the most recently updated ticket wins.
 */
export const SMART_STATUS_ORDER: readonly TicketStatus[] = [
  "waiting_for_user",
  "open",
  "in_progress",
  "resolved",
  "closed",
];

const STATUS_RANK = SMART_STATUS_ORDER.reduce<Record<TicketStatus, number>>(
  (acc, status, index) => {
    acc[status] = index;
    return acc;
  },
  { open: 0, in_progress: 0, waiting_for_user: 0, resolved: 0, closed: 0 },
);

/** Statuses that still need someone to act (used for the "unresolved" view). */
export const UNRESOLVED_STATUSES: readonly TicketStatus[] = [
  "waiting_for_user",
  "open",
  "in_progress",
];

export function isUnresolved(status: TicketStatus): boolean {
  return UNRESOLVED_STATUSES.includes(status);
}

/** Sort a copy of the list: attention-first, then newest-updated. */
export function sortTicketsSmart(tickets: readonly Ticket[]): Ticket[] {
  return tickets.slice().sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  unresolved: number;
}

/** Count tickets by lifecycle bucket. Computed, never hard-coded. */
export function summariseTickets(tickets: readonly Ticket[]): TicketSummary {
  const summary: TicketSummary = {
    total: tickets.length,
    open: 0,
    inProgress: 0,
    waiting: 0,
    resolved: 0,
    closed: 0,
    unresolved: 0,
  };

  for (const ticket of tickets) {
    switch (ticket.status) {
      case "open":
        summary.open += 1;
        break;
      case "in_progress":
        summary.inProgress += 1;
        break;
      case "waiting_for_user":
        summary.waiting += 1;
        break;
      case "resolved":
        summary.resolved += 1;
        break;
      case "closed":
        summary.closed += 1;
        break;
    }
    if (isUnresolved(ticket.status)) summary.unresolved += 1;
  }

  return summary;
}

/** The most recent support-authored message on a ticket, or `null`. */
export function latestSupportReply(ticket: Ticket): TicketMessage | null {
  for (let index = ticket.messages.length - 1; index >= 0; index -= 1) {
    if (ticket.messages[index].author === "support") return ticket.messages[index];
  }
  return null;
}

const SEEN_STORAGE_KEY = "shikkha.helpdesk.seen.v1";

/** Map of ticketId → ISO of the ticket `updatedAt` the user last opened. */
type SeenMap = Record<string, string>;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readSeen(): SeenMap {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSeen(map: SeenMap): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Private mode / quota — the indicator is a nicety, not critical.
  }
}

/**
 * Ticket ids that carry a support reply the user has not opened yet. An empty
 * local "seen" state means the user simply hasn't looked — a waiting reply on a
 * fresh ticket still counts as unseen.
 */
export function unseenSupportIds(tickets: readonly Ticket[]): Set<string> {
  const seen = readSeen();
  const ids = new Set<string>();

  for (const ticket of tickets) {
    const reply = latestSupportReply(ticket);
    if (!reply) continue;
    const lastSeen = seen[ticket.id];
    if (!lastSeen || new Date(reply.createdAt).getTime() > new Date(lastSeen).getTime()) {
      ids.add(ticket.id);
    }
  }

  return ids;
}

/** True when a ticket's latest support reply is newer than its last-seen mark. */
export function hasUnseenReply(ticket: Ticket, unseen: ReadonlySet<string>): boolean {
  return unseen.has(ticket.id);
}

/** Record that the user just opened this ticket (clears its "new reply" flag). */
export function markTicketSeen(ticket: Ticket): void {
  const seen = readSeen();
  seen[ticket.id] = ticket.updatedAt;
  writeSeen(seen);
}

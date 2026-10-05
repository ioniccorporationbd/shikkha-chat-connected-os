/**
 * Help Desk — service layer.
 *
 * The single API the UI is allowed to call. Every function is `async` and
 * returns plain ticket objects (or throws), so when a real Frappe/ERPNext
 * backend exists the only thing that changes is the body of these functions —
 * swap the localStorage store for `fetch()` calls to whitelist endpoints and
 * the components stay untouched.
 *
 * Ownership note: `ownerKey` filtering here is a CONVENIENCE for the mock
 * phase only. Real "a user may only see their own tickets" enforcement MUST
 * happen server-side once the backend exists (see `Ticket.ownerKey`).
 */

import { normaliseContact, loadTickets, saveTickets, nextTicketId, uid } from "./mock-store";
import type {
  CreateTicketInput,
  SupportReplyInput,
  Ticket,
  TicketMessage,
  TicketStatus,
} from "./types";

/** Simulated network latency so loading states are exercised for real. */
const LATENCY_MS = 320;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Deep clone so callers never mutate the persisted copy by reference. */
function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Derive the mock-phase owner key from a contact (email preferred, else mobile/name). */
export function ownerKeyForContact(contact: {
  email?: string;
  mobile?: string;
  name?: string;
}): string {
  const email = normaliseContact(contact.email);
  if (email) return `email:${email}`;
  const mobile = normaliseContact(contact.mobile);
  if (mobile) return `mobile:${mobile}`;
  return `name:${normaliseContact(contact.name)}`;
}

/** All tickets, newest-updated first. */
export async function listTickets(): Promise<Ticket[]> {
  const tickets = loadTickets().slice();
  tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return delay(tickets.map(clone));
}

/** Only the tickets whose mock owner key matches. */
export async function listMyTickets(ownerKey: string): Promise<Ticket[]> {
  const key = ownerKey.trim();
  if (!key) return delay([]);
  const mine = loadTickets().filter((t) => t.ownerKey === key);
  mine.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return delay(mine.map(clone));
}

/** A single ticket by id, or `null`. */
export async function getTicket(id: string): Promise<Ticket | null> {
  const found = loadTickets().find((t) => t.id === id);
  return delay(found ? clone(found) : null);
}

/** Create a ticket; returns the persisted ticket (with its allocated display id). */
export async function createTicket(
  input: CreateTicketInput,
  ownerKey?: string,
): Promise<Ticket> {
  const tickets = loadTickets();
  const now = new Date().toISOString();
  const id = nextTicketId(tickets);

  const openingMessage: TicketMessage = {
    id: uid("msg"),
    author: "user",
    body: input.description.trim(),
    createdAt: now,
    statusChange: "open",
  };

  const ticket: Ticket = {
    id,
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority,
    description: input.description.trim(),
    status: "open",
    contact: {
      name: input.contact.name.trim(),
      email: input.contact.email.trim(),
      mobile: input.contact.mobile?.trim() || undefined,
      preferredContact: input.contact.preferredContact,
    },
    relatedRoute: input.relatedRoute?.trim() || undefined,
    department: input.department?.trim() || undefined,
    attachments: (input.attachments ?? []).map((a) => ({ ...a })),
    messages: [openingMessage],
    createdAt: now,
    updatedAt: now,
    ownerKey: ownerKey || undefined,
  };

  const next = [ticket, ...tickets];
  saveTickets(next);
  return delay(clone(ticket));
}

/** Append a user reply, moving a finished/waiting ticket back into progress. */
export async function addUserReply(id: string, body: string): Promise<Ticket> {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("ticket_not_found");

  const now = new Date().toISOString();
  const message: TicketMessage = { id: uid("msg"), author: "user", body: body.trim(), createdAt: now };
  tickets[index].messages.push(message);
  tickets[index].updatedAt = now;
  if (tickets[index].status === "waiting_for_user" || tickets[index].status === "resolved") {
    tickets[index].status = "in_progress";
  }
  saveTickets(tickets);
  return delay(clone(tickets[index]));
}

/**
 * Post a customer-care reply (used by the on-page response-flow simulation).
 * Optionally carries ordered steps, a status change and a resolution summary.
 */
export async function sendSupportReply(
  id: string,
  input: SupportReplyInput,
): Promise<Ticket> {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("ticket_not_found");

  const now = new Date().toISOString();
  const statusChange: TicketStatus | undefined = input.statusChange;

  const message: TicketMessage = {
    id: uid("msg"),
    author: "support",
    authorName: input.agentName?.trim() || undefined,
    body: input.body.trim(),
    createdAt: now,
    steps: input.steps && input.steps.length ? input.steps.map((s) => s.trim()).filter(Boolean) : undefined,
    statusChange,
  };

  tickets[index].messages.push(message);
  tickets[index].updatedAt = now;
  if (input.agentName?.trim()) tickets[index].assignedAgent = input.agentName.trim();

  if (statusChange) {
    tickets[index].status = statusChange;
    if (statusChange === "resolved") {
      tickets[index].resolvedAt = now;
      tickets[index].resolutionSummary = input.resolutionSummary?.trim() || undefined;
    } else if (tickets[index].status !== "resolved") {
      // Leaving the resolved state clears the resolution metadata.
      tickets[index].resolvedAt = undefined;
      tickets[index].resolutionSummary = undefined;
    }
  }

  saveTickets(tickets);
  return delay(clone(tickets[index]));
}

/** Reopen a resolved/closed ticket — the user says "the problem is still there". */
export async function reopenTicket(id: string): Promise<Ticket> {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("ticket_not_found");

  const now = new Date().toISOString();
  const message: TicketMessage = {
    id: uid("msg"),
    author: "system",
    body: "user_reopened",
    createdAt: now,
    statusChange: "in_progress",
  };
  tickets[index].messages.push(message);
  tickets[index].status = "in_progress";
  tickets[index].updatedAt = now;
  tickets[index].resolvedAt = undefined;
  tickets[index].resolutionSummary = undefined;
  saveTickets(tickets);
  return delay(clone(tickets[index]));
}

/**
 * Guest lookup — match by display id AND (email OR mobile). Lenient on the
 * contact formatting so `01 600 000 000` finds `01600000000`.
 */
export async function lookupGuest(id: string, contact: string): Promise<Ticket | null> {
  const wantId = id.trim().toUpperCase();
  const wantContact = normaliseContact(contact);
  if (!wantId || !wantContact) return delay(null);

  const found = loadTickets().find((t) => {
    if (t.id.toUpperCase() !== wantId) return false;
    return (
      normaliseContact(t.contact.email) === wantContact ||
      normaliseContact(t.contact.mobile) === wantContact
    );
  });
  return delay(found ? clone(found) : null);
}

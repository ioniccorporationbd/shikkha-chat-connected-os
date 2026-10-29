/**
 * Help Desk — service layer (live ERP).
 *
 * The single API the UI is allowed to call. Every function is `async`, returns
 * plain ticket objects and throws a `HelpDeskError` on failure, so the
 * components stay unchanged whether data comes from here or anywhere else.
 *
 * Data source: the portal's same-origin routes under `/api/help-desk/*`, which
 * proxy the whitelisted methods in `shikkha_os/api/v1/help_desk.py`. Ownership
 * is decided by the ERP from the session cookie — this layer never sends an
 * owner identifier, so a customer cannot ask for somebody else's ticket.
 */

import type {
  CreateTicketInput,
  HelpDeskListPayload,
  HelpDeskOptions,
  HelpDeskTicketPayload,
  HelpDeskUploadedFile,
  Ticket,
} from "./types";
import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";

const TICKETS_URL = "/api/help-desk/tickets";
const OPTIONS_URL = "/api/help-desk/options";

/** A failed Help Desk call, carrying the backend's own (human) message. */
export class HelpDeskError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "helpdesk_error", status = 0) {
    super(message);
    this.name = "HelpDeskError";
    this.code = code;
    this.status = status;
  }
}

/** The UI language for backend messages (`<html lang>`), defaulting to Bangla. */
export function currentLanguage(): string {
  if (typeof document === "undefined") return "bn";
  const lang = document.documentElement.lang || "bn";
  return lang.toLowerCase().startsWith("en") ? "en" : "bn";
}

/** A single GET is retried once before the reader is told the load failed. */
const TRANSPORT_RETRIES = 1;

function offline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One portal call.
 *
 * A read is the only thing retried: a browser `fetch` that rejects before any
 * byte came back (dev server recompiling, a proxy dropping the connection, a
 * laptop that just woke) says nothing about the ticket, so a single quiet retry
 * turns a spurious red box into a normal load. A write is never repeated here —
 * the portal cannot know whether the ERP already committed it, and a duplicated
 * ticket or reply is worse than an error the reader can retry himself.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = String(init.method || "GET").toUpperCase();
  const attempts = method === "GET" ? TRANSPORT_RETRIES + 1 : 1;

  let response: Response | null = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      response = await fetch(path, { cache: "no-store", ...init });
      break;
    } catch {
      response = null;
      if (attempt < attempts) await sleep(400);
    }
  }

  if (!response) {
    throw new HelpDeskError(
      offline()
        ? "You appear to be offline. Check your connection and try again."
        : "The portal could not reach the server. Please check your connection.",
      "network_error"
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const envelope = payload as { success?: boolean; data?: T; message?: string; code?: string } | null;

  if (!response.ok || !envelope || envelope.success !== true) {
    const message =
      (envelope && typeof envelope.message === "string" && envelope.message) ||
      (response.status === 401
        ? "Your session has expired. Please sign in again."
        : "The request could not be completed. Please try again.");
    throw new HelpDeskError(message, envelope?.code || "helpdesk_error", response.status);
  }

  return envelope.data as T;
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Statuses / priorities / ticket types the ERP has configured. The create form
 * uses these so it can never offer a value the ticket cannot store; a failure
 * here is not fatal (the form keeps its default lists).
 */
export async function getOptions(): Promise<HelpDeskOptions> {
  const query = new URLSearchParams({ language: currentLanguage() });
  return request<HelpDeskOptions>(`${OPTIONS_URL}?${query.toString()}`);
}

/**
 * Normalise one ticket to the UI contract.
 *
 * The ERP only ships a ticket's conversation (`messages`) on the DETAIL response;
 * list rows carry no `messages` key at all. The UI contract in `types.ts` says
 * `messages: TicketMessage[]`, so an endpoint omitting the key used to crash
 * `HelpDeskOverview` with "Cannot read properties of undefined (reading
 * 'length')". Every response now passes through here, so array fields are never
 * undefined regardless of what the backend (or an older deployed backend) sends.
 */
function normaliseTicket(ticket: Ticket): Ticket {
  return {
    ...ticket,
    messages: Array.isArray(ticket.messages) ? ticket.messages : [],
    attachments: Array.isArray(ticket.attachments) ? ticket.attachments : [],
  };
}

/** All tickets the ERP allows this user to see, newest-updated first. */
export async function listTickets(): Promise<Ticket[]> {
  const query = new URLSearchParams({ language: currentLanguage(), page_size: "500" });
  const data = await request<HelpDeskListPayload>(`${TICKETS_URL}?${query.toString()}`);
  return (data.tickets ?? []).map(normaliseTicket);
}

/**
 * A single ticket by id, or `null` when it does not exist / is not visible to
 * this user (the ERP answers 404/403 — both surface as "not found" so the UI
 * never reveals that a ticket exists for someone else).
 */
export async function getTicket(id: string): Promise<Ticket | null> {
  const query = new URLSearchParams({ language: currentLanguage() });
  try {
    const data = await request<HelpDeskTicketPayload>(
      `${TICKETS_URL}/${encodeURIComponent(id)}?${query.toString()}`
    );
    return normaliseTicket(data.ticket);
  } catch (error) {
    if (error instanceof HelpDeskError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

/** Upload one attachment to the ERP (a private File owned by the session user). */
export async function uploadAttachment(file: File): Promise<HelpDeskUploadedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return postJson<HelpDeskUploadedFile>("/api/help-desk/upload", {
    file_name: file.name,
    content: bytesToBase64(bytes),
    language: currentLanguage(),
  });
}

/** Create a ticket in the ERP; returns the persisted ticket with its real id. */
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  // Upload the files first: a ticket is only created once every attachment has
  // a real File record, so the ERP never holds a reference to a missing file.
  const attachments: { name: string; url: string }[] = [];
  for (const attachment of input.attachments ?? []) {
    if (attachment.file) {
      const uploaded = await uploadAttachment(attachment.file);
      attachments.push({ name: uploaded.name, url: uploaded.url });
    } else if (attachment.url) {
      attachments.push({ name: attachment.name, url: attachment.url });
    }
  }

  const data = await postJson<HelpDeskTicketPayload>(TICKETS_URL, {
    subject: input.subject.trim(),
    // ERP-managed values, sent exactly as configured (never a local constant):
    // `HD Ticket Type` name and `HD Ticket Priority` name.
    ticketType: input.ticketType?.trim() || "",
    priority: input.priority?.trim() || "",
    description: input.description.trim(),
    contact: {
      name: input.contact.name?.trim() || "",
      email: input.contact.email?.trim() || "",
      mobile: input.contact.mobile?.trim() || "",
      preferredContact: input.contact.preferredContact,
    },
    relatedRoute: input.relatedRoute?.trim() || "",
    department: input.department?.trim() || "",
    attachments,
    language: currentLanguage(),
  });

  reportNotification(data.notification);

  // Files the ERP refused to attach: the ticket exists, so this is not a submit
  // failure — but the customer must never be left believing the file is there.
  const missed = data.attachments_failed ?? [];
  if (missed.length > 0) {
    const bangla = currentLanguage() !== "en";
    toast.warning(
      bangla
        ? `টিকেট তৈরি হয়েছে, তবে ${missed.length}টি ফাইল সংযুক্ত হয়নি: ${missed.join(", ")}`
        : `The ticket was created, but ${missed.length} file(s) could not be attached: ${missed.join(", ")}`
    );
    console.error("[help-desk] ticket saved but attachments were not attached", { missed });
    reportClientError({
      scope: "help-desk:attach",
      message: `Ticket created without ${missed.length} attachment(s): ${missed.join(", ")}`,
      detail: { missed, route: TICKETS_URL },
    });
  }

  return normaliseTicket(data.ticket);
}

/**
 * The ticket exists; a notification channel did not deliver.
 *
 * That is a delivery problem, not a submit problem - the customer must not be
 * told their ticket failed - so it is surfaced the way every other Help Desk
 * failure is: `[client-error]` in the browser console (with the ERP's own
 * reason, per channel) and a row in `/desk/system/error-log`.
 *
 * A partial success is reported too: "SMS went out, the e-mail did not" used to
 * pass silently because `sent` is true as soon as one channel works.
 */
function reportNotification(notification: HelpDeskTicketPayload["notification"]): void {
  if (!notification) return;

  const channels = Object.entries(notification.channels ?? {});
  const failed = channels.filter(([, value]) => !value.sent).map(([name]) => name);
  const nothingSent = !notification.sent;

  if (!nothingSent && failed.length === 0) return;

  const detail = {
    ticket: notification.ticket ?? null,
    channels: Object.fromEntries(channels),
    failed,
    sent: notification.sent,
    reason: notification.reason ?? null,
    route: "/api/help-desk/tickets",
  };

  console.error(
    "[help-desk] ticket saved but the customer notification did not fully deliver",
    detail,
  );
  reportClientError({
    scope: "help-desk:notify",
    message: `Ticket ${notification.ticket ?? "created"}; ${
      failed.length ? `${failed.join(", ")} not delivered` : "notification not delivered"
    }`,
    detail,
  });
}

/**
 * Append a customer reply (stored as a real `Communication` in the ERP) with
 * any chat attachments — images, PDFs, documents or a recorded voice note.
 */
export async function addUserReply(
  id: string,
  body: string,
  attachments: Array<{ name: string; url: string }> = []
): Promise<Ticket> {
  const data = await postJson<HelpDeskTicketPayload>(
    `${TICKETS_URL}/${encodeURIComponent(id)}/replies`,
    { message: body.trim(), attachments, language: currentLanguage() }
  );
  return normaliseTicket(data.ticket);
}

/**
 * Pin (or unpin) one message of this ticket's conversation. The pin is stored
 * per customer on the shared cache — no new doctype, field or table — and comes
 * back on `getTicket()` so the details page can keep showing it.
 */
export async function pinTicketMessage(
  id: string,
  messageId: string,
  pinned: boolean
): Promise<string | null> {
  const data = await postJson<{ pinnedMessageId?: string | null }>(
    `${TICKETS_URL}/${encodeURIComponent(id)}/pins`,
    { message: messageId, pinned, language: currentLanguage() }
  );
  return data.pinnedMessageId ?? null;
}

/**
 * Delete one chat message. Each message is a `Communication` record, so the ERP
 * removes exactly that record (permission-checked server-side) — no soft-delete
 * column is invented on the frontend.
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await request<{ deleted?: boolean }>(`/api/help-desk/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
  });
}

/**
 * Forward a message into another ticket. A forward is a normal reply on the
 * target ticket that carries the original text — the ERP keeps it as a real
 * `Communication`, so the receiving agent sees it like any other message.
 */
export async function forwardMessage(id: string, body: string): Promise<Ticket> {
  return addUserReply(id, body);
}

/** Reopen a resolved/closed ticket — the user says "the problem is still there". */
export async function reopenTicket(id: string): Promise<Ticket> {
  const data = await postJson<HelpDeskTicketPayload>(
    `${TICKETS_URL}/${encodeURIComponent(id)}/reopen`,
    { language: currentLanguage() }
  );
  return normaliseTicket(data.ticket);
}

/** Same-origin URL that streams a private ERP attachment with the portal session. */
export function attachmentUrl(file: { url?: string }): string | null {
  if (!file.url) return null;
  return `/api/help-desk/files?url=${encodeURIComponent(file.url)}`;
}

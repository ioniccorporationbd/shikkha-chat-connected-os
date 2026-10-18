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
function currentLanguage(): string {
  if (typeof document === "undefined") return "bn";
  const lang = document.documentElement.lang || "bn";
  return lang.toLowerCase().startsWith("en") ? "en" : "bn";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw new HelpDeskError("The portal could not reach the server. Please check your connection.", "network_error");
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

/** All tickets the ERP allows this user to see, newest-updated first. */
export async function listTickets(): Promise<Ticket[]> {
  const query = new URLSearchParams({ language: currentLanguage(), page_size: "500" });
  const data = await request<HelpDeskListPayload>(`${TICKETS_URL}?${query.toString()}`);
  return data.tickets;
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
    return data.ticket;
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

  return data.ticket;
}

/** Append a customer reply (stored as a real `Communication` in the ERP). */
export async function addUserReply(id: string, body: string): Promise<Ticket> {
  const data = await postJson<HelpDeskTicketPayload>(
    `${TICKETS_URL}/${encodeURIComponent(id)}/replies`,
    { message: body.trim(), language: currentLanguage() }
  );
  return data.ticket;
}

/** Reopen a resolved/closed ticket — the user says "the problem is still there". */
export async function reopenTicket(id: string): Promise<Ticket> {
  const data = await postJson<HelpDeskTicketPayload>(
    `${TICKETS_URL}/${encodeURIComponent(id)}/reopen`,
    { language: currentLanguage() }
  );
  return data.ticket;
}

/** Same-origin URL that streams a private ERP attachment with the portal session. */
export function attachmentUrl(file: { url?: string }): string | null {
  if (!file.url) return null;
  return `/api/help-desk/files?url=${encodeURIComponent(file.url)}`;
}

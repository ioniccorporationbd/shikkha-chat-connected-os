/**
 * Help Desk — conversation service (live ERP).
 *
 * Every function here talks to the portal's same-origin routes under
 * `/api/help-desk/conversations` and `/api/help-desk/tickets/[id]/...`, which
 * proxy `shikkha_os.api.v1.help_desk_messages`. Nothing is stored locally: a
 * message is a `Communication` row on the ticket, a requirement is the same
 * row type with the ERP-side marker, an attachment is an existing `File`.
 *
 * Ownership and role (customer vs support) are decided by the ERP from the
 * session cookie — this layer never sends a user identifier.
 */

import { currentLanguage, HelpDeskError, request, uploadAttachment } from "./service";
import type {
  ConversationListPayload,
  ConversationPayload,
  HelpDeskUploadedFile,
} from "./types";

const CONVERSATIONS_URL = "/api/help-desk/conversations";

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** One page of ticket threads, newest conversation activity first. */
export async function listConversations(
  options: { search?: string; page?: number; pageSize?: number; includeEmpty?: boolean } = {}
): Promise<ConversationListPayload> {
  const query = new URLSearchParams({ language: currentLanguage() });
  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.page && options.page > 0) query.set("page", String(options.page));
  if (options.pageSize && options.pageSize > 0) query.set("page_size", String(options.pageSize));
  // Support's problem queue needs tickets that nobody has replied to yet.
  if (options.includeEmpty) query.set("include_empty", "1");
  return request<ConversationListPayload>(`${CONVERSATIONS_URL}?${query.toString()}`);
}

/**
 * One ticket conversation. Calling it also records the signed-in user's read
 * state (the ERP marks every message addressed to them as seen).
 */
export async function getConversation(ticketId: string): Promise<ConversationPayload | null> {
  const query = new URLSearchParams({ language: currentLanguage() });
  try {
    return await request<ConversationPayload>(
      `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}?${query.toString()}`
    );
  } catch (error) {
    if (error instanceof HelpDeskError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

/** Resolve UI attachments to ERP `File` rows, uploading any browser file first. */
async function resolveAttachments(files?: File[]): Promise<{ name: string; url: string }[]> {
  const resolved: { name: string; url: string }[] = [];
  for (const file of files ?? []) {
    const uploaded: HelpDeskUploadedFile = await uploadAttachment(file);
    resolved.push({ name: uploaded.name, url: uploaded.url });
  }
  return resolved;
}

export interface SendMessageInput {
  message: string;
  /** Communication id being quoted (Telegram-style reply-to). */
  replyTo?: string | null;
  attachments?: File[];
  /** Employees can flag a message as the resolution note. */
  kind?: "message" | "resolution";
}

/** Append one message to the conversation (customer or support employee). */
export async function sendMessage(ticketId: string, input: SendMessageInput): Promise<ConversationPayload> {
  const attachments = await resolveAttachments(input.attachments);
  return postJson<ConversationPayload>(`${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}/messages`, {
    message: input.message.trim(),
    replyTo: input.replyTo || null,
    kind: input.kind || "message",
    attachments,
    language: currentLanguage(),
  });
}

/** Add an additional requirement — accepted only while the ticket is Open. */
export async function addRequirement(
  ticketId: string,
  input: { message: string; replyTo?: string | null; attachments?: File[] }
): Promise<ConversationPayload> {
  const attachments = await resolveAttachments(input.attachments);
  return postJson<ConversationPayload>(
    `/api/help-desk/tickets/${encodeURIComponent(ticketId)}/requirements`,
    {
      message: input.message.trim(),
      replyTo: input.replyTo || null,
      attachments,
      language: currentLanguage(),
    }
  );
}

/** Employee-side status transition (an existing `HD Ticket Status`). */
export async function setTicketStatus(
  ticketId: string,
  input: { status: string; resolution?: string }
): Promise<ConversationPayload> {
  return postJson<ConversationPayload>(
    `/api/help-desk/tickets/${encodeURIComponent(ticketId)}/status`,
    {
      status: input.status,
      resolution: (input.resolution || "").trim(),
      language: currentLanguage(),
    }
  );
}

/** Record that this user has read the thread (idempotent). */
export async function markConversationRead(ticketId: string): Promise<number> {
  const data = await postJson<{ marked: number }>(
    `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}/read`,
    { language: currentLanguage() }
  );
  return data.marked ?? 0;
}

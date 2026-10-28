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
  ConversationReaction,
  HelpDeskBadgesPayload,
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

/** Unread activity counts behind the Help Desk numeric badges. */
export async function getHelpDeskBadges(): Promise<HelpDeskBadgesPayload | null> {
  try {
    return await request<HelpDeskBadgesPayload>(`/api/help-desk/badges?language=${currentLanguage()}`);
  } catch (error) {
    // A badge is decoration: a failed poll must never break the page.
    if (error instanceof HelpDeskError) return null;
    throw error;
  }
}

/** One page of ticket threads, newest conversation activity first. */
export async function listConversations(
  options: {
    search?: string;
    page?: number;
    pageSize?: number;
    includeEmpty?: boolean;
    /**
     * Restrict the queue to ticket statuses (comma/space separated keys such as
     * `open`) or the token `not_open` for the employee Solve queue. The ERP is
     * what enforces it — this is only the request.
     */
    statuses?: string;
    /**
     * Inclusive calendar days (`YYYY-MM-DD`). Every list filters on its own
     * timestamp, named by `dateField`: `created` = ticket submission,
     * `activity` = latest conversation activity, `resolved` = resolution day.
     * The ERP applies the range before counting and paginating.
     */
    fromDate?: string;
    toDate?: string;
    dateField?: "created" | "activity" | "resolved";
    /** Case-insensitive partial match on the ticket subject only. */
    title?: string;
  } = {}
): Promise<ConversationListPayload> {
  const query = new URLSearchParams({ language: currentLanguage() });
  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.page && options.page > 0) query.set("page", String(options.page));
  if (options.pageSize && options.pageSize > 0) query.set("page_size", String(options.pageSize));
  // Support's problem queue needs tickets that nobody has replied to yet.
  if (options.includeEmpty) query.set("include_empty", "1");
  if (options.statuses?.trim()) query.set("statuses", options.statuses.trim());
  if (options.fromDate?.trim()) query.set("from_date", options.fromDate.trim());
  if (options.toDate?.trim()) query.set("to_date", options.toDate.trim());
  if (options.dateField) query.set("date_field", options.dateField);
  if (options.title?.trim()) query.set("title", options.title.trim());
  return request<ConversationListPayload>(`${CONVERSATIONS_URL}?${query.toString()}`);
}

/**
 * One ticket conversation. Calling it also records the signed-in user's read
 * state (the ERP marks every message addressed to them as seen).
 *
 * Paging is opt-in and bounded by the ERP query, never by slicing here:
 * `limit` returns only that many of the newest entries, `cursor` the page
 * before a known cursor, `since` everything after one (a delta read).
 */
export async function getConversation(
  ticketId: string,
  options: { limit?: number; cursor?: string | null; since?: string | null } = {}
): Promise<ConversationPayload | null> {
  const query = new URLSearchParams({ language: currentLanguage() });
  if (options.limit && options.limit > 0) query.set("limit", String(options.limit));
  if (options.cursor) query.set("cursor", options.cursor);
  if (options.since) query.set("since", options.since);
  try {
    const payload = await request<ConversationPayload>(
      `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}?${query.toString()}`
    );
    return payload ? alignConversation(payload) : payload;
  } catch (error) {
    if (error instanceof HelpDeskError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

/**
 * Put every bubble on the side of the room it belongs to.
 *
 * The ERP flags each row `isMine` by matching its `sender` / `owner` against the
 * signed-in e-mail, which is exact only while the portal account is the account
 * named on the row. A customer whose `Contact`/`User` e-mail differs from the
 * `Communication.sender`, or a backend deployed before the flag existed, came
 * back with every bubble on the left — his own comments included. The author
 * *side* is what the room can actually see and is never ambiguous (`support` =
 * a staff member wrote it, `user` = the customer wrote it), so the side is
 * derived from it: the reader's own side sits on the right, the other party on
 * the left. That holds in both dashboards without the backend having to know
 * who is looking.
 *
 * A payload that does not say which side the reader is on is returned
 * untouched, so an older backend keeps its own `isMine` as the only truth.
 */
export function alignConversation(payload: ConversationPayload): ConversationPayload {
  const viewerIsSupport = typeof payload.isSupport === "boolean" ? payload.isSupport : null;
  if (viewerIsSupport === null) return payload;

  const messages = (Array.isArray(payload.messages) ? payload.messages : []).map((message) => ({
    ...message,
    isMine: message.author === "support" ? viewerIsSupport : !viewerIsSupport,
  }));

  return { ...payload, messages };
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
  const payload = await postJson<ConversationPayload>(
    `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}/messages`,
    {
      message: input.message.trim(),
      replyTo: input.replyTo || null,
      kind: input.kind || "message",
      attachments,
      language: currentLanguage(),
    }
  );
  return alignConversation(payload);
}

/** Add an additional requirement — accepted only while the ticket is Open. */
export async function addRequirement(
  ticketId: string,
  input: { message: string; replyTo?: string | null; attachments?: File[] }
): Promise<ConversationPayload> {
  const attachments = await resolveAttachments(input.attachments);
  const payload = await postJson<ConversationPayload>(
    `/api/help-desk/tickets/${encodeURIComponent(ticketId)}/requirements`,
    {
      message: input.message.trim(),
      replyTo: input.replyTo || null,
      attachments,
      language: currentLanguage(),
    }
  );
  return alignConversation(payload);
}

/** Employee-side status transition (an existing `HD Ticket Status`). */
export async function setTicketStatus(
  ticketId: string,
  input: { status: string; resolution?: string }
): Promise<ConversationPayload> {
  const payload = await postJson<ConversationPayload>(
    `/api/help-desk/tickets/${encodeURIComponent(ticketId)}/status`,
    {
      status: input.status,
      resolution: (input.resolution || "").trim(),
      language: currentLanguage(),
    }
  );
  return alignConversation(payload);
}

/**
 * Toggle one emoji reaction on a message (`"<comm>"` or `"comment:<name>"`).
 *
 * The ERP stores the reaction on the message row itself and returns the fresh
 * group list, so the caller can replace its local copy with the server truth.
 */
export async function setMessageReaction(
  ticketId: string,
  messageId: string,
  emoji: string
): Promise<ConversationReaction[]> {
  const data = await postJson<{ message: string; reactions: ConversationReaction[] }>(
    `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}/reactions`,
    { message: messageId, emoji, language: currentLanguage() }
  );
  return data.reactions ?? [];
}

/** Record that this user has read the thread (idempotent). */
export async function markConversationRead(ticketId: string): Promise<number> {
  const data = await postJson<{ marked: number }>(
    `${CONVERSATIONS_URL}/${encodeURIComponent(ticketId)}/read`,
    { language: currentLanguage() }
  );
  return data.marked ?? 0;
}

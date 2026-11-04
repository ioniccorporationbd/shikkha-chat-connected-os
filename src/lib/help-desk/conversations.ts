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

import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";
import { currentLanguage, HelpDeskError, request, uploadAttachment } from "./service";
import type {
  ConversationAttachment,
  ConversationListPayload,
  ConversationMessage,
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
    if (!payload) return payload;
    const aligned = alignConversation(payload);
    logAttachmentCensus(aligned, `read ${ticketId}`);
    return aligned;
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
/**
 * The one order a conversation is ever read in: creation time, oldest first.
 *
 * The ERP merges two channels (Comment and Communication) and, on the paged
 * route, hands back one window at a time; a delta read returns only what is
 * newer than the newest entry. Each of those arrives in its own shape, so the
 * order is re-established here — once, for every path (first load, older page,
 * poll delta, write response) — instead of trusting whichever list was merged
 * last. `id` breaks a tie so two rows written in the same second still hold a
 * stable order between refreshes.
 */
function orderByStamp<T>(items: T[], stampOf: (item: T) => { at?: string | null; id?: string }): T[] {
  return items
    .map((item) => {
      const { at, id } = stampOf(item);
      const text = String(at ?? "");
      const parsed = Date.parse(text);
      return {
        item,
        parsed: Number.isFinite(parsed) ? parsed : null,
        text,
        id: String(id ?? ""),
      };
    })
    .sort((a, b) => {
      // A row with a real timestamp always reads before one without.
      if (a.parsed !== b.parsed) {
        if (a.parsed === null) return 1;
        if (b.parsed === null) return -1;
        return a.parsed - b.parsed;
      }
      if (a.text !== b.text) return a.text < b.text ? -1 : 1;
      if (a.id !== b.id) return a.id < b.id ? -1 : 1;
      return 0;
    })
    .map((entry) => entry.item);
}

export function orderConversation<T extends { createdAt?: string | null; id?: string }>(
  messages: T[]
): T[] {
  return orderByStamp(messages, (message) => ({ at: message.createdAt, id: message.id }));
}

/**
 * How long apart two rows may sit and still count as one retried send.
 * Mirrors `_DUPLICATE_WINDOW_SECONDS` on the ERP side.
 */
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

/**
 * The same reply can also reach the desk twice with different *wrapping*: the
 * plain comment the employee typed, and the email copy that carries the quoted
 * history and a signature. The words of one sit whole inside the other, so the
 * fold compares bodies by containment inside this window.
 */
const CONTAIN_WINDOW_MS = 2 * 60 * 1000;

/** Bodies shorter than this never fold by containment - see above. */
const CONTAIN_MIN_CHARS = 12;

/**
 * What the reader actually reads, as a fold key.
 *
 * The two channels store the same words differently: a Comment often carries
 * HTML (`<div>hi</div>`, `&nbsp;`) while the Communication twin is plain text.
 * Comparing the raw strings therefore failed to see them as one message and the
 * chat drew the same sentence twice. Strip the markup and the common entities
 * first, then collapse whitespace and case, so the fold compares text, not
 * serialisation.
 */
function bodyKey(body: unknown): string {
  return String(body ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function attachmentMark(file: unknown): string {
  const row = file as { url?: string; fileName?: string; name?: string } | null;
  return String(row?.url ?? row?.fileName ?? row?.name ?? "").trim();
}

function fileKey(files: unknown): string {
  if (!Array.isArray(files)) return "";
  return files.map(attachmentMark).filter(Boolean).sort().join("|");
}

function stamp(value: unknown): number | null {
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * One message must read once, even when the ERP stored it on both channels.
 *
 * A customer message lives in `Comment` (the desk's Comment tab) while agent
 * replies live in `Communication`; a send that was retried — the browser gave up
 * at 15s and the reader pressed send again — can therefore land on both, with two
 * ids and two timestamps seconds apart, and the chat box drew the same text twice.
 * Rows are folded only when they sit on *different* channels, share the author and
 * the text (or the exact file set), and are within five minutes, so a customer who
 * genuinely repeats himself later still reads twice. The surviving row keeps any
 * file or quote only the retried twin carried.
 */
export function dropChannelDuplicates<T extends ConversationMessage>(messages: T[]): T[] {
  return foldChannelDuplicates(messages).kept;
}

/**
 * Same fold, plus the ids that no longer draw. The audit timeline lists a row per
 * message id, so a twin folded out of `messages` has to leave the timeline too —
 * otherwise the very same text returns as a "message" event a line further down.
 */
function foldChannelDuplicates<T extends ConversationMessage>(messages: T[]): {
  kept: T[];
  dropped: Set<string>;
} {
  const kept: T[] = [];
  const dropped = new Set<string>();
  const twins = new Map<string, T[]>();
  // The very same row arriving twice (a page merged over itself, a delta read
  // overlapping the page) must not draw twice, whatever its text says.
  const seenIds = new Set<string>();
  for (const message of messages) {
    if (message.id) {
      if (seenIds.has(message.id)) {
        dropped.add(message.id);
        continue;
      }
      seenIds.add(message.id);
    }
    const body = bodyKey(message.body);
    const files = fileKey(message.attachments);
    if (!body && !files) {
      kept.push(message);
      continue;
    }
    // Text identifies a message; files only identify a file-only row. A retry
    // that also carried a file must still fold with its text twin.
    const key = `${message.author ?? ""}\u0001${body}\u0001${body ? "" : files}`;
    const candidates = twins.get(key) ?? [];
    twins.set(key, candidates);
    const at = stamp(message.createdAt);
    const twin = candidates.find((prior) => {
      const priorAt = stamp(prior.createdAt);
      if (priorAt === null || at === null) return false;
      const gap = Math.abs(priorAt - at);
      // Different channels: the classic Comment + Communication twin.
      if ((prior.channel ?? "") !== (message.channel ?? "")) return gap <= DUPLICATE_WINDOW_MS;
      // Same channel: a resend of the same upload, or the desk storing its own
      // second copy of the reply. The key here is the whole body, so the wide
      // window is safe — a person does not retype the same dozen-plus
      // characters by accident, and a shorter line is never folded this way.
      if (files) {
        if (gap > DUPLICATE_WINDOW_MS) return false;
        return fileKey(prior.attachments) === files;
      }
      if (body.length < CONTAIN_MIN_CHARS) return false;
      return gap <= DUPLICATE_WINDOW_MS;
    });
    if (!twin) {
      candidates.push(message);
      kept.push(message);
      continue;
    }
    const known = new Set(fileKey(twin.attachments).split("|").filter(Boolean));
    const extra = (message.attachments ?? []).filter((file) => {
      const mark = attachmentMark(file);
      return mark !== "" && !known.has(mark);
    });
    if (extra.length) twin.attachments = [...(twin.attachments ?? []), ...extra];
    if (!twin.replyTo && message.replyTo) twin.replyTo = message.replyTo;
    if (message.id) dropped.add(message.id);
  }

  // The same reply can reach the desk twice with different wrapping: the plain
  // comment, and the email copy that carries the quoted history or a signature.
  // The raw strings differ, so the twin pass above cannot see them — but the
  // short body sits whole at the start (or the end) of the long one, under the
  // same author, minutes apart. That is one message to the reader either way.
  const byAuthor = new Map<string, T[]>();
  const folded: T[] = [];
  for (const message of kept) {
    const body = bodyKey(message.body);
    const at = stamp(message.createdAt);
    const seen = byAuthor.get(String(message.author ?? "")) ?? [];
    const host =
      body.length >= CONTAIN_MIN_CHARS && at !== null
        ? seen.find((prior) => {
            const priorAt = stamp(prior.createdAt);
            if (priorAt === null || Math.abs(at - priorAt) > CONTAIN_WINDOW_MS) return false;
            const other = bodyKey(prior.body);
            if (other.length < CONTAIN_MIN_CHARS || other === body) return false;
            const [small, big] = body.length <= other.length ? [body, other] : [other, body];
            return big.startsWith(small) || big.endsWith(small);
          })
        : undefined;
    if (host) {
      // Keep the row the reader already has (its time is the time they saw) and
      // give it the fuller text, so the signature and quote are not lost.
      if (body.length > bodyKey(host.body).length) host.body = message.body;
      if (!host.replyTo && message.replyTo) host.replyTo = message.replyTo;
      const knownFiles = new Set(fileKey(host.attachments).split("|").filter(Boolean));
      const extraFiles = (message.attachments ?? []).filter((file) => {
        const mark = attachmentMark(file);
        return mark !== "" && !knownFiles.has(mark);
      });
      if (extraFiles.length) host.attachments = [...(host.attachments ?? []), ...extraFiles];
      if (message.id) dropped.add(message.id);
      continue;
    }
    seen.push(message);
    byAuthor.set(String(message.author ?? ""), seen);
    folded.push(message);
  }

  return { kept: folded, dropped };
}

/**
 * One attachment as the ERP sends it. The API names the file `name`/`mime`; the
 * conversation UI reads `fileName`/`fileType`, so every payload is translated
 * here — otherwise an image arrives with no MIME type and no name, and the
 * thread draws it as an anonymous row instead of the picture itself.
 */
type RawAttachment = {
  id?: string;
  name?: string;
  fileName?: string;
  size?: number | string | null;
  mime?: string;
  fileType?: string;
  url?: string;
};

function toAttachment(raw: RawAttachment): ConversationAttachment | null {
  if (!raw || typeof raw !== "object") return null;
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  const named = String(raw.fileName ?? raw.name ?? "").trim();
  const fromUrl = url ? decodeURIComponent(url.split("/").pop() || "") : "";
  const fileName = named || fromUrl;
  if (!url && !fileName) return null;
  const size = Number.parseInt(String(raw.size ?? 0), 10);
  return {
    url: url || undefined,
    fileName,
    fileType: String(raw.fileType ?? raw.mime ?? "").trim(),
    size: Number.isFinite(size) && size > 0 ? size : 0,
  };
}

/**
 * One stable name for a file, however the ERP spelled it: the name if it came
 * with one, else the last path segment. `/files/x.png` and
 * `/private/files/x.png` are the same picture, and the desk writes both forms.
 */
export function attachmentName(file: ConversationAttachment): string {
  const name = String(file.fileName ?? "").trim();
  if (name) return decodeURIComponent(name).toLowerCase();
  const url = String(file.url ?? "").trim();
  return url ? decodeURIComponent(url.split("?")[0].split("/").pop() || "").toLowerCase() : "";
}

function normalizeMessage(message: ConversationMessage): ConversationMessage {
  const raw = (message as unknown as { attachments?: unknown }).attachments;
  if (!Array.isArray(raw) || raw.length === 0) return { ...message, attachments: [] };
  const seen = new Set<string>();
  const attachments = (raw as RawAttachment[])
    .map(toAttachment)
    .filter((file): file is ConversationAttachment => file !== null)
    // One picture is one picture: the ERP can name the same file twice — once
    // from the row's attachment list and once from the image its HTML embeds —
    // and a bubble that draws it twice reads as "my message was sent twice".
    .filter((file) => {
      const name = attachmentName(file);
      const key = name || String(file.url ?? "");
      if (!key) return false;
      if (seen.has(key)) {
        console.info("[hd:attach] folded a repeated file inside one message", {
          message: message.id,
          file: key,
        });
        return false;
      }
      seen.add(key);
      return true;
    });
  return { ...message, attachments };
}

/**
 * A file belongs to the message that carried it. The desk also keeps a
 * file-only row for the same upload (an "Attachment" comment, a ticket-tray
 * row), so the picture shows up again one line lower with no text of its own.
 * Once a picture rides on a message that has words, later rows lose it — and a
 * file-only row that is left with nothing at all disappears. Order matters:
 * this runs on the already-ordered list, so the *earliest* copy wins.
 */
function settleAttachments<T extends { id?: string; body?: string; attachments?: ConversationAttachment[] }>(
  messages: T[]
): { kept: T[]; dropped: Set<string> } {
  const shown = new Set<string>();
  const kept: T[] = [];
  const droppedIds = new Set<string>();
  for (const message of messages) {
    if (!message.attachments || message.attachments.length === 0) {
      kept.push(message);
      continue;
    }
    const here: ConversationAttachment[] = [];
    for (const file of message.attachments) {
      const key = attachmentName(file) || String(file.url ?? "");
      if (!key) continue;
      if (shown.has(key)) continue;
      shown.add(key);
      here.push(file);
    }
    const dropped = message.attachments.length - here.length;
    if (dropped > 0) {
      console.info("[hd:attach] a file already shown elsewhere was folded away", {
        message: message.id ?? "",
        kept: here.length,
        dropped,
        text: Boolean(message.body && message.body.trim()),
      });
    }
    if (here.length === 0 && !(message.body && message.body.trim())) {
      // A file-only row with nothing left to draw is a mirror, not a message.
      if (message.id) droppedIds.add(message.id);
      continue;
    }
    kept.push({ ...message, attachments: here });
  }
  return { kept, dropped: droppedIds };
}

export function alignConversation(payload: ConversationPayload): ConversationPayload {
  const viewerIsSupport = typeof payload.isSupport === "boolean" ? payload.isSupport : null;
  if (viewerIsSupport === null) {
    // An older backend keeps its own `isMine`; the reading order still holds.
    const folded = foldChannelDuplicates(
      (Array.isArray(payload.messages) ? payload.messages : []).map(normalizeMessage)
    );
    const settled = settleAttachments(orderConversation(folded.kept));
    return {
      ...payload,
      messages: settled.kept,
      timeline: withoutDropped(payload.timeline, union(folded.dropped, settled.dropped)),
    };
  }

  const folded = foldChannelDuplicates(
    (Array.isArray(payload.messages) ? payload.messages : []).map((message) =>
      normalizeMessage({
        ...message,
        isMine: message.author === "support" ? viewerIsSupport : !viewerIsSupport,
      })
    )
  );
  const settled = settleAttachments(orderConversation(folded.kept));
  const messages = settled.kept;

  // The chat is ordered by these events: an unsorted timeline would draw the
  // bubbles out of time even when `messages` itself is right. A twin the fold
  // removed must leave the timeline as well, or it draws again as an event row
  // — and so must a bare attachment row the picture-fold swallowed.
  const gone = union(folded.dropped, settled.dropped);
  const counted = new Map(
    messages.map((message) => [message.id, (message.attachments ?? []).length] as const)
  );
  const timeline = Array.isArray(payload.timeline)
    ? orderByStamp(
        payload.timeline
          .filter((event) => !(event.id && gone.has(event.id)))
          // The event row prints "N attachments" from the row it came with, and
          // that row still counts the copies the chat just folded away.
          .map((event) =>
            event.id && counted.has(event.id)
              ? { ...event, attachments: counted.get(event.id) as number }
              : event
          ),
        (event) => ({ at: event.at, id: event.id })
      )
    : payload.timeline;

  return { ...payload, messages, timeline };
}

function union(a: Set<string>, b: Set<string>): Set<string> {
  if (b.size === 0) return a;
  const merged = new Set(a);
  for (const id of b) merged.add(id);
  return merged;
}

function withoutDropped<T extends { id?: string }>(timeline: T[] | undefined, dropped: Set<string>): T[] | undefined {
  if (!Array.isArray(timeline)) return timeline;
  return timeline.filter((event) => !(event.id && dropped.has(event.id)));
}

/**
 * Files the ERP refused to link to a message (not the caller's upload, or already
 * attached elsewhere). The message itself was accepted, so this is a warning, not
 * a failure - but the customer must never believe a missing image is on the thread.
 */
function reportUnattached(missed: string[] | undefined, scope: string): void {
  if (!missed || missed.length === 0) return;
  const bangla = currentLanguage() !== "en";
  toast.warning(
    bangla
      ? `${missed.length}টি ফাইল সংযুক্ত হয়নি: ${missed.join(", ")}`
      : `${missed.length} file(s) could not be attached: ${missed.join(", ")}`
  );
  console.error("[help-desk] message saved but attachments were not attached", { missed });
  reportClientError({
    scope,
    message: `Message saved without ${missed.length} attachment(s): ${missed.join(", ")}`,
    detail: { missed },
  });
}

/** Resolve UI attachments to ERP `File` rows, uploading any browser file first. */
async function resolveAttachments(files?: File[]): Promise<{ name: string; url: string }[]> {
  const resolved: { name: string; url: string }[] = [];
  for (const file of files ?? []) {
    const uploaded: HelpDeskUploadedFile = await uploadAttachment(file);
    console.info("[hd:attach] uploaded", {
      fileName: uploaded.name,
      url: uploaded.url,
      size: uploaded.size,
    });
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
/** One console line per message that carries files: what came back, from where. */
function logAttachmentCensus(payload: ConversationPayload, where: string): void {
  const rows = (payload.messages ?? []).filter(
    (message) => (message.attachments ?? []).length > 0
  );
  if (rows.length === 0) return;
  console.info(
    "[hd:attach] conversation", where,
    rows.map((message) => ({
      id: message.id,
      author: message.author,
      channel: message.channel,
      text: Boolean(message.body && message.body.trim()),
      files: (message.attachments ?? []).map((file) => file.fileName || file.url || ""),
    }))
  );
}

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
  reportUnattached(payload.attachments_failed, "help-desk:reply");
  const aligned = alignConversation(payload);
  logAttachmentCensus(aligned, `sent ${ticketId}`);
  return aligned;
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
  reportUnattached(payload.attachments_failed, "help-desk:requirement");
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

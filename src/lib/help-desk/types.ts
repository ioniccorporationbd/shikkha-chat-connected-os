/**
 * Help Desk — shared types.
 *
 * Frontend-only for now: no Frappe/ERPNext DocType exists yet, so every value
 * here is produced by `src/lib/help-desk/service.ts` from the live ERP
 * (`HD Ticket` and its conversation), never from a local mock store.
 *
 * These shapes are deliberately shaped like a future server payload — a
 * "Help Desk Ticket" document with owner/contact, subject, category, priority,
 * description, status, messages, attachments, assigned agent and resolution —
 * so that swapping the mock service for real HTTP calls later requires no UI
 * change. Do NOT hard-lock the schema: fields a later backend may drop are all
 * optional.
 */

/** Lifecycle of a ticket, in the order support moves through it. */
export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting_for_user"
  | "resolved"
  | "closed";

/** How urgently the reporter needs an answer. */
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/** Stable ids for the (configurable) problem categories. */
export type TicketCategoryId =
  | "login"
  | "account"
  | "payment"
  | "registration"
  | "dashboard"
  | "expense_claim"
  | "customer_creation"
  | "technical"
  | "other";

/** Who wrote a conversation entry. */
export type MessageAuthor = "user" | "support" | "system";

/** How the reporter prefers to be reached. */
export type PreferredContact = "email" | "mobile";

/** A file the reporter attached. Stored as metadata only (no real upload yet). */
export interface TicketAttachment {
  id: string;
  /** Original file name. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** MIME type, e.g. `image/png`. */
  mime: string;
  /**
   * A short-lived object URL for an in-browser preview. Never persisted — a
   * later backend/file API returns the real, permanent URL instead.
   */
  previewUrl?: string;
  /** The ERP's stored file URL (`/private/files/...`), once uploaded. */
  url?: string;
  /** The browser File while the ticket is still being submitted (never persisted). */
  file?: File;
}

/** One entry in a ticket's conversation timeline. */
/** A file carried by a chat message (image, PDF, document or voice note). */
export interface MessageAttachment {
  /** ERP file URL, served through `/api/help-desk/files`. */
  url: string;
  fileName?: string;
  fileType?: string;
  size?: number;
}

export interface TicketMessage {
  id: string;
  author: MessageAuthor;
  /** Display name for support (agent) messages; ignored for user messages. */
  authorName?: string;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  /** Ordered how-to steps a support reply may carry (rendered as a steps card). */
  steps?: string[];
  /** When this entry changed the ticket status, the new status (for the timeline). */
  statusChange?: TicketStatus;
  /** Files attached to this message. */
  attachments?: MessageAttachment[];
}

/** The person who filed the ticket (or who is tracking it). */
export interface TicketContact {
  name: string;
  email: string;
  mobile?: string;
  preferredContact?: PreferredContact;
}

/** A help-desk ticket. */
export interface Ticket {
  /** Human-facing display id, e.g. `HD-2026-00001`. */
  id: string;
  subject: string;
  category: TicketCategoryId;
  priority: TicketPriority;
  /** The original problem description (the user's first message body). */
  description: string;
  status: TicketStatus;
  contact: TicketContact;
  /** Optional app route the problem happened on, e.g. `/login`. */
  relatedRoute?: string;
  attachments: TicketAttachment[];
  /** The full conversation, oldest first. */
  messages: TicketMessage[];
  /** The message this customer pinned to the ticket, if any (ERP cache-backed). */
  pinnedMessageId?: string | null;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  assignedAgent?: string;
  /** Optional owning department (demo/mock phase; a later backend may supply it). */
  department?: string;
  /**
   * Mock-phase owner identity (normalised email or profile name) used to filter
   * a signed-in user's own tickets. This is a CONVENIENCE FILTER ONLY — real
   * ownership must be enforced server-side once a backend exists.
   */
  ownerKey?: string;
}

/** Payload accepted by `createTicket`. */
export interface CreateTicketInput {
  subject: string;
  /**
   * ERP `HD Ticket Type` name — the only thing the form sends now that the
   * options come from the ERP. Sent verbatim; the backend rejects a type that
   * does not exist instead of silently inventing one.
   */
  ticketType?: string;
  /** ERP `HD Ticket Priority` name (dynamic), never a hard-coded list member. */
  priority?: string;
  description: string;
  contact: TicketContact;
  relatedRoute?: string;
  /** ERP `HD Team` name the ticket is routed to, when one is configured. */
  department?: string;
  attachments?: TicketAttachment[];
}

/** A support reply the "customer care" simulation can post. */
export interface SupportReplyInput {
  body: string;
  steps?: string[];
  /** Optionally move the ticket to a new status as part of the reply. */
  statusChange?: TicketStatus;
  /** Free-text resolution summary when resolving. */
  resolutionSummary?: string;
  agentName?: string;
}

/** Ticket-list filter + search state. */
export interface TicketFilterState {
  status: TicketStatus | "all";
  query: string;
}

/** Server payload of `GET /api/help-desk/tickets` (computed by the ERP). */
export interface HelpDeskCounts {
  all: number;
  open: number;
  in_progress: number;
  waiting_for_user: number;
  resolved: number;
  closed: number;
}

export interface HelpDeskListPayload {
  tickets: Ticket[];
  counts: HelpDeskCounts;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  server_time: string;
}

/** Server payload of ticket creation / detail / reply / reopen. */
export interface HelpDeskTicketPayload {
  ticket: Ticket;
  verified?: boolean;
  duplicate?: boolean;
}

/** Server payload of `POST /api/help-desk/upload`. */
export interface HelpDeskUploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
}

/** One ERP-configured priority (`HD Ticket Priority`), mapped to the portal key. */
export interface HelpDeskOptionPriority {
  /** Portal priority key when the ERP row maps to one (`low|medium|high|urgent`), else null. */
  id: string | null;
  /** The ERP `HD Ticket Priority` name — what the form submits. */
  name: string;
}

export interface HelpDeskOptionType {
  /** The ERP `HD Ticket Type` name — what the form submits. */
  value: string;
  /** Portal category key when the row maps to a designed card, else null. */
  key: string | null;
}

/* ------------------------------------------------------------------ *
 * Ticket conversations (the Messages module)
 *
 * One row per ticket, one thread per ticket. Everything below is produced by
 * `shikkha_os.api.v1.help_desk_messages` out of real `HD Ticket`,
 * `Communication` and `File` records — there is no local message store.
 * ------------------------------------------------------------------ */

/** What a conversation entry is: a plain message, an added requirement, or a resolution. */
export type ConversationMessageKind = "message" | "requirement" | "resolution";

/**
 * ERP storage channel of one thread entry: `message` = `Communication`
 * (email-style reply), `comment` = `Comment` (the row Frappe Helpdesk shows in
 * its Comment tab / `#comment`).
 */
export type ConversationChannel = "message" | "comment";

/** A file attached to one message (an existing ERP `File` record). */
export interface ConversationAttachment {
  /** Public file URL from the ERP `File` record. */
  url?: string;
  fileName: string;
  /** MIME type as stored on the `File` record (may be empty). */
  fileType: string;
  size: number;
}

/** The message this entry quotes as its reply-to reference. */
export interface ConversationReplyRef {
  id: string;
  author: MessageAuthor;
  authorName?: string;
  body: string;
}

/** One entry in a ticket's conversation, as returned by the ERP. */
export interface ConversationMessage {
  id: string;
  author: MessageAuthor;
  authorName?: string;
  body: string;
  /** ISO timestamp. */
  createdAt: string;
  kind: ConversationMessageKind;
  /**
   * Which ERP channel the entry came from: `message` is a `Communication`
   * (email-style reply), `comment` is a `Comment` row — the same record the
   * Frappe Helpdesk desk/SPA render in their Comment tab. Defaults to
   * `message` when the ERP omits it (older rows).
   */
  channel?: ConversationChannel;
  replyTo?: ConversationReplyRef | null;
  attachments: ConversationAttachment[];
  /** True when the signed-in user wrote this entry. */
  isMine: boolean;
  /** Whether the *recipient* has read it (ERP `Communication.seen`). */
  seen: boolean;
}

/** One Messages table row — a single ticket thread. */
export interface ConversationSummary {
  ticketId: string;
  subject: string;
  status: TicketStatus;
  statusLabel: string;
  priority: TicketPriority;
  category?: TicketCategoryId;
  customer: string;
  assignedAgent?: string | null;
  /** When the ticket left Open (ERP `resolution_date`, else last update). */
  resolvedAt?: string;
  counterpart?: string | null;
  lastMessage: string;
  lastSender: string;
  lastSenderRole: "customer" | "support";
  lastMessageAt: string;
  /** When the customer originally submitted the problem. */
  submittedAt?: string;
  updatedAt: string;
  messageCount: number;
  unread: number;
}

/** Server payload of `GET /api/help-desk/conversations`. */
/** Unread activity counts for the Help Desk section cards and nav entries. */
export interface HelpDeskBadgeCounts {
  /** Customer: unread support replies on Open tickets. Always 0 for staff. */
  open_tickets: number;
  /** Customer: unread support replies on Resolved/Closed tickets. */
  solved_tickets: number;
  /** Staff: Open tickets that hold unread customer activity or no reply yet. */
  new_problem: number;
  /** Staff: unread customer activity on tickets that already left Open. */
  solve_problem: number;
}

export interface HelpDeskBadgesPayload {
  role: "customer" | "employee";
  counts: HelpDeskBadgeCounts;
  server_time?: string;
}

export interface ConversationListPayload {
  conversations: ConversationSummary[];
  total: number;
  unread: number;
  page: number;
  page_size: number;
  has_more: boolean;
  isSupport: boolean;
  server_time: string;
}

/** Server payload of `GET /api/help-desk/conversations/[id]`. */
/** One row of the detail page's audit trail (`get_conversation().timeline`). */
export type ConversationTimelineType = "created" | "message" | "requirement" | "resolution" | "status";

export interface ConversationTimelineEvent {
  /** Communication name, `created`, or a synthetic `status:<at>` id. */
  id: string;
  type: ConversationTimelineType;
  at: string;
  author: "user" | "support";
  authorName: string;
  text: string;
  /** Raw ERP status names — only on `type: "status"` events. */
  from?: string;
  to?: string;
  attachments: number;
}

export interface ConversationPayload {
  ticket: Ticket;
  messages: ConversationMessage[];
  requirements: ConversationMessage[];
  /** Every event on the ticket, oldest first (creation, replies, status). */
  timeline?: ConversationTimelineEvent[];
  unread: number;
  statusCategory: string;
  isSupport: boolean;
  canReply: boolean;
  canAddRequirement: boolean;
  canChangeStatus: boolean;
  /** The ERP status row currently set on the ticket (employees). */
  currentStatus?: string;
  /** Every existing `HD Ticket Status` an employee may move the ticket to. */
  statuses?: { name: string; category: string }[];
  /**
   * Paging. A plain call still returns the whole thread (`paged: false`);
   * passing `limit` switches the message list to one page and these fields
   * describe where that page sits in the history.
   */
  paged?: boolean;
  /** Older entries exist below this page — ask again with `next_cursor`. */
  has_more?: boolean;
  /** A `since=` read hit its window: more entries exist above this page. */
  has_newer?: boolean;
  /** Cursor to pass as `cursor=` for the next older page. */
  next_cursor?: string | null;
  /** Cursor of the newest loaded entry — pass as `since=` for a delta read. */
  latest_cursor?: string | null;
  server_time: string;
}

/** Everything the create form offers, straight from the ERP master data. */
export interface HelpDeskOptions {
  statuses: {
    name: string;
    category: string;
    label: string;
    color?: string | null;
    enabled: number;
  }[];
  priorities: HelpDeskOptionPriority[];
  types: string[];
  categories: HelpDeskOptionType[];
  teams: string[];
}

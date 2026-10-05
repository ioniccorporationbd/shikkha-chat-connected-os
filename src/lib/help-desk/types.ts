/**
 * Help Desk — shared types.
 *
 * Frontend-only for now: no Frappe/ERPNext DocType exists yet, so every value
 * here is produced by the local mock service layer (`src/lib/help-desk/service.ts`).
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
}

/** One entry in a ticket's conversation timeline. */
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
  category: TicketCategoryId;
  priority: TicketPriority;
  description: string;
  contact: TicketContact;
  relatedRoute?: string;
  /** Optional department the ticket is routed to (demo/mock phase). */
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

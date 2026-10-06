/**
 * Help Desk — frontend configuration.
 *
 * Pure data + icon references only. All human-facing text lives in
 * `messages.ts` (keyed by the ids below), so a later backend/DocType can replace
 * this config with a server-provided list without touching any copy logic.
 */

import type { IconType } from "react-icons";
import {
  FiAlertCircle,
  FiCreditCard,
  FiGrid,
  FiHelpCircle,
  FiLogIn,
  FiTool,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";

import type { TicketCategoryId, TicketPriority, TicketStatus } from "./types";

export interface CategoryConfig {
  id: TicketCategoryId;
  icon: IconType;
}

/** Problem categories, in display order. Labels come from `copy.categories`. */
export const TICKET_CATEGORIES: readonly CategoryConfig[] = [
  { id: "login", icon: FiLogIn },
  { id: "account", icon: FiUser },
  { id: "payment", icon: FiCreditCard },
  { id: "registration", icon: FiUserPlus },
  { id: "dashboard", icon: FiGrid },
  { id: "expense_claim", icon: FiAlertCircle },
  { id: "customer_creation", icon: FiUserPlus },
  { id: "technical", icon: FiTool },
  { id: "other", icon: FiHelpCircle },
];

/** Priority options, low → urgent. Labels come from `copy.priorities`. */
export const TICKET_PRIORITIES: readonly TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

/** Status options, in lifecycle order. Labels come from `copy.statuses`. */
export const TICKET_STATUSES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
];

/** Filter chips on the ticket list. `all` + the lifecycle statuses. */
export const TICKET_FILTERS: readonly (TicketStatus | "all")[] = [
  "all",
  "open",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
];

export const DEFAULT_CATEGORY: TicketCategoryId = "technical";
export const DEFAULT_PRIORITY: TicketPriority = "medium";

/** Colour tokens per status. Muted, semantic, theme-aligned (no neon). */
export const STATUS_TONE: Record<TicketStatus, string> = {
  open: "#071e2e",
  in_progress: "#b45309",
  waiting_for_user: "#2f5f7d",
  resolved: "#2f7d5a",
  closed: "#6b7280",
};

/** Colour tokens per priority. */
export const PRIORITY_TONE: Record<TicketPriority, string> = {
  low: "#2f7d5a",
  medium: "#2f5f7d",
  high: "#c98a1f",
  urgent: "#b4453a",
};

/** Categories that are considered "still open" work (not finished). */
export const ACTIVE_STATUSES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_for_user",
];

export function isActiveStatus(status: TicketStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Shared card surface used across every Help Desk screen. */
export const HD_CARD =
  "rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/** Shared primary pill button (text utilities live on an inner span). */
export const HD_PRIMARY_BTN =
  "group inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-3 font-semibold transition duration-300 hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2";

/** Shared ghost/outline button. */
export const HD_GHOST_BTN =
  "group inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] px-5 py-3 font-semibold text-[var(--color-primary)] transition duration-300 hover:-translate-y-[2px] hover:bg-[var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2";

/** Shared text input / textarea / select surface. */
export const HD_INPUT =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-4 py-3 text-[15px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-secondary)_70%,var(--color-white))]";

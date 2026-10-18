/**
 * Help Desk — ERP-managed choices for the create form.
 *
 * The form offers exactly what the ERP is configured for: `HD Ticket Priority`
 * rows and `HD Ticket Type` rows. When the ERP has no rows of a kind (or the
 * options call failed) the design's default lists are kept, so the UI never
 * changes shape — only which values are on offer.
 */

import { TICKET_CATEGORIES, TICKET_PRIORITIES, type CategoryConfig } from "./config";
import type { HelpDeskOptions, TicketPriority } from "./types";

/** Portal priority keys that exist as `HD Ticket Priority` rows (null = no constraint). */
export function erpPriorityKeys(options: HelpDeskOptions | null): Set<TicketPriority> | null {
  if (!options) return null;
  const keys = new Set<TicketPriority>();
  for (const priority of options.priorities) {
    if (priority.id) keys.add(priority.id);
  }
  return keys.size ? keys : null;
}

/** Priority pills to render: ERP-supported keys, else the design list. */
export function priorityChoices(options: HelpDeskOptions | null): readonly TicketPriority[] {
  const keys = erpPriorityKeys(options);
  if (!keys) return TICKET_PRIORITIES;
  const supported = TICKET_PRIORITIES.filter((key) => keys.has(key));
  return supported.length ? supported : TICKET_PRIORITIES;
}

/**
 * Category cards to render: the design cards whose label matches a configured
 * `HD Ticket Type`, else all cards (the backend simply leaves `ticket_type`
 * empty for a category the ERP has no type for).
 */
export function categoryChoices(options: HelpDeskOptions | null): readonly CategoryConfig[] {
  if (!options || !options.types.length || !options.categories.length) return TICKET_CATEGORIES;
  const types = new Set(options.types.map((name) => String(name).trim().toLowerCase()));
  const supported = new Set(
    options.categories
      .filter((category) => types.has(String(category.label || "").trim().toLowerCase()))
      .map((category) => category.id)
  );
  if (!supported.size) return TICKET_CATEGORIES;
  const filtered = TICKET_CATEGORIES.filter((category) => supported.has(category.id));
  return filtered.length ? filtered : TICKET_CATEGORIES;
}

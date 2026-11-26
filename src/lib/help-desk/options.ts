/**
 * Help Desk — ERP-managed choices for the create form.
 *
 * Nothing here carries a hard-coded option list: every value the form offers is
 * a real `HD Ticket Type` / `HD Ticket Priority` / `HD Team` row read from the
 * ERP via `GET /api/help-desk/options`. This module only decides how those rows
 * are *presented* (which icon, which tone, which translated label), so the
 * design stays identical no matter what the ERP is configured with.
 */

import type { HelpDeskOptionPriority, HelpDeskOptionType, HelpDeskOptions } from "./types";

export type TypeIconKey = "technical" | "billing" | "account" | "usage" | "other" | "generic";

/** Presentation hint only — the label always comes from the ERP row itself. */
const ICON_HINTS: readonly [RegExp, TypeIconKey][] = [
  [/bill|invoice|payment|refund|charge|price/i, "billing"],
  [/account|login|password|profile|access|auth|verify/i, "account"],
  [/usage|course|class|content|video|lesson|tutor|exam/i, "usage"],
  [/tech|bug|error|crash|network|api|system|server/i, "technical"],
  [/other|general|misc/i, "other"],
];

const KNOWN_KEYS: readonly TypeIconKey[] = ["technical", "billing", "account", "usage", "other"];

export function iconForType(value: string, key: string | null): TypeIconKey {
  if (key && (KNOWN_KEYS as readonly string[]).includes(key)) return key as TypeIconKey;
  for (const [pattern, icon] of ICON_HINTS) {
    if (pattern.test(value)) return icon;
  }
  return "generic";
}

/** Configured ticket types (categories) — one card each, ERP order preserved. */
export function typeChoices(options: HelpDeskOptions | null): HelpDeskOptionType[] {
  return options?.categories ?? [];
}

/** Configured priorities — one pill each, ERP order preserved. */
export function priorityChoices(options: HelpDeskOptions | null): HelpDeskOptionPriority[] {
  return options?.priorities ?? [];
}

/** Configured teams the ticket can route to. */
export function teamChoices(options: HelpDeskOptions | null): string[] {
  return options?.teams ?? [];
}

/** Localized label for a type row: the designed translation when the row maps
 *  to a known card, otherwise the ERP name exactly as configured. */
export function typeLabel(choice: HelpDeskOptionType, translated?: Record<string, string>): string {
  if (choice.key && translated && translated[choice.key]) return translated[choice.key];
  return choice.value;
}

/** Localized label for a priority row (falls back to the ERP name). */
export function priorityLabel(choice: HelpDeskOptionPriority, translated?: Record<string, string>): string {
  if (choice.id && translated && translated[choice.id]) return translated[choice.id];
  return choice.name;
}

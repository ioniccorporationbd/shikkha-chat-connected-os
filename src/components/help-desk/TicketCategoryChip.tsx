"use client";

import type { TicketCategoryId } from "@/lib/help-desk/types";
import { TICKET_CATEGORIES } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";

/** Neutral chip with the category icon + label. */
export function TicketCategoryChip({
  category,
  copy,
}: {
  category: TicketCategoryId;
  copy: HelpDeskCopy;
}) {
  const config = TICKET_CATEGORIES.find((c) => c.id === category);
  const Icon = config?.icon;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--color-action)_24%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
      {Icon ? <Icon className="h-3.5 w-3.5 flex-none" aria-hidden /> : null}
      {copy.categories[category]}
    </span>
  );
}

export default TicketCategoryChip;

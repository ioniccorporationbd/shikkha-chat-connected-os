"use client";

import type { TicketPriority } from "@/lib/help-desk/types";
import { PRIORITY_TONE } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";

/** Coloured pill for a ticket priority (low → urgent), always text + colour. */
export function TicketPriorityBadge({
  priority,
  copy,
}: {
  priority: TicketPriority;
  copy: HelpDeskCopy;
}) {
  const tone = PRIORITY_TONE[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        color: tone,
        backgroundColor: `color-mix(in srgb, ${tone} 10%, white)`,
        border: `1px solid color-mix(in srgb, ${tone} 30%, white)`,
      }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: tone }} aria-hidden />
      {copy.priorities[priority]}
    </span>
  );
}

export default TicketPriorityBadge;

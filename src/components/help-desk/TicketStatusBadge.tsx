"use client";

import type { TicketStatus } from "@/lib/help-desk/types";
import { STATUS_TONE } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";

/**
 * Coloured pill for a ticket status. Status is always shown as TEXT (never
 * colour alone) so it stays readable for colour-blind users and screen readers.
 */
export function TicketStatusBadge({
  status,
  copy,
}: {
  status: TicketStatus;
  copy: HelpDeskCopy;
}) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        color: tone,
        backgroundColor: `color-mix(in srgb, ${tone} 12%, white)`,
        border: `1px solid color-mix(in srgb, ${tone} 34%, white)`,
      }}
    >
      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: tone }} aria-hidden />
      {copy.statuses[status]}
    </span>
  );
}

export default TicketStatusBadge;

"use client";

import Link from "next/link";
import { FiArrowRight, FiClock } from "react-icons/fi";

import { HELP_DESK_TICKETS_PATH } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { Ticket } from "@/lib/help-desk/types";

import TicketCategoryChip from "./TicketCategoryChip";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

/** A single ticket as a mobile-friendly card (used below the `lg` table breakpoint). */
export default function TicketCard({
  ticket,
  copy,
  language,
}: {
  ticket: Ticket;
  copy: HelpDeskCopy;
  language: string;
}) {
  return (
    <article className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] p-4 shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
          {ticket.id}
        </span>
        <TicketStatusBadge status={ticket.status} copy={copy} />
      </div>

      <h3 className="mt-2 text-base font-semibold text-[var(--color-primary)]">{ticket.subject}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TicketCategoryChip category={ticket.category} copy={copy} />
        <TicketPriorityBadge priority={ticket.priority} copy={copy} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--color-primary)_65%,var(--color-white))]">
          <FiClock className="h-3.5 w-3.5" aria-hidden />
          {formatDateTime(ticket.updatedAt, language)}
        </span>
        <Link
          href={`${HELP_DESK_TICKETS_PATH}/${ticket.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
          <FiArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

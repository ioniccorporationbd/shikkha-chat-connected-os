"use client";

import Link from "next/link";
import { FiCalendar, FiChevronRight } from "react-icons/fi";

import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import type { Ticket } from "@/lib/help-desk/types";

import TicketCategoryChip from "./TicketCategoryChip";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

/**
 * A single ticket as a card (below the `lg` table breakpoint). Mirrors the
 * desktop row: serial number, id, status, subject, chips and the same outline
 * "view details" action button — red appears on that action only.
 */
export default function TicketCard({
  ticket,
  copy,
  language,
  detailHref,
  basePath,
  newReply,
  sl,
}: {
  ticket: Ticket;
  copy: HelpDeskCopy;
  language: string;
  /** Optional override for the card's detail URL (solved cards open Messages). */
  detailHref?: (ticketId: string) => string;
  basePath?: string;
  newReply?: boolean;
  /** Row serial number shown on the desktop table. */
  sl?: number;
}) {
  const links = helpDeskLinks(basePath);
  return (
    <article className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_7%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
          {typeof sl === "number" ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] text-[11px] tabular-nums text-[var(--color-primary)]">
              {sl}
            </span>
          ) : null}
          {ticket.id}
        </span>
        <span className="flex items-center gap-2">
          {newReply ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
              {copy.newReplyBadge}
            </span>
          ) : null}
          <TicketStatusBadge status={ticket.status} copy={copy} />
        </span>
      </div>

      <h3 className="mt-2 text-base font-semibold text-[var(--color-primary)]">{ticket.subject}</h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TicketCategoryChip category={ticket.category} copy={copy} />
        <TicketPriorityBadge priority={ticket.priority} copy={copy} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--color-primary)_65%,var(--color-white))]">
          <FiCalendar className="h-3.5 w-3.5" aria-hidden />
          {formatDateTime(ticket.updatedAt, language)}
        </span>
        <Link
          href={detailHref ? detailHref(ticket.id) : links.ticket(ticket.id)}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
        >
          <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
          <FiChevronRight size={14} className="text-[var(--color-primary)]" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

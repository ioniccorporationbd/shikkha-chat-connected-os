"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import { HELP_DESK_TICKETS_PATH } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { Ticket } from "@/lib/help-desk/types";

import TicketCard from "./TicketCard";
import TicketCategoryChip from "./TicketCategoryChip";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

/**
 * Ticket list: a polished table on desktop (`lg`+) and stacked cards on mobile.
 * `hasFilter` distinguishes a genuine "no tickets" state (handled by the caller)
 * from "no tickets match this filter".
 */
export default function TicketList({
  tickets,
  copy,
  language,
  hasFilter,
}: {
  tickets: Ticket[];
  copy: HelpDeskCopy;
  language: string;
  hasFilter?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-white))] bg-[var(--color-white)] p-8 text-center">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          {hasFilter ? copy.searchPlaceholder : copy.emptyTitle}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile / tablet: cards */}
      <div className="space-y-3 lg:hidden">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} copy={copy} language={language} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] shadow-[0_16px_36px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] lg:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{copy.listTitle}</caption>
          <thead>
            <tr className="bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))]">
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colTicketId}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colSubject}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colCategory}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colPriority}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colStatus}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colUpdated}
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
                {copy.colAction}
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
              >
                <td className="px-4 py-3 text-sm font-bold text-[var(--color-primary)]">{ticket.id}</td>
                <td className="max-w-[22rem] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
                  {ticket.subject}
                </td>
                <td className="px-4 py-3">
                  <TicketCategoryChip category={ticket.category} copy={copy} />
                </td>
                <td className="px-4 py-3">
                  <TicketPriorityBadge priority={ticket.priority} copy={copy} />
                </td>
                <td className="px-4 py-3">
                  <TicketStatusBadge status={ticket.status} copy={copy} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-white))]">
                  {formatDateTime(ticket.updatedAt, language)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`${HELP_DESK_TICKETS_PATH}/${ticket.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                  >
                    <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
                    <FiArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

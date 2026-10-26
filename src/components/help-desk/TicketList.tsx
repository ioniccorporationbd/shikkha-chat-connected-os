"use client";

import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

import { formatDateTimeNumeric } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import type { Ticket } from "@/lib/help-desk/types";

import SubjectCell from "./SubjectCell";
import TicketCard from "./TicketCard";
import TicketCategoryChip from "./TicketCategoryChip";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

const HEAD = "whitespace-nowrap px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]";

/**
 * Ticket table, laid out exactly like the Service / Payment list panels:
 * mint header strip, `SL` column, numbered rows, an outline "view details"
 * action button per row and stacked cards on mobile. Shikkha red is used ONLY
 * on the row action (a click target) — never in the static chrome.
 */
export default function TicketList({
  tickets,
  copy,
  language,
  hasFilter,
  basePath,
  unseenIds,
  slStart = 1,
  detailHref,
  stamp = "created",
}: {
  tickets: Ticket[];
  copy: HelpDeskCopy;
  language: string;
  hasFilter?: boolean;
  basePath?: string;
  unseenIds?: ReadonlySet<string>;
  /** First row's serial number (page-aware). */
  slStart?: number;
  /** Optional override for the row's detail URL. */
  detailHref?: (ticketId: string) => string;
  /**
   * Which timestamp the date/time column carries: `created` for the Open
   * tickets table (when the ticket was filed) and `resolved` for the Closed
   * table (when it left Open). WhatsApp-style: the date and the clock time sit
   * together, stacked, so a row reads like a chat entry.
   */
  stamp?: "created" | "resolved";
}) {
  const links = helpDeskLinks(basePath);

  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_24%,var(--color-white))] bg-[var(--color-white)] px-6 py-12 text-center">
        <p className="text-sm font-semibold text-[var(--color-primary)]">{hasFilter ? copy.searchPlaceholder : copy.emptyTitle}</p>
        <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{copy.emptyHint}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile / tablet: cards */}
      <div className="space-y-3 lg:hidden">
        {tickets.map((ticket, index) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            copy={copy}
            language={language}
            basePath={basePath}
            detailHref={detailHref}
            newReply={Boolean(unseenIds?.has(ticket.id))}
            stamp={stamp}
            sl={slStart + index}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] lg:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{copy.listTitle}</caption>
          <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
            <tr>
              <th scope="col" className={HEAD}>{copy.colSl}</th>
              <th scope="col" className={HEAD}>{copy.colTicketId}</th>
              <th scope="col" className={HEAD}>{copy.colSubject}</th>
              <th scope="col" className={`${HEAD} hidden xl:table-cell`}>{copy.colCategory}</th>
              <th scope="col" className={`${HEAD} hidden xl:table-cell`}>{copy.colPriority}</th>
              <th scope="col" className={HEAD}>{copy.colStatus}</th>
              <th scope="col" className={HEAD}>{stamp === "resolved" ? copy.colClosedAt : copy.colCreatedAt}</th>
              <th scope="col" className={HEAD}>{copy.colAction}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr
                key={ticket.id}
                className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)]"
              >
                <td className="px-4 py-3.5 text-[13px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                  {slStart + index}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold text-[var(--color-primary)]">{ticket.id}</td>
                <td className="max-w-[20rem] px-4 py-3.5 text-[13px] font-medium text-[var(--color-primary)]">
                  <span className="inline-flex max-w-full items-center gap-2">
                    {/* 15 chars + full text in a hover/tap/focus popover. */}
                    <SubjectCell subject={ticket.subject} />
                    {unseenIds?.has(ticket.id) ? (
                      <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
                        {copy.newReplyBadge}
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 xl:table-cell">
                  <TicketCategoryChip category={ticket.category} copy={copy} />
                </td>
                <td className="hidden px-4 py-3.5 xl:table-cell">
                  <TicketPriorityBadge priority={ticket.priority} copy={copy} />
                </td>
                <td className="px-4 py-3.5">
                  <TicketStatusBadge status={ticket.status} copy={copy} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {(() => {
                    const iso = stamp === "resolved" ? ticket.resolvedAt || ticket.updatedAt : ticket.createdAt;
                    return (
                      // One stamp, straight from the ERP: `26/10/2026, 06:20 PM`
                      // in Asia/Dhaka. A missing timestamp prints an em dash —
                      // never today's date, never a guessed clock time.
                      <span className="text-[12.5px] font-semibold tabular-nums text-[var(--color-primary)]">
                        <time dateTime={iso || undefined}>{formatDateTimeNumeric(iso, language)}</time>
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={detailHref ? detailHref(ticket.id) : links.ticket(ticket.id)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                  >
                    <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
                    <FiChevronRight size={14} className="text-[var(--color-primary)]" aria-hidden />
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

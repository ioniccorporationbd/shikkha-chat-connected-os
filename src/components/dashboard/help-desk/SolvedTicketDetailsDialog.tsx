"use client";

import { FiCheckCircle } from "react-icons/fi";

import DetailSheet, { type DetailSection } from "@/components/dashboard/DetailSheet";
import { formatDateTimeNumeric } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { Ticket } from "@/lib/help-desk/types";

import TicketCategoryChip from "@/components/help-desk/TicketCategoryChip";
import TicketStatusBadge from "@/components/help-desk/TicketStatusBadge";

/**
 * Solved-ticket details popup.
 *
 * The Solved table's অ্যাকশন column opens this sheet instead of navigating to
 * the ticket page: one glance at the resolved ticket (id, subject, category,
 * priority, status, dates, agent, the original problem and the resolution
 * summary) plus the shared Print / Download action bar from `DetailSheet` —
 * the exact document family the Service Build and Payment History sheets use,
 * so Bengali prints through the same webfont pipeline.
 */
export default function SolvedTicketDetailsDialog({
  ticket,
  copy,
  language,
  onClose,
}: {
  ticket: Ticket | null;
  copy: HelpDeskCopy;
  language: string;
  onClose: () => void;
}) {
  const sections: DetailSection[] = ticket
    ? [
        {
          key: "info",
          title: copy.detailsInfo,
          rows: [
            { label: copy.colTicketId, value: ticket.id, emphasis: true },
            { label: copy.colSubject, value: ticket.subject },
            { label: copy.colCategory, value: copy.categories[ticket.category] },
            { label: copy.colPriority, value: copy.priorities[ticket.priority] },
            { label: copy.colStatus, value: copy.statuses[ticket.status] },
            { label: copy.detailsCreated, value: formatDateTimeNumeric(ticket.createdAt, language) },
            ...(ticket.resolvedAt
              ? [{ label: copy.resolvedAt, value: formatDateTimeNumeric(ticket.resolvedAt, language) }]
              : []),
            { label: copy.detailsAgent, value: ticket.assignedAgent || copy.detailsUnassigned },
          ],
        },
        {
          key: "problem",
          title: copy.detailsProblem,
          rows: [{ label: copy.detailsProblem, value: ticket.description }],
        },
        ...(ticket.resolutionSummary
          ? [
              {
                key: "resolution",
                title: copy.resolvedSummary,
                rows: [{ label: copy.resolvedSummary, value: ticket.resolutionSummary }],
              },
            ]
          : []),
      ]
    : [];

  return (
    <DetailSheet
      open={Boolean(ticket)}
      onClose={onClose}
      closeLabel={copy.close}
      eyebrow={copy.solvedTitle}
      title={ticket ? ticket.id : ""}
      subtitle={ticket?.subject}
      icon={
        <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
          <FiCheckCircle size={18} aria-hidden />
        </span>
      }
      badges={
        ticket ? (
          <>
            <TicketStatusBadge status={ticket.status} copy={copy} />
            <TicketCategoryChip category={ticket.category} copy={copy} />
          </>
        ) : undefined
      }
      sections={sections}
      document={
        ticket
          ? {
              brand: "Shikkha Chat",
              filename: `ticket-${ticket.id}`,
              printLabel: copy.solvedDetailsPrint,
              downloadLabel: copy.solvedDetailsDownload,
              footerNote: copy.solvedDetailsFooter,
              locale: language === "en" ? "en-GB" : "bn-BD",
            }
          : undefined
      }
    />
  );
}

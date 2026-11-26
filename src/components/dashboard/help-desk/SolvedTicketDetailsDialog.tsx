"use client";

import { useEffect, useState } from "react";
import { FiCheckCircle } from "react-icons/fi";

import DetailSheet, { type DetailSection } from "@/components/dashboard/DetailSheet";
import { formatDateTimeNumeric } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { getTicket } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";
import { reportClientError } from "@/lib/log/report-error";

import TicketCategoryChip from "@/components/help-desk/TicketCategoryChip";
import TicketStatusBadge from "@/components/help-desk/TicketStatusBadge";

/** Skeleton dwell so the loading state is perceivable, like the invoice sheet. */
const MIN_LOADING_MS = 350;

/**
 * Solved-ticket details popup — Service Build (ইনভয়েস বিস্তারিত) behaviour:
 * the click opens the sheet immediately in a loading state, the ticket is
 * fetched fresh through `getTicket`, then the details, Print and Download
 * render. The row data is the fallback when the fetch is empty/unavailable, so
 * the popup never dead-ends.
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
  // The parent remounts this sheet per ticket (`key={ticket.id}`), so the
  // mount state IS the reset: open on the skeleton, then fill in.
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(Boolean(ticket));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticket) return;
    let active = true;
    const startedAt = Date.now();
    void getTicket(ticket.id)
      .then((fresh) => {
        if (!active) return;
        setDetail(fresh ?? ticket);
      })
      .catch((err) => {
        if (!active) return;
        // Row data still opens the sheet; the failure is readable in the browser
        // console and the ERP Error Log, never silently swallowed.
        setDetail(ticket);
        setError(copy.detailsLoadFailed);
        reportClientError({
          scope: "help-desk:solved-detail-load",
          message: `Could not refresh solved ticket ${ticket.id}.`,
          detail: { error: err instanceof Error ? err.message : String(err) },
        });
      })
      .finally(() => {
        if (!active) return;
        const wait = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
        setTimeout(() => {
          if (active) setLoading(false);
        }, wait);
      });
    return () => {
      active = false;
    };
  }, [ticket, copy.detailsLoadFailed]);

  const data = detail;

  const sections: DetailSection[] = data
    ? [
        {
          key: "info",
          title: copy.detailsInfo,
          rows: [
            { label: copy.colTicketId, value: data.id, emphasis: true },
            { label: copy.colSubject, value: data.subject },
            { label: copy.colCategory, value: copy.categories[data.category] },
            { label: copy.colPriority, value: copy.priorities[data.priority] },
            { label: copy.colStatus, value: copy.statuses[data.status] },
            { label: copy.detailsCreated, value: formatDateTimeNumeric(data.createdAt, language) },
            ...(data.resolvedAt
              ? [{ label: copy.resolvedAt, value: formatDateTimeNumeric(data.resolvedAt, language) }]
              : []),
            { label: copy.detailsAgent, value: data.assignedAgent || copy.detailsUnassigned },
          ],
        },
        {
          key: "problem",
          title: copy.detailsProblem,
          rows: [{ label: copy.detailsProblem, value: data.description }],
        },
        ...(data.resolutionSummary
          ? [
              {
                key: "resolution",
                title: copy.resolvedSummary,
                rows: [{ label: copy.resolvedSummary, value: data.resolutionSummary }],
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
      subtitle={data?.subject || ticket?.subject}
      icon={
        <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
          <FiCheckCircle size={18} aria-hidden />
        </span>
      }
      badges={
        data ? (
          <>
            <TicketStatusBadge status={data.status} copy={copy} />
            <TicketCategoryChip category={data.category} copy={copy} />
          </>
        ) : undefined
      }
      loading={loading}
      loadingText={copy.detailsLoading}
      error={error}
      errorTitle={copy.loadFailedTitle}
      sections={sections}
      document={
        data
          ? {
              brand: "Shikkha Chat",
              filename: `ticket-${data.id}`,
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

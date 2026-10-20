"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiHeadphones,
  FiInfo,
  FiMessageSquare,
  FiRotateCcw,
  FiSend,
  FiUser,
} from "react-icons/fi";

import { HD_CARD, HD_GHOST_BTN } from "@/lib/help-desk/config";
import { formatDate, formatTime } from "@/lib/help-desk/format";
import { markTicketSeen } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { getTicket, reopenTicket } from "@/lib/help-desk/service";
import type { Ticket, TicketStatus } from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

import { HelpDeskErrorState, HelpDeskNotFound, TicketDetailsSkeleton } from "./HelpDeskStates";
import TicketCategoryChip from "./TicketCategoryChip";
import TicketConversation from "./TicketConversation";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

type LoadState = "loading" | "ready" | "notfound" | "error";

/** Full ticket details: info, problem, attachments, conversation, reply,
 *  resolution + reopen — all read from and written to the ERP. */
export default function TicketDetails({
  ticketId,
  copy,
  language,
  basePath,
  markSeen,
}: {
  ticketId: string;
  copy: HelpDeskCopy;
  language: string;
  basePath?: string;
  markSeen?: boolean;
}) {
  const [state, setState] = useState<LoadState>("loading");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [reopenBusy, setReopenBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const found = await getTicket(ticketId);
      if (!found) {
        setState("notfound");
        return;
      }
      setTicket(found);
      setState("ready");
      if (markSeen) markTicketSeen(found);
    } catch {
      setState("error");
    }
  }, [ticketId, markSeen]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  // Shared header reload → refetch the open ticket (local state, not React Query).
  useReloadHandler(load);

  const retry = () => {
    setState("loading");
    void load();
  };

  const doReopen = async () => {
    if (!ticket) return;
    setReopenBusy(true);
    try {
      const updated = await reopenTicket(ticket.id);
      setTicket(updated);
      toast.info(copy.reopenDone);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.toastLoadFailed);
    } finally {
      setReopenBusy(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <BackLink copy={copy} basePath={basePath} />
        <TicketDetailsSkeleton />
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="space-y-4">
        <BackLink copy={copy} basePath={basePath} />
        <HelpDeskNotFound copy={copy} />
      </div>
    );
  }

  if (state === "error" || !ticket) {
    return (
      <div className="space-y-4">
        <BackLink copy={copy} basePath={basePath} />
        <HelpDeskErrorState copy={copy} onRetry={retry} />
      </div>
    );
  }

  const isResolved = ticket.status === "resolved" || ticket.status === "closed";
  // Line-wise description: split on blank lines into paragraphs and keep the
  // author's single line breaks inside each one, so a pasted list of steps
  // reads line by line instead of as one run-on paragraph.
  const descriptionParagraphs = ticket.description
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <BackLink copy={copy} basePath={basePath} />

      {/* Header card — id + title, then one tidy meta strip for the status set */}
      <div className={`${HD_CARD} overflow-hidden p-0`}>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]">
              {ticket.id}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--color-primary)]">
              <FiClock className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]" aria-hidden />
              <span className="text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">{copy.detailsCreated}</span>
              <span className="tabular-nums">{formatDate(ticket.createdAt, language)}</span>
              <span className="text-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-white))]">·</span>
              <span className="tabular-nums">{formatTime(ticket.createdAt, language)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] bg-[var(--color-white)] px-2.5 py-1 text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
              <FiActivity className="h-3.5 w-3.5" aria-hidden />
              <span>{copy.detailsUpdated}</span>
              <span className="tabular-nums">{formatDate(ticket.updatedAt, language)}</span>
              <span className="opacity-50">·</span>
              <span className="tabular-nums">{formatTime(ticket.updatedAt, language)}</span>
            </span>
          </div>
          <h1 className="mt-3 text-xl font-bold leading-snug text-[var(--color-primary)] sm:text-2xl">{ticket.subject}</h1>
        </div>

        <dl className="grid grid-cols-1 gap-px border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] sm:grid-cols-3">
          <MetaCell label={copy.colStatus}>
            <TicketStatusBadge status={ticket.status} copy={copy} />
          </MetaCell>
          <MetaCell label={copy.colPriority}>
            <TicketPriorityBadge priority={ticket.priority} copy={copy} />
          </MetaCell>
          <MetaCell label={copy.colCategory}>
            <TicketCategoryChip category={ticket.category} copy={copy} />
          </MetaCell>
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Problem */}
          <section className={`${HD_CARD} p-5 sm:p-6`}>
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
              <FiFileText className="h-4 w-4" aria-hidden />
              {copy.detailsProblem}
            </h2>
            <div className="mt-3 space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-4">
              {descriptionParagraphs.map((block, index) => (
                <p
                  key={`desc-${index}`}
                  className="whitespace-pre-line break-words text-[15px] leading-relaxed text-[var(--color-primary)]"
                >
                  {block}
                </p>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Resolved block */}
          {isResolved ? (
            <section className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-primary)]">
                  <FiCheckCircle className="h-5 w-5 text-[var(--color-white)]" aria-hidden />
                </span>
                <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.resolvedTitle}</h2>
              </div>
              {ticket.resolutionSummary ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
                    {copy.resolvedSummary}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-primary)]">{ticket.resolutionSummary}</p>
                </div>
              ) : null}
              {ticket.resolvedAt ? (
                <p className="mt-3 inline-flex flex-wrap items-center gap-x-1.5 rounded-full bg-[var(--color-white)] px-2.5 py-1 text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-white))]">
                  <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
                  <span>{copy.resolvedAt}</span>
                  <span className="tabular-nums">{formatDate(ticket.resolvedAt, language)}</span>
                  <span className="opacity-40">·</span>
                  <span className="tabular-nums">{formatTime(ticket.resolvedAt, language)}</span>
                </p>
              ) : null}

              <div className="mt-4 border-t border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] pt-3">
                <p className="text-sm font-bold text-[var(--color-primary)]">{copy.reopenStillBroken}</p>
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
                  {copy.reopenHint}
                </p>
                <button
                  type="button"
                  onClick={doReopen}
                  disabled={reopenBusy}
                  className={`${HD_GHOST_BTN} mt-3 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <FiRotateCcw className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.reopenAction}</span>
                </button>
              </div>
            </section>
          ) : null}

          {/* Info */}
          <section className={`${HD_CARD} p-5`}>
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
              <FiInfo className="h-4 w-4" aria-hidden />
              {copy.detailsInfo}
            </h2>
            <dl className="mt-3 space-y-3">
              <InfoRow icon={<FiUser className="h-4 w-4" aria-hidden />} label={copy.fieldName} value={ticket.contact.name} />
              <InfoRow icon={<FiSend className="h-4 w-4" aria-hidden />} label={copy.fieldEmail} value={ticket.contact.email} />
              {ticket.contact.mobile ? (
                <InfoRow icon={<FiClock className="h-4 w-4" aria-hidden />} label={copy.fieldMobile} value={ticket.contact.mobile} />
              ) : null}
              <InfoRow
                icon={<FiHeadphones className="h-4 w-4" aria-hidden />}
                label={copy.detailsAgent}
                value={ticket.assignedAgent || copy.detailsUnassigned}
              />
              {ticket.department ? (
                <InfoRow
                  icon={<FiBriefcase className="h-4 w-4" aria-hidden />}
                  label={copy.detailsDepartment}
                  value={ticket.department}
                />
              ) : null}
              {ticket.relatedRoute ? (
                <InfoRow
                  icon={<FiActivity className="h-4 w-4" aria-hidden />}
                  label={copy.detailsRelatedRoute}
                  value={ticket.relatedRoute}
                />
              ) : null}
            </dl>
          </section>

          {/* Timeline */}
          <section className={`${HD_CARD} p-5`}>
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
              <FiActivity className="h-4 w-4" aria-hidden />
              {copy.detailsTimeline}
            </h2>
            <ol className="mt-3 space-y-3">
              <TimelineItem
                label={copy.timelineCreated}
                date={formatDate(ticket.createdAt, language)}
                time={formatTime(ticket.createdAt, language)}
              />
              {ticket.messages
                .filter((message) => message.statusChange)
                .map((message) => (
                  <TimelineItem
                    key={`t-${message.id}`}
                    label={`${copy.timelineStatusTo} · ${copy.statuses[message.statusChange as TicketStatus]}`}
                    date={formatDate(message.createdAt, language)}
                    time={formatTime(message.createdAt, language)}
                  />
                ))}
            </ol>
          </section>

        </div>
      </div>
      {/* Conversation — the last block on the page. Replies are read here; new
          requirements and attachments are no longer submitted from this page. */}
      <section className={`${HD_CARD} p-5 sm:p-6`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
            <FiMessageSquare className="h-4 w-4" aria-hidden />
            {copy.detailsConversation}
          </h2>
          {ticket.messages.length > 0 ? (
            <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-2.5 py-1 text-[11px] font-bold tabular-nums text-[color-mix(in_srgb,var(--color-primary)_65%,var(--color-white))]">
              {ticket.messages.length}
            </span>
          ) : null}
        </div>
        <TicketConversation messages={ticket.messages} copy={copy} language={language} />
      </section>

    </div>
  );
}

function BackLink({ copy, basePath }: { copy: HelpDeskCopy; basePath?: string }) {
  const links = helpDeskLinks(basePath);
  return (
    <Link
      href={links.tickets}
      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] focus-visible:ring-offset-2"
    >
      <FiArrowLeft size={14} className="text-[var(--color-primary)]" aria-hidden />
      <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.backToList}</span>
    </Link>
  );
}

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-white)] px-4 py-3 sm:px-5">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-primary)_50%,var(--color-white))]">
        {label}
      </dt>
      <dd className="mt-1.5 flex flex-wrap items-center gap-1.5">{children}</dd>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] text-[var(--color-primary)]">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
          {label}
        </dt>
        <dd className="break-words text-sm font-semibold text-[var(--color-primary)]">{value}</dd>
      </div>
    </div>
  );
}

function TimelineItem({ label, date, time }: { label: string; date: string; time: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 flex h-2.5 w-2.5 flex-none rounded-full bg-[var(--color-primary)]" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
        <p className="mt-0.5 inline-flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,var(--color-white))]">
          <span className="tabular-nums">{date}</span>
          <span className="opacity-40">·</span>
          <span className="font-semibold tabular-nums text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-white))]">{time}</span>
        </p>
      </div>
    </li>
  );
}

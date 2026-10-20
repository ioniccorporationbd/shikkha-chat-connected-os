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
  FiPaperclip,
  FiRotateCcw,
  FiSend,
  FiUser,
  FiX,
} from "react-icons/fi";

import { HD_CARD, HD_GHOST_BTN, HD_INPUT } from "@/lib/help-desk/config";
import { formatDateTime, formatFileSize } from "@/lib/help-desk/format";
import { markTicketSeen } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { addRequirement } from "@/lib/help-desk/conversations";
import { attachmentUrl, getTicket, reopenTicket } from "@/lib/help-desk/service";
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

  const [requirement, setRequirement] = useState("");
  const [requirementFiles, setRequirementFiles] = useState<File[]>([]);
  const [requirementBusy, setRequirementBusy] = useState(false);
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

  // Additional requirements replace the old open-ticket reply form. They are
  // ticket-linked Communications, honoured by the ERP only while status = Open.
  const submitRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;
    if (!requirement.trim()) {
      toast.error(copy.reqValidation);
      return;
    }
    setRequirementBusy(true);
    try {
      await addRequirement(ticket.id, { message: requirement, attachments: requirementFiles });
      setRequirement("");
      setRequirementFiles([]);
      toast.success(copy.reqSent);
      await load();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.toastLoadFailed);
    } finally {
      setRequirementBusy(false);
    }
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
  // Additional requirements are Open-only; the ERP re-checks this server-side.
  const canAddRequirement = ticket.status === "open";

  return (
    <div className="space-y-4">
      <BackLink copy={copy} basePath={basePath} />

      {/* Header card */}
      <div className={`${HD_CARD} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
            {ticket.id}
          </span>
          <TicketStatusBadge status={ticket.status} copy={copy} />
          <TicketPriorityBadge priority={ticket.priority} copy={copy} />
          <TicketCategoryChip category={ticket.category} copy={copy} />
        </div>
        <h1 className="mt-3 text-xl font-bold text-[var(--color-primary)] sm:text-2xl">{ticket.subject}</h1>
        <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
          {copy.detailsCreated}: {formatDateTime(ticket.createdAt, language)} · {copy.detailsUpdated}:{" "}
          {formatDateTime(ticket.updatedAt, language)}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Problem */}
          <section className={`${HD_CARD} p-5 sm:p-6`}>
            <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.detailsProblem}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-primary)]">
              {ticket.description}
            </p>

            {/* Attachments */}
            <div className="mt-4 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] pt-4">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
                <FiPaperclip className="h-4 w-4" aria-hidden />
                {copy.detailsAttachments}
              </h3>
              {ticket.attachments.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {ticket.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-2.5"
                    >
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]">
                        <FiFileText className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        {attachmentUrl(file) ? (
                          <a
                            href={attachmentUrl(file) as string}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-sm font-semibold text-[var(--color-primary)] underline decoration-[color-mix(in_srgb,var(--color-primary)_30%,var(--color-white))] underline-offset-2 hover:no-underline"
                          >
                            {file.name}
                          </a>
                        ) : (
                          <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{file.name}</p>
                        )}
                        <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
                  {copy.detailsNoAttachments}
                </p>
              )}
            </div>
          </section>

          {/* Conversation */}
          <section className={`${HD_CARD} p-5 sm:p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
                <FiMessageSquare className="h-4 w-4" aria-hidden />
                {copy.detailsConversation}
              </h2>
            </div>
            <TicketConversation messages={ticket.messages} copy={copy} language={language} />

            {/* Additional requirements — Open tickets only (spec §4) */}
            {canAddRequirement ? (
              <form
                onSubmit={submitRequirement}
                className="mt-5 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] pt-4"
              >
                <label htmlFor="hd-requirement" className="text-sm font-bold text-[var(--color-primary)]">
                  {copy.reqTitle}
                </label>
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
                  {copy.reqHint}
                </p>
                <textarea
                  id="hd-requirement"
                  value={requirement}
                  onChange={(event) => setRequirement(event.target.value)}
                  rows={4}
                  placeholder={copy.reqPlaceholder}
                  className={`${HD_INPUT} mt-2 resize-y`}
                />

                {requirementFiles.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {requirementFiles.map((file) => (
                      <li
                        key={`${file.name}-${file.size}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-3 py-1 text-xs font-medium text-[var(--color-primary)]"
                      >
                        <FiPaperclip className="h-3.5 w-3.5" aria-hidden />
                        <span className="max-w-[14rem] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setRequirementFiles((files) => files.filter((item) => item !== file))}
                          className="rounded-full p-0.5 text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))] transition hover:text-[var(--color-action)]"
                          aria-label={file.name}
                        >
                          <FiX className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                    <FiPaperclip className="h-4 w-4" aria-hidden />
                    {copy.reqAttach}
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const picked = Array.from(event.target.files ?? []);
                        setRequirementFiles((files) => {
                          const merged = [...files];
                          picked.forEach((file) => {
                            if (!merged.some((item) => item.name === file.name && item.size === file.size)) {
                              merged.push(file);
                            }
                          });
                          return merged;
                        });
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={requirementBusy}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-5 py-2.5 transition duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                  >
                    <FiSend className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
                    <span className="text-sm font-semibold text-[var(--color-white)]">
                      {requirementBusy ? copy.reqSending : copy.reqSubmit}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] p-4">
                <p className="text-sm font-bold text-[var(--color-primary)]">{copy.reqClosed}</p>
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
                  {copy.reqClosedHint}
                </p>
              </div>
            )}
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
                <p className="mt-3 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
                  {copy.resolvedAt}: {formatDateTime(ticket.resolvedAt, language)}
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
              <TimelineItem label={copy.timelineCreated} time={formatDateTime(ticket.createdAt, language)} />
              {ticket.messages
                .filter((message) => message.statusChange)
                .map((message) => (
                  <TimelineItem
                    key={`t-${message.id}`}
                    label={`${copy.timelineStatusTo} · ${copy.statuses[message.statusChange as TicketStatus]}`}
                    time={formatDateTime(message.createdAt, language)}
                  />
                ))}
            </ol>
          </section>

        </div>
      </div>
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

function TimelineItem({ label, time }: { label: string; time: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1 flex h-2.5 w-2.5 flex-none rounded-full bg-[var(--color-primary)]" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
        <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">{time}</p>
      </div>
    </li>
  );
}

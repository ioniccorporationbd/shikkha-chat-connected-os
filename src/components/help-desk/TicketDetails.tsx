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
} from "react-icons/fi";

import { HD_CARD, HD_GHOST_BTN, HD_INPUT, TICKET_STATUSES } from "@/lib/help-desk/config";
import { formatDateTime, formatFileSize } from "@/lib/help-desk/format";
import { markTicketSeen } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { addUserReply, getTicket, reopenTicket, sendSupportReply } from "@/lib/help-desk/service";
import type { Ticket, TicketStatus } from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

import { HelpDeskErrorState, HelpDeskNotFound, TicketDetailsSkeleton } from "./HelpDeskStates";
import TicketCategoryChip from "./TicketCategoryChip";
import TicketConversation from "./TicketConversation";
import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

type LoadState = "loading" | "ready" | "notfound" | "error";
type SimStatus = TicketStatus | "none";

/** Full ticket details: info, problem, attachments, conversation, reply, care
 *  simulation, resolution + reopen. */
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

  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);

  const [simAgent, setSimAgent] = useState("");
  const [simBody, setSimBody] = useState("");
  const [simSteps, setSimSteps] = useState("");
  const [simStatus, setSimStatus] = useState<SimStatus>("none");
  const [simResolution, setSimResolution] = useState("");
  const [simBusy, setSimBusy] = useState(false);

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

  const retry = () => {
    setState("loading");
    void load();
  };

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;
    if (!reply.trim()) {
      toast.error(copy.replyValidation);
      return;
    }
    setReplyBusy(true);
    try {
      const updated = await addUserReply(ticket.id, reply);
      setTicket(updated);
      setReply("");
      toast.success(copy.replySent);
    } catch {
      toast.error(copy.toastLoadFailed);
    } finally {
      setReplyBusy(false);
    }
  };

  const doReopen = async () => {
    if (!ticket) return;
    setReopenBusy(true);
    try {
      const updated = await reopenTicket(ticket.id);
      setTicket(updated);
      toast.info(copy.reopenDone);
    } catch {
      toast.error(copy.toastLoadFailed);
    } finally {
      setReopenBusy(false);
    }
  };

  const submitSim = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticket) return;
    if (!simBody.trim()) {
      toast.error(copy.replyValidation);
      return;
    }
    setSimBusy(true);
    try {
      const steps = simSteps
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const updated = await sendSupportReply(ticket.id, {
        body: simBody,
        steps,
        agentName: simAgent || undefined,
        statusChange: simStatus === "none" ? undefined : simStatus,
        resolutionSummary: simResolution || undefined,
      });
      setTicket(updated);
      setSimBody("");
      setSimSteps("");
      setSimResolution("");
      setSimStatus("none");
      toast.success(copy.simSent);
    } catch {
      toast.error(copy.toastLoadFailed);
    } finally {
      setSimBusy(false);
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
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_35%,var(--color-white))]">
                        <FiFileText className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-primary)]">{file.name}</p>
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
            <h2 className="mb-4 inline-flex items-center gap-2 text-base font-bold text-[var(--color-primary)]">
              <FiMessageSquare className="h-4 w-4" aria-hidden />
              {copy.detailsConversation}
            </h2>
            <TicketConversation messages={ticket.messages} copy={copy} language={language} />

            {/* Reply */}
            <form onSubmit={submitReply} className="mt-5 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] pt-4">
              <label htmlFor="hd-reply" className="text-sm font-bold text-[var(--color-primary)]">
                {copy.replyTitle}
              </label>
              <textarea
                id="hd-reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={3}
                placeholder={copy.replyPlaceholder}
                className={`${HD_INPUT} mt-2 resize-y`}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={replyBusy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 transition duration-200 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
                >
                  <FiSend className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
                  <span className="text-sm font-semibold text-[var(--color-white)]">
                    {replyBusy ? copy.replySending : copy.replySend}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Resolved block */}
          {isResolved ? (
            <section className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-success)_34%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-success)_10%,var(--color-white))] p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-success)]">
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

              <div className="mt-4 border-t border-[color-mix(in_srgb,var(--color-success)_28%,var(--color-white))] pt-3">
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

          {/* Customer-care simulation */}
          <section className={`${HD_CARD} p-5`}>
            <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.simTitle}</h2>
            <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
              {copy.simHint}
            </p>
            <form onSubmit={submitSim} className="mt-3 space-y-3">
              <input
                type="text"
                value={simAgent}
                onChange={(e) => setSimAgent(e.target.value)}
                placeholder={copy.simAgentName}
                className={HD_INPUT}
                aria-label={copy.simAgentName}
              />
              <textarea
                value={simBody}
                onChange={(e) => setSimBody(e.target.value)}
                rows={2}
                placeholder={copy.simMessage}
                className={`${HD_INPUT} resize-y`}
                aria-label={copy.simMessage}
              />
              <textarea
                value={simSteps}
                onChange={(e) => setSimSteps(e.target.value)}
                rows={2}
                placeholder={copy.simStepsHint}
                className={`${HD_INPUT} resize-y`}
                aria-label={copy.simStepsHint}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.simStatusLabel}</span>
                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value as SimStatus)}
                  className={HD_INPUT}
                >
                  <option value="none">{copy.simStatusNone}</option>
                  {TICKET_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {copy.statuses[status]}
                    </option>
                  ))}
                </select>
              </label>
              {simStatus === "resolved" ? (
                <textarea
                  value={simResolution}
                  onChange={(e) => setSimResolution(e.target.value)}
                  rows={2}
                  placeholder={copy.simResolutionPlaceholder}
                  className={`${HD_INPUT} resize-y`}
                  aria-label={copy.resolvedSummary}
                />
              ) : null}
              <button
                type="submit"
                disabled={simBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)] px-5 py-2.5 transition duration-200 hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
              >
                <FiHeadphones className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  {simBusy ? copy.simSending : copy.simSend}
                </span>
              </button>
            </form>
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
      className="inline-flex items-center gap-2 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
    >
      <FiArrowLeft className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
      <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.backToList}</span>
    </Link>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_32%,var(--color-white))] text-[var(--color-primary)]">
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiHeadphones, FiRefreshCw, FiX } from "react-icons/fi";

import ConversationComposer, { type ComposerInput } from "@/components/help-desk/conversation/ConversationComposer";
import ConversationThread from "@/components/help-desk/conversation/ConversationThread";
import ConversationTimeline from "@/components/help-desk/conversation/ConversationTimeline";
import ProblemInfoCard from "@/components/help-desk/conversation/ProblemInfoCard";
import { helpDeskHomeFor } from "@/components/dashboard/help-desk/HelpDeskBackButton";
import {
  getConversation,
  markConversationRead,
  sendMessage,
  setTicketStatus,
} from "@/lib/help-desk/conversations";
import { conversationCopyFor, conversationStatusLabel } from "@/lib/help-desk/conversation-copy";
import { useTicketRealtime } from "@/lib/help-desk/use-ticket-realtime";
import type { ConversationMessage, ConversationPayload } from "@/lib/help-desk/types";
import { reportClientError } from "@/lib/log/report-error";
import { toast } from "@/lib/ui/toast";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";

/**
 * How often the open card asks the ERP for new messages (ms).
 *
 * Two cadences: with the live socket connected the ping is what refreshes the
 * thread and this is only a safety net; without it the card must still show a
 * customer message within a few seconds, so the fallback poll is small. (It used
 * to be 30s, which is exactly why the employee side looked like it "never got"
 * the customer's message.)
 */
const POLL_INTERVAL_MS = 4_000;
const LIVE_SAFETY_POLL_MS = 60_000;

/**
 * The employee's "View details" card for one customer problem.
 *
 * It is the same ERP payload the full thread page renders (`getConversation`),
 * shown as an overlay so the employee never loses the queue behind it:
 * the problem exactly as the ERP stores it, the chronological conversation with
 * a reply box, the solution/status panel and the full audit timeline.
 *
 * Nothing is inferred on the client: `canReply`, `canChangeStatus` and the
 * allowed statuses all come from the server, and every write goes through the
 * existing whitelisted endpoints (a `Communication` row / an `HD Ticket Status`
 * change — no new schema).
 */
export default function ProblemDetailCard({
  ticketId,
  language,
  onClose,
  onChanged,
}: {
  ticketId: string;
  language: string;
  onClose: () => void;
  /** Called after a reply or a status change so the queue behind refetches. */
  onChanged?: () => void;
}) {
  const copy = useMemo(() => conversationCopyFor(language), [language]);

  const [payload, setPayload] = useState<ConversationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [quoted, setQuoted] = useState<ConversationMessage | null>(null);
  const [statusValue, setStatusValue] = useState("");
  const [resolution, setResolution] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const mounted = useRef(true);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(false);
      }
      try {
        const data = await getConversation(ticketId);
        if (!mounted.current) return;
        if (!data) {
          setError(true);
          setPayload(null);
          return;
        }
        setPayload(data);
        setError(false);
        setStatusValue((current) => current || data.currentStatus || "");
        if (data.unread > 0) {
          void markConversationRead(ticketId)
            .then(() => {
              if (mounted.current) setPayload((current) => (current ? { ...current, unread: 0 } : current));
            })
            .catch((err) => {
              console.error("[help-desk] mark read failed", ticketId, err);
            });
        }
      } catch (err) {
        if (!mounted.current) return;
        if (!silent) {
          setError(true);
          reportClientError({
            scope: "help-desk:problem-load",
            message: "Could not load the problem conversation.",
            detail: { ticket: ticketId, error: err instanceof Error ? err.message : String(err) },
          });
        }
      } finally {
        if (mounted.current && !silent) setLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    mounted.current = true;
    const kickoff = window.setTimeout(() => void load(), 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(kickoff);
    };
  }, [load]);

  // Live updates: the same server-bridged realtime channel the full thread uses.
  // A customer message re-reads the card the moment the ERP publishes it.
  const live = useTicketRealtime(ticketId, () => {
    void load(true);
  });

  // A reply that arrives while the card stays open must show up without a click
  // — on a live socket the ping does the work and this is a slow safety net; on
  // the polling fallback it is what delivers the message within a few seconds.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible" || statusBusy) return;
      void load(true);
    };
    const timer = window.setInterval(tick, live ? LIVE_SAFETY_POLL_MS : POLL_INTERVAL_MS);
    // Coming back to the tab catches up immediately instead of waiting a tick.
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live, load, statusBusy]);

  // Overlay behaviour: ESC closes, the page behind never scrolls, focus moves in.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const submitMessage = useCallback(
    async (input: ComposerInput) => {
      try {
        const data = await sendMessage(ticketId, {
          message: input.message,
          replyTo: input.replyTo,
          attachments: input.files,
        });
        if (mounted.current) {
          setPayload(data);
          setQuoted(null);
        }
        toast.success(copy.composerSent);
        onChanged?.();
        return true;
      } catch (err) {
        const text = err instanceof Error ? err.message : "";
        toast.error(text || copy.composerFailed);
        console.error("[help-desk] message send failed", ticketId, err);
        reportClientError({
          scope: "help-desk:problem-send",
          message: "Sending a reply from the problem card failed.",
          detail: { ticket: ticketId, error: text || String(err) },
        });
        return false;
      }
    },
    [copy.composerFailed, copy.composerSent, onChanged, ticketId]
  );

  const submitStatus = useCallback(async () => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      // The backend writes the solution Communication before the status change,
      // in one transaction, so a problem can never close without its answer.
      const data = await setTicketStatus(ticketId, { status: statusValue, resolution });
      if (mounted.current) {
        setPayload(data);
        setResolution("");
        setStatusValue(data.currentStatus || statusValue);
      }
      toast.success(copy.statusUpdated);
      onChanged?.();
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      toast.error(text || copy.statusFailed);
      console.error("[help-desk] status update failed", ticketId, err);
      reportClientError({
        scope: "help-desk:problem-status",
        message: "Updating the problem status failed.",
        detail: { ticket: ticketId, status: statusValue, error: text || String(err) },
      });
    } finally {
      if (mounted.current) setStatusBusy(false);
    }
  }, [copy.statusFailed, copy.statusUpdated, onChanged, resolution, statusBusy, statusValue, ticketId]);

  const ticket = payload?.ticket;
  const canReply = payload?.canReply ?? false;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        // Only a press that starts on the backdrop closes the card, so a text
        // selection dragged out of the panel never dismisses it.
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.detailCardTitle}
        tabIndex={-1}
        className={`flex h-full w-full flex-col overflow-hidden border ${CARD_BORDER} bg-[var(--color-white)] shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] outline-none sm:h-[min(92vh,60rem)] sm:max-w-4xl sm:rounded-[26px]`}
      >
        {/* Header — the problem identity and the way out, always visible. */}
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.detailCardTitle}
            </p>
            <h2 className="mt-0.5 truncate text-[16px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[18px]">
              {ticket?.subject || ticketId}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">
                {ticketId}
              </span>
              {ticket ? (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
                  {conversationStatusLabel[ticket.status]?.[language === "en" ? "en" : "bn"] ?? ticket.status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* The queue's own Back/Help Desk row sits behind this overlay, so
                the card carries its own Help Desk exit. Close stays the only
                "go back" control — two back buttons would be ambiguous. */}
            <Link
              href={helpDeskHomeFor("/userDashboard")}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-2.5 py-1.5 text-[11.5px] font-bold transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
              style={{ color: "var(--color-white)" }}
            >
              <FiHeadphones size={12} aria-hidden style={{ color: "var(--color-white)" }} />
              <span style={{ color: "var(--color-white)" }}>{copy.helpDeskHome}</span>
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            >
              <FiRefreshCw size={12} aria-hidden />
              {copy.conversationRetry}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.detailCardClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            >
              <FiX size={16} aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {loading && !payload ? (
            <div className="flex flex-col gap-2.5" aria-busy="true">
              <div className="h-24 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]" />
              <div className="h-40 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]" />
              <div className="h-16 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]" />
              <p className="sr-only">{copy.detailCardLoading}</p>
            </div>
          ) : error || !payload ? (
            <div className="px-2 py-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
                <FiAlertCircle size={22} aria-hidden />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
              <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {copy.conversationErrorHint}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <ProblemInfoCard
                ticket={payload.ticket}
                copy={copy}
                language={language}
                requirements={payload.requirements}
                showCustomer
              />

              <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.conversationTitle}</h3>
                  {payload.unread > 0 ? (
                    <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-white)]">
                      {copy.unreadBadge(payload.unread)}
                    </span>
                  ) : null}
                </div>

                <ConversationThread
                  copy={copy}
                  language={language}
                  messages={payload.messages}
                  loading={false}
                  error={false}
                  onRetry={() => void load()}
                  onQuote={canReply ? (message) => setQuoted(message) : undefined}
                />

                {canReply ? (
                  <div className="mt-3">
                    <ConversationComposer
                      copy={copy}
                      quoted={quoted}
                      onClearQuote={() => setQuoted(null)}
                      onSubmit={submitMessage}
                      requirementMode={false}
                    />
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-3 text-[12px] font-semibold text-[var(--color-primary)]">
                    {copy.conversationClosed}
                  </p>
                )}
              </section>

              {/* Status: the employee opens or closes the problem from here. */}
              {payload.canChangeStatus ? (
                <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4`}>
                  <h3 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.statusTitle}</h3>
                  <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                    {copy.statusHint}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[15rem_1fr]">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                        {copy.problemStatus}
                      </span>
                      <select
                        value={statusValue}
                        onChange={(event) => setStatusValue(event.target.value)}
                        className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-2 text-[12.5px] font-semibold text-[var(--color-primary)] outline-none focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                      >
                        <option value="">{copy.statusSelect}</option>
                        {(payload.statuses ?? []).map((status) => (
                          <option key={status.name} value={status.name}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                        {copy.statusResolution}
                      </span>
                      <textarea
                        value={resolution}
                        onChange={(event) => setResolution(event.target.value)}
                        rows={2}
                        placeholder={copy.statusResolutionPlaceholder}
                        className="resize-y rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-2 text-[12.5px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitStatus()}
                    disabled={statusBusy || !statusValue}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                  >
                    {statusBusy ? copy.statusUpdating : copy.statusUpdate}
                  </button>
                </section>
              ) : null}

              <ConversationTimeline events={payload.timeline ?? []} language={language} isSupport />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

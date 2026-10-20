"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

import ConversationComposer, { type ComposerInput } from "@/components/help-desk/conversation/ConversationComposer";
import ConversationThread from "@/components/help-desk/conversation/ConversationThread";
import ConversationTimeline from "@/components/help-desk/conversation/ConversationTimeline";
import ProblemInfoCard from "@/components/help-desk/conversation/ProblemInfoCard";
import HelpDeskBackButton from "@/components/dashboard/help-desk/HelpDeskBackButton";
import {
  addRequirement,
  getConversation,
  markConversationRead,
  sendMessage,
  setTicketStatus,
} from "@/lib/help-desk/conversations";
import { conversationCopyFor } from "@/lib/help-desk/conversation-copy";
import { reopenTicket } from "@/lib/help-desk/service";
import { toast } from "@/lib/ui/toast";
import type { ConversationMessage, ConversationPayload } from "@/lib/help-desk/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/** How often an open thread asks the ERP for new messages (ms). */
const POLL_INTERVAL_MS = 30_000;

/**
 * One ticket conversation — customer and employee use the same screen.
 *
 * Block A is the problem as the ERP stores it (`ProblemInfoCard`), block B the
 * full timeline and block C the write box. When the signed-in user is support,
 * the extra status/solution panel appears; when the customer is on an Open
 * ticket, the composer can switch to "additional requirement".
 *
 * Everything on screen is the ERP payload: `canReply`, `canAddRequirement`,
 * `canChangeStatus`, the message list and the unread count are all decided on
 * the server, never inferred here.
 */
export default function HelpDeskTicketThread({
  language,
  ticketId,
  listHref,
  backFallback,
  titleOverride,
}: {
  language: string;
  ticketId: string;
  /** Where the back pill and the error state send the user. */
  listHref: string;
  backFallback: string;
  titleOverride?: string;
}) {
  const copy = useMemo(() => conversationCopyFor(language), [language]);

  const [payload, setPayload] = useState<ConversationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [missing, setMissing] = useState(false);

  const [quoted, setQuoted] = useState<ConversationMessage | null>(null);
  const [mode, setMode] = useState<"message" | "requirement">("message");
  const [reopenBusy, setReopenBusy] = useState(false);

  const [statusValue, setStatusValue] = useState("");
  const [resolution, setResolution] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const mounted = useRef(true);

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
          setMissing(true);
          setPayload(null);
          return;
        }
        setMissing(false);
        setPayload(data);
        setError(false);
        setStatusValue((current) => current || data.currentStatus || "");
        if (data.unread > 0) {
          // Reading the thread clears the ERP's own unread marker for this user.
          void markConversationRead(ticketId)
            .then(() => {
              if (mounted.current) setPayload((current) => (current ? { ...current, unread: 0 } : current));
            })
            .catch((err) => {
              console.error("[help-desk] mark read failed", ticketId, err);
            });
        }
      } catch {
        if (!mounted.current) return;
        if (!silent) {
          setError(true);
          // Keep the surface diagnosable without a toast library dependency.
          console.error("[help-desk] conversation load failed", ticketId);
        }
      } finally {
        if (mounted.current && !silent) setLoading(false);
      }
    },
    [ticketId]
  );

  useEffect(() => {
    mounted.current = true;
    // Queued so the first fetch does not setState synchronously inside the effect.
    const kickoff = window.setTimeout(() => void load(), 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(kickoff);
    };
  }, [load]);

  // Light refresh so a reply that arrives while the page is open shows up.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !statusBusy) void load(true);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load, statusBusy]);

  const messages = payload?.messages ?? [];
  const requirements = payload?.requirements ?? [];

  const submitMessage = useCallback(
    async (input: ComposerInput) => {
      if (mode === "requirement") {
        try {
          const data = await addRequirement(ticketId, {
            message: input.message,
            replyTo: input.replyTo,
            attachments: input.files,
          });
          setPayload(data);
          setQuoted(null);
          toast.success(copy.composerRequirementSent, copy.conversationTitle);
          return true;
        } catch (err) {
          const text = err instanceof Error ? err.message : "";
          toast.error(text || copy.composerFailed);
          console.error("[help-desk] requirement failed", ticketId, err);
          return false;
        }
      }

      try {
        const data = await sendMessage(ticketId, {
          message: input.message,
          replyTo: input.replyTo,
          attachments: input.files,
        });
        setPayload(data);
        setQuoted(null);
        toast.success(copy.composerSent);
        return true;
      } catch (err) {
        const text = err instanceof Error ? err.message : "";
        toast.error(text || copy.composerFailed);
        console.error("[help-desk] message send failed", ticketId, err);
        return false;
      }
    },
    [copy.composerFailed, copy.composerRequirementSent, copy.composerSent, copy.conversationTitle, mode, ticketId]
  );

  const submitStatus = useCallback(async () => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      // The backend writes the solution Communication before the status change,
      // inside one transaction, so a ticket can never close without its answer.
      const data = await setTicketStatus(ticketId, { status: statusValue, resolution });
      setPayload(data);
      setResolution("");
      toast.success(copy.statusUpdated);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      toast.error(text || copy.statusFailed);
      console.error("[help-desk] status update failed", ticketId, err);
    } finally {
      setStatusBusy(false);
    }
  }, [copy.statusFailed, copy.statusUpdated, resolution, statusBusy, statusValue, ticketId]);

  // Closed tickets reject replies in this ERP. The only permitted way back is an
  // explicit reopen — never a silent status change.
  const reopen = useCallback(async () => {
    if (reopenBusy) return;
    setReopenBusy(true);
    try {
      await reopenTicket(ticketId);
      toast.success(copy.conversationReopened);
      await load(true);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      toast.error(text || copy.conversationReopenFailed);
      console.error("[help-desk] reopen failed", ticketId, err);
    } finally {
      setReopenBusy(false);
    }
  }, [copy.conversationReopenFailed, copy.conversationReopened, load, reopenBusy, ticketId]);

  const isSupport = payload?.isSupport ?? false;
  const canReply = payload?.canReply ?? false;
  const canAddRequirement = payload?.canAddRequirement ?? false;

  if (loading && !payload) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW}`} aria-busy="true">
          <div className="h-5 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))]" />
          <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]" />
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]" />
        </div>
      </div>
    );
  }

  if (missing || (!payload && !error)) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiAlertCircle size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.conversationErrorHint}
          </p>
          <a
            href={listHref}
            className="mt-3 inline-flex items-center rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
          >
            {copy.back}
          </a>
        </div>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div className="flex flex-col gap-4">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <p className="text-[14px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.conversationErrorHint}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)]"
          >
            <FiRefreshCw size={13} aria-hidden />
            {copy.conversationRetry}
          </button>
        </div>
      </div>
    );
  }

  const ticket = payload!.ticket;

  return (
    <div className="flex flex-col gap-4">
      <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={backFallback} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[22px]">
            {titleOverride || ticket.subject}
          </h1>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {ticket.id}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]"
        >
          <FiRefreshCw size={12} aria-hidden />
          {copy.conversationRetry}
        </button>
      </div>

      <ProblemInfoCard
        ticket={ticket}
        copy={copy}
        language={language}
        requirements={requirements}
        showCustomer={isSupport}
      />

      <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 sm:p-5 ${CARD_SHADOW}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.conversationTitle}</h2>
          {payload!.unread > 0 ? (
            <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-white)]">
              {copy.unreadBadge(payload!.unread)}
            </span>
          ) : null}
        </div>

        <ConversationThread
          copy={copy}
          language={language}
          messages={messages}
          loading={false}
          error={false}
          onRetry={() => void load()}
          onQuote={canReply ? (message) => setQuoted(message) : undefined}
        />

        <div className="mt-3 flex flex-col gap-2">
          {canAddRequirement ? (
            <div className="flex w-fit items-center gap-1 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] p-1">
              {(
                [
                  { key: "message" as const, label: copy.composerSend },
                  { key: "requirement" as const, label: copy.composerRequirementSend },
                ]
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMode(tab.key)}
                  className={[
                    "rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition",
                    mode === tab.key
                      ? "bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_6px_14px_-10px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
                      : "text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          {canReply ? (
            <ConversationComposer
              copy={copy}
              quoted={quoted}
              onClearQuote={() => setQuoted(null)}
              onSubmit={submitMessage}
              requirementMode={mode === "requirement" && canAddRequirement}
            />
          ) : (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-3">
              <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.conversationClosed}</p>
              <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {copy.conversationClosedHint}
              </p>
              {!isSupport ? (
                <button
                  type="button"
                  onClick={() => void reopen()}
                  disabled={reopenBusy}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-3 py-1.5 text-[11.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                >
                  {reopenBusy ? copy.conversationReopening : copy.conversationReopen}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* B2 — full audit trail: creation, every reply/requirement, the
          employee solution and each ERP status change, oldest first. */}
      <ConversationTimeline events={payload!.timeline ?? []} language={language} isSupport={isSupport} />

      {payload!.canChangeStatus ? (
        <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 sm:p-5 ${CARD_SHADOW}`}>
          <h2 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.statusTitle}</h2>
          <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.statusHint}
          </p>

          <div className="mt-3 grid gap-3 lg:grid-cols-[15rem_1fr]">
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
                {(payload!.statuses ?? []).map((status) => (
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
    </div>
  );
}

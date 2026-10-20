"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowDown, FiMessageCircle, FiRefreshCw } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatChatDay } from "@/lib/help-desk/format";
import type { ConversationMessage } from "@/lib/help-desk/types";

import MessageBubble from "./MessageBubble";

/** A real ticket event (opened / status changed / resolved) shown as a chip. */
export type ThreadSystemEvent = {
  id: string;
  at: string;
  label: string;
};

type ThreadRow =
  | { kind: "message"; key: string; at: string; message: ConversationMessage; dayLabel: string | null }
  | { kind: "event"; key: string; at: string; label: string; dayLabel: string | null };

/**
 * The scrollable ticket thread.
 *
 * Newest message at the bottom like every chat the team uses. If the reader is
 * scrolled up when a refresh brings new messages, a small notice appears
 * instead of yanking the viewport — clicking it jumps to the newest message.
 * Nothing here fabricates a message: an empty array renders the empty state.
 */
export default function ConversationThread({
  copy,
  language,
  messages,
  loading,
  error,
  onRetry,
  onQuote,
  heightClass,
  bare = false,
  onPin,
  canPin = false,
  pinnedId = null,
  focus = null,
  systemEvents,
}: {
  copy: ConversationCopy;
  language: string;
  messages: ConversationMessage[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onQuote?: (message: ConversationMessage) => void;
  /** Override the panel height (the full-page route wants a taller thread). */
  heightClass?: string;
  /** Drop the panel chrome so the thread can sit flush inside a chat card. */
  bare?: boolean;
  /** Pin/unpin a message — rendered only where the ERP allows a reply. */
  onPin?: (message: ConversationMessage) => void;
  canPin?: boolean;
  pinnedId?: string | null;
  /**
   * External jump request (pinned banner, notification). `nonce` must change
   * for the same id to be jumped to again.
   */
  focus?: { id: string; nonce: number } | null;
  /**
   * Verified ticket events rendered as centred chips. Only the immersive
   * /conversation route passes these: in ticket details the same events live
   * in the timeline card, and showing them twice would be noise.
   */
  systemEvents?: ThreadSystemEvent[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastCount = useRef(0);
  // Distance between the reader and the newest message, captured on scroll
  // BEFORE new bubbles grow the thread. The follow-on-append decision must use
  // this snapshot: reading the live DOM inside the effect sees the already
  // grown layout and would wrongly think the reader had scrolled up.
  const bottomGap = useRef(0);
  const [pendingNew, setPendingNew] = useState(false);
  // Quoted-reply target flash: tapping the quote block scrolls to the original
  // message and rings it briefly, the way WhatsApp does it.
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const jumpToMessage = useCallback((id: string) => {
    const node = document.getElementById(`msg-${id}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((current) => (current === id ? null : current)), 1800);
  }, []);

  const atBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 64;
  }, []);

  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    bottomGap.current = 0;
    setPendingNew(false);
  }, []);

  useEffect(() => {
    if (loading || error) return;

    const count = messages.length;
    const previous = lastCount.current;
    lastCount.current = count;

    if (count === 0 || count === previous) return;

    // First load of a thread: land on the newest message without animating.
    if (previous === 0) {
      bottomRef.current?.scrollIntoView({ block: "end" });
      bottomGap.current = 0;
      return;
    }

    // A later refresh brought messages in: follow them only if the reader was
    // already at the end (measured before this render grew the thread),
    // otherwise offer the jump notice.
    // Your own message always lands in view, the way WhatsApp treats a send;
    // someone else's only follows when you were already at the end.
    const mine = messages[count - 1]?.isMine === true;
    if (mine || bottomGap.current < 64) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      // Queued so the notice appears without a synchronous setState in the effect.
      const notice = window.setTimeout(() => setPendingNew(true), 0);
      return () => window.clearTimeout(notice);
    }
    // The gap snapshot lives in a ref; the effect only re-runs on data.
  }, [messages, loading, error]);

  // Jump requests from outside (pinned banner, etc.). The message must already
  // be in the thread; the banner only renders for loaded messages.
  const focusNonce = focus?.nonce ?? 0;
  useEffect(() => {
    if (!focus?.id || focusNonce === 0) return;
    const timer = window.setTimeout(() => jumpToMessage(focus.id), 30);
    return () => window.clearTimeout(timer);
  }, [focus?.id, focusNonce, jumpToMessage]);

  // One pass over the thread: a separator before the first entry of each day,
  // then bubbles and (on the chat-only route) system-event chips interleaved
  // by time. Precomputed so render never mutates shared state.
  const rows = useMemo<ThreadRow[]>(() => {
    const entries: ThreadRow[] = messages.map((message) => ({
      kind: "message",
      key: `m-${message.id}`,
      at: message.createdAt,
      message,
      dayLabel: null,
    }));

    if (systemEvents?.length) {
      const known = new Set(messages.map((message) => message.id));
      for (const event of systemEvents) {
        if (known.has(event.id)) continue;
        entries.push({ kind: "event", key: `e-${event.id}`, at: event.at, label: event.label, dayLabel: null });
      }
      // An event with a missing timestamp is put first (it is normally the
      // ticket-created marker); messages missing one keep their server order.
      const time = (row: ThreadRow) => {
        const value = new Date(row.at).getTime();
        if (!Number.isNaN(value)) return value;
        return row.kind === "event" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      };
      entries.sort((a, b) => time(a) - time(b) || (a.kind === "message" ? -1 : 1));
    }

    const labels = entries.map((entry) => formatChatDay(entry.at, language));
    return entries.map((entry, index) => ({
      ...entry,
      dayLabel: index === 0 || labels[index] !== labels[index - 1] ? labels[index] : null,
    }));
  }, [messages, language, systemEvents]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          bottomGap.current = node.scrollHeight - node.scrollTop - node.clientHeight;
          if (pendingNew && atBottom()) setPendingNew(false);
        }}
        className={
          bare
            ? `flex flex-col gap-3 overflow-y-auto px-3.5 py-3 sm:px-4 ${heightClass ?? "max-h-[26rem] min-h-[14rem] sm:max-h-[32rem]"}`
            : `flex flex-col gap-3 overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-3 ${heightClass ?? "max-h-[26rem] min-h-[14rem] sm:max-h-[32rem]"}`
        }
      >
        {loading ? (
          <div className="flex flex-1 flex-col gap-2.5" aria-busy="true" aria-label={copy.conversationLoading}>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className={`h-16 w-[72%] animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] ${
                  row % 2 === 0 ? "self-start" : "self-end"
                }`}
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">{copy.conversationErrorTitle}</p>
            <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.conversationErrorHint}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            >
              <FiRefreshCw size={13} aria-hidden />
              {copy.conversationRetry}
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))] text-[var(--color-primary)]">
              <FiMessageCircle size={20} aria-hidden />
            </span>
            <p className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {copy.conversationEmpty}
            </p>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2.5">
            {rows.map((row) => (
              <Fragment key={row.key}>
                {row.dayLabel ? (
                  <div className="my-1 flex items-center justify-center">
                    <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-3 py-0.5 text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
                      {row.dayLabel}
                    </span>
                  </div>
                ) : null}
                {row.kind === "event" ? (
                  <div className="my-0.5 flex justify-center" data-system-event={row.key}>
                    <span className="max-w-[88%] rounded-full border border-[color-mix(in_srgb,var(--color-primary)_13%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-2.5 py-1 text-center text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_64%,transparent)]">
                      {row.label}
                    </span>
                  </div>
                ) : (
                  <MessageBubble
                    message={row.message}
                    copy={copy}
                    language={language}
                    onQuote={onQuote}
                    onJumpTo={jumpToMessage}
                    onPin={onPin}
                    canPin={canPin}
                    pinned={pinnedId === row.message.id}
                    highlighted={highlightId === row.message.id}
                  />
                )}
              </Fragment>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingNew ? (
        <button
          type="button"
          onClick={jumpToBottom}
          className="absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[11.5px] font-semibold text-[var(--color-white)] shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus-visible:ring-offset-2"
        >
          <FiArrowDown size={12} aria-hidden />
          {copy.conversationNewMessages}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiMessageCircle, FiRefreshCw } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import type { ConversationMessage } from "@/lib/help-desk/types";

import MessageBubble from "./MessageBubble";

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
}: {
  copy: ConversationCopy;
  language: string;
  messages: ConversationMessage[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onQuote?: (message: ConversationMessage) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastCount = useRef(0);
  const [pendingNew, setPendingNew] = useState(false);

  const atBottom = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 64;
  }, []);

  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
      return;
    }

    // A later refresh brought messages in: follow them only if the reader is
    // already at the end, otherwise offer the jump notice.
    if (atBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      // Queued so the notice appears without a synchronous setState in the effect.
      const notice = window.setTimeout(() => setPendingNew(true), 0);
      return () => window.clearTimeout(notice);
    }
    // `atBottom()` reads the live DOM; the effect only needs to re-run on data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, error]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={() => {
          if (pendingNew && atBottom()) setPendingNew(false);
        }}
        className="flex max-h-[26rem] min-h-[14rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-3 sm:max-h-[32rem]"
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
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))] text-[var(--color-primary)]">
              <FiMessageCircle size={20} aria-hidden />
            </span>
            <p className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {copy.conversationEmpty}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              copy={copy}
              language={language}
              onQuote={onQuote}
            />
          ))
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

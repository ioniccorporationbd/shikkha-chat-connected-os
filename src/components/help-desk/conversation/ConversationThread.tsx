"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiArrowDown, FiCopy, FiMessageCircle, FiRefreshCw, FiTrash2, FiX } from "react-icons/fi";

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
  | {
      kind: "message";
      key: string;
      at: string;
      message: ConversationMessage;
      dayLabel: string | null;
      /** Same side, same day, only moments after the row above it. */
      grouped: boolean;
    }
  | { kind: "event"; key: string; at: string; label: string; dayLabel: string | null };

/** A run of one person's lines is collapsed only while they stay this close. */
const GROUP_WINDOW_MS = 3 * 60 * 1000;

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
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  olderHint,
  onQuote,
  heightClass,
  bare = false,
  onPin,
  canPin = false,
  pinnedId = null,
  focus = null,
  systemEvents,
  onDelete,
  canDelete = false,
  onForward,
  canForward = false,
  onCopied,
  onReact,
  onCopyFailed,
}: {
  copy: ConversationCopy;
  language: string;
  messages: ConversationMessage[];
  loading: boolean;
  error: boolean;
  /** Error recovery. Omitted where the page must not offer a retry action. */
  onRetry?: () => void;
  /** Older entries exist below this page (paged route only). */
  hasOlder?: boolean;
  /** An older page is in flight — drives the top indicator. */
  loadingOlder?: boolean;
  /** Ask for the next older page (scroll up). */
  onLoadOlder?: () => void;
  /** Label of the top "loading older messages" indicator. */
  olderHint?: string;
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
  /** Delete one or more messages (the ERP deletes the Communication records). */
  onDelete?: (messages: ConversationMessage[]) => void;
  canDelete?: boolean;
  /** Forward a message into another ticket. */
  onForward?: (message: ConversationMessage) => void;
  canForward?: boolean;
  /** Confirmation toast after copying. */
  onCopied?: () => void;
  /** Toggle one emoji reaction on a message (persisted by the ERP). */
  onReact?: (message: ConversationMessage, emoji: string) => void;
  /** The clipboard refused the write. */
  onCopyFailed?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastCount = useRef(0);
  // Newest message seen so far: a change here is a *new* message, while the
  // same newest id with more rows can only be an older page landing on top.
  const lastId = useRef<string | null>(null);
  // Geometry captured before each render, so an older page can be prepended
  // without the viewport jumping: the reader keeps the bubble they were on.
  const metrics = useRef({ height: 0, top: 0 });
  // Distance between the reader and the newest message, captured on scroll
  // BEFORE new bubbles grow the thread. The follow-on-append decision must use
  // this snapshot: reading the live DOM inside the effect sees the already
  // grown layout and would wrongly think the reader had scrolled up.
  const bottomGap = useRef(0);
  const [pendingNew, setPendingNew] = useState(false);
  // Quoted-reply target flash: tapping the quote block scrolls to the original
  // message and rings it briefly, the way WhatsApp does it.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // Multi-select, the way a messenger lets you pick several messages and act on
  // them at once. Nothing is selected until the reader asks for it.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const selectedMessages = useMemo(
    () => messages.filter((message) => selected.includes(message.id)),
    [messages, selected],
  );

  const enterSelectMode = useCallback((message: ConversationMessage) => {
    setSelectMode(true);
    setSelected([message.id]);
  }, []);

  const toggleSelected = useCallback((message: ConversationMessage) => {
    setSelected((current) =>
      current.includes(message.id) ? current.filter((id) => id !== message.id) : [...current, message.id],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectMode(false);
    setSelected([]);
  }, []);

  const copySelected = useCallback(async () => {
    const text = selectedMessages
      .map((message) => message.body?.trim())
      .filter(Boolean)
      .join("\n\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const node = document.createElement("textarea");
      node.value = text;
      node.style.position = "fixed";
      node.style.opacity = "0";
      document.body.appendChild(node);
      node.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(node);
      }
    }
    onCopied?.();
  }, [onCopied, selectedMessages]);

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

    // An older page arrives above the reader, not a new message: keep the
    // viewport exactly where it was (the layout effect below restores it) and
    // never raise the "new messages" notice for it.
    const newest = messages[count - 1]?.id ?? null;
    const newestChanged = newest !== lastId.current;
    lastId.current = newest;
    if (!newestChanged && previous > 0) return;

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

  // Restore the reading position when an older page is prepended. A layout
  // effect runs in the same frame as the DOM update, so the added height is
  // compensated before anything is painted — the reader never sees a jump.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const previous = metrics.current;
    if (previous.height > 0 && node.scrollHeight > previous.height) {
      node.scrollTop = previous.top + (node.scrollHeight - previous.height);
    }
    metrics.current = { height: node.scrollHeight, top: node.scrollTop };
  }, [messages]);

  // A short thread has nothing to scroll, so the "reached the top" trigger
  // would never fire. While more pages exist and the panel does not overflow,
  // keep asking for the next one until it either fills the panel or runs out.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || !hasOlder || loadingOlder) return;
    if (node.scrollHeight <= node.clientHeight + 8) onLoadOlder?.();
  }, [hasOlder, loadingOlder, messages, onLoadOlder]);

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
      grouped: false,
    }));

    if (systemEvents?.length) {
      const known = new Set(messages.map((message) => message.id));
      for (const event of systemEvents) {
        if (known.has(event.id)) continue;
        entries.push({ kind: "event", key: `e-${event.id}`, at: event.at, label: event.label, dayLabel: null });
      }
    }

    // Sequence is the contract: the thread always reads oldest -> newest, no
    // matter what order the ERP payload, a delta poll or a page merge handed the
    // rows over in. Two channels feed the list (Communication + Comment) and a
    // merge only ever appends, so the order has to be established here rather
    // than trusted from upstream. Backend timestamps are ISO in one timezone,
    // which compares correctly as a plain string (the two channels may differ in
    // fractional precision; a prefix still sorts before its longer form), so the
    // sort is a string compare with the incoming position as a stable tie-break.
    // A row with no timestamp keeps its place at the end — never on top.
    const position = new Map(entries.map((entry, index) => [entry.key, index]));
    const stamp = (row: ThreadRow) => (row.at ? String(row.at).replace(" ", "T") : "");
    entries.sort((a, b) => {
      const first = stamp(a);
      const second = stamp(b);
      if (first && !second) return -1;
      if (!first && second) return 1;
      if (first !== second) return first < second ? -1 : 1;
      return (position.get(a.key) ?? 0) - (position.get(b.key) ?? 0);
    });

    // A reply is never drawn above the message it answers. If the ERP's own
    // timestamps put the quote first (a reply written before a slow customer
    // message landed, or two rows sharing one second), the reply is moved to sit
    // directly after its parent. Threading wins over a same-second tie.
    const slot = new Map(entries.map((entry, index) => [entry.key, index]));
    const reindex = () => {
      slot.clear();
      entries.forEach((entry, index) => slot.set(entry.key, index));
    };
    for (let pass = 0; pass < 4; pass += 1) {
      let moved = false;
      for (let index = 0; index < entries.length; index += 1) {
        const row = entries[index];
        if (row.kind !== "message") continue;
        const parentId = row.message.replyTo?.id;
        if (!parentId) continue;
        const parentKey = `m-${parentId}`;
        const parentIndex = slot.get(parentKey);
        if (parentIndex === undefined || parentIndex < index) continue;
        // Detach first, then re-index, so the parent's position is read from
        // the list the row is actually going into (removing the row shifts
        // every entry above the parent down by one).
        entries.splice(index, 1);
        reindex();
        entries.splice((slot.get(parentKey) ?? entries.length - 1) + 1, 0, row);
        reindex();
        moved = true;
        break;
      }
      if (!moved) break;
    }

    // One pass sets the day separator and, with it, the run collapsing: two
    // bubbles from the same person on the same day are one block, so the second
    // one drops its name and tucks up under the first. Anything that breaks the
    // run — a different author, a different day, a gap longer than a few minutes
    // — starts a fresh block with a full stamp.
    const labels = entries.map((entry) => formatChatDay(entry.at, language));
    return entries.map((entry, index) => {
      const previous = index > 0 ? entries[index - 1] : null;
      const dayLabel = index === 0 || labels[index] !== labels[index - 1] ? labels[index] : null;
      let grouped = false;
      if (entry.kind === "message" && previous && previous.kind === "message" && dayLabel === null) {
        const sameSide = previous.message.isMine === entry.message.isMine;
        const sameAuthor = previous.message.author === entry.message.author;
        const previousAt = Date.parse(String(previous.at).replace(" ", "T"));
        const currentAt = Date.parse(String(entry.at).replace(" ", "T"));
        const closeEnough = Number.isFinite(previousAt) && Number.isFinite(currentAt) && currentAt - previousAt <= GROUP_WINDOW_MS;
        grouped = sameSide && sameAuthor && closeEnough;
      }
      return { ...entry, dayLabel, grouped };
    });
  }, [messages, language, systemEvents]);

  return (
    <div className="relative">
      {selectMode ? (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-[var(--color-white)]">
          <span className="text-[12px] font-semibold">
            {selected.length === 0 ? copy.selectHint : `${selected.length} ${copy.selectCount}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void copySelected()}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--color-white)_16%,transparent)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-white)_70%,transparent)]"
            >
              <FiCopy size={12} aria-hidden />
              {copy.selectCopy}
            </button>
            {canDelete && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (!selected.length) return;
                  onDelete(selectedMessages);
                  clearSelection();
                }}
                disabled={selected.length === 0}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--color-white)_16%,transparent)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-white)_70%,transparent)]"
              >
                <FiTrash2 size={12} aria-hidden />
                {copy.selectDelete}
              </button>
            ) : null}
            <button
              type="button"
              onClick={clearSelection}
              aria-label={copy.selectCancel}
              title={copy.selectCancel}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-white)_16%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-white)_70%,transparent)]"
            >
              <FiX size={13} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          bottomGap.current = node.scrollHeight - node.scrollTop - node.clientHeight;
          metrics.current = { height: node.scrollHeight, top: node.scrollTop };
          if (pendingNew && atBottom()) setPendingNew(false);
          // Reading upwards in a chat means asking for the page above; the
          // caller de-duplicates while a page is already in flight.
          if (hasOlder && !loadingOlder && node.scrollTop < 96) onLoadOlder?.();
        }}
        className={
          bare
            ? `flex flex-col gap-3 overflow-y-auto hd-scrollbar-hidden px-3.5 py-3 sm:px-4 ${heightClass ?? "max-h-[26rem] min-h-[14rem] sm:max-h-[32rem]"}`
            : `flex flex-col gap-3 overflow-y-auto hd-scrollbar-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-3 ${heightClass ?? "max-h-[26rem] min-h-[14rem] sm:max-h-[32rem]"}`
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
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
              >
                <FiRefreshCw size={13} aria-hidden />
                {copy.conversationRetry}
              </button>
            ) : null}
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
            {hasOlder || loadingOlder ? (
              <div
                className="flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                data-thread-older
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] ${loadingOlder ? "animate-ping" : "opacity-40"}`}
                  aria-hidden
                />
                {loadingOlder ? olderHint ?? copy.conversationLoading : "···"}
              </div>
            ) : null}
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
                    grouped={row.grouped}
                    onQuote={onQuote}
                    onJumpTo={jumpToMessage}
                    onPin={onPin}
                    canPin={canPin}
                    pinned={pinnedId === row.message.id}
                    highlighted={highlightId === row.message.id}
                    canDelete={canDelete}
                    canForward={canForward}
                    onDelete={(target) => onDelete?.([target])}
                    onForward={onForward}
                    onSelect={enterSelectMode}
                    onCopied={onCopied}
                    onCopyFailed={onCopyFailed}
                    onReact={onReact}
                    selectMode={selectMode}
                    selected={selected.includes(row.message.id)}
                    onToggleSelect={toggleSelected}
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

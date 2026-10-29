"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiBookmark, FiCheck, FiCheckCircle, FiCornerUpLeft, FiFileText } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatBubbleTime, formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { ConversationMessage, ConversationReplyRef } from "@/lib/help-desk/types";

import ImageLightbox from "./ImageLightbox";
import MessageActionMenu from "./MessageActionMenu";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const AUDIO_EXT = /\.(webm|mp3|m4a|wav|ogg|oga|aac|mp4)$/i;

const isImageFile = (mime: string, name: string) => (mime || "").startsWith("image/") || IMAGE_EXT.test(name || "");
const isAudioFile = (mime: string, name: string) => (mime || "").startsWith("audio/") || AUDIO_EXT.test(name || "");

/**
 * Copy plain text, with the old `execCommand` fallback for browsers that deny
 * the async clipboard (a non-secure origin, an older WebView).
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const node = document.createElement("textarea");
      node.value = text;
      node.style.position = "fixed";
      node.style.opacity = "0";
      document.body.appendChild(node);
      node.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(node);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * One message in a ticket conversation.
 *
 * The bubble itself is a record of what was said — clicking the text does
 * nothing but select it. A small chevron on the header line opens the message
 * menu (Reply / React / Copy): hidden until the row is hovered on desktop,
 * always visible on touch, and also opened by long-press / right-click on the
 * bubble. Emoji reactions collect in chips under the bubble; tapping a chip
 * toggles your own reaction with exactly that emoji.
 *
 * Layout: a header line carries the sender's name and the message time
 * (Asia/Dhaka, straight from the ERP timestamp), then the bubble with the
 * responsive width — as narrow as its text, capped at min(32rem, 85%). Mine on
 * the right, the other party on the left.
 */
export default function MessageBubble({
  message,
  quoted,
  onJumpTo,
  copy,
  language,
  pinned = false,
  grouped = false,
  onQuote,
  onReact,
  onCopied,
  onCopyFailed,
}: {
  message: ConversationMessage;
  /**
   * The comment this bubble answers, when the thread inferred the pairing (the
   * ERP does not link Comment and Communication rows). An explicit
   * `message.replyTo` always wins, so a real quote is never replaced.
   */
  quoted?: ConversationReplyRef;
  copy: ConversationCopy;
  language: string;
  /** Brings the quoted comment back into view: a reply is read with its comment. */
  onJumpTo?: (id: string) => void;
  onPin?: (message: ConversationMessage) => void;
  canPin?: boolean;
  pinned?: boolean;
  /**
   * Directly follows a bubble from the same side, on the same day, within a few
   * minutes: the stamp (dot, name, separator) is dropped and the bubble tucks up
   * under the previous one, the way a messenger collapses a run of one person's
   * lines. The time stays, so nothing is lost.
   */
  grouped?: boolean;
  highlighted?: boolean;
  canDelete?: boolean;
  canForward?: boolean;
  onDelete?: (message: ConversationMessage) => void;
  onForward?: (message: ConversationMessage) => void;
  onSelect?: (message: ConversationMessage) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (message: ConversationMessage) => void;
  /** Reply to this message (opens the composer's quote banner). */
  onQuote?: (message: ConversationMessage) => void;
  /** Toggle one emoji reaction on this message (the ERP persists it). */
  onReact?: (message: ConversationMessage, emoji: string) => void;
  /** Copied feedback (a toast on the page). */
  onCopied?: () => void;
  onCopyFailed?: () => void;
}) {
  const mine = message.isMine;
  const isRequirement = message.kind === "requirement";
  const isResolution = message.kind === "resolution";
  // A real ERP quote beats the inferred pairing.
  const reply: ConversationReplyRef | undefined = message.replyTo ?? quoted;
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<number | null>(null);

  const isSupport = isResolution || message.author === "support";
  const authorLabel = isResolution
    ? copy.conversationSupport
    : message.authorName || (message.author === "support" ? copy.conversationSupport : copy.conversationCustomer);
  const timeLabel = formatBubbleTime(message.createdAt, language);
  const reactions = message.reactions ?? [];
  const canAct = Boolean(onQuote || onReact || onCopied);

  useEffect(
    () => () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    []
  );

  const copyMessage = useCallback(async () => {
    // Only the message text: no author, no timestamp, no formatting.
    const ok = await writeClipboard(message.body ?? "");
    if (!ok) {
      onCopyFailed?.();
      return;
    }
    setCopied(true);
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1600);
    onCopied?.();
  }, [message.body, onCopied, onCopyFailed]);

  const toggleReaction = useCallback(
    (emoji: string) => {
      onReact?.(message, emoji);
    },
    [message, onReact]
  );

  return (
    <div
      id={`msg-${message.id}`}
      className={[
        "group/msg flex w-full min-w-0 scroll-mt-4",
        mine ? "justify-end" : "justify-start",
        grouped ? "-mt-1.5" : "",
      ].join(" ")}
    >
      <div
        className={[
          // The column is as wide as its content (`w-fit`) and only grows to the
          // responsive cap, so a short "ok" stays a small bubble. `min-w-0` keeps
          // long unbroken tokens inside the panel.
          "flex w-fit min-w-0 max-w-[min(32rem,85%)] flex-col gap-1",
          mine ? "items-end" : "items-start",
        ].join(" ")}
      >
        {/* Sender: only the first line of a run carries the name, mirrored on
            the right for my own messages, the way a messenger labels a person
            once and then simply stacks their lines. The chevron that opens the
            message menu rides at the end of that line. */}
        {grouped ? null : (
          <div className="flex max-w-full items-center gap-1.5 px-1">
            <span
              className={[
                "h-[5px] w-[5px] flex-none rounded-full",
                isSupport
                  ? "bg-[color-mix(in_srgb,var(--color-action)_70%,var(--color-white))]"
                  : "bg-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]",
              ].join(" ")}
              aria-hidden
            />
            <span
              className={[
                "truncate text-[12px] font-semibold tracking-[0.01em]",
                isSupport
                  ? "text-[color-mix(in_srgb,var(--color-action)_82%,var(--color-primary))]"
                  : "text-[color-mix(in_srgb,var(--color-primary)_86%,transparent)]",
              ].join(" ")}
            >
              {mine ? copy.conversationYou : authorLabel}
            </span>
            <span
              className="h-[3px] w-[3px] flex-none rounded-full bg-[color-mix(in_srgb,var(--color-primary)_26%,transparent)]"
              aria-hidden
            />
            {canAct ? (
              <MessageActionMenu
                copy={copy}
                mine={mine}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                onReply={onQuote ? () => onQuote(message) : undefined}
                onReact={onReact ? toggleReaction : undefined}
                onCopy={onCopied || onCopyFailed ? () => void copyMessage() : undefined}
              />
            ) : null}
            {copied ? (
              <span className="flex-none rounded-full bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))] px-1.5 py-[1px] text-[10px] font-bold text-[var(--color-action)]">
                {copy.copied}
              </span>
            ) : null}
          </div>
        )}

        <div
          onContextMenu={(event) => {
            // Long-press on touch / right-click on the bubble opens the menu
            // when the message allows actions; text selection keeps working
            // otherwise.
            if (!canAct) return;
            event.preventDefault();
            setMenuOpen(true);
          }}
          className={[
            // Read-only surface: no cursor-pointer, no hover, no focus ring —
            // it is text in a bubble, not a button. `select-text` keeps the copy
            // gesture available for anyone who wants to quote it themselves.
            // (No `min-w-*` here: globals.css sets `min-width:0` on every div,
            // which beats utilities — a short bubble simply hugs its text.)
            "w-fit max-w-full select-text rounded-2xl px-3.5 py-2 text-[13.75px] leading-[1.55] text-[var(--color-primary)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]",
            mine
              ? "rounded-tr-[6px] bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))]"
              : "rounded-tl-[6px] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]",
          ].join(" ")}
        >
          {isRequirement || isResolution ? (
            <span
              className={[
                "mb-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isRequirement
                  ? "bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] text-[#8a5a10]"
                  : "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]",
              ].join(" ")}
            >
              {isRequirement ? copy.requirementBadge : copy.resolutionBadge}
            </span>
          ) : null}

          {reply ? (
            /* The comment this bubble answers, WhatsApp-style: who said it, then
               a one-glance snippet, tied to the bubble it belongs to. Clicking
               scrolls the pair into view together. */
            <button
              type="button"
              onClick={() => onJumpTo?.(reply.id)}
              title={reply.body}
              className="mb-1.5 block w-full max-w-full cursor-pointer rounded-lg border-l-[3px] border-[color-mix(in_srgb,var(--color-action)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_72%,transparent)] px-2.5 py-1.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-white)_92%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-action)_35%,transparent)]"
            >
              <span className="flex items-center gap-1">
                <FiCornerUpLeft
                  size={10.5}
                  aria-hidden
                  className="flex-none text-[color-mix(in_srgb,var(--color-action)_75%,var(--color-primary))]"
                />
                <span className="truncate text-[10.5px] font-semibold tracking-[0.01em] text-[color-mix(in_srgb,var(--color-action)_72%,var(--color-primary))]">
                  {reply.authorName ||
                    (reply.author === "support" ? copy.conversationSupport : copy.conversationCustomer)}
                </span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-[1.45] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {reply.body}
              </span>
            </button>
          ) : null}

          {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}

          {message.attachments.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {message.attachments.map((file, index) => {
                const href = attachmentUrl(file);
                const image = isImageFile(file.fileType, file.fileName);
                const audio = isAudioFile(file.fileType, file.fileName);
                const key = `${file.url || file.fileName}-${index}`;
                // No signed URL means the file could not be resolved for this
                // viewer; fall through to the plain file row rather than an
                // <img> with an empty src (the browser would re-fetch the page).
                if (image && href) {
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => href && setLightbox({ src: href, alt: file.fileName || copy.imageOpen })}
                        className="block overflow-hidden rounded-lg transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                        aria-label={`${copy.imageOpen}: ${file.fileName || ""}`}
                        title={copy.imageOpen}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={href ?? ""}
                          alt={file.fileName}
                          loading="lazy"
                          className="max-h-56 w-auto max-w-full object-cover"
                        />
                      </button>
                    </li>
                  );
                }
                if (audio) {
                  return (
                    <li key={key}>
                      <div className="rounded-lg bg-[color-mix(in_srgb,var(--color-white)_80%,transparent)] px-1.5 py-1">
                        <audio
                          controls
                          preload="none"
                          src={href ?? undefined}
                          aria-label={file.fileName}
                          className="w-[240px] max-w-full"
                        >
                          <track kind="captions" />
                        </audio>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={key}>
                    <a
                      href={href ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-[color-mix(in_srgb,var(--color-white)_82%,transparent)] px-2.5 py-1.5 transition hover:bg-[var(--color-white)]"
                    >
                      <FiFileText size={14} className="flex-none text-[var(--color-primary)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[var(--color-primary)]">
                        {file.fileName}
                      </span>
                      <span className="flex-none text-[10.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                        {formatFileSize(file.size)}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {/* Stamp inside the bubble, bottom-right: the time always, then the
              delivery ticks for my own lines — and, on a grouped line, the
              message menu, so it is still one hover away without a header row
              pushing the bubbles apart. */}
          <div className="mt-1 flex items-center justify-end gap-1">
            {pinned ? (
              <FiBookmark
                size={10}
                className="flex-none text-[color-mix(in_srgb,var(--color-action)_75%,transparent)]"
                aria-label={copy.pinnedBar}
              />
            ) : null}
            {grouped && canAct ? (
              <MessageActionMenu
                copy={copy}
                mine={mine}
                open={menuOpen}
                onOpenChange={setMenuOpen}
                onReply={onQuote ? () => onQuote(message) : undefined}
                onReact={onReact ? toggleReaction : undefined}
                onCopy={onCopied || onCopyFailed ? () => void copyMessage() : undefined}
              />
            ) : null}
            {grouped && copied ? (
              <span className="flex-none rounded-full bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))] px-1.5 py-[1px] text-[10px] font-bold text-[var(--color-action)]">
                {copy.copied}
              </span>
            ) : null}
            <time
              dateTime={message.createdAt}
              className="flex-none text-[10px] font-medium tabular-nums tracking-[0.02em] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
            >
              {timeLabel}
            </time>
            {mine ? (
              message.seen ? (
                <FiCheckCircle
                  size={11}
                  className="flex-none text-[color-mix(in_srgb,var(--color-action)_70%,transparent)]"
                  aria-hidden
                />
              ) : (
                <FiCheck
                  size={11}
                  className="flex-none text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
                  aria-hidden
                />
              )
            ) : null}
          </div>
        </div>

        {reactions.length > 0 ? (
          <div className="flex max-w-full flex-wrap items-center gap-1 px-0.5">
            {reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                onClick={() => (onReact ? toggleReaction(reaction.emoji) : undefined)}
                disabled={!onReact}
                aria-label={`${reaction.emoji} ${reaction.count}`}
                aria-pressed={reaction.mine}
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[11px] leading-[1.5] transition",
                  reaction.mine
                    ? "border-[color-mix(in_srgb,var(--color-action)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] text-[var(--color-action)]"
                    : "border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_90%,transparent)] text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]",
                  onReact ? "hover:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]" : "cursor-default",
                ].join(" ")}
              >
                <span aria-hidden>{reaction.emoji}</span>
                <span className="font-semibold tabular-nums">{reaction.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <ImageLightbox copy={copy} src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  );
}

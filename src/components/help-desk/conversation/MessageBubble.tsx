"use client";

import { useEffect, useRef, useState } from "react";
import { FiBookmark, FiCheck, FiCheckCircle, FiCopy, FiCornerUpLeft, FiFileText } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatBubbleTime, formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { ConversationMessage } from "@/lib/help-desk/types";

import ImageLightbox from "./ImageLightbox";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const AUDIO_EXT = /\.(webm|mp3|m4a|wav|ogg|oga|aac|mp4)$/i;

const isImageFile = (mime: string, name: string) => (mime || "").startsWith("image/") || IMAGE_EXT.test(name || "");
const isAudioFile = (mime: string, name: string) => (mime || "").startsWith("audio/") || AUDIO_EXT.test(name || "");

/**
 * One message in a ticket conversation, laid out like a messenger thread:
 * my bubbles on the right with a red tint, the other party's on the left in
 * white, the author name only where the writer is somebody else, and the time
 * tucked into the bubble footer next to the read tick.
 *
 * Quiet hover toolbar (always visible on touch): reply, pin/unpin, copy.
 */
export default function MessageBubble({
  message,
  copy,
  language,
  onQuote,
  onJumpTo,
  onPin,
  canPin = false,
  pinned = false,
  highlighted,
}: {
  message: ConversationMessage;
  copy: ConversationCopy;
  language: string;
  onQuote?: (message: ConversationMessage) => void;
  /** Scrolls the thread to a quoted message when its block is tapped. */
  onJumpTo?: (id: string) => void;
  /** Pin or unpin this exact message (ticket-level pin, ERP-backed). */
  onPin?: (message: ConversationMessage) => void;
  canPin?: boolean;
  pinned?: boolean;
  /** Briefly ring the bubble after a jump, like a chat app search hit. */
  highlighted?: boolean;
}) {
  const mine = message.isMine;
  const isRequirement = message.kind === "requirement";
  const isResolution = message.kind === "resolution";
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyText = async () => {
    const text = message.body || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older/insecure contexts: fall back to a hidden textarea selection.
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
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  const authorLabel = isResolution
    ? copy.conversationSupport
    : message.authorName || (message.author === "support" ? copy.conversationSupport : copy.conversationCustomer);

  // One shared look for the hover/tap toolbar buttons.
  const actionClass =
    "inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] invisible transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] hover:text-[var(--color-primary)] focus-visible:visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] max-sm:visible sm:group-hover:visible";

  return (
    <div
      id={`msg-${message.id}`}
      className={[
        "flex w-full scroll-mt-4 rounded-2xl transition-shadow",
        mine ? "justify-end" : "justify-start",
        highlighted ? "ring-2 ring-[color-mix(in_srgb,var(--color-action)_45%,transparent)] ring-offset-2" : "",
      ].join(" ")}
    >
      <div className={`group flex max-w-[min(32rem,86%)] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        <div
          className={[
            "min-w-[6.5rem] rounded-2xl border px-3.5 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
            mine
              ? "rounded-br-md border-[color-mix(in_srgb,var(--color-action)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-action)_8%,var(--color-white))] text-[var(--color-primary)]"
              : "rounded-bl-md border-[color-mix(in_srgb,var(--color-primary)_13%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)]",
            isRequirement ? "border-l-4 border-l-[color-mix(in_srgb,var(--color-warning)_70%,transparent)]" : "",
            isResolution ? "border-l-4 border-l-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]" : "",
            pinned ? "ring-1 ring-[color-mix(in_srgb,var(--color-action)_35%,transparent)]" : "",
          ].join(" ")}
        >
          {!mine ? (
            <p className="mb-1 text-[11px] font-bold text-[color-mix(in_srgb,var(--color-action)_78%,var(--color-primary))]">
              {authorLabel}
            </p>
          ) : null}

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

          {message.replyTo ? (
            <button
              type="button"
              onClick={() => onJumpTo?.(message.replyTo!.id)}
              data-jump-to={message.replyTo.id}
              title={copy.jumpToQuoted}
              aria-label={copy.jumpToQuoted}
              className="mb-2 block w-full rounded-xl border-l-[3px] border-[color-mix(in_srgb,var(--color-action)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-2.5 py-1.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
            >
              <p className="text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-action)_80%,var(--color-primary))]">
                {message.replyTo.authorName ||
                  (message.replyTo.author === "support" ? copy.conversationSupport : copy.conversationCustomer)}
              </p>
              <p className="line-clamp-2 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                {message.replyTo.body}
              </p>
            </button>
          ) : null}

          {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}

          {message.attachments.length > 0 ? (
            <ul className="mt-1.5 space-y-1.5">
              {message.attachments.map((file, index) => {
                const href = attachmentUrl(file);
                const image = isImageFile(file.fileType, file.fileName);
                const audio = isAudioFile(file.fileType, file.fileName);
                const key = `${file.url || file.fileName}-${index}`;
                if (image) {
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => href && setLightbox({ src: href, alt: file.fileName || copy.imageOpen })}
                        className="block overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
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
                      <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-2 py-1.5">
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
                      className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 transition hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]"
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

          <div className="mt-1 flex items-center justify-end gap-1">
            {pinned ? (
              <FiBookmark
                size={10}
                className="text-[color-mix(in_srgb,var(--color-action)_80%,transparent)]"
                aria-label={copy.pinnedBar}
              />
            ) : null}
            <span className="text-[10px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]">
              {formatBubbleTime(message.createdAt, language)}
            </span>
            {mine ? (
              message.seen ? (
                <FiCheckCircle size={11} className="text-[color-mix(in_srgb,var(--color-action)_75%,transparent)]" aria-hidden />
              ) : (
                <FiCheck size={11} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" aria-hidden />
              )
            ) : null}
          </div>
        </div>

        <div className={`flex items-center gap-2 px-1 ${mine ? "flex-row-reverse" : ""}`}>
          {onQuote ? (
            <button type="button" onClick={() => onQuote(message)} aria-label={copy.replyAction} title={copy.replyAction} className={actionClass}>
              <FiCornerUpLeft size={12} aria-hidden />
              <span className="hidden sm:inline">{copy.replyAction}</span>
            </button>
          ) : null}
          {canPin && onPin ? (
            <button
              type="button"
              onClick={() => onPin(message)}
              aria-label={pinned ? copy.unpinAction : copy.pinAction}
              title={pinned ? copy.unpinAction : copy.pinAction}
              aria-pressed={pinned}
              className={actionClass}
            >
              <FiBookmark size={12} aria-hidden className={pinned ? "fill-current" : undefined} />
              <span className="hidden sm:inline">{pinned ? copy.unpinAction : copy.pinAction}</span>
            </button>
          ) : null}
          {message.body ? (
            <button
              type="button"
              onClick={() => void copyText()}
              aria-label={copied ? copy.copied : copy.copyAction}
              title={copied ? copy.copied : copy.copyAction}
              className={actionClass}
            >
              {copied ? <FiCheck size={12} aria-hidden /> : <FiCopy size={12} aria-hidden />}
              <span className="hidden sm:inline">{copied ? copy.copied : copy.copyAction}</span>
            </button>
          ) : null}
        </div>
      </div>

      {lightbox ? (
        <ImageLightbox copy={copy} src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  );
}

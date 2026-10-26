"use client";

import { useState } from "react";
import { FiBookmark, FiCheck, FiCheckCircle, FiFileText } from "react-icons/fi";

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
 * One message in a ticket conversation — read-only.
 *
 * The thread is a record of what was said: nothing here reacts to a left click.
 * There is no action menu, no reply button, no highlight and no context menu;
 * the only things that stay clickable are the attachment affordances (open an
 * image, play a voice note, download a file) and selecting the text itself.
 *
 * Layout: a header line carries the sender's name and the message time
 * (Asia/Dhaka, straight from the ERP timestamp), then the bubble with the
 * responsive width — as narrow as its text, capped at min(32rem, 85%). Mine on
 * the right, the other party on the left.
 */
export default function MessageBubble({
  message,
  copy,
  language,
  pinned = false,
}: {
  message: ConversationMessage;
  copy: ConversationCopy;
  language: string;
  /** Kept for call-site compatibility; the thread no longer offers actions. */
  onQuote?: (message: ConversationMessage) => void;
  onJumpTo?: (id: string) => void;
  onPin?: (message: ConversationMessage) => void;
  canPin?: boolean;
  pinned?: boolean;
  highlighted?: boolean;
  canDelete?: boolean;
  canForward?: boolean;
  onDelete?: (message: ConversationMessage) => void;
  onForward?: (message: ConversationMessage) => void;
  onSelect?: (message: ConversationMessage) => void;
  onCopied?: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (message: ConversationMessage) => void;
}) {
  const mine = message.isMine;
  const isRequirement = message.kind === "requirement";
  const isResolution = message.kind === "resolution";
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const isSupport = isResolution || message.author === "support";
  const authorLabel = isResolution
    ? copy.conversationSupport
    : message.authorName || (message.author === "support" ? copy.conversationSupport : copy.conversationCustomer);
  const timeLabel = formatBubbleTime(message.createdAt, language);

  return (
    <div
      id={`msg-${message.id}`}
      className={["flex w-full min-w-0 scroll-mt-4", mine ? "justify-end" : "justify-start"].join(" ")}
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
        {/* Sender + time: the whole stamp sits above the bubble, mirrored on the
            right for my own messages, so name, text and time read as one block. */}
        <div
          className="flex max-w-full items-center gap-1.5 px-1"
        >
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
          <time
            dateTime={message.createdAt}
            className="flex-none text-[10.5px] font-medium uppercase tabular-nums tracking-[0.03em] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
          >
            {timeLabel}
          </time>
          {pinned ? (
            <FiBookmark
              size={10}
              className="flex-none text-[color-mix(in_srgb,var(--color-action)_75%,transparent)]"
              aria-label={copy.pinnedBar}
            />
          ) : null}
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

        <div
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

          {message.replyTo ? (
            /* A quoted message is context, not a control: plain block, no button,
               no hover, no jump. */
            <div className="mb-1.5 rounded-lg border-l-[3px] border-[color-mix(in_srgb,var(--color-action)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_70%,transparent)] px-2.5 py-1.5">
              <p className="text-[10.5px] font-semibold tracking-[0.01em] text-[color-mix(in_srgb,var(--color-action)_72%,var(--color-primary))]">
                {message.replyTo.authorName ||
                  (message.replyTo.author === "support" ? copy.conversationSupport : copy.conversationCustomer)}
              </p>
              <p className="line-clamp-2 text-[11.5px] leading-[1.45] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {message.replyTo.body}
              </p>
            </div>
          ) : null}

          {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}

          {message.attachments.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
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
        </div>
      </div>

      {lightbox ? (
        <ImageLightbox copy={copy} src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  );
}

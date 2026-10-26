"use client";

import { useEffect, useRef, useState } from "react";
import { FiBookmark, FiCheck, FiCheckCircle, FiChevronDown, FiFileText } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatBubbleTime, formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { ConversationMessage } from "@/lib/help-desk/types";

import ImageLightbox from "./ImageLightbox";
import MessageActionMenu, { type MessageMenuAction } from "./MessageActionMenu";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const AUDIO_EXT = /\.(webm|mp3|m4a|wav|ogg|oga|aac|mp4)$/i;

const isImageFile = (mime: string, name: string) => (mime || "").startsWith("image/") || IMAGE_EXT.test(name || "");
const isAudioFile = (mime: string, name: string) => (mime || "").startsWith("audio/") || AUDIO_EXT.test(name || "");

// Message ids are Communication names, plus two synthetic ids the ERP builds
// for markers; only real records can be deleted.
const deletableId = (id: string) => Boolean(id) && id !== "created" && !id.startsWith("status:");

/**
 * One message in a ticket conversation, shaped like a messenger thread rather
 * than a card: no border, no outer frame — only a soft fill, the sender's name
 * on every message, and the time in the footer. Mine on the right in blush,
 * the other party on the left in a cool mint tint.
 *
 * Clicking a message (or pressing its chevron) opens the WhatsApp-style menu:
 * reply, copy, pin, forward, select, delete.
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
  canDelete = false,
  canForward = false,
  onDelete,
  onForward,
  onSelect,
  onCopied,
  selectMode = false,
  selected = false,
  onToggleSelect,
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
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // A pointer-driven click opens the menu; the same gesture on a link, audio
  // player or attachment must keep its native behaviour.
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
    onCopied?.();
  };

  const authorLabel = isResolution
    ? copy.conversationSupport
    : message.authorName || (message.author === "support" ? copy.conversationSupport : copy.conversationCustomer);

  const handleAction = (action: MessageMenuAction) => {
    if (action === "reply") onQuote?.(message);
    else if (action === "copy") void copyText();
    else if (action === "pin") onPin?.(message);
    else if (action === "forward") onForward?.(message);
    else if (action === "select") onSelect?.(message);
    else if (action === "delete") onDelete?.(message);
  };

  const openMenu = (x: number, y: number) => {
    if (selectMode) return;
    setMenu({ x, y });
  };

  // Anything the reader can interact with inside the bubble keeps its own
  // behaviour; everything else is "click the message" like WhatsApp.
  const isInteractive = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest("button, a, audio, video, input, textarea, select, [data-no-menu]"));

  return (
    <div
      id={`msg-${message.id}`}
      className={[
        "flex w-full min-w-0 scroll-mt-4 items-end gap-2",
        mine ? "justify-end" : "justify-start",
      ].join(" ")}
    >
      {selectMode ? (
        <span
          className={[
            "mb-2 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-2 transition",
            selected
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
              : "border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[var(--color-white)]",
            mine ? "order-2" : "",
          ].join(" ")}
          aria-hidden
        >
          {selected ? <FiCheck size={11} /> : null}
        </span>
      ) : null}

      <div
        className={[
          // The bubble column is the width of its content (`w-fit`) and only
          // grows to the responsive cap, so a short "ok" never draws a box
          // across the page. `min-w-0` keeps long unbroken tokens inside it.
          "group relative flex w-fit min-w-0 max-w-[min(32rem,85%)] flex-col",
          mine ? "items-end" : "items-start",
          highlighted ? "rounded-2xl ring-2 ring-[color-mix(in_srgb,var(--color-action)_45%,transparent)] ring-offset-2" : "",
        ].join(" ")}
      >
        <div
          onClick={(event) => {
            if (selectMode) {
              onToggleSelect?.(message);
              return;
            }
            if (isInteractive(event.target)) return;
            openMenu(event.clientX, event.clientY);
          }}
          onContextMenu={(event) => {
            if (selectMode) return;
            event.preventDefault();
            openMenu(event.clientX, event.clientY);
          }}
          className={[
            "relative w-fit min-w-[7rem] max-w-full cursor-pointer rounded-[12px] px-3 py-1.5 text-[13.5px] leading-relaxed shadow-[0_1px_1px_rgba(16,24,40,0.05)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-1",
            mine
              ? "rounded-br-[4px] bg-[color-mix(in_srgb,var(--color-action)_13%,var(--color-white))]"
              : "rounded-bl-[4px] bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-white))]",
            selected ? "ring-2 ring-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]" : "",
            "text-[var(--color-primary)]",
          ].join(" ")}
        >
          <p
            className={[
              "mb-0.5 text-[11px] font-bold",
              mine
                ? "text-[color-mix(in_srgb,var(--color-action)_78%,var(--color-primary))]"
                : "text-[color-mix(in_srgb,var(--color-primary)_82%,transparent)]",
            ].join(" ")}
          >
            {mine ? copy.conversationYou : authorLabel}
          </p>

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
              className="mb-1.5 block w-full rounded-md border-l-[3px] border-[color-mix(in_srgb,var(--color-action)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_60%,transparent)] px-2 py-1 text-left transition hover:bg-[color-mix(in_srgb,var(--color-white)_90%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
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

          <div className="mt-0.5 flex items-center justify-end gap-1">
            {pinned ? (
              <FiBookmark
                size={10}
                className="text-[color-mix(in_srgb,var(--color-action)_80%,transparent)]"
                aria-label={copy.pinnedBar}
              />
            ) : null}
            <span className="text-[10px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_46%,transparent)]">
              {copied ? copy.copied : formatBubbleTime(message.createdAt, language)}
            </span>
            {mine ? (
              message.seen ? (
                <FiCheckCircle size={11} className="text-[color-mix(in_srgb,var(--color-action)_75%,transparent)]" aria-hidden />
              ) : (
                <FiCheck size={11} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" aria-hidden />
              )
            ) : null}
          </div>

          {!selectMode ? (
            <button
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                openMenu(rect.right - 8, rect.bottom + 4);
              }}
              aria-label={copy.menuOpen}
              title={copy.menuOpen}
              aria-haspopup="menu"
              className={[
                "absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-[var(--color-white)] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] shadow-[0_1px_4px_rgba(15,23,42,0.18)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] sm:flex",
                menu ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
              ].join(" ")}
            >
              <FiChevronDown size={13} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {menu ? (
        <MessageActionMenu
          copy={copy}
          x={menu.x}
          y={menu.y}
          pinned={pinned}
          canReply={Boolean(onQuote)}
          canCopy={Boolean(message.body)}
          canPin={canPin && Boolean(onPin)}
          canForward={canForward && Boolean(onForward)}
          canDelete={canDelete && deletableId(message.id) && Boolean(onDelete)}
          onAction={handleAction}
          onClose={() => setMenu(null)}
        />
      ) : null}

      {lightbox ? (
        <ImageLightbox copy={copy} src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  );
}

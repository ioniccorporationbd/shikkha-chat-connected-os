"use client";

import { FiCheckCircle, FiHeadphones, FiInfo, FiBookmark, FiUser } from "react-icons/fi";

import { formatTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

import MessageAttachmentView from "./MessageAttachmentView";

/**
 * One WhatsApp-style chat bubble.
 *
 * user    → right aligned, brand-tinted surface
 * support → left aligned, neutral surface with the agent name
 * system  → centred status line
 */
export default function ChatBubble({
  message,
  copy,
  language,
  pinned = false,
  onPin,
}: {
  message: TicketMessage;
  copy: HelpDeskCopy;
  language: string;
  pinned?: boolean;
  onPin?: (messageId: string, pinned: boolean) => void;
}) {
  const time = formatTime(message.createdAt, language);
  const attachments = message.attachments ?? [];

  if (message.author === "system") {
    return (
      <li className="flex justify-center py-0.5">
        <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-3 py-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
          <FiInfo className="h-3 w-3" aria-hidden />
          <span className="break-words">
            {message.statusChange ? `${copy.timelineStatusTo}: ${copy.statuses[message.statusChange]}` : message.body}
          </span>
          <span className="tabular-nums opacity-60">· {time}</span>
        </span>
      </li>
    );
  }

  const mine = message.author === "user";
  const pinButton = onPin ? (
    <button
      type="button"
      onClick={() => onPin(message.id, !pinned)}
      aria-label={pinned ? copy.chatUnpinAction : copy.chatPinAction}
      title={pinned ? copy.chatUnpinAction : copy.chatPinAction}
      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full transition ${
        pinned
          ? "bg-[var(--color-action)] text-[var(--color-white)]"
          : "text-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] hover:text-[var(--color-primary)]"
      }`}
    >
      <FiBookmark className="h-3 w-3" aria-hidden />
    </button>
  ) : null;

  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`w-full max-w-[85%] sm:max-w-[75%] overflow-hidden rounded-2xl border shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_5%,transparent)] ${
          pinned
            ? "border-[var(--color-action)] ring-1 ring-[var(--color-action)]"
            : mine
              ? "border-[color-mix(in_srgb,var(--color-action)_20%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))]"
              : "border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[var(--color-white)]"
        }`}
      >
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-1.5 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">
            {mine ? <FiUser className="h-2.5 w-2.5" aria-hidden /> : <FiHeadphones className="h-2.5 w-2.5" aria-hidden />}
            {mine ? copy.you : message.authorName?.trim() || copy.support}
          </span>
          <span className="flex-1" />
          {pinButton}
        </div>

        <div className="px-3 pb-1.5 pt-1">
          {message.body && message.body !== "user_reopened" ? (
            <p className="whitespace-pre-line break-words text-[14px] leading-relaxed text-[var(--color-primary)]">
              {message.body}
            </p>
          ) : null}

          {message.steps && message.steps.length > 0 ? (
            <ol className="mt-2 space-y-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_2%,var(--color-white))] p-2.5">
              {message.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-white)]">
                    {index + 1}
                  </span>
                  <span className="text-[13px] leading-relaxed text-[var(--color-primary)]">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {attachments.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {attachments.map((file, index) => (
                <MessageAttachmentView key={`${file.url}-${index}`} file={file} copy={copy} />
              ))}
            </div>
          ) : null}

          {message.statusChange && message.author === "support" ? (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-success)_80%,black)]">
              <FiCheckCircle className="h-3 w-3" aria-hidden />
              {copy.statuses[message.statusChange]}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
          {pinned ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--color-action)]">
              <FiBookmark className="h-2.5 w-2.5" aria-hidden />
              {copy.chatPinnedTitle}
            </span>
          ) : null}
          <span className="tabular-nums text-[10px] font-medium text-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]">
            {time}
          </span>
        </div>
      </div>
    </li>
  );
}

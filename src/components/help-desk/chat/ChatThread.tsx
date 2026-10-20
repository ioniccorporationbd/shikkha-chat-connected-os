"use client";

import { Fragment } from "react";
import { FiInfo } from "react-icons/fi";

import { formatDate } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

import ChatBubble from "./ChatBubble";

/** Calendar day (Asia/Dhaka) an entry belongs to — used for the date separators. */
function dayKey(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
}

/** "Today" / "Yesterday" / the formatted date for a chat date separator. */
function dayLabel(iso: string, language: string, copy: HelpDeskCopy): string {
  const key = dayKey(iso);
  const now = new Date();
  const today = dayKey(now.toISOString());
  const yesterday = dayKey(new Date(now.getTime() - 86400000).toISOString());
  if (key === today) return copy.chatToday;
  if (key === yesterday) return copy.chatYesterday;
  return formatDate(iso, language);
}

/**
 * The WhatsApp-style conversation list. The newest message sits at the top
 * (as requested) with a date separator whenever the calendar day changes, and
 * the pinned message highlighted.
 */
export default function ChatThread({
  messages,
  copy,
  language,
  pinnedMessageId,
  onPin,
  limit,
  compact = false,
}: {
  messages: TicketMessage[];
  copy: HelpDeskCopy;
  language: string;
  pinnedMessageId?: string | null;
  onPin?: (messageId: string, pinned: boolean) => void;
  /** Show only the newest N messages (details preview). */
  limit?: number;
  compact?: boolean;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-4 py-7 text-center">
        <FiInfo className="h-5 w-5 text-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]" aria-hidden />
        <p className="text-sm font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
          {copy.noConversation}
        </p>
      </div>
    );
  }

  const shown = limit && messages.length > limit ? messages.slice(messages.length - limit) : messages;

  // The customer asked for the newest message at the top, so the thread is
  // rendered newest-first; `limit` still keeps the latest N entries.
  const ordered = [...shown].reverse();
  const rows = ordered.map((message, index) => ({
    message,
    showSeparator: index === 0 || dayKey(message.createdAt) !== dayKey(ordered[index - 1].createdAt),
  }));

  return (
    <ol className={`flex flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
      {rows.map(({ message, showSeparator }) => {
        return (
          <Fragment key={message.id}>
            {showSeparator ? (
              <li className="my-1 flex items-center justify-center">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] bg-[var(--color-white)] px-2.5 py-0.5 text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))] shadow-sm">
                  {dayLabel(message.createdAt, language, copy)}
                </span>
              </li>
            ) : null}
            <ChatBubble
              message={message}
              copy={copy}
              language={language}
              pinned={Boolean(pinnedMessageId && pinnedMessageId === message.id)}
              onPin={onPin}
            />
          </Fragment>
        );
      })}
    </ol>
  );
}

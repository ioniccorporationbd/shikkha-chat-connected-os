"use client";

import { FiCalendar, FiClock, FiInfo, FiUser } from "react-icons/fi";

import { formatDate, formatTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

import SupportReply from "./SupportReply";
import TicketMetaTag from "./TicketMetaTag";

/** The full conversation thread for a ticket (oldest → newest). */
export default function TicketConversation({
  messages,
  copy,
  language,
}: {
  messages: TicketMessage[];
  copy: HelpDeskCopy;
  language: string;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-4 py-8 text-center">
        <FiInfo className="h-5 w-5 text-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]" aria-hidden />
        <p className="text-sm font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
          {copy.noConversation}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        if (message.author === "support") {
          return <SupportReply key={message.id} message={message} copy={copy} language={language} />;
        }

        if (message.author === "system") {
          return (
            <li key={message.id} className="flex flex-wrap items-center justify-center gap-1.5 py-1">
              <TicketMetaTag tone="accent" icon={<FiInfo className="h-3 w-3" aria-hidden />}>
                {message.body === "user_reopened" || message.statusChange
                  ? copy.timelineStatusTo
                  : message.body}
                {message.statusChange ? `: ${copy.statuses[message.statusChange]}` : ""}
              </TicketMetaTag>
              <TicketMetaTag tone="outline" icon={<FiCalendar className="h-3 w-3" aria-hidden />}>
                {formatDate(message.createdAt, language)}
              </TicketMetaTag>
              <TicketMetaTag tone="outline" icon={<FiClock className="h-3 w-3" aria-hidden />}>
                {formatTime(message.createdAt, language)}
              </TicketMetaTag>
            </li>
          );
        }

        return (
          <li key={message.id} className="flex justify-end">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] shadow-[0_6px_18px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_2%,var(--color-white))] px-3.5 py-2">
                <TicketMetaTag tone="strong" icon={<FiUser className="h-3 w-3" aria-hidden />}>
                  {copy.you}
                </TicketMetaTag>
                <TicketMetaTag tone="outline" icon={<FiCalendar className="h-3 w-3" aria-hidden />}>
                  {formatDate(message.createdAt, language)}
                </TicketMetaTag>
                <TicketMetaTag tone="outline" icon={<FiClock className="h-3 w-3" aria-hidden />}>
                  {formatTime(message.createdAt, language)}
                </TicketMetaTag>
              </div>
              <div className="px-3.5 py-3">
                <p className="whitespace-pre-line break-words text-[14.5px] leading-relaxed text-[var(--color-primary)]">
                  {message.body}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

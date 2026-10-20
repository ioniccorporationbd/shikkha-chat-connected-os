"use client";

import { FiInfo, FiUser } from "react-icons/fi";

import { formatDate, formatTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

import SupportReply from "./SupportReply";

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
    <div className="space-y-4">
      {messages.map((message) => {
        if (message.author === "support") {
          return <SupportReply key={message.id} message={message} copy={copy} language={language} />;
        }

        if (message.author === "system") {
          return (
            <div key={message.id} className="flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] px-3 py-1.5">
                <FiInfo className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]" aria-hidden />
                <span className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_74%,var(--color-white))]">
                  {message.body === "user_reopened" || message.statusChange
                    ? copy.timelineStatusTo
                    : message.body}
                  {message.statusChange ? `: ${copy.statuses[message.statusChange]}` : ""} ·{" "}
                  <span className="tabular-nums">{formatDate(message.createdAt, language)}</span>{" "}
                  <span className="tabular-nums">{formatTime(message.createdAt, language)}</span>
                </span>
              </span>
            </div>
          );
        }

        return (
          <div key={message.id} className="flex justify-end">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_7%,transparent)]">
              <div className="flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] px-4 py-2.5">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]">
                  <FiUser className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
                </span>
                <p className="text-sm font-bold text-[var(--color-primary)]">{copy.you}</p>
                <span className="text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
                  · <span className="tabular-nums">{formatDate(message.createdAt, language)}</span>{" "}
                  <span className="tabular-nums">{formatTime(message.createdAt, language)}</span>
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-primary)]">
                  {message.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

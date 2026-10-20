"use client";

import { FiCalendar, FiCheckCircle, FiClock, FiHeadphones } from "react-icons/fi";

import { formatDate, formatTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

import TicketMetaTag from "./TicketMetaTag";

/**
 * A customer-care (support) reply, rendered distinctly from user messages:
 * tinted surface and support tags, plus optional ordered resolution steps and
 * an inline status-change tag.
 */
export default function SupportReply({
  message,
  copy,
  language,
}: {
  message: TicketMessage;
  copy: HelpDeskCopy;
  language: string;
}) {
  const agent = message.authorName?.trim() || copy.support;

  return (
    <li className="flex justify-start">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] shadow-[0_6px_18px_color-mix(in_srgb,var(--color-primary)_7%,transparent)]">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] px-3.5 py-2">
          <TicketMetaTag tone="strong" icon={<FiHeadphones className="h-3 w-3" aria-hidden />}>
            {copy.support}
          </TicketMetaTag>
          <TicketMetaTag>{agent}</TicketMetaTag>
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

          {message.steps && message.steps.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-3">
              <ol className="space-y-2">
                {message.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[11px] font-bold text-[var(--color-primary)]">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--color-primary)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {message.statusChange ? (
            <div className="mt-3">
              <TicketMetaTag tone="success" icon={<FiCheckCircle className="h-3.5 w-3.5" aria-hidden />}>
                {copy.timelineStatusTo}: {copy.statuses[message.statusChange]}
              </TicketMetaTag>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

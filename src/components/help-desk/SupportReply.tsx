"use client";

import { FiCheckCircle, FiHeadphones } from "react-icons/fi";

import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketMessage } from "@/lib/help-desk/types";

/**
 * A customer-care (support) reply, rendered distinctly from user messages:
 * tinted surface, an accent bar and a support avatar, plus optional ordered
 * resolution steps and an inline status-change marker.
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
    <div className="flex justify-start">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
        <div className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] px-4 py-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-primary)]">
            <FiHeadphones className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--color-primary)]">{copy.support}</p>
            <p className="truncate text-xs text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
              {agent} · {formatDateTime(message.createdAt, language)}
            </p>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-primary)]">
            {message.body}
          </p>

          {message.steps && message.steps.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] p-3">
              <ol className="space-y-2">
                {message.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[11px] font-bold text-[var(--color-primary)]">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--color-primary)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {message.statusChange ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action-tint)] px-3 py-1">
              <FiCheckCircle className="h-3.5 w-3.5 text-[var(--color-action)]" aria-hidden />
              <span className="text-xs font-semibold text-[var(--color-action)]">
                {copy.timelineStatusTo}: {copy.statuses[message.statusChange]}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

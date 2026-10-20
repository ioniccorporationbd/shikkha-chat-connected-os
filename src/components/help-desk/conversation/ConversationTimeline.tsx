"use client";

import { useMemo } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMessageSquare,
  FiPlusCircle,
  FiRefreshCw,
} from "react-icons/fi";
import type { IconType } from "react-icons";

import { conversationCopyFor, conversationStatusLabel } from "@/lib/help-desk/conversation-copy";
import { formatDateTime } from "@/lib/help-desk/format";
import type { ConversationTimelineEvent, ConversationTimelineType } from "@/lib/help-desk/types";

const TYPE_STYLE: Record<
  ConversationTimelineType,
  { chip: string; dot: string; icon: IconType }
> = {
  created: {
    chip: "bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]",
    dot: "bg-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))]",
    icon: FiFileText,
  },
  message: {
    chip: "bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]",
    dot: "bg-[var(--color-secondary-strong)]",
    icon: FiMessageSquare,
  },
  requirement: {
    chip: "bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]",
    dot: "bg-[var(--color-warning)]",
    icon: FiPlusCircle,
  },
  resolution: {
    chip: "bg-[color-mix(in_srgb,var(--color-success)_16%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]",
    dot: "bg-[var(--color-success)]",
    icon: FiCheckCircle,
  },
  status: {
    chip: "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
    dot: "bg-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-white))]",
    icon: FiRefreshCw,
  },
};

/** ERP stores status names as display strings ("In Progress") — map them back. */
function statusKey(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface ConversationTimelineProps {
  events: ConversationTimelineEvent[];
  language: string;
  isSupport?: boolean;
}

/**
 * Block B2 — the full audit trail of one ticket, oldest first: creation, every
 * reply, additional requirement, employee solution and ERP status transition.
 * Purely presentational; the rows come from `get_conversation().timeline`,
 * which is assembled from the same `Communication` rows the thread renders
 * plus Frappe's own `Version` log — nothing new is stored.
 */
export default function ConversationTimeline({ events, language, isSupport = false }: ConversationTimelineProps) {
  const copy = useMemo(() => conversationCopyFor(language), [language]);

  const labels: Record<ConversationTimelineType, string> = {
    created: copy.timelineCreated,
    message: isSupport ? copy.timelineReplyCustomer : copy.timelineMessage,
    requirement: copy.timelineRequirement,
    resolution: copy.timelineResolution,
    status: copy.timelineStatus,
  };

  if (!events.length) {
    return (
      <section className="rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 sm:p-5 shadow-[0_16px_40px_-32px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
        <h2 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.timelineTitle}</h2>
        <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
          {copy.timelineEmpty}
        </p>
      </section>
    );
  }

  return (
    <details
      open
      className="group rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 sm:p-5 shadow-[0_16px_40px_-32px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="text-[13.5px] font-bold text-[var(--color-primary)]">{copy.timelineTitle}</h2>
          <p className="mt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.timelineHint}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-2.5 py-1 text-[11px] font-bold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          <FiClock aria-hidden />
          {copy.timelineCount(events.length)}
        </span>
      </summary>

      <ol className="mt-4 space-y-0">
        {events.map((event, index) => {
          const style = TYPE_STYLE[event.type] ?? TYPE_STYLE.message;
          const Icon = style.icon;
          const last = index === events.length - 1;
          return (
            <li key={`${event.id}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="relative flex w-6 shrink-0 flex-col items-center">
                <span
                  className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-white)] ${style.dot}`}
                >
                  <Icon aria-hidden className="text-[11px]" />
                </span>
                {!last ? (
                  <span
                    aria-hidden
                    className="mt-1 w-px flex-1 bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${style.chip}`}>
                    {labels[event.type] ?? copy.timelineMessage}
                  </span>
                  <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                    {event.authorName || (event.author === "support" ? copy.timelineSupport : copy.timelineYou)}
                  </span>
                  <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                    {formatDateTime(event.at, language)}
                  </span>
                  {event.attachments > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-1.5 py-0.5 text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
                      <FiFileText aria-hidden />
                      {copy.timelineAttachments(event.attachments)}
                    </span>
                  ) : null}
                </div>
                {event.type === "status" && (event.from || event.to) ? (
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_80%,transparent)]">
                    <span className="rounded-md bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-1.5 py-0.5">
                      {conversationStatusLabel[statusKey(event.from) as keyof typeof conversationStatusLabel]?.[
                        language === "en" ? "en" : "bn"
                      ] ?? (event.from || "—")}
                    </span>
                    <span aria-hidden>→</span>
                    <span className="rounded-md bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] px-1.5 py-0.5">
                      {conversationStatusLabel[statusKey(event.to) as keyof typeof conversationStatusLabel]?.[
                        language === "en" ? "en" : "bn"
                      ] ?? (event.to || "—")}
                    </span>
                  </p>
                ) : event.text ? (
                  <p className="mt-1 whitespace-pre-line break-words text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
                    {event.text}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

"use client";

import { FiCheck, FiCornerUpLeft, FiFileText } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatDateTime, formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { ConversationMessage } from "@/lib/help-desk/types";

/**
 * One message in a ticket conversation.
 *
 * The layout follows the messaging apps the team already knows: my messages on
 * the right, the other party on the left, a timestamp under each bubble and a
 * quoted block when the message answers a specific one. Shikkha red stays off
 * the bubbles — it belongs to click targets only — so the thread uses the
 * brand's deep green tints and a single outline reply action.
 */
export default function MessageBubble({
  message,
  copy,
  language,
  onQuote,
}: {
  message: ConversationMessage;
  copy: ConversationCopy;
  language: string;
  onQuote?: (message: ConversationMessage) => void;
}) {
  const mine = message.isMine;
  const isRequirement = message.kind === "requirement";
  const isResolution = message.kind === "resolution";

  const authorLabel = mine ? copy.conversationYou : isResolution ? copy.conversationSupport : message.authorName || (message.author === "support" ? copy.conversationSupport : copy.conversationCustomer);

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`group flex max-w-[min(34rem,88%)] flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
        <span className="px-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {authorLabel}
        </span>

        <div
          className={[
            "w-full rounded-2xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed",
            mine
              ? "border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] text-[var(--color-primary)]"
              : "border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)]",
            isRequirement ? "border-l-4 border-l-[color-mix(in_srgb,var(--color-warning)_70%,transparent)]" : "",
            isResolution ? "border-l-4 border-l-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]" : "",
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
            <div className="mb-2 rounded-xl border-l-2 border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-2.5 py-1.5">
              <p className="text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
                {message.replyTo.authorName || (message.replyTo.author === "support" ? copy.conversationSupport : copy.conversationCustomer)}
              </p>
              <p className="line-clamp-2 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                {message.replyTo.body}
              </p>
            </div>
          ) : null}

          <p className="whitespace-pre-wrap break-words">{message.body}</p>

          {message.attachments.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {message.attachments.map((file) => {
                const href = attachmentUrl(file);
                return (
                  <li key={file.id}>
                    <a
                      href={href ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 transition hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]"
                    >
                      <FiFileText size={14} className="flex-none text-[var(--color-primary)]" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-[var(--color-primary)]">
                        {file.name}
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

        <div className={`flex items-center gap-2 px-1 ${mine ? "flex-row-reverse" : ""}`}>
          <span className="text-[10.5px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {formatDateTime(message.createdAt, language)}
          </span>
          {mine && message.seen ? (
            <span
              className="inline-flex items-center text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
              title={copy.noUnread}
              aria-label={copy.noUnread}
            >
              <FiCheck size={11} aria-hidden />
            </span>
          ) : null}
          {onQuote ? (
            <button
              type="button"
              onClick={() => onQuote(message)}
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] opacity-0 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] hover:text-[var(--color-primary)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] group-hover:opacity-100"
            >
              <FiCornerUpLeft size={11} aria-hidden />
              {copy.replyAction}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

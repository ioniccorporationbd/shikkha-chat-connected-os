"use client";

import type { ReactNode } from "react";
import { FiHeadphones, FiUser } from "react-icons/fi";

import { STATUS_TONE } from "@/lib/help-desk/config";
import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import type { Ticket } from "@/lib/help-desk/types";

/**
 * The chat header at the top of a conversation card.
 *
 * A compact identity bar — avatar, who you are talking to, the ticket id and
 * subject on one quiet second line, and the live status as a small chip. It
 * lives inside the card so the thread reads as a real messaging window, not as
 * one more dashboard panel.
 */
export default function ConversationHeader({
  copy,
  ticket,
  isSupport,
  statusLabel,
  unread = 0,
  actions,
}: {
  copy: ConversationCopy;
  ticket: Ticket;
  /** True in the employee view: the header then names the customer. */
  isSupport: boolean;
  /** Localised label of `ticket.status`. */
  statusLabel: string;
  unread?: number;
  /** Right-hand controls (unread badge, See-all link, …). */
  actions?: ReactNode;
}) {
  const name = isSupport ? ticket.contact?.name || copy.chatCustomerName : copy.chatSupportName;

  // Two-letter monogram for the customer (support side keeps a headset glyph,
  // which reads as "official line" without inventing a face).
  const initials = (isSupport ? (ticket.contact?.name || "?").trim() : "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const tone = STATUS_TONE[ticket.status] ?? "#032521";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-3.5 py-2.5 sm:px-5 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11.5px] font-bold ring-1 ${
            isSupport
              ? "bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)] ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
              : "bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] text-[var(--color-action)] ring-[color-mix(in_srgb,var(--color-action)_22%,transparent)]"
          }`}
          aria-hidden
        >
          {isSupport ? initials || <FiUser size={15} /> : <FiHeadphones size={16} />}
        </span>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-[13.5px] font-bold leading-tight text-[var(--color-primary)]">
              {isSupport ? <span className="sr-only">{copy.conversationTitle} — </span> : null}
              {name}
            </h2>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-bold"
              style={{
                color: tone,
                backgroundColor: `color-mix(in srgb, ${tone} 10%, #ffffff)`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 20%, transparent)`,
              }}
              title={`${copy.chatStatusPrefix}: ${statusLabel}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} aria-hidden />
              {statusLabel}
            </span>
          </div>
          <p className="truncate text-[11px] leading-tight text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
            <span className="font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
              {ticket.id}
            </span>
            {ticket.subject ? <span> · {ticket.subject}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {unread > 0 ? (
          <span className="rounded-full bg-[var(--color-action)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-white)]">
            {copy.unreadBadge(unread)}
          </span>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

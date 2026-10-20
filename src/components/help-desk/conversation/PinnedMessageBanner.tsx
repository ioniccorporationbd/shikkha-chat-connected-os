"use client";

import { FiBookmark, FiX } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import type { ConversationMessage } from "@/lib/help-desk/types";

/**
 * Compact "pinned message" strip that sits directly under the chat header.
 *
 * Clicking the strip jumps to the pinned bubble; the little × unpins it (only
 * rendered when the viewer is allowed to reply, i.e. the ERP would accept the
 * pin call). Nothing is stored in the frontend — the pin lives on the ticket.
 */
export default function PinnedMessageBanner({
  copy,
  message,
  onJump,
  onUnpin,
  unpinBusy = false,
}: {
  copy: ConversationCopy;
  message: ConversationMessage;
  onJump: () => void;
  onUnpin?: () => void;
  unpinBusy?: boolean;
}) {
  const sender = message.isMine
    ? copy.conversationYou
    : message.author === "support"
      ? message.authorName || copy.conversationSupport
      : copy.conversationCustomer;
  // An attachment-only message is still worth pinning: fall back to the file
  // names so the strip never reads as an empty pin.
  const preview =
    (message.body || "").replace(/\s+/g, " ").trim() ||
    message.attachments.map((file) => file.fileName).filter(Boolean).join(", ");

  return (
    <div className="flex items-stretch gap-2 border-b border-[color-mix(in_srgb,var(--color-action)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-action)_4%,var(--color-white))] px-3.5 py-1.5 sm:px-5">
      <span className="grid w-5 shrink-0 place-items-center text-[var(--color-action)]" aria-hidden>
        <FiBookmark size={13} />
      </span>
      <button
        type="button"
        onClick={onJump}
        className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
        aria-label={`${copy.pinnedBar}: ${preview.slice(0, 80)}`}
      >
        <span className="block truncate text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-action)]">
          {copy.pinnedBar}
        </span>
        <span className="block truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
          <span className="font-semibold">{sender}:</span> {preview || "—"}
        </span>
      </button>
      {onUnpin ? (
        <button
          type="button"
          onClick={onUnpin}
          disabled={unpinBusy}
          className="grid w-6 shrink-0 place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] hover:text-[var(--color-action)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
          aria-label={copy.unpinAction}
          title={copy.unpinAction}
        >
          <FiX size={13} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

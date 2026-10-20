"use client";

import { useEffect } from "react";
import { FiTrash2 } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";

/**
 * Confirmation before a message is really deleted from the ERP. Deleting a
 * Communication cannot be undone, so the destructive action is never one click.
 */
export default function DeleteMessageDialog({
  copy,
  count = 1,
  busy = false,
  onCancel,
  onConfirm,
}: {
  copy: ConversationCopy;
  count?: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(9,20,26,0.55)] p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-message-title"
        aria-describedby="delete-message-body"
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--color-white)] p-5 shadow-[0_24px_60px_rgba(9,20,26,0.28)]"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))] text-[var(--color-action)]">
          <FiTrash2 size={18} aria-hidden />
        </div>
        <h2 id="delete-message-title" className="text-[15px] font-bold text-[var(--color-primary)]">
          {copy.deleteTitle}
        </h2>
        <p id="delete-message-body" className="mt-1.5 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          {count > 1 ? `${count} ${copy.selectCount} — ${copy.deleteBody}` : copy.deleteBody}
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl px-3 py-1.5 text-[12.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
          >
            {copy.deleteCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-[var(--color-action)] px-3.5 py-1.5 text-[12.5px] font-bold text-[var(--color-white)] transition hover:brightness-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
          >
            {busy ? copy.deleteAction : copy.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

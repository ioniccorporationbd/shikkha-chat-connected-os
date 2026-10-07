"use client";

import { FiLogOut } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";

export interface LogoutConfirmCopy {
  title: string;
  message: string;
  yes: string;
  no: string;
  signing: string;
}

/**
 * The one logout confirmation dialog, opened by *every* Logout button (the
 * sidebar rail and the account dropdown). Its `onConfirm` runs the existing
 * sign-out flow — no custom logout API is introduced here.
 *
 * `DashboardModal` supplies the shared behaviour (overlay + `Escape` close,
 * scroll-lock, focus handling), so this stays a thin, presentational wrapper.
 * Redesigned for a clearer, more premium confirmation: a prominent alert-icon
 * cue, a stronger copy hierarchy, and a well-grouped Cancel / Sign Out row.
 */
export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  copy,
  signingOut = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  copy: LogoutConfirmCopy;
  signingOut?: boolean;
}) {
  return (
    <DashboardModal
      open={open}
      title={copy.title}
      closeLabel={copy.no}
      onClose={onClose}
      widthClass="max-w-[420px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-5 py-2.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.no}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
          >
            <FiLogOut aria-hidden size={15} className="text-[var(--color-white)]" />
            <span className="text-[13px] font-semibold text-[var(--color-white)]">
              {signingOut ? copy.signing : copy.yes}
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 px-1 py-2 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-action)_24%,transparent)] bg-[var(--color-action-tint-strong)] text-[var(--color-action)] shadow-[0_18px_36px_-20px_color-mix(in_srgb,var(--color-action)_75%,transparent)]">
          <FiLogOut size={26} />
        </span>
        <p className="max-w-[32ch] text-[13.5px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
          {copy.message}
        </p>
      </div>
    </DashboardModal>
  );
}

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
 *
 * Refined for a calmer, more premium confirmation: a larger haloed exit glyph
 * anchors the eye, the description reads one clear sentence, and Cancel / Sign
 * Out sit as a well-grouped, right-aligned action row.
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
      widthClass="max-w-[440px]"
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
            <span className="text-[var(--color-white)]">
              <FiLogOut size={15} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold text-[var(--color-white)]">
              {signingOut ? copy.signing : copy.yes}
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 px-2 pb-1 pt-2 text-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-[24px] bg-[var(--color-action-tint-strong)] text-[var(--color-action)] shadow-[0_20px_40px_-22px_color-mix(in_srgb,var(--color-action)_75%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-action)_22%,transparent)]">
          <FiLogOut size={30} />
        </span>
        <p className="max-w-[34ch] text-[14px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_74%,transparent)]">
          {copy.message}
        </p>
      </div>
    </DashboardModal>
  );
}

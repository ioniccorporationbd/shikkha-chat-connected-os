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
 * `DashboardModal` supplies the shared behaviour (logo, overlay + `Escape`
 * close, scroll-lock, focus handling), so this stays a thin, presentational
 * wrapper.
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
      logo
      widthClass="max-w-[400px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.no}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={signingOut}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-danger)] px-4 py-2.5 transition hover:bg-[var(--color-danger-strong)] disabled:opacity-60"
          >
            <FiLogOut aria-hidden size={15} className="text-[var(--color-white)]" />
            <span className="text-[13px] font-semibold text-[var(--color-white)]">
              {signingOut ? copy.signing : copy.yes}
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-danger)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] text-[var(--color-danger-strong)]">
          <FiLogOut size={24} />
        </span>
        <p className="max-w-[34ch] text-[14px] font-medium">{copy.message}</p>
      </div>
    </DashboardModal>
  );
}

"use client";

import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import { postJson } from "@/lib/api/http";
import { profileCopyFor } from "@/lib/auth/profile-messages";
import { looksTechnical } from "@/lib/auth/sanitize";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ChangePasswordResult } from "@/lib/auth/types";
import { toast } from "@/lib/ui/toast";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)] focus:bg-[var(--color-white)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)]";

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { language } = useLanguage();
  const copy = profileCopyFor(language);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
  };

  const handleSubmit = async () => {
    if (busy) return;

    if (!current) return void toast.warning(copy.required);
    if (next.length < 6) return void toast.warning(copy.tooShort);
    if (next !== confirm) return void toast.warning(copy.mismatch);
    if (next === current) return void toast.warning(copy.samePassword);

    setBusy(true);

    try {
      await postJson<ChangePasswordResult>("/api/auth/password", {
        current_password: current,
        new_password: next,
      });

      toast.success(copy.passwordChanged, copy.passwordChangedTitle);
      reset();
      onClose();
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      toast.error(looksTechnical(raw) || !raw ? copy.genericError : raw);
    } finally {
      setBusy(false);
    }
  };

  const inputType = show ? "text" : "password";

  return (
    <DashboardModal
      open={open}
      title={copy.passwordTitle}
      subtitle={copy.passwordSubtitle}
      closeLabel={copy.close}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] disabled:opacity-60"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">
              {copy.cancel}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] transition hover:opacity-92 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
              <FiLock size={15} />
              {busy ? copy.updating : copy.update}
            </span>
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
            {copy.currentPassword}
          </span>
          <input
            type={inputType}
            autoComplete="current-password"
            value={current}
            placeholder={copy.currentPasswordPlaceholder}
            onChange={(event) => setCurrent(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
            {copy.newPassword}
          </span>
          <input
            type={inputType}
            autoComplete="new-password"
            value={next}
            placeholder={copy.newPasswordPlaceholder}
            onChange={(event) => setNext(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
            {copy.confirmPassword}
          </span>
          <input
            type={inputType}
            autoComplete="new-password"
            value={confirm}
            placeholder={copy.confirmPasswordPlaceholder}
            onChange={(event) => setConfirm(event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-primary)]">
              {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              {show ? copy.hidePassword : copy.showPassword}
            </span>
          </button>

          <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.passwordHint}
          </span>
        </div>
      </form>
    </DashboardModal>
  );
}

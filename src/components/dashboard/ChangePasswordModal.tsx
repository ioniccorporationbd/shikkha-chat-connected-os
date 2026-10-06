"use client";

import { useRef, useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import { postJson } from "@/lib/api/http";
import { profileCopyFor, type ProfileCopy } from "@/lib/auth/profile-messages";
import { looksTechnical } from "@/lib/auth/sanitize";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ChangePasswordResult } from "@/lib/auth/types";
import { toast } from "@/lib/ui/toast";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3.5 py-2.5 pr-12 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)] focus:bg-[var(--color-white)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)]";

const LABEL_CLASS =
  "text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]";

/**
 * A password input with its own show/hide control.
 *
 * The eye button is a real, keyboard-focusable <button> that sits inside the
 * input's right padding (so the field never reflows), carries an aria-label and
 * aria-pressed for AT, and stays put on mobile.
 */
function PasswordField({
  label,
  value,
  placeholder,
  autoComplete,
  onChange,
  copy,
}: {
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  copy: ProfileCopy;
}) {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL_CLASS}>{label}</span>
      <span className="relative block">
        <input
          ref={inputRef}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={FIELD_CLASS}
        />
        <button
          type="button"
          // Toggling visibility must not deactivate the field: hand focus back
          // to the input so typed/autofilled text stays usable.
          onClick={() => {
            setShow((current) => !current);
            inputRef.current?.focus();
          }}
          aria-label={show ? copy.hidePassword : copy.showPassword}
          aria-pressed={show}
          title={show ? copy.hidePassword : copy.showPassword}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-2xl text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)] transition hover:text-[var(--color-primary)] focus-visible:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)]"
        >
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </span>
    </label>
  );
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { language } = useLanguage();
  const copy = profileCopyFor(language);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
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

  return (
    <DashboardModal
      open={open}
      title={copy.passwordTitle}
      subtitle={copy.passwordSubtitle}
      closeLabel={copy.close}
      onClose={onClose}
      widthClass="max-w-[460px]"
      logo
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] disabled:opacity-60"
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
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="flex flex-col gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4">
          <PasswordField
            label={copy.currentPassword}
            value={current}
            placeholder={copy.currentPasswordPlaceholder}
            autoComplete="current-password"
            onChange={setCurrent}
            copy={copy}
          />

          <PasswordField
            label={copy.newPassword}
            value={next}
            placeholder={copy.newPasswordPlaceholder}
            autoComplete="new-password"
            onChange={setNext}
            copy={copy}
          />

          <PasswordField
            label={copy.confirmPassword}
            value={confirm}
            placeholder={copy.confirmPasswordPlaceholder}
            autoComplete="new-password"
            onChange={setConfirm}
            copy={copy}
          />
        </div>

        <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
          {copy.passwordHint}
        </span>
      </form>
    </DashboardModal>
  );
}

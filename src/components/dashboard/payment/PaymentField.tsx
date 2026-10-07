"use client";

import type { ReactNode } from "react";

/**
 * Styling shared by every manual-payment field, so bKash / Rocket / Bank all
 * look like the rest of the ERP forms (see CreateCustomerView for the family).
 *
 * Per the project's CSS convention the readable text/colour utilities live on
 * the inner <span>, never directly on a control.
 */
export const PAY_FIELD_CLASS =
  "w-full rounded-2xl border bg-[var(--color-white)] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:ring-2 focus:ring-[var(--color-action-ring)] focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]";

export const PAY_LABEL_CLASS =
  "text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]";

/** Focus ring for the non-input controls (cards, dropzone, buttons). */
export const PAY_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]";

/** Border colour for a field, red when invalid (matches the ERP forms). */
export function payBorder(invalid?: boolean): string {
  return invalid
    ? "border-[color-mix(in_srgb,var(--color-danger)_55%,transparent)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";
}

interface PaymentFieldProps {
  id: string;
  label: string;
  required?: boolean;
  /** Shown as a muted "(optional)" tag when the field is not required. */
  optionalLabel?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Label + control + error/hint, one consistent vertical block. */
export default function PaymentField({
  id,
  label,
  required,
  optionalLabel,
  error,
  hint,
  children,
}: PaymentFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex flex-wrap items-center gap-1.5">
        <span className={PAY_LABEL_CLASS}>{label}</span>
        {required ? (
          <span aria-hidden className="text-[12px] font-semibold text-[var(--color-danger-strong)]">
            *
          </span>
        ) : optionalLabel ? (
          <span className="text-[10.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]">
            ({optionalLabel})
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <span role="alert" className="text-[11.5px] font-medium text-[var(--color-danger-strong)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">{hint}</span>
      ) : null}
    </div>
  );
}

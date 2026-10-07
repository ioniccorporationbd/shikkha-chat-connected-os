"use client";

import { useState } from "react";
import { FiCreditCard, FiShield } from "react-icons/fi";

import { formatAmount } from "@/lib/payment-entry/format";
import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import { toast } from "@/lib/ui/toast";

import PaymentField, { PAY_FIELD_CLASS, PAY_FOCUS, payBorder } from "./PaymentField";
import { amountInput } from "./form-utils";

interface SslcommerzPaymentPanelProps {
  copy: ManualPaymentCopy;
  language: string;
  currency: string;
  /** True while the initiate request is in flight (disables the button). */
  submitting: boolean;
  /** Starts the gateway session for the entered amount. */
  onSubmit: (amount: number) => void;
}

/**
 * The "Pay with SSLCommerz" amount panel — the online-payment counterpart of the
 * manual forms. The customer enters an amount; on submit the backend opens the
 * sandbox session and the browser is redirected to the gateway. Validation here
 * is convenience only — the ERP re-validates the amount and compares it against
 * its own stored value after SSLCommerz confirms the payment.
 */
export default function SslcommerzPaymentPanel({
  copy,
  language,
  currency,
  submitting,
  onSubmit,
}: SslcommerzPaymentPanelProps) {
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  const value = Number(amount);
  const amountError = !amount.trim() || !Number.isFinite(value) || value <= 0 ? copy.errAmount : "";
  const errors: Record<string, string> = touched && amountError ? { amount: amountError } : {};

  const symbolCurrency = currency || "BDT";
  const preview = formatAmount(Number.isFinite(value) && value > 0 ? value : 0, symbolCurrency, language);

  const submit = () => {
    if (submitting) return;
    setTouched(true);
    if (amountError) {
      toast.warning(copy.errSummary);
      return;
    }
    onSubmit(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <PaymentField
        id="ssl-amount"
        label={copy.sslAmountLabel}
        required
        error={errors.amount}
        hint={copy.sslAmountHint}
      >
        <input
          id="ssl-amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          placeholder={copy.sslAmountPlaceholder}
          disabled={submitting}
          onChange={(event) => setAmount(amountInput(event.target.value))}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.amount))}`}
        />
      </PaymentField>

      <p className="flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3 py-2 text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
        <FiShield size={13} className="shrink-0" />
        <span>{copy.sslEnvironmentNote}</span>
      </p>

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className={`inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60 ${PAY_FOCUS}`}
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
          <FiCreditCard size={15} />
          {submitting ? copy.sslRedirecting : copy.sslPayWith.replace("{amount}", preview)}
        </span>
      </button>
    </div>
  );
}

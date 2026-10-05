"use client";

import { useState } from "react";
import { FiSend } from "react-icons/fi";

import {
  BD_MOBILE_PATTERN,
  normalizeMobile,
} from "@/lib/payment-entry/manual-payment/config";
import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import type { ManualPaymentSubmitInput } from "@/lib/payment-entry/manual-payment/types";
import { toast } from "@/lib/ui/toast";

import PaymentField, { PAY_FIELD_CLASS, PAY_FOCUS, payBorder } from "./PaymentField";
import PaymentProofUpload, { type ProofSelection } from "./PaymentProofUpload";
import { amountInput, digitsOnly, todayISO } from "./form-utils";

export interface MobileWalletFormProps {
  method: "bkash" | "rocket";
  copy: ManualPaymentCopy;
  language: string;
  submitting: boolean;
  onSubmit: (input: ManualPaymentSubmitInput) => void;
}

/**
 * The bKash / Rocket manual-payment form — one implementation for the shared
 * "mobile wallet" family. Fields: amount, sender mobile, transaction ID,
 * payment date, proof image, optional note.
 *
 * On submit it produces the real backend payload (the proof travels as a
 * base64 `data:` URL); validation here is convenience only — the ERP validates
 * again.
 */
export default function MobileWalletForm({
  method,
  copy,
  language,
  submitting,
  onSubmit,
}: MobileWalletFormProps) {
  const today = todayISO();
  const [amount, setAmount] = useState("");
  const [mobile, setMobile] = useState("");
  const [trx, setTrx] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<ProofSelection | null>(null);
  const [touched, setTouched] = useState(false);

  const idPrefix = method;

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) errors.amount = copy.errAmount;
    if (!BD_MOBILE_PATTERN.test(normalizeMobile(mobile))) errors.mobile = copy.errMobile;
    if (trx.trim().length < 4) errors.trx = copy.errTransactionId;
    if (!date) errors.date = copy.errDate;
    else if (date > today) errors.date = copy.errFutureDate;
    if (!proof) errors.proof = copy.errProof;
    return errors;
  };

  const errors = touched ? validate() : {};

  const submit = () => {
    if (submitting) return;
    setTouched(true);
    if (Object.keys(validate()).length > 0) {
      toast.warning(copy.errSummary);
      return;
    }
    if (!proof) return;
    onSubmit({
      payment_method: method,
      amount: Number(amount),
      payment_date: date,
      sender_mobile: normalizeMobile(mobile),
      transaction_id: trx.trim(),
      note: note.trim() || undefined,
      proof_file_data: proof.preview,
      proof_file_name: proof.file.name,
      language,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PaymentField id={`${idPrefix}-amount`} label={copy.amountLabel} required error={errors.amount} hint={copy.amountHint}>
        <input
          id={`${idPrefix}-amount`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          placeholder={copy.amountPlaceholder}
          onChange={(event) => setAmount(amountInput(event.target.value))}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.amount))}`}
        />
      </PaymentField>

      <PaymentField
        id={`${idPrefix}-mobile`}
        label={copy.senderMobileLabel}
        required
        error={errors.mobile}
        hint={copy.senderMobileHint}
      >
        <input
          id={`${idPrefix}-mobile`}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          value={mobile}
          placeholder={copy.senderMobilePlaceholder}
          onChange={(event) => setMobile(digitsOnly(event.target.value))}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.mobile))}`}
        />
      </PaymentField>

      <PaymentField
        id={`${idPrefix}-trx`}
        label={copy.transactionIdLabel}
        required
        error={errors.trx}
        hint={copy.transactionIdHint}
      >
        <input
          id={`${idPrefix}-trx`}
          type="text"
          autoComplete="off"
          maxLength={32}
          value={trx}
          placeholder={copy.transactionIdPlaceholder}
          onChange={(event) => setTrx(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.trx))}`}
        />
      </PaymentField>

      <PaymentField
        id={`${idPrefix}-date`}
        label={copy.paymentDateLabel}
        required
        error={errors.date}
        hint={copy.paymentDateHint}
      >
        <input
          id={`${idPrefix}-date`}
          type="date"
          max={today}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.date))}`}
        />
      </PaymentField>

      <PaymentProofUpload
        copy={copy}
        inputId={`${idPrefix}-proof`}
        invalid={Boolean(errors.proof)}
        onChange={setProof}
      />

      <PaymentField
        id={`${idPrefix}-note`}
        label={copy.noteLabel}
        optionalLabel={copy.optional}
      >
        <textarea
          id={`${idPrefix}-note`}
          rows={3}
          maxLength={500}
          value={note}
          placeholder={copy.notePlaceholder}
          onChange={(event) => setNote(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(false)} resize-none`}
        />
      </PaymentField>

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className={`inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] transition hover:opacity-95 disabled:opacity-60 ${PAY_FOCUS}`}
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
          <FiSend size={15} />
          {submitting ? copy.submitting : copy.submit}
        </span>
      </button>
    </div>
  );
}

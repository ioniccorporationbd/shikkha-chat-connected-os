"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheck, FiCopy, FiRefreshCw, FiSend } from "react-icons/fi";

import { fetchSupportedBanks } from "@/lib/payment-entry/manual-payment/service";
import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import type {
  ManualPaymentSubmitInput,
  SupportedBank,
} from "@/lib/payment-entry/manual-payment/types";
import { toast } from "@/lib/ui/toast";

import DashboardSelect from "../DashboardSelect";
import PaymentField, { PAY_FIELD_CLASS, PAY_FOCUS, payBorder } from "./PaymentField";
import PaymentProofUpload, { type ProofSelection } from "./PaymentProofUpload";
import { amountInput, todayISO } from "./form-utils";

interface BankPaymentFormProps {
  copy: ManualPaymentCopy;
  language: string;
  submitting: boolean;
  onSubmit: (input: ManualPaymentSubmitInput) => void;
}

/** One copyable value row in the receive-details card. */
function CopyRow({ label, value, copy }: { label: string; value: string; copy: ManualPaymentCopy }) {
  const [copied, setCopied] = useState(false);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; leave the value visible so it can be copied
      // by hand — never surface a raw error to the customer.
    }
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
          {label}
        </span>
        <span className="block truncate text-[13px] font-semibold text-[var(--color-primary)]" title={value}>
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={doCopy}
        aria-label={`${copy.bankCopy}: ${label}`}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] ${PAY_FOCUS}`}
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-primary)]">
          {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
          {copied ? copy.bankCopied : copy.bankCopy}
        </span>
      </button>
    </div>
  );
}

/** The read-only receive-details block for the selected bank. */
function BankReceiveCard({ bank, copy }: { bank: SupportedBank; copy: ManualPaymentCopy }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
        {copy.bankReceiveTitle}
      </p>

      <div className="flex flex-col gap-2.5">
        {bank.account_name ? <CopyRow label={copy.bankAccountName} value={bank.account_name} copy={copy} /> : null}
        {bank.account_number ? <CopyRow label={copy.bankAccountNumber} value={bank.account_number} copy={copy} /> : null}
        {bank.branch ? <CopyRow label={copy.bankBranch} value={bank.branch} copy={copy} /> : null}
        {bank.routing_number ? <CopyRow label={copy.bankRouting} value={bank.routing_number} copy={copy} /> : null}
      </div>

      {bank.instructions ? (
        <p className="text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {bank.instructions}
        </p>
      ) : null}

      {bank.is_placeholder ? (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-white))] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-primary)]">
          {copy.bankDemoNote}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The Bank manual-payment form: pick a supported bank (loaded from the ERP),
 * see its receive details (with copy buttons), then submit the transfer proof.
 */
export default function BankPaymentForm({
  copy,
  language,
  submitting,
  onSubmit,
}: BankPaymentFormProps) {
  const today = todayISO();
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksFailed, setBanksFailed] = useState(false);

  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<ProofSelection | null>(null);
  const [touched, setTouched] = useState(false);

  const loadBanks = useMemo(
    () => async () => {
      setBanksLoading(true);
      setBanksFailed(false);
      try {
        const payload = await fetchSupportedBanks();
        setBanks(payload.banks || []);
      } catch {
        setBanksFailed(true);
      } finally {
        setBanksLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadBanks();
    });
    return () => {
      active = false;
    };
  }, [loadBanks]);

  const bank = banks.find((option) => option.name === bankName) || null;

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!bankName) errors.bank = copy.errBank;
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) errors.amount = copy.errAmount;
    if (!senderName.trim()) errors.senderName = copy.errSenderName;
    if (reference.trim().length < 3) errors.reference = copy.errReference;
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
      payment_method: "bank",
      amount: Number(amount),
      payment_date: date,
      bank: bankName,
      sender_account_name: senderName.trim(),
      sender_account_number: senderAccount.trim() || undefined,
      transfer_reference: reference.trim(),
      note: note.trim() || undefined,
      proof_file_data: proof.preview,
      proof_file_name: proof.file.name,
      language,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PaymentField id="bank-select" label={copy.bankSelectLabel} required error={errors.bank}>
        <DashboardSelect
          value={bankName}
          onChange={setBankName}
          disabled={banksLoading || banks.length === 0}
          invalid={Boolean(errors.bank)}
          placeholder={copy.bankSelectPlaceholder}
          ariaLabel={copy.bankSelectLabel}
          options={banks.map((option) => ({ value: option.name, label: option.bank_name }))}
        />
      </PaymentField>

      {banksLoading ? (
        <div className="flex items-center gap-2 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          <FiRefreshCw size={13} className="animate-spin" />
          <span>{copy.bankLoading}</span>
        </div>
      ) : null}

      {!banksLoading && banksFailed ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] px-3 py-2">
          <span className="text-[11.5px] text-[var(--color-danger-strong)]">{copy.bankLoadFailed}</span>
          <button
            type="button"
            onClick={() => void loadBanks()}
            className={`rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2 py-0.5 ${PAY_FOCUS}`}
          >
            <span className="text-[11px] font-semibold text-[var(--color-primary)]">{copy.retry}</span>
          </button>
        </div>
      ) : null}

      {!banksLoading && !banksFailed && banks.length === 0 ? (
        <p className="rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-white))] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--color-primary)]">
          {copy.bankEmpty}
        </p>
      ) : null}

      {bank ? <BankReceiveCard bank={bank} copy={copy} /> : null}

      <PaymentField id="bank-amount" label={copy.amountLabel} required error={errors.amount} hint={copy.amountHint}>
        <input
          id="bank-amount"
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
        id="bank-sender-name"
        label={copy.senderAccountNameLabel}
        required
        error={errors.senderName}
      >
        <input
          id="bank-sender-name"
          type="text"
          autoComplete="off"
          maxLength={120}
          value={senderName}
          placeholder={copy.senderAccountNamePlaceholder}
          onChange={(event) => setSenderName(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.senderName))}`}
        />
      </PaymentField>

      <PaymentField
        id="bank-sender-account"
        label={copy.senderAccountNumberLabel}
        optionalLabel={copy.optional}
      >
        <input
          id="bank-sender-account"
          type="text"
          autoComplete="off"
          maxLength={40}
          value={senderAccount}
          placeholder={copy.senderAccountNumberPlaceholder}
          onChange={(event) => setSenderAccount(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(false)}`}
        />
      </PaymentField>

      <PaymentField
        id="bank-reference"
        label={copy.bankReferenceLabel}
        required
        error={errors.reference}
      >
        <input
          id="bank-reference"
          type="text"
          autoComplete="off"
          maxLength={48}
          value={reference}
          placeholder={copy.bankReferencePlaceholder}
          onChange={(event) => setReference(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.reference))}`}
        />
      </PaymentField>

      <PaymentField id="bank-date" label={copy.paymentDateLabel} required error={errors.date} hint={copy.paymentDateHint}>
        <input
          id="bank-date"
          type="date"
          max={today}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={`${PAY_FIELD_CLASS} ${payBorder(Boolean(errors.date))}`}
        />
      </PaymentField>

      <PaymentProofUpload
        copy={copy}
        inputId="bank-proof"
        invalid={Boolean(errors.proof)}
        onChange={setProof}
      />

      <PaymentField id="bank-note" label={copy.noteLabel} optionalLabel={copy.optional}>
        <textarea
          id="bank-note"
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
        className={`inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60 ${PAY_FOCUS}`}
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
          <FiSend size={15} />
          {submitting ? copy.submitting : copy.submit}
        </span>
      </button>
    </div>
  );
}

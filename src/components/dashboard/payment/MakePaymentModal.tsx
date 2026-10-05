"use client";

import { useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiClock, FiInfo } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import { formatAmount } from "@/lib/payment-entry/format";
import { manualPaymentCopyFor } from "@/lib/payment-entry/manual-payment/messages";
import { submitManualPayment } from "@/lib/payment-entry/manual-payment/service";
import type {
  MakePaymentStep,
  ManualPaymentMethod,
  ManualPaymentRequest,
  ManualPaymentResult,
  PaymentChannel,
} from "@/lib/payment-entry/manual-payment/types";
import { toast } from "@/lib/ui/toast";

import BankPaymentForm from "./BankPaymentForm";
import BkashPaymentForm from "./BkashPaymentForm";
import ManualPaymentSelector from "./ManualPaymentSelector";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { PAY_FOCUS } from "./PaymentField";
import RocketPaymentForm from "./RocketPaymentForm";

interface MakePaymentModalProps {
  language: string;
  currency: string;
  customerName: string;
  onClose: () => void;
}

/**
 * The "Make Payment" modal — a small step machine:
 *   method → (online info | manual) → bKash/Rocket/Bank form → success
 *
 * Mounted only while open (the parent renders it conditionally), so every open
 * starts clean at the first step with no leftover form state. Submission goes
 * through the isolated manual-payment service — no ERP write happens here.
 */
export default function MakePaymentModal({
  language,
  currency,
  customerName,
  onClose,
}: MakePaymentModalProps) {
  const copy = manualPaymentCopyFor(language);

  const [step, setStep] = useState<MakePaymentStep>("method");
  const [showOnlineInfo, setShowOnlineInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ManualPaymentResult | null>(null);
  const [submitted, setSubmitted] = useState<ManualPaymentRequest | null>(null);

  const methodLabel = (method: ManualPaymentMethod | undefined): string => {
    if (method === "bkash") return copy.methodBkash;
    if (method === "rocket") return copy.methodRocket;
    if (method === "bank") return copy.methodBank;
    return "";
  };

  const handleChannel = (channel: PaymentChannel) => {
    if (channel === "online") {
      setShowOnlineInfo(true);
      return;
    }
    setStep("manual");
  };

  const handleMethod = (method: ManualPaymentMethod) => setStep(method);

  const handleSubmit = async (request: ManualPaymentRequest) => {
    setSubmitting(true);
    try {
      const acknowledgement = await submitManualPayment(request);
      setResult(acknowledgement);
      setSubmitted(request);
      setStep("success");
      toast.success(copy.successTitle, copy.makePayment);
    } catch {
      toast.error(copy.submitFailed, copy.makePayment);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (showOnlineInfo) {
      setShowOnlineInfo(false);
      return;
    }
    if (step === "manual") {
      setStep("method");
      return;
    }
    if (step === "bkash" || step === "rocket" || step === "bank") {
      setStep("manual");
    }
  };

  const showBack = showOnlineInfo || step === "manual" || step === "bkash" || step === "rocket" || step === "bank";

  const BackButton = (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] ${PAY_FOCUS}`}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary)]">
        <FiArrowLeft size={14} />
        {copy.back}
      </span>
    </button>
  );

  return (
    <DashboardModal
      open
      title={copy.makePayment}
      subtitle={copy.makePaymentSubtitle}
      closeLabel={copy.close}
      onClose={onClose}
      widthClass="max-w-[560px]"
    >
      <div className="flex flex-col gap-4">
        {showBack ? BackButton : null}

        {step === "method" ? (
          showOnlineInfo ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-white))] px-5 py-8 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] text-[var(--color-warning)]">
                <FiInfo size={22} />
              </span>
              <h3 className="text-[15px] font-semibold text-[var(--color-primary)]">
                {copy.onlineInfoTitle}
              </h3>
              <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                {copy.onlineInfoBody}
              </p>
            </div>
          ) : (
            <>
              <StepHeading title={copy.stepMethodTitle} subtitle={copy.stepMethodSubtitle} />
              <PaymentMethodSelector copy={copy} onSelect={handleChannel} />
            </>
          )
        ) : null}

        {step === "manual" ? (
          <>
            <StepHeading title={copy.stepManualTitle} subtitle={copy.stepManualSubtitle} />
            <ManualPaymentSelector copy={copy} onSelect={handleMethod} />
          </>
        ) : null}

        {step === "bkash" ? (
          <>
            <StepHeading title={copy.formTitleBkash} />
            <BkashPaymentForm
              copy={copy}
              currency={currency}
              customerName={customerName}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "rocket" ? (
          <>
            <StepHeading title={copy.formTitleRocket} />
            <RocketPaymentForm
              copy={copy}
              currency={currency}
              customerName={customerName}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "bank" ? (
          <>
            <StepHeading title={copy.formTitleBank} />
            <BankPaymentForm
              copy={copy}
              currency={currency}
              customerName={customerName}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "success" && result ? (
          <>
            <div className="flex flex-col items-center gap-2 pt-1 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-success)_16%,var(--color-white))] text-[var(--color-success)]">
                <FiCheckCircle size={26} />
              </span>
              <h3 className="text-[15px] font-semibold text-[var(--color-primary)]">
                {copy.successTitle}
              </h3>
              <p className="max-w-[44ch] text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                {copy.successBody}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] p-4">
              <SummaryLine label={copy.successRef} value={result.request_id} />
              <SummaryLine label={copy.successMethod} value={methodLabel(submitted?.method)} />
              <SummaryLine
                label={copy.successAmount}
                value={formatAmount(submitted?.amount ?? 0, currency, language)}
              />
              <span className="inline-flex items-center gap-1.5 pt-1 text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                <FiClock size={13} />
                {copy.pendingLocal}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-95 ${PAY_FOCUS}`}
            >
              <span className="text-[13px] font-semibold text-[var(--color-white)]">
                {copy.successClose}
              </span>
            </button>
          </>
        ) : null}
      </div>
    </DashboardModal>
  );
}

/** A small in-body heading above a step's content. */
function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-[14px] font-semibold text-[var(--color-primary)]">{title}</h3>
      {subtitle ? (
        <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** A label/value row in the success summary. */
function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
        {label}
      </span>
      <span className="truncate text-[13px] font-semibold text-[var(--color-primary)]" title={value}>
        {value}
      </span>
    </div>
  );
}

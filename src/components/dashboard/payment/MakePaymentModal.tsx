"use client";

import { useState } from "react";
import { FiArrowLeft, FiCreditCard } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import { manualPaymentCopyFor } from "@/lib/payment-entry/manual-payment/messages";
import { submitManualPayment } from "@/lib/payment-entry/manual-payment/service";
import type {
  MakePaymentStep,
  ManualPaymentMethod,
  ManualPaymentSubmitInput,
  PaymentChannel,
} from "@/lib/payment-entry/manual-payment/types";
import { initiateSslcommerz } from "@/lib/payment-entry/sslcommerz/service";
import { toast } from "@/lib/ui/toast";

import BankPaymentForm from "./BankPaymentForm";
import BkashPaymentForm from "./BkashPaymentForm";
import ManualPaymentSelector from "./ManualPaymentSelector";
import NagadPaymentForm from "./NagadPaymentForm";
import PaymentBrandMark from "./PaymentBrandMark";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { PAY_FOCUS } from "./PaymentField";
import RocketPaymentForm from "./RocketPaymentForm";
import SslcommerzPaymentPanel from "./SslcommerzPaymentPanel";

interface MakePaymentModalProps {
  language: string;
  currency: string;
  /**
   * Called after the backend confirms the request, with the REAL created
   * Payment Entry name (e.g. "ACC-PAY-2026-00001"). The page redirects to the
   * dashboard-themed Payment Success page; there is no in-modal success screen.
   */
  onCreated?: (paymentEntryId: string) => void;
  onClose: () => void;
}

/**
 * The "Make Payment" modal — a small step machine:
 *   method → (sslcommerz | manual) → bKash/Rocket/Bank form → redirect
 *
 * Manual Pay posts the manual payment to the ERP (a real ERPNext Payment Entry,
 * status "Draft") and then hands the created document name to the page, which
 * navigates to the success route. The SSLCommerz branch opens a hosted sandbox
 * session and sends the browser to the gateway; the final status is read back
 * from our own backend after SSLCommerz validates the payment.
 */
export default function MakePaymentModal({
  language,
  currency,
  onCreated,
  onClose,
}: MakePaymentModalProps) {
  const copy = manualPaymentCopyFor(language);

  const [step, setStep] = useState<MakePaymentStep>("method");
  const [sslSubmitting, setSslSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChannel = (channel: PaymentChannel) => {
    setStep(channel === "online" ? "sslcommerz" : "manual");
  };

  const handleMethod = (method: ManualPaymentMethod) => setStep(method);

  const handleSubmit = async (input: ManualPaymentSubmitInput) => {
    setSubmitting(true);
    try {
      const acknowledgement = await submitManualPayment(input);
      // No in-modal success screen and no toast: hand the real Payment Entry
      // name to the page, which redirects to the success route — the single,
      // authoritative confirmation.
      onCreated?.(acknowledgement.name);
    } catch (error) {
      // The ERP's own message (duplicate transaction, invalid bank, file too
      // large, …) is surfaced as-is; fall back to a generic line.
      const message = error instanceof Error && error.message ? error.message : copy.submitFailed;
      toast.error(message, copy.makePayment);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSslSubmit = async (amount: number) => {
    setSslSubmitting(true);
    try {
      const session = await initiateSslcommerz({ amount, language });
      // Hand the browser over to the SSLCommerz hosted page. The ERP opened the
      // session server-side; nothing sensitive is in this URL but the gateway.
      window.location.assign(session.gateway_page_url);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : copy.submitFailed;
      toast.error(message, copy.makePayment);
      setSslSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === "manual" || step === "sslcommerz") {
      setStep("method");
      return;
    }
    if (step === "bkash" || step === "rocket" || step === "nagad" || step === "bank") {
      setStep("manual");
    }
  };

  const showBack =
    step === "manual" ||
    step === "sslcommerz" ||
    step === "bkash" ||
    step === "rocket" ||
    step === "nagad" ||
    step === "bank";

  const BackButton = (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-1 transition hover:bg-[var(--color-action-tint)] ${PAY_FOCUS}`}
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
          <>
            <StepHeading title={copy.stepMethodTitle} subtitle={copy.stepMethodSubtitle} />
            <PaymentMethodSelector copy={copy} onSelect={handleChannel} />
          </>
        ) : null}

        {step === "sslcommerz" ? (
          <>
            <StepHeading
              title={copy.sslcommerzStepTitle}
              subtitle={copy.sslcommerzStepSubtitle}
              icon={
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-action)_14%,var(--color-white))] text-[var(--color-action)]">
                  <FiCreditCard size={18} />
                </span>
              }
            />
            <SslcommerzPaymentPanel
              copy={copy}
              language={language}
              currency={currency}
              submitting={sslSubmitting}
              onSubmit={handleSslSubmit}
            />
          </>
        ) : null}

        {step === "manual" ? (
          <>
            <StepHeading title={copy.stepManualTitle} subtitle={copy.stepManualSubtitle} />
            <ManualPaymentSelector copy={copy} onSelect={handleMethod} />
          </>
        ) : null}

        {step === "bkash" ? (
          <>
            <StepHeading title={copy.formTitleBkash} icon={<PaymentBrandMark method="bkash" size={40} />} />
            <BkashPaymentForm
              copy={copy}
              language={language}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "rocket" ? (
          <>
            <StepHeading title={copy.formTitleRocket} icon={<PaymentBrandMark method="rocket" size={40} />} />
            <RocketPaymentForm
              copy={copy}
              language={language}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "nagad" ? (
          <>
            <StepHeading title={copy.formTitleNagad} icon={<PaymentBrandMark method="nagad" size={40} />} />
            <NagadPaymentForm
              copy={copy}
              language={language}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}

        {step === "bank" ? (
          <>
            <StepHeading title={copy.formTitleBank} icon={<PaymentBrandMark method="bank" size={40} />} />
            <BankPaymentForm
              copy={copy}
              language={language}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </>
        ) : null}
      </div>
    </DashboardModal>
  );
}

/** A small in-body heading above a step's content, with an optional mark. */
function StepHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-[14px] font-semibold text-[var(--color-primary)]">{title}</h3>
        {subtitle ? (
          <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

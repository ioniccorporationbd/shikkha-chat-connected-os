"use client";

import { FiArrowRight, FiGlobe, FiSend } from "react-icons/fi";

import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import type { PaymentChannel } from "@/lib/payment-entry/manual-payment/types";

import { PAY_FOCUS } from "./PaymentField";

interface PaymentMethodSelectorProps {
  copy: ManualPaymentCopy;
  onSelect: (channel: PaymentChannel) => void;
}

/**
 * First step of the Make Payment modal: Online Pay vs Manual Pay.
 *
 * Manual Pay is the live path in this phase; Online Pay is an honest
 * informational choice (no fake gateway) that opens a "coming soon" state.
 */
export default function PaymentMethodSelector({ copy, onSelect }: PaymentMethodSelectorProps) {
  const cardClass = `group flex items-center gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] p-4 text-left transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] ${PAY_FOCUS}`;

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => onSelect("manual")} className={cardClass}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
          <FiSend size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-[var(--color-primary)]">
            {copy.manualTitle}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.manualDesc}
          </span>
        </span>
        <FiArrowRight size={18} className="shrink-0 text-[var(--color-primary)]" />
      </button>

      <button type="button" onClick={() => onSelect("online")} className={cardClass}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
          <FiGlobe size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-[var(--color-primary)]">
              {copy.onlineTitle}
            </span>
            <span className="rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
              {copy.onlineBadge}
            </span>
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.onlineDesc}
          </span>
        </span>
        <FiArrowRight size={18} className="shrink-0 text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]" />
      </button>
    </div>
  );
}

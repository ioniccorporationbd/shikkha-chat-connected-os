"use client";

import { FiArrowRight } from "react-icons/fi";

import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import type { ManualPaymentMethod } from "@/lib/payment-entry/manual-payment/types";

import PaymentBrandMark from "./PaymentBrandMark";
import { PAY_FOCUS } from "./PaymentField";

interface ManualPaymentSelectorProps {
  copy: ManualPaymentCopy;
  onSelect: (method: ManualPaymentMethod) => void;
}

/** Second step of the Make Payment modal: bKash / Nagad / Rocket / Bank. */
export default function ManualPaymentSelector({ copy, onSelect }: ManualPaymentSelectorProps) {
  // One shared card treatment for every method. Rest is neutral; hover washes
  // the surface in the light-red `action-tint` and turns the border red; the
  // pressed / keyboard-focused card (the closest thing to a "selected" state
  // for these navigation cards) uses the denser `action-tint-strong`.
  const cardClass = `group flex items-center gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-4 text-left transition duration-200 hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] active:border-[var(--color-action)] active:bg-[var(--color-action-tint-strong)] focus-visible:border-[var(--color-action)] focus-visible:bg-[var(--color-action-tint)] ${PAY_FOCUS}`;

  const arrowClass =
    "shrink-0 text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--color-action)]";

  const options: {
    key: ManualPaymentMethod;
    name: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    { key: "bkash", name: copy.methodBkash, desc: copy.methodBkashDesc, icon: <PaymentBrandMark method="bkash" size={44} /> },
    { key: "rocket", name: copy.methodRocket, desc: copy.methodRocketDesc, icon: <PaymentBrandMark method="rocket" size={44} /> },
    { key: "nagad", name: copy.methodNagad, desc: copy.methodNagadDesc, icon: <PaymentBrandMark method="nagad" size={44} /> },
    { key: "bank", name: copy.methodBank, desc: copy.methodBankDesc, icon: <PaymentBrandMark method="bank" size={44} /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onSelect(option.key)}
          className={cardClass}
        >
          {option.icon}
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[var(--color-primary)]">
              {option.name}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {option.desc}
            </span>
          </span>
          <FiArrowRight size={18} className={arrowClass} />
        </button>
      ))}
    </div>
  );
}

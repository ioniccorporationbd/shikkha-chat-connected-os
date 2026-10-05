"use client";

import { FiArrowRight, FiCreditCard, FiSmartphone } from "react-icons/fi";

import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";
import type { ManualPaymentMethod } from "@/lib/payment-entry/manual-payment/types";

import { PAY_FOCUS } from "./PaymentField";

interface ManualPaymentSelectorProps {
  copy: ManualPaymentCopy;
  onSelect: (method: ManualPaymentMethod) => void;
}

/** Second step of the Make Payment modal: bKash / Rocket / Bank. */
export default function ManualPaymentSelector({ copy, onSelect }: ManualPaymentSelectorProps) {
  const cardClass = `group flex items-center gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] p-4 text-left transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] ${PAY_FOCUS}`;

  const options: {
    key: ManualPaymentMethod;
    name: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    { key: "bkash", name: copy.methodBkash, desc: copy.methodBkashDesc, icon: <FiSmartphone size={18} /> },
    { key: "rocket", name: copy.methodRocket, desc: copy.methodRocketDesc, icon: <FiSmartphone size={18} /> },
    { key: "bank", name: copy.methodBank, desc: copy.methodBankDesc, icon: <FiCreditCard size={18} /> },
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
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
            {option.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[var(--color-primary)]">
              {option.name}
            </span>
            <span className="mt-0.5 block text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {option.desc}
            </span>
          </span>
          <FiArrowRight size={18} className="shrink-0 text-[var(--color-primary)]" />
        </button>
      ))}
    </div>
  );
}

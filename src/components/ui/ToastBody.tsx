"use client";

import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ToastType } from "@/lib/ui/toast";

const TITLES: Record<"bn" | "en", Record<ToastType, string>> = {
  bn: { error: "ত্রুটি", success: "সফল", warning: "সতর্কতা", info: "তথ্য" },
  en: { error: "Error", success: "Success", warning: "Warning", info: "Info" },
};

/**
 * Toast surfaces reuse EXISTING design tokens only — no new colour is
 * introduced (Part D §22/§23/§26/§27, Part F guardrail):
 *   - success → the Dashboard selected/active navigation colour (--color-primary)
 *   - error   → the Shikkha action red (--color-action)
 *   - warning → the existing warning token
 *   - info    → the brand/neutral treatment (--color-primary)
 * Every toast carries white text and icon. The card is deliberately SHARP
 * (border-radius: 0, §20) with a square icon chip and a sharp close control.
 */
const SURFACE: Record<ToastType, string> = {
  error: "var(--color-action)",
  success: "var(--color-primary)",
  warning: "var(--color-warning)",
  info: "var(--color-primary)",
};

function Icon({ type }: { type: ToastType }) {
  const size = 18;
  if (type === "success") return <FiCheckCircle size={size} />;
  if (type === "warning") return <FiAlertTriangle size={size} />;
  if (type === "error") return <FiAlertOctagon size={size} />;
  return <FiInfo size={size} />;
}

/**
 * The actual toast card. react-toastify injects `closeToast`, so this renders
 * purely — auto-dismiss timing is owned by the library, not by us.
 */
export default function ToastBody({
  type,
  message,
  title,
  closeToast,
}: {
  type: ToastType;
  message: string;
  title?: string;
  closeToast?: () => void;
}) {
  const { language } = useLanguage();
  const heading = title ?? TITLES[language === "en" ? "en" : "bn"][type];

  return (
    <div
      data-no-translate="true"
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className="flex w-full items-start gap-3 rounded-none border border-[color-mix(in_srgb,var(--color-white)_22%,transparent)] px-4 py-3 shadow-[0_22px_48px_-22px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
      style={{ background: SURFACE[type] }}
    >
      <span
        aria-hidden
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-none bg-[color-mix(in_srgb,var(--color-white)_22%,transparent)] text-[var(--color-white)]"
      >
        <Icon type={type} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[var(--color-white)]">{heading}</span>
        <span className="mt-0.5 block break-words text-[13px] leading-relaxed text-[var(--color-white)]">
          {message}
        </span>
      </span>

      <button
        type="button"
        onClick={() => closeToast?.()}
        aria-label="Dismiss"
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-none text-[color-mix(in_srgb,var(--color-white)_70%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-white)_18%,transparent)] hover:text-[var(--color-white)]"
      >
        <FiX size={15} />
      </button>
    </div>
  );
}

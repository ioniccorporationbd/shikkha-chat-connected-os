"use client";

import { FiGlobe } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  className?: string;
  /** `compact` = header pill; `full` = full-width switch (account dropdown). */
  variant?: "compact" | "full";
};

/**
 * Dashboard language selector — a two-option segmented switch with a sliding
 * indicator.
 *
 * It reads and writes the *same* `LanguageProvider` state the marketing site
 * uses, so switching here updates the whole app (and vice-versa) and the choice
 * persists — one global language preference, never a second one. The only
 * change here is presentation: a smooth indicator replaces the plain active
 * pill, and both options stay real <button>s with `aria-pressed`.
 */
export default function DashboardLanguageToggle({ className, variant = "compact" }: Props) {
  const { language, setLanguage } = useLanguage();
  const isBangla = language !== "en";
  const full = variant === "full";

  const optionClass = full
    ? "relative z-[1] inline-flex h-9 flex-1 items-center justify-center rounded-full transition-colors duration-300"
    : "relative z-[1] inline-flex h-7 w-[46px] items-center justify-center rounded-full transition-colors duration-300";

  const labelClass = (active: boolean) =>
    ["text-[12px] font-bold transition-colors duration-300", active ? "text-[var(--color-white)]" : "text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]"].join(
      " "
    );

  return (
    <div
      data-no-translate="true"
      role="group"
      aria-label="Language"
      className={[full ? "flex w-full items-center gap-1.5" : "inline-flex items-center gap-1.5", className ?? ""].join(" ")}
    >
      <FiGlobe aria-hidden size={full ? 15 : 14} className="shrink-0 text-[var(--color-primary)]" />

      <span
        className={[
          "relative flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] p-0.5 shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
          full ? "flex-1" : "",
        ].join(" ")}
      >
        {/* Sliding indicator */}
        <span
          aria-hidden
          className={[
            "absolute inset-y-0.5 left-0.5 rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,color-mix(in_srgb,var(--color-primary)_82%,var(--color-secondary))_100%)] shadow-[0_8px_18px_-10px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition-transform duration-300 ease-out",
            full ? "w-[calc(50%-0.25rem)]" : "w-[46px]",
            isBangla ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        />

        <button type="button" onClick={() => setLanguage("bn")} aria-pressed={isBangla} className={optionClass}>
          <span className={labelClass(isBangla)}>{full ? "বাংলা" : "বাং"}</span>
        </button>

        <button type="button" onClick={() => setLanguage("en")} aria-pressed={!isBangla} className={optionClass}>
          <span className={labelClass(!isBangla)}>{full ? "English" : "EN"}</span>
        </button>
      </span>
    </div>
  );
}

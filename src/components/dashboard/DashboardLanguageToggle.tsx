"use client";

import { FiGlobe } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  className?: string;
  /** `compact` = header pill; `full` = full-width button (account dropdown). */
  variant?: "compact" | "full";
};

/**
 * Dashboard language selector — the compact SINGLE toggle button (restored).
 *
 * It shows the *current* language and flips to the other one on click
 * (বাংলা ⇄ English): one button, one language shown at a time — never the
 * simultaneous two-segment switch the Dashboard-Wide redesign briefly introduced.
 *
 * It reads and writes the *same* `LanguageProvider` state the marketing site
 * uses, so switching here updates the whole app (and vice-versa) and the choice
 * persists — one global language preference, never a second one. Purely a
 * presentation change: language state, persistence and hydration behaviour are
 * untouched (still `useLanguage` → `setLanguage`).
 *
 * Hover uses the same soft Shikkha-red surface as the rest of the dashboard.
 */
export default function DashboardLanguageToggle({ className, variant = "compact" }: Props) {
  const { language, setLanguage } = useLanguage();
  const isBangla = language !== "en";
  const full = variant === "full";

  const current = isBangla ? "বাংলা" : "English";
  const short = isBangla ? "বাং" : "EN";
  const ariaLabel = isBangla ? "Switch language to English" : "ভাষা বাংলায় পরিবর্তন করুন";

  return (
    <button
      type="button"
      data-no-translate="true"
      aria-label={ariaLabel}
      onClick={() => setLanguage(isBangla ? "en" : "bn")}
      className={[
        full
          ? "flex w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3 py-2.5"
          : "inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3 py-1.5",
        "transition duration-300 hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]",
        className ?? "",
      ].join(" ")}
    >
      <span className="text-[var(--color-primary)]">
        <FiGlobe aria-hidden size={full ? 15 : 14} />
      </span>
      <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">
        {full ? current : short}
      </span>
    </button>
  );
}

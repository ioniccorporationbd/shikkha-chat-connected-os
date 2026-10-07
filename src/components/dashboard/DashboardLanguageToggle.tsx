"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  className?: string;
  /** `compact` = header pill; `full` = full-width segmented control (account dropdown). */
  variant?: "compact" | "full";
};

/**
 * Dashboard language selector — a two-segment control (বাংলা ⇄ English).
 *
 * The ACTIVE language is the Shikkha-red segment with white text; the inactive
 * one is a neutral surface that shows a light red tint on hover. It reads and
 * writes the *same* `LanguageProvider` state the marketing site uses, so
 * switching here updates the whole app (and vice-versa) and the choice
 * persists — one global language preference, never a second one.
 *
 * This is a purely presentational change: the language state, persistence and
 * hydration behaviour are untouched (still `useLanguage` → `setLanguage`).
 */
export default function DashboardLanguageToggle({ className, variant = "compact" }: Props) {
  const { language, setLanguage } = useLanguage();
  const isBangla = language !== "en";
  const full = variant === "full";

  const segments: Array<{ code: "bn" | "en"; label: string; short: string; aria: string }> = [
    { code: "bn", label: "বাংলা", short: "বাং", aria: "ভাষা বাংলা" },
    { code: "en", label: "English", short: "EN", aria: "Language English" },
  ];

  return (
    <div
      data-no-translate="true"
      role="group"
      aria-label="Language"
      className={[
        full
          ? "grid w-full grid-cols-2 gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] p-1"
          : "inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] p-0.5",
        className ?? "",
      ].join(" ")}
    >
      {segments.map((seg) => {
        const active = seg.code === "bn" ? isBangla : !isBangla;

        return (
          <button
            key={seg.code}
            type="button"
            aria-pressed={active}
            aria-label={seg.aria}
            onClick={() => setLanguage(seg.code)}
            className={[
              "inline-flex items-center justify-center rounded-full transition duration-200",
              full ? "px-3 py-1.5" : "px-2.5 py-1",
              active
                ? "bg-[var(--color-action)] shadow-[0_8px_18px_-10px_color-mix(in_srgb,var(--color-action)_80%,transparent)]"
                : "hover:bg-[var(--color-action-tint)]",
            ].join(" ")}
          >
            <span
              className={[
                "text-[12px] font-semibold leading-none",
                active
                  ? "text-[var(--color-white)]"
                  : "text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
              ].join(" ")}
            >
              {full ? seg.label : seg.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}

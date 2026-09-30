"use client";

import { FiGlobe } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  className?: string;
  /** `compact` = header pill; `full` = full-width switch (profile dropdown). */
  variant?: "compact" | "full";
};

/**
 * Dashboard language selector.
 *
 * Reads and writes the *same* `LanguageProvider` state the marketing site uses,
 * so switching here updates the whole app (and vice-versa) and the choice is
 * persisted — one global language preference, never a second one.
 */
export default function DashboardLanguageToggle({ className, variant = "compact" }: Props) {
  const { language, setLanguage } = useLanguage();
  const isBangla = language !== "en";

  const optionClass = (activeOption: boolean, full: boolean) =>
    [
      full
        ? "inline-flex h-9 flex-1 items-center justify-center rounded-xl px-3 text-[12px] font-bold transition duration-300"
        : "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold transition duration-300",
      activeOption
        ? "bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_8px_18px_-10px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]"
        : "text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] hover:text-[var(--color-primary)]",
    ].join(" ");

  if (variant === "full") {
    return (
      <div
        data-no-translate="true"
        role="group"
        aria-label="Language"
        className={[
          "flex w-full items-center gap-1 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-1",
          className ?? "",
        ].join(" ")}
      >
        <FiGlobe aria-hidden size={15} className="ml-1.5 mr-0.5 shrink-0 text-[var(--color-primary)]" />

        <button
          type="button"
          onClick={() => setLanguage("bn")}
          aria-pressed={isBangla}
          className={optionClass(isBangla, true)}
        >
          বাংলা
        </button>

        <button
          type="button"
          onClick={() => setLanguage("en")}
          aria-pressed={!isBangla}
          className={optionClass(!isBangla, true)}
        >
          English
        </button>
      </div>
    );
  }

  return (
    <div
      data-no-translate="true"
      role="group"
      aria-label="Language"
      className={[
        "inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-0.5",
        className ?? "",
      ].join(" ")}
    >
      <FiGlobe aria-hidden size={14} className="ml-1.5 mr-0.5 text-[var(--color-primary)]" />

      <button
        type="button"
        onClick={() => setLanguage("bn")}
        aria-pressed={isBangla}
        className={optionClass(isBangla, false)}
      >
        বাং
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={!isBangla}
        className={optionClass(!isBangla, false)}
      >
        EN
      </button>
    </div>
  );
}

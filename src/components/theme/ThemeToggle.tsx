"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

import {
  applyTheme,
  currentTheme,
  THEME_EVENT,
  type Theme,
} from "@/lib/theme/theme";

type Props = {
  className?: string;
  /** `compact` = icon pill (headers); `full` = full-width row (menus). */
  variant?: "compact" | "full";
};

/**
 * Light ⇄ dark switch. Writes the same `data-theme` attribute the pre-paint
 * script uses and persists the explicit choice, so the selected mode survives
 * reloads. Only additive: the light theme is the default and is never mutated
 * by this component.
 */
export default function ThemeToggle({ className, variant = "compact" }: Props) {
  const [theme, setTheme] = useState<Theme>("light");
  const full = variant === "full";

  // Read the painted theme after mount (the attribute is set by the inline
  // script before hydration, so reading during render would mismatch SSR).
  useEffect(() => {
    setTheme(currentTheme());
    const sync = () => setTheme(currentTheme());
    window.addEventListener(THEME_EVENT, sync);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      // Follow the OS only while the user has not made an explicit choice.
      try {
        if (window.localStorage.getItem("shikkha-theme")) return;
      } catch {
        return;
      }
      sync();
    };
    media.addEventListener?.("change", onSystem);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      media.removeEventListener?.("change", onSystem);
    };
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  }, []);

  const isDark = theme === "dark";
  const label = isDark ? "লাইট মোডে যান" : "ডার্ক মোডে যান";

  return (
    <button
      type="button"
      data-no-translate="true"
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={toggle}
      className={[
        full
          ? "flex w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3 py-2.5"
          : "inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3 py-1.5",
        "transition duration-300 hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2",
        className ?? "",
      ].join(" ")}
    >
      <span className="text-[var(--color-primary)]">
        {isDark ? <FiSun aria-hidden size={full ? 15 : 14} /> : <FiMoon aria-hidden size={full ? 15 : 14} />}
      </span>
      {full ? (
        <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">
          {isDark ? "লাইট মোড" : "ডার্ক মোড"}
        </span>
      ) : null}
    </button>
  );
}

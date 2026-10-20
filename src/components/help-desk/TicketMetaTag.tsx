"use client";

import type { ReactNode } from "react";

/**
 * Small tag used for thread metadata (author, date, time, status). Keeps the
 * conversation header a tidy row of chips instead of a run of "·" separated
 * text, and gives every entry the same rhythm.
 */
export default function TicketMetaTag({
  children,
  icon,
  tone = "neutral",
}: {
  children: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "outline" | "strong" | "accent" | "success";
}) {
  const tones: Record<string, string> = {
    neutral:
      "bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-white))]",
    outline:
      "border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]",
    strong: "bg-[var(--color-primary)] text-[var(--color-white)]",
    accent:
      "bg-[color-mix(in_srgb,var(--color-action)_9%,var(--color-white))] text-[var(--color-action)]",
    success:
      "bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] text-[color-mix(in_srgb,var(--color-success)_82%,black)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}

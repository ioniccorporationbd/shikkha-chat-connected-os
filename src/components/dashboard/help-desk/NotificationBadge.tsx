"use client";

/**
 * Small numeric activity pill (WhatsApp/Telegram style) for Help Desk sections.
 *
 * Rules: red background, bold white number, hidden entirely at zero, and
 * `99+` once the count stops being a useful single glance. It sits inline next
 * to a label so it can never cover text or steal a click from the row.
 */

export default function NotificationBadge({
  count,
  label,
  className = "",
}: {
  count: number | null | undefined;
  /** Section name, used for the accessible title (`Problems: 4 new`). */
  label?: string;
  className?: string;
}) {
  const value = typeof count === "number" && Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  if (value <= 0) return null;

  const text = value > 99 ? "99+" : String(value);

  return (
    <span
      className={[
        "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1.5",
        "bg-[var(--color-action)] text-[10.5px] font-bold leading-none tabular-nums text-white",
        "shadow-[0_5px_12px_-6px_color-mix(in_srgb,var(--color-action)_85%,transparent)]",
        className,
      ].join(" ")}
      title={label ? `${label}: ${text}` : `${text} new`}
      aria-label={label ? `${label}: ${text}` : `${text} new`}
    >
      {text}
    </span>
  );
}

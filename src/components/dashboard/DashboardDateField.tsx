"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { useOptionalLanguage } from "@/lib/i18n/LanguageProvider";
import { useOverlayPresence } from "@/lib/dashboard/useOverlayPresence";

type Lang = "bn" | "en";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const BN_MONTHS_FULL = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];
const EN_MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const BN_MONTHS_SHORT = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const EN_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BN_WEEKDAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
const EN_WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const COPY = {
  bn: {
    placeholder: "তারিখ নির্বাচন করুন",
    today: "আজ",
    clear: "মুছুন",
    prev: "আগের মাস",
    next: "পরের মাস",
    dialog: "তারিখ বাছুন",
  },
  en: {
    placeholder: "Select a date",
    today: "Today",
    clear: "Clear",
    prev: "Previous month",
    next: "Next month",
    dialog: "Pick a date",
  },
} as const;

function toBnDigits(text: string): string {
  return text.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse a `YYYY-MM-DD` value into its calendar parts, rejecting rollovers. */
function parseIso(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const d = Number(match[3]);
  const probe = new Date(y, m, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== m || probe.getDate() !== d) return null;
  return { y, m, d };
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/** Order two `YYYY-MM-DD` strings; empty is lowest. */
function compareIso(a: string, b: string): number {
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface DashboardDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  /** Layout styling only — pass the same input class the sibling fields use. */
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  min?: string;
  max?: string;
  /** Override the active app language (used by previews); defaults to context. */
  language?: Lang;
}

/**
 * Dashboard date field — a fully themed, accessible alternative to the native
 * `<input type="date">`.
 *
 * The native control's *opened* calendar is drawn by the OS and cannot be
 * styled, so it broke the project's visual language (same reason DashboardSelect
 * replaced the native `<select>`). This renders the whole surface itself: a
 * trigger that matches the shared input style plus a white popover whose
 * calendar uses the dashboard's own tokens — dark-green Shikkha ink for the
 * structure and the selected day, mint for hover, the same border/radius/shadow
 * as every other dashboard popover.
 *
 * Presentation only: it is a controlled `value`/`onChange` pair emitting the
 * same `YYYY-MM-DD` string the native input produced, so callers keep their
 * existing state and handlers. Keyboard (Escape) and click-outside close the
 * popover; `min`/`max` bound the selectable days.
 */
export default function DashboardDateField({
  value,
  onChange,
  id,
  name,
  className,
  placeholder,
  ariaLabel,
  disabled,
  invalid,
  min,
  max,
  language,
}: DashboardDateFieldProps) {
  const contextLanguage = useOptionalLanguage().language as Lang;
  const lang: Lang = language ?? contextLanguage;
  const copy = COPY[lang];

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Keep the popover mounted through its exit keyframe (smooth close).
  const { mounted: popMounted, exiting: popExiting } = useOverlayPresence(open, 160);

  const selected = useMemo(() => parseIso(value), [value]);
  const now = useMemo(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
  }, []);
  const todayIso = toIso(now.y, now.m, now.d);

  const [view, setView] = useState<{ y: number; m: number }>(() => {
    const base = selected ?? now;
    return { y: base.y, m: base.m };
  });

  // Re-sync the visible month to the value (or today) whenever the popover opens.
  useEffect(() => {
    if (!open) return;
    const base = selected ?? now;
    setView({ y: base.y, m: base.m });
  }, [open, selected, now]);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isDisabledDay = (iso: string): boolean => {
    if (min && compareIso(iso, min) < 0) return true;
    if (max && compareIso(iso, max) > 0) return true;
    return false;
  };

  const select = (iso: string) => {
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  // 6x7 grid (Sunday-first) including the neighbouring months' fill days.
  const cells = useMemo(() => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay(); // 0 = Sunday
    const total = daysInMonth(view.y, view.m);
    const out: { iso: string; label: string; outside: boolean; isToday: boolean; selected: boolean }[] = [];

    const prev = view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 };
    const prevTotal = daysInMonth(prev.y, prev.m);
    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      const day = prevTotal - i;
      const iso = toIso(prev.y, prev.m, day);
      out.push({ iso, label: pad2(day), outside: true, isToday: iso === todayIso, selected: iso === value });
    }

    for (let day = 1; day <= total; day += 1) {
      const iso = toIso(view.y, view.m, day);
      out.push({ iso, label: pad2(day), outside: false, isToday: iso === todayIso, selected: iso === value });
    }

    const next = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };
    let trailing = 1;
    while (out.length < 42) {
      const iso = toIso(next.y, next.m, trailing);
      out.push({ iso, label: pad2(trailing), outside: true, isToday: iso === todayIso, selected: iso === value });
      trailing += 1;
    }
    return out;
  }, [view, value, todayIso]);

  const monthLabel = useMemo(() => {
    const name = (lang === "en" ? EN_MONTHS_FULL : BN_MONTHS_FULL)[view.m];
    const year = String(view.y);
    return lang === "en" ? `${name} ${year}` : `${name} ${toBnDigits(year)}`;
  }, [lang, view]);

  const display = useMemo(() => {
    if (!selected) return "";
    const name = (lang === "en" ? EN_MONTHS_SHORT : BN_MONTHS_SHORT)[selected.m];
    const text = `${pad2(selected.d)} ${name} ${selected.y}`;
    return lang === "en" ? text : toBnDigits(text);
  }, [lang, selected]);

  const weekdays = lang === "en" ? EN_WEEKDAYS : BN_WEEKDAYS;

  const moveMonth = (delta: number) => {
    setView((current) => {
      const next = current.m + delta;
      if (next < 0) return { y: current.y - 1, m: 11 };
      if (next > 11) return { y: current.y + 1, m: 0 };
      return { y: current.y, m: next };
    });
  };

  const navClass =
    "grid h-8 w-8 place-items-center rounded-xl text-[color-mix(in_srgb,var(--color-action)_72%,transparent)] transition hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        name={name}
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        data-no-translate="true"
        onClick={() => setOpen((current) => !current)}
        style={invalid ? { borderColor: "var(--color-danger)" } : undefined}
        className={`flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      >
        <span
          className={`truncate ${
            display
              ? "font-medium text-[var(--color-primary)]"
              : "text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
          }`}
        >
          {display || placeholder || copy.placeholder}
        </span>
        <FiCalendar
          aria-hidden
          size={15}
          className={`shrink-0 transition ${
            open ? "text-[var(--color-primary)]" : "text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
          }`}
        />
      </button>

      {popMounted ? (
        <div
          role="dialog"
          aria-label={`${copy.dialog} — ${monthLabel}`}
          aria-hidden={popExiting || undefined}
          data-no-translate="true"
          className={`absolute left-0 z-40 mt-1.5 w-80 max-w-[calc(100vw-2rem)] origin-top rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-3 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] ${
            popExiting ? "u-shk-pop-out pointer-events-none" : "u-shk-pop-in"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label={copy.prev} onClick={() => moveMonth(-1)} className={navClass}>
              <FiChevronLeft size={16} />
            </button>
            <p className="text-[13px] font-semibold text-[var(--color-primary)]">{monthLabel}</p>
            <button type="button" aria-label={copy.next} onClick={() => moveMonth(1)} className={navClass}>
              <FiChevronRight size={16} />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {weekdays.map((day) => (
              <span
                key={day}
                className="grid h-7 place-items-center text-[10.5px] font-semibold leading-none tracking-tight text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const disabledDay = isDisabledDay(cell.iso);
              const label = lang === "en" ? cell.label : toBnDigits(cell.label);
              let state: string;
              if (disabledDay) {
                state = "cursor-not-allowed text-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]";
              } else if (cell.selected) {
                state =
                  "bg-[var(--color-action)] font-semibold text-[var(--color-white)] shadow-[0_10px_22px_-12px_color-mix(in_srgb,var(--color-action)_85%,transparent)]";
              } else if (cell.isToday) {
                state =
                  "font-semibold text-[var(--color-primary)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_22%,transparent)]";
              } else if (cell.outside) {
                state =
                  "text-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,transparent)]";
              } else {
                state =
                  "font-medium text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_22%,transparent)]";
              }
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={disabledDay}
                  aria-pressed={cell.selected}
                  onClick={() => select(cell.iso)}
                  className={`grid h-9 w-full place-items-center rounded-xl text-[12.5px] outline-none transition disabled:opacity-35 ${state}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] hover:text-[var(--color-primary)]"
            >
              {copy.clear}
            </button>
            <button
              type="button"
              disabled={isDisabledDay(todayIso)}
              onClick={() => select(todayIso)}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-action)] transition hover:bg-[var(--color-action-tint)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copy.today}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

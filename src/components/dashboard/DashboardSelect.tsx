"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown } from "react-icons/fi";

import { useOverlayPresence } from "@/lib/dashboard/useOverlayPresence";

export interface DashboardSelectOption {
  value: string;
  label: string;
  /** Optional leading status dot (Frappe indicator colour name, e.g. "gray"). */
  color?: string;
  /** Optional leading avatar initial (1–2 chars) shown in a soft circle. */
  avatar?: string;
}

/** Frappe indicator colour names → CSS colours for the optional leading dot. */
const INDICATOR_COLORS: Record<string, string> = {
  black: "#111827",
  gray: "#8a94a6",
  grey: "#8a94a6",
  blue: "#2f9bff",
  green: "#22c55e",
  red: "#ef4444",
  pink: "#ec4899",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  purple: "#a855f7",
};

/** Leading dot (status colour) or avatar initial rendered before an option. */
function LeadingVisual({ option }: { option?: DashboardSelectOption }) {
  if (!option) return null;
  if (option.color) {
    return (
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: INDICATOR_COLORS[option.color] ?? option.color }}
      />
    );
  }
  if (option.avatar) {
    return (
      <span
        aria-hidden
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--color-action-tint)] text-[10px] font-semibold uppercase text-[var(--color-action)]"
      >
        {option.avatar.slice(0, 2)}
      </span>
    );
  }
  return null;
}

/**
 * Dashboard dropdown — a fully themed, accessible alternative to the native
 * `<select>` used inside the dashboard panels and forms.
 *
 * The native control's *opened* option list is drawn by the OS and cannot be
 * styled, so it broke the project's visual language. This renders the whole
 * surface itself: a rounded trigger that matches the shared input style, and a
 * white popover whose options use the same soft Shikkha-red hover surface as the
 * sidebar, menus and rows — hover = light red, selected = red mark + red text.
 *
 * Presentation only: a controlled value/onChange pair, so callers keep their
 * existing state and handlers. Keyboard (Arrow/Home/End/Enter/Escape) and
 * click-outside behaviour are built in; ARIA follows the listbox pattern.
 *
 * `portal` renders the option list into document.body with fixed positioning so
 * a parent scroll container (e.g. the journal-entry accounts table, which uses
 * `overflow-x-auto`) can neither clip the menu nor grow a scrollbar when it
 * opens. Off by default, so other pages are unaffected.
 */
export default function DashboardSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  disabled,
  invalid,
  portal,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DashboardSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Render the menu in a body portal (fixed) so a parent overflow container
   *  can't clip it or show a scrollbar. */
  portal?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  // Keep the option list mounted through its exit keyframe (smooth close).
  const { mounted: popMounted, exiting: popExiting } = useOverlayPresence(open, 150);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current && rootRef.current.contains(target)) return;
      if (listRef.current && listRef.current.contains(target)) return; // portalled menu
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // Fixed-position coordinates for the portalled menu; re-measured on scroll
  // and resize so it tracks the trigger while the page/table moves.
  useLayoutEffect(() => {
    if (!portal || !open) return;
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const estimate = Math.min(240, options.length * 44 + 12);
      const spaceBelow = window.innerHeight - r.bottom;
      const flipUp = spaceBelow < estimate && r.top > spaceBelow;
      const top = flipUp ? Math.max(8, r.top - estimate - 6) : r.bottom + 6;
      setCoords({ top, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [portal, open, options.length]);

  const openAtSelected = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openAtSelected();
        return;
      }
      setActive((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return Math.min(options.length - 1, Math.max(0, next));
      });
    } else if (event.key === "Home") {
      if (open) {
        event.preventDefault();
        setActive(0);
      }
    } else if (event.key === "End") {
      if (open) {
        event.preventDefault();
        setActive(options.length - 1);
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) commit(active);
      else openAtSelected();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const border = invalid
    ? "border-[var(--color-danger)]"
    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";

  const listbox = (
    <ul
      ref={listRef}
      id={`${baseId}-list`}
      role="listbox"
      aria-label={ariaLabel}
      aria-hidden={popExiting || undefined}
      style={
        portal && coords
          ? { position: "fixed", top: coords.top, left: coords.left, width: coords.width }
          : undefined
      }
      className={`${portal ? "fixed z-[80]" : "absolute left-0 right-0 z-30 mt-1.5"} max-h-60 origin-top overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-1.5 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] ${
        popExiting ? "u-shk-pop-out pointer-events-none" : "u-shk-pop-in"
      }`}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isActive = index === active;
        return (
          <li key={option.value} role="option" aria-selected={isSelected}>
            <button
              type="button"
              onMouseEnter={() => setActive(index)}
              onClick={() => commit(index)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                isActive ? "bg-[var(--color-action-tint)]" : "hover:bg-[var(--color-action-tint)]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <LeadingVisual option={option} />
                <span
                  className={`min-w-0 truncate text-[13px] ${
                    isSelected
                      ? "font-semibold text-[var(--color-action)]"
                      : "font-medium text-[var(--color-primary)]"
                  }`}
                >
                  {option.label}
                </span>
              </span>
              {isSelected ? (
                <FiCheck aria-hidden size={15} className="shrink-0 text-[var(--color-action)]" />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-list` : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAtSelected())}
        onKeyDown={onKeyDown}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-2xl border ${border} bg-[var(--color-white)] px-3 text-left outline-none transition hover:border-[var(--color-action)] focus-visible:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <LeadingVisual option={selected} />
          <span
            className={`truncate text-[13px] ${
              selected ? "font-medium text-[var(--color-primary)]" : "text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
            }`}
          >
            {selected?.label ?? placeholder ?? ""}
          </span>
        </span>
        <FiChevronDown
          aria-hidden
          size={16}
          className={`shrink-0 text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {popMounted
        ? portal
          ? typeof document !== "undefined" && coords
            ? createPortal(listbox, document.body)
            : null
          : listbox
        : null}
    </div>
  );
}

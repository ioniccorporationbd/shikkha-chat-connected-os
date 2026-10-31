"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLock } from "react-icons/fi";

export type StepSelectOption = {
  value: string;
  label: string;
  /** Optional secondary line (e.g. an ERP-side hint). */
  hint?: string;
};

/**
 * Step dropdown in the homepage "Service Pill" language.
 *
 * The homepage rail opens a catalog category as a rounded-2xl pill row whose
 * chevron rotates and whose panel grows on a 500ms cubic-bezier(0.22,1,0.36,1)
 * — this control reproduces that exact motion language for the New Ticket
 * form's Category / Priority / Department selects:
 *
 *   • rounded-2xl trigger with a rotating chevron (same easing/duration)
 *   • panel expands with the same `grid-rows-[0fr] → [1fr]` + opacity trick
 *   • rows use the rail row hover tint (`--color-action` colour-mix)
 *   • no search box — the rail pill opens straight to its rows
 *   • keyboard nav, focus rings, outside-click close, disabled state
 *
 * It is a plain controlled listbox — the caller owns the value.
 */
export default function StepSelect({
  label,
  placeholder,
  noMatchLabel,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
  lockedHint,
  error,
  tone = "primary",
}: {
  label: string;
  placeholder: string;
  noMatchLabel?: string;
  options: StepSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  lockedHint?: string;
  error?: string;
  /** `action` paints the trigger red once the step is answered. */
  tone?: "primary" | "action";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const listId = `${baseId}-list`;

  const selected = useMemo(() => options.find((item) => item.value === value) ?? null, [options, value]);
  const filtered = options;

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Opening highlights the current selection so Enter/Arrow starts from there.
  const openPanel = useCallback(() => {
    const index = options.findIndex((item) => item.value === value);
    setActive(index >= 0 ? index : 0);
    setOpen(true);
  }, [options, value]);

  // Close on outside click / Escape. Kept separate from the trigger handler so
  // a click inside the panel never closes it before the row's onClick fires.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  // Focus the option list when the panel opens (mouse or keyboard).
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => listRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [open]);

  const commit = (next: string) => {
    onChange(next);
    close();
    // Return focus to the trigger so the next step is reachable by keyboard.
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPanel();
    }
  };

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length === 0) return;
      setActive((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + filtered.length) % filtered.length;
      });
      return;
    }
    if (event.key === "Enter") {
      const option = filtered[active];
      if (option) {
        event.preventDefault();
        commit(option.value);
      }
    }
  };

  const answered = Boolean(selected);
  const locked = disabled && !loading;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="listbox"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          if (open) close();
          else openPanel();
        }}
        onKeyDown={onTriggerKeyDown}
        className={[
          "group flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]",
          loading
            ? "cursor-progress border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
            : locked
              ? "cursor-not-allowed border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))]"
              : answered && tone === "action"
                ? "border-[var(--color-action)] bg-[color-mix(in_srgb,var(--color-action)_6%,var(--color-white))] hover:border-[var(--color-action-hover)]"
                : answered
                  ? "border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] hover:border-[var(--color-primary)]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[var(--color-white)] hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]",
          error ? "border-[var(--color-danger)]" : "",
        ].join(" ")}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_50%,var(--color-white))]">
            {label}
          </span>
          <span
            className={[
              "mt-0.5 block truncate text-sm font-semibold",
              selected
                ? "text-[var(--color-primary)]"
                : locked
                  ? "text-[color-mix(in_srgb,var(--color-primary)_42%,var(--color-white))]"
                  : "text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]",
            ].join(" ")}
          >
            {loading ? "…" : selected ? selected.label : locked ? (lockedHint ?? placeholder) : placeholder}
          </span>
        </span>

        {locked ? (
          <FiLock className="h-4 w-4 flex-none text-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-white))]" aria-hidden />
        ) : answered ? (
          <FiCheck className="h-4 w-4 flex-none text-[var(--color-primary)]" aria-hidden />
        ) : null}

        <FiChevronDown
          aria-hidden
          className={[
            "h-4 w-4 flex-none text-[var(--color-primary)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      <div
        id={panelId}
        className={[
          "grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0">
          <div
            onKeyDown={onPanelKeyDown}
            className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[var(--color-white)] shadow-[0_24px_48px_-28px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
          >
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={label}
              tabIndex={-1}
              className="max-h-60 overflow-y-auto p-1.5 outline-none"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
                  {noMatchLabel ?? placeholder}
                </li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === active;
                  return (
                    <li key={option.value} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => commit(option.value)}
                        onMouseEnter={() => setActive(index)}
                        className={[
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition duration-200",
                          isSelected
                            ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                            : isActive
                              ? "bg-[var(--color-action-tint)] text-[var(--color-primary)]"
                              : "text-[var(--color-primary)] hover:bg-[var(--color-action-tint)]",
                        ].join(" ")}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{option.label}</span>
                          {option.hint ? (
                            <span
                              className={[
                                "mt-0.5 block truncate text-[11px]",
                                isSelected
                                  ? "text-[color-mix(in_srgb,var(--color-white)_78%,transparent)]"
                                  : "text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]",
                              ].join(" ")}
                            >
                              {option.hint}
                            </span>
                          ) : null}
                        </span>
                        {isSelected ? <FiCheck className="h-4 w-4 flex-none" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  );
}

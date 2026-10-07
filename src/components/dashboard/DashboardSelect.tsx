"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

export interface DashboardSelectOption {
  value: string;
  label: string;
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
 */
export default function DashboardSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  disabled,
  invalid,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DashboardSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.children[active] as HTMLElement | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

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
        <span
          className={`truncate text-[13px] ${
            selected ? "font-medium text-[var(--color-primary)]" : "text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
          }`}
        >
          {selected?.label ?? placeholder ?? ""}
        </span>
        <FiChevronDown
          aria-hidden
          size={16}
          className={`shrink-0 text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={`${baseId}-list`}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 z-30 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-1.5 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
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
                  <span
                    className={`min-w-0 truncate text-[13px] ${
                      isSelected
                        ? "font-semibold text-[var(--color-action)]"
                        : "font-medium text-[var(--color-primary)]"
                    }`}
                  >
                    {option.label}
                  </span>
                  {isSelected ? (
                    <FiCheck aria-hidden size={15} className="shrink-0 text-[var(--color-action)]" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

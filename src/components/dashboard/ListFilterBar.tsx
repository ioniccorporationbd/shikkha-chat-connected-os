"use client";

import { FiFilter, FiRotateCcw, FiSliders } from "react-icons/fi";

import type { AmountFilter, ListFilterCopy } from "@/lib/dashboard/list-controls";

const INPUT =
  "h-9 w-full rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-2.5 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)]";
const LABEL =
  "text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]";

/**
 * Compact, ERPNext/Frappe DocType-list-style filter toolbar shared by the
 * dashboard list panels. One bordered strip of compact controls (status, amount
 * exact/min/max, posting-date from/to) with Apply + Reset — dense, wrapped, and
 * theme-aligned. Purely controlled: the caller owns the filter state + handlers.
 */
export default function ListFilterBar({
  copy,
  statusValue,
  statusOptions,
  onStatusChange,
  amount,
  onAmountChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  onReset,
  error,
}: {
  copy: ListFilterCopy;
  statusValue: string;
  statusOptions: { value: string; label: string }[];
  onStatusChange: (value: string) => void;
  amount: AmountFilter;
  onAmountChange: (field: keyof AmountFilter, value: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  error?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-3 shadow-[0_10px_26px_-20px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
      <div className="flex flex-wrap items-end gap-2.5">
        <span
          className="mb-1 inline-flex items-center gap-1.5 self-center text-[var(--color-primary)]"
          title={copy.filterHint}
        >
          <FiSliders size={15} aria-hidden />
          <span className="hidden text-[11.5px] font-semibold sm:inline">{copy.filterHeading}</span>
        </span>

        <label className="flex min-w-[128px] flex-1 flex-col gap-1 sm:flex-none">
          <span className={LABEL}>{copy.filterStatusLabel}</span>
          <select
            value={statusValue}
            onChange={(event) => onStatusChange(event.target.value)}
            aria-label={copy.filterStatusLabel}
            className={INPUT}
          >
            <option value="all">{copy.filterStatusAll}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[128px] flex-1 flex-col gap-1 sm:flex-none">
          <span className={LABEL}>{copy.filterAmountLabel}</span>
          <select
            value={amount.mode}
            onChange={(event) => onAmountChange("mode", event.target.value)}
            aria-label={copy.filterAmountLabel}
            className={INPUT}
          >
            <option value="any">{copy.filterAmountAny}</option>
            <option value="exact">{copy.filterAmountExact}</option>
            <option value="range">{copy.filterAmountRange}</option>
          </select>
        </label>

        {amount.mode === "exact" ? (
          <label className="flex min-w-[110px] flex-1 flex-col gap-1 sm:flex-none">
            <span className={LABEL}>{copy.filterAmountExact}</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={amount.exact}
              onChange={(event) => onAmountChange("exact", event.target.value)}
              placeholder={copy.filterAmountExactPlaceholder}
              aria-label={copy.filterAmountExact}
              className={INPUT}
            />
          </label>
        ) : null}

        {amount.mode === "range" ? (
          <>
            <label className="flex min-w-[96px] flex-1 flex-col gap-1 sm:flex-none">
              <span className={LABEL}>{copy.filterMinPlaceholder}</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={amount.min}
                onChange={(event) => onAmountChange("min", event.target.value)}
                placeholder={copy.filterMinPlaceholder}
                aria-label={copy.filterMinPlaceholder}
                className={INPUT}
              />
            </label>
            <label className="flex min-w-[96px] flex-1 flex-col gap-1 sm:flex-none">
              <span className={LABEL}>{copy.filterMaxPlaceholder}</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={amount.max}
                onChange={(event) => onAmountChange("max", event.target.value)}
                placeholder={copy.filterMaxPlaceholder}
                aria-label={copy.filterMaxPlaceholder}
                className={INPUT}
              />
            </label>
          </>
        ) : null}

        <label className="flex min-w-[132px] flex-1 flex-col gap-1 sm:flex-none">
          <span className={LABEL}>{copy.filterFromLabel}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            aria-label={copy.filterFromLabel}
            className={INPUT}
          />
        </label>

        <label className="flex min-w-[132px] flex-1 flex-col gap-1 sm:flex-none">
          <span className={LABEL}>{copy.filterToLabel}</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            aria-label={copy.filterToLabel}
            className={INPUT}
          />
        </label>

        <div className="flex items-center gap-2 self-end">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 transition hover:opacity-90"
          >
            <FiFilter size={14} className="text-[var(--color-white)]" aria-hidden />
            <span className="text-[12.5px] font-semibold text-[var(--color-white)]">{copy.filterApply}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3 transition hover:border-[var(--color-primary)]"
          >
            <FiRotateCcw size={14} className="text-[var(--color-primary)]" aria-hidden />
            <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.filterClear}</span>
          </button>
        </div>
      </div>

      {error ? <p className="mt-2 text-[12px] font-medium text-[var(--color-danger-strong)]">{error}</p> : null}
    </div>
  );
}

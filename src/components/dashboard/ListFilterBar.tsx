"use client";

import { FiFilter, FiRotateCcw, FiSearch, FiSliders, FiX } from "react-icons/fi";

import type { AmountFilter, ListFilterCopy } from "@/lib/dashboard/list-controls";

import DashboardSelect from "./DashboardSelect";

const INPUT =
  "h-10 w-full rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 text-[13px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const LABEL =
  "text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";

/**
 * Premium, ERPNext/Frappe DocType-list-style filter card shared by the dashboard
 * list panels (Service Build, Payment Entry). A titled surface with a prominent
 * search field, status, amount (exact/min/max) and posting-date from/to, plus
 * Apply + Reset — roomy spacing, no squeezed controls. Purely controlled: the
 * caller owns the filter state + handlers.
 */
export default function ListFilterBar({
  copy,
  search,
  onSearchChange,
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
  search: string;
  onSearchChange: (value: string) => void;
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
    <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_20px_44px_-34px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]">
          <FiSliders size={15} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13.5px] font-semibold">{copy.filterHeading}</h2>
          <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.filterHint}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-4">
          <span className={LABEL}>{copy.filterSearchLabel}</span>
          <span className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
              <FiSearch size={15} aria-hidden />
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.filterSearchPlaceholder}
              aria-label={copy.filterSearchLabel}
              className={`${INPUT} pr-9 pl-9`}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={copy.filterClear}
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-[var(--color-primary)]"
              >
                <FiX size={14} aria-hidden />
              </button>
            ) : null}
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>{copy.filterStatusLabel}</span>
          <DashboardSelect
            value={statusValue}
            onChange={onStatusChange}
            ariaLabel={copy.filterStatusLabel}
            options={[
              { value: "all", label: copy.filterStatusAll },
              ...statusOptions.map((option) => ({ value: option.value, label: option.label })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>{copy.filterAmountLabel}</span>
          <DashboardSelect
            value={amount.mode}
            onChange={(value) => onAmountChange("mode", value)}
            ariaLabel={copy.filterAmountLabel}
            options={[
              { value: "any", label: copy.filterAmountAny },
              { value: "exact", label: copy.filterAmountExact },
              { value: "range", label: copy.filterAmountRange },
            ]}
          />
        </div>

        {amount.mode === "exact" ? (
          <label className="flex flex-col gap-1.5">
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
            <label className="flex flex-col gap-1.5">
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
            <label className="flex flex-col gap-1.5">
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

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{copy.filterFromLabel}</span>
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            aria-label={copy.filterFromLabel}
            className={INPUT}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>{copy.filterToLabel}</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            aria-label={copy.filterToLabel}
            className={INPUT}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-4 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
        >
          <span className="text-[var(--color-primary)]">
            <FiRotateCcw size={15} aria-hidden />
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.filterClear}</span>
        </button>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-action)] px-5 shadow-[0_14px_28px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-action)_28%,transparent)] focus:outline-none"
        >
          <span className="text-[var(--color-white)]">
            <FiFilter size={15} aria-hidden />
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.filterApply}</span>
        </button>
      </div>

      {error ? <p className="mt-3 text-[12px] font-medium text-[var(--color-danger-strong)]">{error}</p> : null}
    </div>
  );
}

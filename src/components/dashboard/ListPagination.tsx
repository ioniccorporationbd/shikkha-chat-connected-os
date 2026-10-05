"use client";

import { FiChevronDown, FiChevronLeft, FiChevronRight, FiHash } from "react-icons/fi";

import {
  ROWS_PER_PAGE_OPTIONS,
  pageWindow,
  type ListPaginationCopy,
} from "@/lib/dashboard/list-controls";

const CONTROL =
  "grid h-9 min-w-9 place-items-center rounded-xl border px-2 text-[12.5px] font-semibold tabular-nums transition";

/**
 * Premium, ERPNext/Frappe-style pagination footer shared by the dashboard list
 * panels. One horizontal toolbar: the Total Records chip, a "Show [n ▾] per
 * page" dropdown, the current range, then compact ‹ prev / page numbers / next ›
 * with a clear active + disabled state. Windowed page numbers keep large page
 * counts tidy (1 2 3 … 12). Pure presentational — the caller owns page state.
 */
export default function ListPagination({
  copy,
  rowsPerPage,
  onRowsPerPageChange,
  page,
  pageCount,
  onPageChange,
  rangeStart,
  rangeEnd,
  total,
}: {
  copy: ListPaginationCopy;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  rangeStart: number;
  rangeEnd: number;
  total: number;
}) {
  const pages = pageWindow(page, pageCount);

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-3 py-3 shadow-[0_20px_44px_-34px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span className="inline-flex items-center gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-3 py-1.5">
          <span className="text-[var(--color-primary)]">
            <FiHash size={14} aria-hidden />
          </span>
          <span className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.totalRecordsLabel}
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[var(--color-primary)]">{total}</span>
        </span>

        <label className="inline-flex items-center gap-2">
          <span className="text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.rowsPerPageShow}
          </span>
          <span className="relative inline-block">
            <select
              value={rowsPerPage}
              onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
              aria-label={copy.rowsPerPageShow}
              className="h-9 appearance-none rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] pr-8 pl-3 text-[12.5px] font-semibold text-[var(--color-primary)] outline-none transition hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
              <FiChevronDown size={14} aria-hidden />
            </span>
          </span>
          <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.rowsPerPageSuffix}
          </span>
        </label>

        {total > 0 ? (
          <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {rangeStart}–{rangeEnd} {copy.ofLabel} {total}
          </span>
        ) : null}
      </div>

      <nav aria-label={copy.pageLabel} className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={copy.pagePrev}
          className={`${CONTROL} border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]`}
        >
          <span className="text-[var(--color-primary)]">
            <FiChevronLeft size={16} aria-hidden />
          </span>
        </button>

        {pages.map((value, index) =>
          value === null ? (
            <span
              key={`gap-${index}`}
              className="grid h-9 min-w-6 place-items-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
            >
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              onClick={() => onPageChange(value)}
              aria-label={`${copy.pageLabel} ${value}`}
              aria-current={value === page ? "page" : undefined}
              className={`${CONTROL} ${
                value === page
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_12px_24px_-14px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
              }`}
            >
              <span
                className={
                  value === page
                    ? "text-[var(--color-white)]"
                    : "text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]"
                }
              >
                {value}
              </span>
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={copy.pageNext}
          className={`${CONTROL} border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]`}
        >
          <span className="text-[var(--color-primary)]">
            <FiChevronRight size={16} aria-hidden />
          </span>
        </button>
      </nav>
    </div>
  );
}

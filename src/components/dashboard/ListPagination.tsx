"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import {
  ROWS_PER_PAGE_OPTIONS,
  pageWindow,
  type ListPaginationCopy,
} from "@/lib/dashboard/list-controls";

const BTN =
  "grid h-8 min-w-8 place-items-center rounded-lg border px-1 text-[12.5px] font-semibold tabular-nums transition";
const ACTIVE = "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]";
const IDLE =
  "border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)] hover:border-[var(--color-primary)]";

/**
 * ERPNext/Frappe DocType-list-style pagination footer shared by the dashboard
 * panels: records-per-page selector (20/100/500), a "start–end of total" range,
 * numbered pages with ellipsis on desktop and a compact "Page x of y" on mobile,
 * plus Previous/Next. Purely controlled.
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
    <div className="flex flex-col gap-2.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="inline-flex items-center gap-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          <span>{copy.rowsPerPageShow}</span>
          <select
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
            aria-label={copy.rowsPerPageShow}
            className="rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-2 py-1 text-[12.5px] font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span>{copy.rowsPerPageSuffix}</span>
        </label>
        <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
          {copy.paginationRangeLabel} {rangeStart}–{rangeEnd} {copy.ofLabel} {total}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label={copy.pagePrev}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
        >
          <FiChevronLeft size={15} className="text-[var(--color-primary)]" aria-hidden />
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((item, index) =>
            item === null ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`${copy.pageLabel} ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={`${BTN} ${item === page ? ACTIVE : IDLE}`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="px-1 text-[12.5px] font-semibold tabular-nums text-[var(--color-primary)] sm:hidden">
          {copy.pageLabel} {page} {copy.pageOf} {pageCount}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label={copy.pageNext}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
        >
          <FiChevronRight size={15} className="text-[var(--color-primary)]" aria-hidden />
        </button>
      </div>
    </div>
  );
}

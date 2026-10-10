/**
 * Shared, ERPNext-style list controls for the dashboard list panels
 * (Payment History, Service Build, …).
 *
 * Framework-free so the filter toolbar and the pagination footer read the SAME
 * option set + page-window maths — the two panels can never drift, and neither
 * duplicates the other's pagination/filter logic.
 */

/**
 * Page-size choices offered to the user as side-by-side buttons under every
 * list table (never a dropdown). Tables start at DEFAULT_ROWS_PER_PAGE (10)
 * rows and the buttons let the user widen the view to 20/50/100/500/1000.
 */
export const ROWS_PER_PAGE_OPTIONS = [20, 50, 100, 500, 1000] as const;
export const DEFAULT_ROWS_PER_PAGE = 10;
export type RowsPerPage = (typeof ROWS_PER_PAGE_OPTIONS)[number];

export type AmountMode = "any" | "exact" | "range";

export interface AmountFilter {
  mode: AmountMode;
  exact: string;
  min: string;
  max: string;
}

export const EMPTY_AMOUNT: AmountFilter = { mode: "any", exact: "", min: "", max: "" };

export interface AppliedFilters {
  amount: AmountFilter;
  fromDate: string;
  toDate: string;
  /** Free-text search over the already-loaded rows (client-side only). */
  search: string;
}

export const EMPTY_APPLIED: AppliedFilters = {
  amount: EMPTY_AMOUNT,
  fromDate: "",
  toDate: "",
  search: "",
};

/**
 * Case-insensitive "does any of these fields contain the query" test.
 *
 * Pure and framework-free so both panels share one search semantics. An empty /
 * whitespace-only query always matches (search is a no-op until the user types).
 * Only ever run against rows the backend already returned — it never widens the
 * server-side scope.
 */
export function matchesQuery(
  fields: (string | number | null | undefined)[],
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => String(field ?? "").toLowerCase().includes(needle));
}

/** Labels the shared filter toolbar needs (structurally met by each panel copy). */
export interface ListFilterCopy {
  filterHeading: string;
  filterHint: string;
  filterSearchLabel: string;
  filterSearchPlaceholder: string;
  filterStatusLabel: string;
  filterStatusAll: string;
  filterAmountLabel: string;
  filterAmountAny: string;
  filterAmountExact: string;
  filterAmountRange: string;
  filterAmountExactPlaceholder: string;
  filterMinPlaceholder: string;
  filterMaxPlaceholder: string;
  filterFromLabel: string;
  filterToLabel: string;
  filterApply: string;
  filterClear: string;
}

/** Labels the shared pagination footer needs. */
export interface ListPaginationCopy {
  totalRecordsLabel: string;
  rowsPerPageShow: string;
  rowsPerPageSuffix: string;
  pagePrev: string;
  pageNext: string;
  pageLabel: string;
  pageOf: string;
  paginationRangeLabel: string;
  ofLabel: string;
}

/**
 * Generic pagination labels for tables that don't ship their own copy object
 * (customer management, expense claims, …). Mirrors the payment-entry wording so
 * every table's footer reads identically in both languages.
 */
const GENERIC_PAGINATION_COPY: Record<"bn" | "en", ListPaginationCopy> = {
  bn: {
    totalRecordsLabel: "মোট রেকর্ড",
    rowsPerPageShow: "দেখান",
    rowsPerPageSuffix: "টি",
    pagePrev: "আগের",
    pageNext: "পরের",
    pageLabel: "পৃষ্ঠা",
    pageOf: "/",
    paginationRangeLabel: "দেখানো হচ্ছে",
    ofLabel: "মোট",
  },
  en: {
    totalRecordsLabel: "Total Records",
    rowsPerPageShow: "Show",
    rowsPerPageSuffix: "rows",
    pagePrev: "Prev",
    pageNext: "Next",
    pageLabel: "Page",
    pageOf: "of",
    paginationRangeLabel: "Showing",
    ofLabel: "of",
  },
};

export function genericPaginationCopy(language: string): ListPaginationCopy {
  return language === "en" ? GENERIC_PAGINATION_COPY.en : GENERIC_PAGINATION_COPY.bn;
}

/**
 * Windowed page numbers for ERPNext-style pagination: always shows first/last,
 * the current page ±1, and `null` for an ellipsis gap. Small counts show every
 * page.
 */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items: (number | null)[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) items.push(null);
  for (let page = left; page <= right; page += 1) items.push(page);
  if (right < total - 1) items.push(null);
  items.push(total);
  return items;
}

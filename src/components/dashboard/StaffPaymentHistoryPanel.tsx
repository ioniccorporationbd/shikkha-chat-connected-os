"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCreditCard, FiHash, FiLayers, FiPlusCircle, FiRotateCcw } from "react-icons/fi";

import ListFilterBar from "./ListFilterBar";
import ListPagination from "./ListPagination";

import {
  DEFAULT_ROWS_PER_PAGE,
  EMPTY_AMOUNT,
  EMPTY_APPLIED,
  ROWS_PER_PAGE_OPTIONS,
  matchesQuery,
  type AmountFilter,
  type AppliedFilters,
} from "@/lib/dashboard/list-controls";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { reportClientError } from "@/lib/log/report-error";
import { formatAmount, formatDate } from "@/lib/payment-entry/format";
import { manualPaymentCopyFor } from "@/lib/payment-entry/manual-payment/messages";
import { paymentEntryCopyFor, type PaymentEntryCopy } from "@/lib/payment-entry/messages";
import { statusTone } from "@/lib/payment-entry/status";
import type { PaymentEntryRow, PaymentEntrySummary } from "@/lib/payment-entry/types";
import { fetchStaffPaymentEntries } from "@/lib/staff-payment/api";

/**
 * Right-side pane for the STAFF Payment Entry page.
 *
 * Replicates the customer dashboard Payment Entry page
 * (`/clientDashboard/payment-entry`): a page header with a "Make Payment" action,
 * a summary + status-breakdown chart synced to the filters, the ERPNext-style
 * {@link ListFilterBar}, and the same "পেমেন্ট তালিকা" table + {@link ListPagination}.
 *
 * The only difference from the customer page is scope: every row is a Payment
 * Entry created by the signed-in employee (`owner`-scoped) via
 * `GET /api/payment-entry/list` (core `frappe.client.get_list`).
 *
 * `onMakePayment` opens the create form (rendered by the parent as a modal), and
 * `refreshToken` lets the parent force a reload after a successful Draft.
 */
export default function StaffPaymentHistoryPanel({
  refreshToken = 0,
  canCreate = false,
  onMakePayment,
  onBack,
}: {
  refreshToken?: number;
  canCreate?: boolean;
  onMakePayment?: () => void;
  onBack?: () => void;
}) {
  const { language } = useLanguage();
  const copy = paymentEntryCopyFor(language);
  const mpCopy = manualPaymentCopyFor(language);

  const [rows, setRows] = useState<PaymentEntryRow[]>([]);
  const [summary, setSummary] = useState<PaymentEntrySummary | null>(null);
  const [currency, setCurrency] = useState("BDT");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ---- Filters (identical state machine to the client payment list) ----
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [amountDraft, setAmountDraft] = useState<AmountFilter>(EMPTY_AMOUNT);
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_APPLIED);
  const [filterError, setFilterError] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await fetchStaffPaymentEntries(language);
      const entries = (result.entries ?? []).filter((row) => Boolean(row?.name));
      setRows(entries);
      setSummary(result.summary ?? null);
      setCurrency(result.summary?.currency || "BDT");
    } catch (error) {
      const err = error as { code?: string; message?: string; detail?: unknown };
      console.error("[payment-entry:list] history load failed", {
        code: err?.code ?? null,
        message: err?.message ?? null,
      });
      reportClientError({
        scope: "payment-entry:list",
        message: err?.message || "Payment history load failed",
        detail: error,
      });
      setLoadError(err?.message || copy.loadFailed);
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load, refreshToken]);

  // Status options derived from the real rows only — never hardcoded.
  const statusOptions = useMemo(() => {
    const order = ["submitted", "reconciled", "received", "paid", "draft", "cancelled"];
    const seen = new Set<string>();
    for (const row of rows) {
      const raw = String(row.display_status || "").trim();
      if (raw) seen.add(raw.toLowerCase());
    }
    const known = order.filter((key) => seen.has(key));
    const extra = [...seen].filter((key) => !order.includes(key));
    return [...known, ...extra].map((key) => ({
      value: key,
      label: copy.statuses[key as keyof typeof copy.statuses] || key,
    }));
  }, [rows, copy]);

  const filtered = useMemo(() => {
    const { amount, fromDate, toDate, search } = applied;
    return rows.filter((row) => {
      if (statusFilter !== "all" && String(row.display_status || "").trim().toLowerCase() !== statusFilter) {
        return false;
      }
      const value = Number(row.amount) || 0;
      if (amount.mode === "exact" && amount.exact !== "") {
        if (Math.abs(value - Number(amount.exact)) > 0.005) return false;
      }
      if (amount.mode === "range") {
        if (amount.min !== "" && value < Number(amount.min)) return false;
        if (amount.max !== "" && value > Number(amount.max)) return false;
      }
      const posting = String(row.posting_date || "");
      if (fromDate && posting < fromDate) return false;
      if (toDate && posting > toDate) return false;
      if (
        !matchesQuery(
          [row.name, row.mode_of_payment, row.party_name, row.reference_no],
          search,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [rows, statusFilter, applied]);

  // Status breakdown for the chart — always derived from the filtered set.
  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filtered) {
      const key = String(row.display_status || "").trim().toLowerCase() || "unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return statusOptions
      .map((option) => ({
        key: option.value,
        label: option.label,
        count: counts.get(option.value) || 0,
      }))
      .filter((segment) => segment.count > 0);
  }, [filtered, statusOptions]);

  const totals = useMemo(() => {
    const totalRecords = summary?.total ?? rows.length;
    const filteredAmount = filtered.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const average = filtered.length > 0 ? filteredAmount / filtered.length : 0;
    const statusOf = (row: PaymentEntryRow) => String(row.display_status || "").trim().toLowerCase();
    const sumOf = (key: string) =>
      filtered
        .filter((row) => statusOf(row) === key)
        .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const settledAmount = sumOf("submitted");
    const dueAmount = sumOf("draft");
    return { totalRecords, filteredAmount, average, settledAmount, dueAmount };
  }, [summary, rows, filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageRows = useMemo(
    () => filtered.slice(pageStart, pageStart + rowsPerPage),
    [filtered, pageStart, rowsPerPage],
  );

  const onAmountChange = useCallback((field: keyof AmountFilter, value: string) => {
    setAmountDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    if (amountDraft.mode === "exact" && amountDraft.exact !== "") {
      const value = Number(amountDraft.exact);
      if (!Number.isFinite(value) || value < 0) {
        setFilterError(copy.filterInvalidAmount);
        return;
      }
    }
    if (amountDraft.mode === "range") {
      const min = amountDraft.min === "" ? null : Number(amountDraft.min);
      const max = amountDraft.max === "" ? null : Number(amountDraft.max);
      if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
        setFilterError(copy.filterInvalidAmount);
        return;
      }
      if (min !== null && max !== null && min > max) {
        setFilterError(copy.filterInvalidAmountRange);
        return;
      }
    }
    if (fromDraft && toDraft && fromDraft > toDraft) {
      setFilterError(copy.filterInvalidDateRange);
      return;
    }
    setFilterError("");
    setApplied({ amount: { ...amountDraft }, fromDate: fromDraft, toDate: toDraft, search: searchDraft });
    setPage(1);
  }, [amountDraft, fromDraft, toDraft, searchDraft, copy]);

  const resetFilters = useCallback(() => {
    setStatusFilter("all");
    setAmountDraft(EMPTY_AMOUNT);
    setFromDraft("");
    setToDraft("");
    setSearchDraft("");
    setApplied(EMPTY_APPLIED);
    setFilterError("");
    setRowsPerPage(DEFAULT_ROWS_PER_PAGE);
    setPage(1);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      {/* ---- Page header (mirrors the customer payment page) ---- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
            <FiCreditCard size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold">{copy.heading}</h1>
            <p className="mt-0.5 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {copy.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onMakePayment ? (
            <button
              type="button"
              onClick={onMakePayment}
              disabled={!canCreate}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--color-action)] px-3.5 py-2 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-white)]">
                <FiPlusCircle size={15} />
                {mpCopy.makePayment}
              </span>
            </button>
          ) : null}
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
            >
              <span className="text-[var(--color-primary)]">
                <FiArrowLeft size={15} />
              </span>
              <span className="text-[12.5px] font-semibold">{copy.back}</span>
            </button>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-5 py-16 text-center">
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{copy.loading}</p>
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger-strong)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-danger-strong)_8%,var(--color-white))] px-4 py-3">
          <p className="text-[12.5px] font-medium text-[var(--color-danger-strong)]">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
          >
            <FiRotateCcw size={13} /> {copy.retry}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
            <FiHash size={22} />
          </span>
          <h2 className="text-[16px] font-semibold">{copy.emptyTitle}</h2>
          <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {copy.emptyHint}
          </p>
        </div>
      ) : (
        <>
          {/* ---- Summary + chart (synced to filters) ---- */}
          <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-primary)]">
                <FiLayers size={16} />
              </span>
              <h2 className="text-[14px] font-semibold">{copy.chartHeading}</h2>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                {copy.chartHint}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
              <Stat label={copy.chartTotal} value={String(totals.totalRecords)} tone="blue" />
              <Stat
                label={copy.chartShowing}
                value={formatAmount(totals.filteredAmount, currency, language)}
                tone="violet"
              />
              <Stat
                label={copy.chartFilteredAmount}
                value={formatAmount(totals.settledAmount, currency, language)}
                tone="green"
              />
              <Stat
                label={copy.chartAvg}
                value={formatAmount(totals.dueAmount, currency, language)}
                tone="red"
              />
              <Stat label={copy.summaryMonth} value={String(summary?.this_month_count ?? 0)} tone="blue" />
              <Stat
                label={copy.summaryLatest}
                value={
                  summary?.latest_payment_date
                    ? formatDate(summary.latest_payment_date, language)
                    : copy.summaryNone
                }
                tone="violet"
              />
            </div>

            <div className="mt-5 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {copy.chartStatusBreakdown}
              </p>
              {breakdown.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {copy.chartEmpty}
                </p>
              ) : (
                <>
                  <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]">
                    {breakdown.map((segment) => (
                      <span
                        key={segment.key}
                        style={{
                          width: `${(segment.count / filtered.length) * 100}%`,
                          background: statusTone(segment.key),
                        }}
                        title={`${segment.label}: ${segment.count}`}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                    {breakdown.map((segment) => (
                      <li key={segment.key} className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: statusTone(segment.key) }}
                        />
                        <span className="text-[12.5px]">{segment.label}</span>
                        <span className="text-[12.5px] font-semibold">{segment.count}</span>
                        <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                          ({Math.round((segment.count / filtered.length) * 100)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* ---- Filter toolbar (ERPNext-style, shared) ---- */}
          <ListFilterBar
            copy={copy}
            search={searchDraft}
            onSearchChange={setSearchDraft}
            statusValue={statusFilter}
            statusOptions={statusOptions}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            amount={amountDraft}
            onAmountChange={onAmountChange}
            fromDate={fromDraft}
            toDate={toDraft}
            onFromDateChange={setFromDraft}
            onToDateChange={setToDraft}
            onApply={applyFilters}
            onReset={resetFilters}
            error={filterError}
          />

          {/* ---- List ---- */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="text-[14px] font-semibold">{copy.listHeading}</h2>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
                  <FiHash size={22} />
                </span>
                <h2 className="text-[16px] font-semibold">{copy.noMatchTitle}</h2>
                <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                  {copy.noMatchHint}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-4 py-2"
                >
                  <span className="text-[var(--color-primary)]">
                    <FiRotateCcw size={14} />
                  </span>
                  <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.clearFilters}</span>
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                      <tr>
                        {[
                          copy.colSl,
                          copy.colId,
                          copy.colDate,
                          copy.colType,
                          copy.colAmount,
                          copy.colMode,
                          copy.colStatus,
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="whitespace-nowrap px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((payment, index) => (
                        <tr
                          key={payment.name}
                          className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_4%,var(--color-white))]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[12px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                            {pageStart + index + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-semibold text-[var(--color-primary)]">
                            {payment.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                            {formatDate(payment.posting_date, language)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                            {copy.paymentTypes[String(payment.payment_type || "").trim()] || payment.payment_type || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12.5px] font-medium text-[var(--color-primary)]">
                            {formatAmount(payment.amount, payment.currency || currency, language)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                            {payment.mode_of_payment || "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusBadge status={payment.display_status} copy={copy} emphasis />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ListPagination
                  copy={copy}
                  page={currentPage}
                  pageCount={totalPages}
                  onPageChange={setPage}
                  rangeStart={pageStart + 1}
                  rangeEnd={pageStart + pageRows.length}
                  total={filtered.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setPage(1);
                  }}
                />
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/** Soft tinted summary tiles (mirrors the customer payment summary cards). */
type StatTone = "violet" | "blue" | "green" | "red";

const STAT_TONES: Record<StatTone, { bg: string; border: string }> = {
  violet: {
    bg: "bg-[color-mix(in_srgb,#7c3aed_10%,var(--color-white))]",
    border: "border-[color-mix(in_srgb,#7c3aed_20%,transparent)]",
  },
  blue: {
    bg: "bg-[color-mix(in_srgb,#2f9bff_10%,var(--color-white))]",
    border: "border-[color-mix(in_srgb,#2f9bff_20%,transparent)]",
  },
  green: {
    bg: "bg-[color-mix(in_srgb,#22c55e_10%,var(--color-white))]",
    border: "border-[color-mix(in_srgb,#22c55e_20%,transparent)]",
  },
  red: {
    bg: "bg-[color-mix(in_srgb,#ef4444_10%,var(--color-white))]",
    border: "border-[color-mix(in_srgb,#ef4444_20%,transparent)]",
  },
};

/** A single summary tile. */
function Stat({ label, value, tone = "blue" }: { label: string; value: string; tone?: StatTone }) {
  const t = STAT_TONES[tone];
  return (
    <div className={`flex flex-col gap-1 rounded-2xl border px-3.5 py-3 ${t.border} ${t.bg}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
        {label}
      </span>
      <span className="truncate text-[14px] font-semibold" title={value}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
  copy,
  emphasis = false,
}: {
  status?: string;
  copy: PaymentEntryCopy;
  emphasis?: boolean;
}) {
  const key = String(status || "").trim().toLowerCase();
  const label = copy.statuses[key as keyof typeof copy.statuses] || status || "—";
  const isPaid = emphasis && label === copy.statuses.submitted;
  const isUnpaid = emphasis && label === copy.statuses.draft;
  const tint = isPaid
    ? {
        background: "color-mix(in srgb, var(--color-success) 14%, var(--color-white))",
        borderColor: "color-mix(in srgb, var(--color-success) 40%, transparent)",
        color: "var(--color-success)",
      }
    : isUnpaid
      ? {
          background: "color-mix(in srgb, var(--color-danger-strong) 12%, var(--color-white))",
          borderColor: "color-mix(in srgb, var(--color-danger-strong) 38%, transparent)",
          color: "var(--color-danger-strong)",
        }
      : undefined;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-2.5 py-1"
      style={tint ? { background: tint.background, borderColor: tint.borderColor } : undefined}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tint ? tint.color : statusTone(key) }}
      />
      <span className="text-[11.5px] font-semibold" style={tint ? { color: tint.color } : undefined}>
        {label}
      </span>
    </span>
  );
}

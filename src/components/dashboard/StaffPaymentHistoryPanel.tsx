"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiHash, FiRotateCcw } from "react-icons/fi";

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
import { paymentEntryCopyFor, type PaymentEntryCopy } from "@/lib/payment-entry/messages";
import { statusTone } from "@/lib/payment-entry/status";
import type { PaymentEntryRow } from "@/lib/payment-entry/types";
import { fetchStaffPaymentEntries } from "@/lib/staff-payment/api";

/**
 * "পেমেন্ট তালিকা" for the STAFF Payment Entry page.
 *
 * Renders directly below the right-side Payment Entry form and lists every
 * Payment Entry created by the signed-in employee (`owner`-scoped), using the
 * exact same UI as the customer dashboard's payment list: {@link ListFilterBar}
 * on top, the same column set + status pill, and {@link ListPagination} below.
 * Data comes from `GET /api/payment-entry/list` (core `frappe.client.get_list`).
 *
 * `refreshToken` lets the parent form force a reload after a successful Draft
 * is created, so a freshly-saved entry appears here immediately.
 */
export default function StaffPaymentHistoryPanel({ refreshToken = 0 }: { refreshToken?: number }) {
  const { language } = useLanguage();
  const copy = paymentEntryCopyFor(language);

  const [rows, setRows] = useState<PaymentEntryRow[]>([]);
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
      <header className="flex items-center gap-2.5 px-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-white)]">
          <FiHash size={15} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{copy.listHeading}</h2>
          <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.filterHint}
          </p>
        </div>
      </header>

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

      {loadError ? (
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
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-5 py-10 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
          {copy.loading}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
            <FiHash size={22} />
          </span>
          <h2 className="text-[16px] font-semibold">{rows.length === 0 ? copy.emptyTitle : copy.noMatchTitle}</h2>
          <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {rows.length === 0 ? copy.emptyHint : copy.noMatchHint}
          </p>
          {rows.length > 0 ? (
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
          ) : null}
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
    </section>
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

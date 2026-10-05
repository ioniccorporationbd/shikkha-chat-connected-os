"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiFilter,
  FiFileText,
  FiHash,
  FiLayers,
  FiRotateCcw,
  FiRotateCw,
  FiSliders,
  FiUserCheck,
  FiX,
} from "react-icons/fi";

import { useRouter } from "next/navigation";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchPaymentDetails, fetchPayments } from "@/lib/payment-entry/api";
import { formatAmount, formatDate } from "@/lib/payment-entry/format";
import { paymentEntryCopyFor, type PaymentEntryCopy } from "@/lib/payment-entry/messages";
import { paymentEntrySnapshot } from "@/lib/dashboard/snapshot";
import { runSmartReload } from "@/lib/dashboard/smart-reload";
import type {
  PaymentEntryDetails,
  PaymentEntryListPayload,
  PaymentEntryReference,
  PaymentEntryRow,
} from "@/lib/payment-entry/types";

import { CLIENT_DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/session";

const ROWS_PER_PAGE_OPTIONS = [20, 100, 500] as const;

type AmountMode = "any" | "exact" | "range";

interface AmountFilter {
  mode: AmountMode;
  exact: string;
  min: string;
  max: string;
}

interface AppliedFilters {
  amount: AmountFilter;
  fromDate: string;
  toDate: string;
}

const EMPTY_AMOUNT: AmountFilter = { mode: "any", exact: "", min: "", max: "" };
const EMPTY_APPLIED: AppliedFilters = { amount: EMPTY_AMOUNT, fromDate: "", toDate: "" };

/** The stable tone for a status key, reused by the chart bar and its legend. */
function statusTone(key: string): string {
  switch (key) {
    case "paid":
      return "var(--color-success)";
    case "reconciled":
    case "received":
      return "color-mix(in srgb, var(--color-success) 72%, var(--color-white))";
    case "submitted":
      return "var(--color-primary)";
    case "draft":
      return "color-mix(in srgb, var(--color-primary) 42%, var(--color-white))";
    case "cancelled":
      return "var(--color-danger-strong)";
    default:
      return "color-mix(in srgb, var(--color-primary) 55%, var(--color-white))";
  }
}

export default function PaymentEntryView({ onBack }: { onBack?: () => void }) {
  const { language } = useLanguage();
  const copy = paymentEntryCopyFor(language);
  const router = useRouter();

  const [data, setData] = useState<PaymentEntryListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);

  const [detailName, setDetailName] = useState<string | null>(null);
  const [detail, setDetail] = useState<PaymentEntryDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // ---- Filters ----
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [amountDraft, setAmountDraft] = useState<AmountFilter>(EMPTY_AMOUNT);
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_APPLIED);
  const [filterError, setFilterError] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PER_PAGE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  const load = useCallback(async (): Promise<{ data: PaymentEntryListPayload | null; error?: unknown }> => {
    try {
      const payload = await fetchPayments(language);
      setData(payload);
      setLoadError("");
      setPermissionDenied(false);
      setExpired(false);
      return { data: payload };
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error("[payment-entry] list load failed", {
        code: err?.code ?? null,
        message: err?.message ?? null,
      });
      if (err?.code === "not_authenticated") {
        setExpired(true);
      } else if (err?.code === "not_permitted") {
        setPermissionDenied(true);
        setData(null);
      } else {
        setLoadError(err?.message || copy.loadFailed);
      }
      return { data: null, error };
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
  }, [load]);

  // Smart Reload — the exact Overview behaviour, shared via runSmartReload:
  // snapshot → refetch → unchanged = light refresh / changed = one hard reload.
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await runSmartReload({
        before: data,
        refetch: () => load(),
        snapshot: paymentEntrySnapshot,
        copy: {
          unchanged: copy.reloadNoChanges,
          changed: copy.reloadChanged,
          failed: copy.reloadFailed,
        },
      });
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, data, load, copy.reloadNoChanges, copy.reloadChanged, copy.reloadFailed]);

  const openDetails = useCallback(
    async (name: string) => {
      setDetailName(name);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        const payload = await fetchPaymentDetails(name, language);
        setDetail(payload);
      } catch (error) {
        const err = error as { message?: string };
        setDetailError(err?.message || copy.loadFailed);
      } finally {
        setDetailLoading(false);
      }
    },
    [language, copy.loadFailed],
  );

  const closeDetails = useCallback(() => {
    setDetailName(null);
    setDetail(null);
    setDetailError("");
  }, []);

  const payments = useMemo(
    () => (data?.payments ?? []).filter((row) => Boolean(row?.name)),
    [data],
  );

  // Status options are derived from the real rows only — never hardcoded.
  const statusOptions = useMemo(() => {
    const order = ["submitted", "reconciled", "received", "paid", "draft", "cancelled"];
    const seen = new Set<string>();
    for (const row of payments) {
      const raw = String(row.display_status || "").trim();
      if (raw) seen.add(raw.toLowerCase());
    }
    const known = order.filter((key) => seen.has(key));
    const extra = [...seen].filter((key) => !order.includes(key));
    return [...known, ...extra].map((key) => ({
      value: key,
      label: copy.statuses[key as keyof typeof copy.statuses] || key,
    }));
  }, [payments, copy]);

  const filtered = useMemo(() => {
    const { amount, fromDate, toDate } = applied;
    return payments.filter((row) => {
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
      return true;
    });
  }, [payments, statusFilter, applied]);

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
    const totalRecords = data?.summary?.total ?? payments.length;
    const filteredAmount = filtered.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const average = filtered.length > 0 ? filteredAmount / filtered.length : 0;
    return { totalRecords, filteredAmount, average };
  }, [data, payments, filtered]);

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
    setAmountDraft((prev) => ({ ...prev }));
    setApplied({ amount: { ...amountDraft }, fromDate: fromDraft, toDate: toDraft });
    setPage(1);
  }, [amountDraft, fromDraft, toDraft, copy.filterInvalidAmount, copy.filterInvalidAmountRange, copy.filterInvalidDateRange]);

  const resetFilters = useCallback(() => {
    setStatusFilter("all");
    setAmountDraft(EMPTY_AMOUNT);
    setFromDraft("");
    setToDraft("");
    setApplied(EMPTY_APPLIED);
    setFilterError("");
    setRowsPerPage(ROWS_PER_PAGE_OPTIONS[0]);
    setPage(1);
  }, []);

  const currency = data?.summary?.currency || "BDT";

  const inputClass =
    "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 py-2.5 text-[13px] outline-none transition focus:border-[var(--color-primary)]";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]";

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
            <FiCreditCard size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold">{copy.heading}</h1>
            <p className="mt-0.5 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {copy.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (onBack ? onBack() : router.push(CLIENT_DASHBOARD_PATH))}
          className="hidden items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 transition hover:border-[var(--color-primary)] sm:inline-flex"
        >
          <span className="text-[var(--color-primary)]">
            <FiArrowLeft size={15} />
          </span>
          <span className="text-[12.5px] font-semibold">{copy.back}</span>
        </button>
      </header>

      <div className="flex flex-col gap-5">
        {expired ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.sessionExpiredTitle}
            action={
              <button
                type="button"
                onClick={() => router.push(LOGIN_PATH)}
                className="rounded-2xl bg-[var(--color-primary)] px-4 py-2"
              >
                <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.signInAgain}</span>
              </button>
            }
          />
        ) : permissionDenied ? (
          <CalmState icon={<FiActivity size={22} />} title={copy.permissionTitle} hint={copy.permissionHint} />
        ) : loading ? (
          <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-5 py-16 text-center">
            <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{copy.loading}</p>
          </div>
        ) : loadError ? (
          <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] px-5 py-10 text-center">
            <p className="text-[14px] font-semibold text-[var(--color-danger-strong)]">{copy.loadFailed}</p>
            <p className="mx-auto mt-1 max-w-[46ch] text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] px-4 py-2"
            >
              <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.retry}</span>
            </button>
          </div>
        ) : data && !data.linked ? (
          <CalmState icon={<FiUserCheck size={22} />} title={copy.noCustomerTitle} hint={copy.noCustomerHint} />
        ) : data ? (
          payments.length === 0 ? (
            <CalmState icon={<FiFileText size={22} />} title={copy.emptyTitle} hint={copy.emptyHint} />
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
                  <Stat label={copy.chartTotal} value={String(totals.totalRecords)} />
                  <Stat
                    label={copy.chartShowing}
                    value={`${filtered.length} ${copy.ofLabel} ${totals.totalRecords}`}
                    accent
                  />
                  <Stat label={copy.chartFilteredAmount} value={formatAmount(totals.filteredAmount, currency, language)} />
                  <Stat
                    label={copy.chartAvg}
                    value={filtered.length ? formatAmount(totals.average, currency, language) : copy.summaryNone}
                  />
                  <Stat label={copy.summaryMonth} value={String(data.summary?.this_month_count ?? 0)} />
                  <Stat
                    label={copy.summaryLatest}
                    value={
                      data.summary?.latest_payment_date
                        ? formatDate(data.summary.latest_payment_date, language)
                        : copy.summaryNone
                    }
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

              {/* ---- Filter bar ---- */}
              <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[var(--color-primary)]">
                    <FiSliders size={16} />
                  </span>
                  <h2 className="text-[14px] font-semibold">{copy.filterHeading}</h2>
                  <span className="text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {copy.filterHint}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>{copy.filterStatusLabel}</span>
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option value="all">{copy.filterStatusAll}</option>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>{copy.filterAmountLabel}</span>
                    <select
                      value={amountDraft.mode}
                      onChange={(event) => onAmountChange("mode", event.target.value)}
                      className={inputClass}
                    >
                      <option value="any">{copy.filterAmountAny}</option>
                      <option value="exact">{copy.filterAmountExact}</option>
                      <option value="range">{copy.filterAmountRange}</option>
                    </select>
                  </label>

                  {amountDraft.mode === "exact" ? (
                    <label className="flex flex-col gap-1.5">
                      <span className={labelClass}>{copy.filterAmountExact}</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={amountDraft.exact}
                        onChange={(event) => onAmountChange("exact", event.target.value)}
                        placeholder={copy.filterAmountExactPlaceholder}
                        className={inputClass}
                      />
                    </label>
                  ) : null}

                  {amountDraft.mode === "range" ? (
                    <>
                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>{copy.filterMinPlaceholder}</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={amountDraft.min}
                          onChange={(event) => onAmountChange("min", event.target.value)}
                          placeholder={copy.filterMinPlaceholder}
                          className={inputClass}
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>{copy.filterMaxPlaceholder}</span>
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          value={amountDraft.max}
                          onChange={(event) => onAmountChange("max", event.target.value)}
                          placeholder={copy.filterMaxPlaceholder}
                          className={inputClass}
                        />
                      </label>
                    </>
                  ) : null}

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>{copy.filterFromLabel}</span>
                    <input
                      type="date"
                      value={fromDraft}
                      onChange={(event) => setFromDraft(event.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>{copy.filterToLabel}</span>
                    <input
                      type="date"
                      value={toDraft}
                      onChange={(event) => setToDraft(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>

                {filterError ? (
                  <p className="mt-3 text-[12px] font-medium text-[var(--color-danger-strong)]">{filterError}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
                  >
                    <span className="text-[var(--color-white)]">
                      <FiFilter size={15} />
                    </span>
                    <span className="text-[12.5px] font-semibold text-[var(--color-white)]">{copy.filterApply}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
                  >
                    <span className="text-[var(--color-primary)]">
                      <FiRotateCcw size={15} />
                    </span>
                    <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.filterClear}</span>
                  </button>
                </div>
              </div>

              {/* ---- List ---- */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 px-1">
                  <h2 className="text-[14px] font-semibold">{copy.listHeading}</h2>
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-3.5 py-2 transition hover:border-[var(--color-primary)] disabled:opacity-60"
                  >
                    <span className={`text-[var(--color-primary)] ${refreshing ? "animate-spin" : ""}`}>
                      <FiRotateCw size={15} />
                    </span>
                    <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">
                      {refreshing ? copy.refreshing : copy.refresh}
                    </span>
                  </button>
                </div>

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
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
                    {/* desktop table */}
                    <div className="hidden overflow-x-auto rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] md:block">
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
                              copy.colAction,
                            ].map((heading) => (
                              <th
                                key={heading}
                                className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
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
                              className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
                            >
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                                {pageStart + index + 1}
                              </td>
                              <td className="px-4 py-3 text-[13px] font-semibold">{payment.name}</td>
                              <td className="px-4 py-3 text-[13px]">{formatDate(payment.posting_date, language)}</td>
                              <td className="px-4 py-3 text-[13px]">{paymentTypeLabel(payment, copy)}</td>
                              <td className="px-4 py-3 text-[13px] font-medium">
                                {formatAmount(payment.amount, payment.currency || currency, language)}
                              </td>
                              <td className="px-4 py-3 text-[13px]">{payment.mode_of_payment || "—"}</td>
                              <td className="px-4 py-3">
                                <StatusBadge status={payment.display_status} copy={copy} />
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => void openDetails(payment.name)}
                                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-primary)]"
                                >
                                  <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                                    {copy.viewDetails}
                                  </span>
                                  <FiChevronRight size={14} className="text-[var(--color-primary)]" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* mobile cards */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {pageRows.map((payment, index) => (
                        <PaymentCard
                          key={payment.name}
                          sl={pageStart + index + 1}
                          payment={payment}
                          copy={copy}
                          language={language}
                          currency={currency}
                          onOpen={() => void openDetails(payment.name)}
                        />
                      ))}
                    </div>

                    {/* rows-per-page + pagination */}
                    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                        <span>{copy.rowsPerPageShow}</span>
                        <select
                          value={rowsPerPage}
                          onChange={(event) => {
                            setRowsPerPage(Number(event.target.value));
                            setPage(1);
                          }}
                          className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 text-[12.5px] font-semibold outline-none focus:border-[var(--color-primary)]"
                        >
                          {ROWS_PER_PAGE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <span>{copy.rowsPerPageSuffix}</span>
                      </label>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                          {copy.paginationRangeLabel} {pageStart + 1}–{pageStart + pageRows.length} {copy.ofLabel}{" "}
                          {filtered.length}
                        </span>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1}
                            aria-label={copy.pagePrev}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
                          >
                            <span className="text-[var(--color-primary)]">
                              <FiChevronLeft size={15} />
                            </span>
                          </button>
                          <span className="px-1 text-[12.5px] font-semibold tabular-nums">
                            {copy.pageLabel} {currentPage} {copy.pageOf} {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label={copy.pageNext}
                            className="grid h-8 w-8 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition hover:border-[var(--color-primary)] disabled:opacity-40"
                          >
                            <span className="text-[var(--color-primary)]">
                              <FiChevronRight size={15} />
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )
        ) : null}
      </div>

      {detailName ? (
        <DetailsDialog
          name={detailName}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          copy={copy}
          language={language}
          onClose={closeDetails}
        />
      ) : null}
    </section>
  );
}

/** A single summary tile. */
function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border px-3.5 py-3 ${
        accent
          ? "border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
          : "border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)]"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
        {label}
      </span>
      <span className="truncate text-[14px] font-semibold" title={value}>
        {value}
      </span>
    </div>
  );
}

/** A compact, mobile-first payment card. */
function PaymentCard({
  sl,
  payment,
  copy,
  language,
  currency,
  onOpen,
}: {
  sl: number;
  payment: PaymentEntryRow;
  copy: PaymentEntryCopy;
  language: string;
  currency: string;
  onOpen: () => void;
}) {
  const code = payment.currency || currency;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">
            <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[11px] font-semibold text-[var(--color-primary)]">
              {sl}
            </span>
            <span className="truncate">{payment.name}</span>
          </p>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {formatDate(payment.posting_date, language)} · {paymentTypeLabel(payment, copy)}
          </p>
        </div>
        <StatusBadge status={payment.display_status} copy={copy} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colAmount}
          </span>
          <span className="text-[13px] font-semibold">{formatAmount(payment.amount, code, language)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colMode}
          </span>
          <span className="text-[13px] font-semibold">{payment.mode_of_payment || "—"}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-primary)]"
        >
          <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
          <FiChevronRight size={14} className="text-[var(--color-primary)]" />
        </button>
      </div>
    </div>
  );
}

/** The payment details drawer (own payment only — enforced server-side). */
function DetailsDialog({
  name,
  detail,
  loading,
  error,
  copy,
  language,
  onClose,
}: {
  name: string;
  detail: PaymentEntryDetails | null;
  loading: boolean;
  error: string;
  copy: PaymentEntryCopy;
  language: string;
  onClose: () => void;
}) {
  const code = detail?.currency || "BDT";

  const rows: { label: string; value: string }[] = detail
    ? [
        { label: copy.dParty, value: detail.party_name || detail.party || "" },
        { label: copy.dPostingDate, value: formatDate(detail.posting_date, language) },
        {
          label: copy.dPaymentType,
          value: copy.paymentTypes[String(detail.payment_type || "").trim()] || detail.payment_type || "",
        },
        { label: copy.dAmount, value: formatAmount(detail.amount, code, language) },
        { label: copy.dCurrency, value: detail.currency || "" },
        { label: copy.dMode, value: detail.mode_of_payment || "" },
        { label: copy.dReferenceNo, value: detail.reference_no || "" },
        {
          label: copy.dReferenceDate,
          value: detail.reference_date ? formatDate(detail.reference_date, language) : "",
        },
        { label: copy.dCompany, value: detail.company || "" },
      ]
    : [];

  // Extra fields taken from the document itself (paid/received, accounts,
  // allocation, contact). Only shown when the ERP actually returned a value.
  const extraRows: { label: string; value: string }[] = detail
    ? (
        [
          {
            label: copy.dPaidAmount,
            value: Number(detail.paid_amount) ? formatAmount(Number(detail.paid_amount), code, language) : "",
          },
          {
            label: copy.dReceivedAmount,
            value: Number(detail.received_amount) ? formatAmount(Number(detail.received_amount), code, language) : "",
          },
          { label: copy.dPaidFrom, value: detail.paid_from || "" },
          { label: copy.dPaidTo, value: detail.paid_to || "" },
          {
            label: copy.dAllocated,
            value: Number(detail.total_allocated_amount)
              ? formatAmount(Number(detail.total_allocated_amount), code, language)
              : "",
          },
          {
            label: copy.dUnallocated,
            value: Number(detail.unallocated_amount)
              ? formatAmount(Number(detail.unallocated_amount), code, language)
              : "",
          },
          { label: copy.dContactPerson, value: detail.contact_person || "" },
          { label: copy.dContactEmail, value: detail.contact_email || "" },
        ] as { label: string; value: string }[]
      ).filter((row) => row.value)
    : [];

  const allRows = [...rows, ...extraRows];

  const references: PaymentEntryReference[] = detail?.references ?? [];

  return (
    <div className="fixed inset-0 z-[130]" data-no-translate="true">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-[26px] border-t border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-5 shadow-[0_-30px_70px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-[620px] sm:max-w-[92vw] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[26px] sm:border"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {copy.detailsHeading}
            </p>
            <h2 className="mt-1 truncate text-[16px] font-semibold">{name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))]"
          >
            <span className="text-[var(--color-primary)]">
              <FiX size={16} />
            </span>
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.detailsLoading}
            </p>
          ) : error ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,var(--color-white))] p-4">
              <p className="text-[13px] font-semibold text-[var(--color-danger-strong)]">{copy.loadFailed}</p>
              <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">{error}</p>
            </div>
          ) : detail ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.display_status} copy={copy} />
                {detail.verified ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-success)]">
                    <FiCheckCircle size={13} />
                    {copy.colId}
                  </span>
                ) : null}
              </div>

              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {allRows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                      {row.label}
                    </dt>
                    <dd className="mt-0.5 break-words text-[13px] font-medium">{row.value || "—"}</dd>
                  </div>
                ))}
              </dl>

              {detail.remark ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {copy.dRemark}
                  </p>
                  <p className="mt-0.5 text-[13px]">{detail.remark}</p>
                </div>
              ) : null}

              <div>
                <p className="text-[12px] font-semibold">{copy.referencesHeading}</p>
                {references.length === 0 ? (
                  <p className="mt-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {copy.referencesEmpty}
                  </p>
                ) : (
                  <div className="mt-2 overflow-x-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                        <tr>
                          {[
                            copy.rDocType,
                            copy.rReference,
                            copy.rDue,
                            copy.rTotal,
                            copy.rOutstanding,
                            copy.rAllocated,
                          ].map((heading) => (
                            <th
                              key={heading}
                              className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {references.map((row, index) => (
                          <tr key={index} className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
                            <td className="px-3 py-2 text-[12px]">{row.reference_doctype || "—"}</td>
                            <td className="px-3 py-2 text-[12px]">{row.reference_name || "—"}</td>
                            <td className="px-3 py-2 text-[12px]">
                              {row.due_date ? formatDate(String(row.due_date), language) : "—"}
                            </td>
                            <td className="px-3 py-2 text-[12px]">
                              {formatAmount(Number(row.total_amount ?? 0), code, language)}
                            </td>
                            <td className="px-3 py-2 text-[12px]">
                              {formatAmount(Number(row.outstanding_amount ?? 0), code, language)}
                            </td>
                            <td className="px-3 py-2 text-[12px] font-medium">
                              {formatAmount(Number(row.allocated_amount ?? 0), code, language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** A calm, centred card for the non-happy states (permission, no customer, ...). */
function CalmState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
        {icon}
      </span>
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {hint ? (
        <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{hint}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

function paymentTypeLabel(payment: PaymentEntryRow, copy: PaymentEntryCopy): string {
  const raw = String(payment.payment_type || "").trim();
  return copy.paymentTypes[raw] || raw || "—";
}

function StatusBadge({ status, copy }: { status?: string; copy: PaymentEntryCopy }) {
  const key = String(status || "").trim().toLowerCase();
  const label = copy.statuses[key as keyof typeof copy.statuses] || status || "—";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-2.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusTone(key) }} />
      <span className="text-[11.5px] font-semibold">{label}</span>
    </span>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiArrowLeft,
  FiCheckCircle,
  FiChevronRight,
  FiDollarSign,
  FiFileText,
  FiHash,
  FiLayers,
  FiLink,
  FiRotateCcw,
  FiUserCheck,
} from "react-icons/fi";

import ListFilterBar from "@/components/dashboard/ListFilterBar";
import ListPagination from "@/components/dashboard/ListPagination";
import {
  EMPTY_AMOUNT,
  EMPTY_APPLIED,
  ROWS_PER_PAGE_OPTIONS,
  matchesQuery,
  type AmountFilter,
  type AppliedFilters,
  DEFAULT_ROWS_PER_PAGE,
} from "@/lib/dashboard/list-controls";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";

import DetailSheet, {
  type DetailRow,
  type DetailSection,
} from "@/components/dashboard/DetailSheet";
import { ApiError } from "@/lib/api/http";
import { CLIENT_DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/session";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { fetchInvoiceDetails, fetchInvoices } from "@/lib/service-build/api";
import { formatAmount, formatDate } from "@/lib/service-build/format";
import { serviceBuildCopyFor, type ServiceBuildCopy } from "@/lib/service-build/messages";
import type {
  SalesInvoiceDetails,
  SalesInvoiceItem,
  SalesInvoiceListPayload,
  SalesInvoiceRow,
  SalesInvoiceStatusKey,
} from "@/lib/service-build/types";

/** A stable colour per status key, reused by the chart bar and its legend. */
function statusTone(key: string): string {
  switch (key) {
    case "paid":
      return "var(--color-success)";
    case "submitted":
      return "var(--color-primary)";
    case "partly paid":
      return "color-mix(in srgb, var(--color-success) 62%, var(--color-white))";
    case "unpaid":
      return "color-mix(in srgb, var(--color-primary) 58%, var(--color-white))";
    case "draft":
      return "color-mix(in srgb, var(--color-primary) 40%, var(--color-white))";
    case "overdue":
      return "var(--color-danger-strong)";
    case "return":
      return "color-mix(in srgb, var(--color-primary) 30%, var(--color-white))";
    case "cancelled":
      return "color-mix(in srgb, var(--color-danger-strong) 60%, var(--color-white))";
    default:
      return "color-mix(in srgb, var(--color-primary) 55%, var(--color-white))";
  }
}

/**
 * The customer Service Build (Sales Invoice) history.
 *
 * Every figure comes from the ERP, scoped to the logged-in customer: the list,
 * the summary and the details are all filtered server-side (`customer = current
 * customer`), so the browser can never see another customer's invoices. Draft and
 * Submitted invoices are shown; Cancelled invoices are never returned.
 */
export default function ServiceBuildView({ onBack }: { onBack?: () => void }) {
  const { language } = useLanguage();
  const copy = serviceBuildCopyFor(language);
  const router = useRouter();

  const [data, setData] = useState<SalesInvoiceListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);

  const [detailName, setDetailName] = useState<string | null>(null);
  const [detail, setDetail] = useState<SalesInvoiceDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // ---- Filters ----
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [amountDraft, setAmountDraft] = useState<AmountFilter>(EMPTY_AMOUNT);
  const [fromDraft, setFromDraft] = useState("");
  const [toDraft, setToDraft] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [applied, setApplied] = useState<AppliedFilters>(EMPTY_APPLIED);
  const [filterError, setFilterError] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);
  const [page, setPage] = useState(1);

  const load = useCallback(async (): Promise<{ data: SalesInvoiceListPayload | null; error?: unknown }> => {
    try {
      const payload = await fetchInvoices(language);
      setData(payload);
      setLoadError("");
      setPermissionDenied(false);
      setExpired(false);
      return { data: payload };
    } catch (error) {
      const err = error as ApiError;
      console.error("[service-build] list load failed", {
        code: err?.code ?? "unknown",
        message: err?.message ?? String(error),
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

  // Register with the shell's shared reload button — this panel keeps its data
  // in local state, so a dashboard refetch alone would never refresh it.
  useReloadHandler(load);

  const openDetails = useCallback(
    async (name: string) => {
      if (!name) return;
      setDetailName(name);
      setDetail(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        const payload = await fetchInvoiceDetails(name, language);
        setDetail(payload);
      } catch (error) {
        const err = error as ApiError;
        console.error("[service-build] details load failed", {
          name,
          code: err?.code ?? "unknown",
          message: err?.message ?? String(error),
        });
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

  const invoices = useMemo(
    () => (data?.invoices ?? []).filter((invoice) => Boolean(invoice?.name)),
    [data],
  );

  // Status options are derived from the real rows only — never hardcoded.
  const statusOptions = useMemo(() => {
    const order: SalesInvoiceStatusKey[] = [
      "draft",
      "submitted",
      "unpaid",
      "partly paid",
      "paid",
      "overdue",
      "return",
      "cancelled",
    ];
    const seen = new Set<string>();
    for (const row of invoices) {
      const raw = String(row.display_status || "").trim();
      if (raw) seen.add(raw.toLowerCase());
    }
    const known = order.filter((key) => seen.has(key));
    const extra = [...seen].filter((key) => !order.includes(key as SalesInvoiceStatusKey));
    return [...known, ...extra].map((key) => ({
      value: key,
      label: copy.statuses[key as SalesInvoiceStatusKey] || key,
    }));
  }, [invoices, copy]);

  const filtered = useMemo(() => {
    const { amount, fromDate, toDate, search } = applied;
    return invoices.filter((row) => {
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
          [
            row.name,
            (row as { customer_name?: string }).customer_name,
            (row as { customer?: string }).customer,
          ],
          search,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [invoices, statusFilter, applied]);

  const breakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of filtered) {
      const key = String(row.display_status || "").trim().toLowerCase() || "unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return statusOptions
      .map((option) => ({ key: option.value, label: option.label, count: counts.get(option.value) || 0 }))
      .filter((segment) => segment.count > 0);
  }, [filtered, statusOptions]);

  const totals = useMemo(() => {
    const totalRecords = data?.summary?.total ?? invoices.length;
    const filteredAmount = filtered.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const filteredOutstanding = filtered.reduce((sum, row) => sum + (Number(row.outstanding_amount) || 0), 0);
    return { totalRecords, filteredAmount, filteredOutstanding };
  }, [data, invoices, filtered]);

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
    setApplied({ amount: { ...amountDraft }, fromDate: fromDraft, toDate: toDraft, search: searchDraft });
    setPage(1);
  }, [
    amountDraft,
    fromDraft,
    toDraft,
    searchDraft,
    copy.filterInvalidAmount,
    copy.filterInvalidAmountRange,
    copy.filterInvalidDateRange,
  ]);

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

  const currency = data?.summary?.currency || invoices[0]?.currency || "BDT";

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
            <FiFileText size={20} />
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
          className="hidden items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] sm:inline-flex"
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
                className="rounded-2xl bg-[var(--color-action)] px-4 py-2"
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
          invoices.length === 0 ? (
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
                  <Stat
                    label={copy.chartFilteredAmount}
                    value={formatAmount(totals.filteredAmount, currency, language)}
                  />
                  <Stat
                    label={copy.chartOutstanding}
                    value={formatAmount(totals.filteredOutstanding, currency, language)}
                  />
                  <Stat label={copy.summaryMonth} value={String(data.summary?.this_month_count ?? 0)} />
                  <Stat
                    label={copy.summaryLatest}
                    value={
                      data.summary?.latest_invoice_date
                        ? formatDate(data.summary.latest_invoice_date, language)
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
                    {/* desktop table */}
                    <div className="hidden overflow-x-auto rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] md:block">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                          <tr>
                            {[
                              copy.colSl,
                              copy.colId,
                              copy.colDate,
                              copy.colDue,
                              copy.colAmount,
                              copy.colOutstanding,
                              copy.colStatus,
                              copy.colAction,
                            ].map((heading) => (
                              <th
                                key={heading}
                                className="whitespace-nowrap px-4 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((invoice, index) => (
                            <tr
                              key={invoice.name}
                              className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition-colors hover:bg-[var(--color-action-tint)] [&>td]:py-3.5"
                            >
                              <td className="px-4 py-3 text-[13px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                                {pageStart + index + 1}
                              </td>
                              <td className="px-4 py-3 text-[13px] font-semibold">{invoice.name}</td>
                              <td className="px-4 py-3 text-[13px]">{formatDate(invoice.posting_date, language)}</td>
                              <td className="px-4 py-3 text-[13px]">
                                {invoice.due_date ? formatDate(invoice.due_date, language) : "—"}
                              </td>
                              <td className="px-4 py-3 text-[13px] font-medium">
                                {formatAmount(invoice.amount, invoice.currency || currency, language)}
                              </td>
                              <td className="px-4 py-3 text-[13px]">
                                {formatAmount(invoice.outstanding_amount, invoice.currency || currency, language)}
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={invoice.display_status} copy={copy} />
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => void openDetails(invoice.name)}
                                  className="inline-flex items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
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
                      {pageRows.map((invoice, index) => (
                        <InvoiceCard
                          key={invoice.name}
                          sl={pageStart + index + 1}
                          invoice={invoice}
                          copy={copy}
                          language={language}
                          currency={currency}
                          onOpen={() => void openDetails(invoice.name)}
                        />
                      ))}
                    </div>

                    {/* pagination (ERPNext-style, shared) */}
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
          )
        ) : null}
      </div>

      <DetailSheet
        open={Boolean(detailName)}
        onClose={closeDetails}
        closeLabel={copy.close}
        eyebrow={copy.detailsHeading}
        title={detailName ?? ""}
        subtitle={detail ? detail.customer_name || detail.company || copy.dSubtitle : copy.dSubtitle}
        icon={<FiFileText size={20} />}
        loading={detailLoading}
        loadingText={copy.detailsLoading}
        error={detailError}
        errorTitle={copy.loadFailed}
        badges={
          detail ? (
            <>
              <StatusBadge status={detail.display_status} copy={copy} />
              {detail.verified ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-success)]">
                  <FiCheckCircle size={13} />
                  {copy.verified}
                </span>
              ) : null}
            </>
          ) : null
        }
        sections={detail ? serviceBillSections(detail, copy, language) : []}
      >
        {detail ? serviceBillItems(detail, copy, language, currency) : null}
      </DetailSheet>
    </section>
  );
}

/** The grouped, logical sections of the invoice details popup. */
function serviceBillSections(
  detail: SalesInvoiceDetails,
  copy: ServiceBuildCopy,
  language: string,
): DetailSection[] {
  const code = detail.currency || "BDT";
  const num = (value: unknown) => Number(value ?? 0);
  const fmt = (value: unknown) => formatAmount(num(value), code, language);

  const amount = num(detail.amount);
  const outstanding = num(detail.outstanding_amount);
  const hasPaid = Number.isFinite(amount) && Number.isFinite(outstanding);
  const paid = hasPaid ? amount - outstanding : null;

  const infoRows: DetailRow[] = (
    [
      { label: copy.dBillId, value: detail.name },
      { label: copy.dPostingDate, value: formatDate(detail.posting_date, language) },
      { label: copy.dDueDate, value: detail.due_date ? formatDate(detail.due_date, language) : "" },
      {
        label: copy.dStatus,
        value:
          copy.statuses[String(detail.display_status || "").toLowerCase() as SalesInvoiceStatusKey] ||
          String(detail.display_status || ""),
      },
      { label: copy.dCompany, value: detail.company || "" },
    ] as DetailRow[]
  ).filter((row) => Boolean(row.value));

  const amountRows: DetailRow[] = (
    [
      { label: copy.dAmountTotal, value: fmt(detail.amount), emphasis: true },
      { label: copy.dNetTotal, value: num(detail.net_total) ? fmt(detail.net_total) : "" },
      { label: copy.dTaxes, value: num(detail.total_taxes_and_charges) ? fmt(detail.total_taxes_and_charges) : "" },
      { label: copy.dDiscount, value: num(detail.discount_amount) ? fmt(detail.discount_amount) : "" },
      { label: copy.dPaid, value: paid !== null ? fmt(paid) : "" },
      { label: copy.dOutstanding, value: fmt(detail.outstanding_amount) },
    ] as DetailRow[]
  ).filter((row) => Boolean(row.value));

  const referenceRows: DetailRow[] = (
    [
      { label: copy.dPoNo, value: detail.po_no || "" },
      { label: copy.dProject, value: detail.project || "" },
      { label: copy.dReturnAgainst, value: detail.is_return ? detail.return_against || "—" : "" },
      { label: copy.dContactPerson, value: detail.contact_person || "" },
      { label: copy.dContactEmail, value: detail.contact_email || "" },
      { label: copy.dRemark, value: detail.remark || "" },
    ] as DetailRow[]
  ).filter((row) => Boolean(row.value));

  const sections: DetailSection[] = [
    { key: "info", title: copy.dSecInfo, icon: <FiFileText size={15} />, rows: infoRows },
    { key: "amount", title: copy.dSecAmount, icon: <FiDollarSign size={15} />, rows: amountRows },
  ];
  if (referenceRows.length) {
    sections.push({ key: "reference", title: copy.dSecReference, icon: <FiLink size={15} />, rows: referenceRows });
  }
  return sections;
}

/** The billed item rows (or an empty note) shown under the sections. */
function serviceBillItems(
  detail: SalesInvoiceDetails,
  copy: ServiceBuildCopy,
  language: string,
  fallbackCurrency: string,
) {
  const code = detail.currency || fallbackCurrency;
  const items: SalesInvoiceItem[] = detail.items ?? [];

  return (
    <section className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_7%,var(--color-white))] p-4">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-primary)]">
          <FiFileText size={15} />
        </span>
        <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          {copy.itemsHeading}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {copy.itemsEmpty}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
              <tr>
                {[copy.iItem, copy.iQty, copy.iRate, copy.iAmount].map((heading) => (
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
              {items.map((row, index) => (
                <tr key={index} className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
                  <td className="px-3 py-2 text-[12px]">{row.item_name || row.item_code || "—"}</td>
                  <td className="px-3 py-2 text-[12px]">
                    {Number(row.qty ?? 0)}
                    {row.uom ? ` ${row.uom}` : ""}
                  </td>
                  <td className="px-3 py-2 text-[12px]">{formatAmount(Number(row.rate ?? 0), code, language)}</td>
                  <td className="px-3 py-2 text-[12px] font-medium">
                    {formatAmount(Number(row.amount ?? 0), code, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

/** A compact, mobile-first invoice card. */
function InvoiceCard({
  sl,
  invoice,
  copy,
  language,
  currency,
  onOpen,
}: {
  sl: number;
  invoice: SalesInvoiceRow;
  copy: ServiceBuildCopy;
  language: string;
  currency: string;
  onOpen: () => void;
}) {
  const code = invoice.currency || currency;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">
            <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[11px] font-semibold text-[var(--color-primary)]">
              {sl}
            </span>
            <span className="truncate">{invoice.name}</span>
          </p>
          <p className="mt-0.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {formatDate(invoice.posting_date, language)}
            {invoice.due_date ? ` · ${formatDate(invoice.due_date, language)}` : ""}
          </p>
        </div>
        <StatusBadge status={invoice.display_status} copy={copy} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colAmount}
          </span>
          <span className="text-[13px] font-semibold">{formatAmount(invoice.amount, code, language)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.colOutstanding}
          </span>
          <span className="text-[13px] font-semibold">
            {formatAmount(invoice.outstanding_amount, code, language)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
        >
          <span className="text-[12px] font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
          <FiChevronRight size={14} className="text-[var(--color-primary)]" />
        </button>
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
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
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

/** A status chip derived from the real ERPNext Sales Invoice `status` field. */
function StatusBadge({
  status,
  copy,
}: {
  status: SalesInvoiceStatusKey | string;
  copy: ServiceBuildCopy;
}) {
  const map: Record<SalesInvoiceStatusKey, string> = {
    draft:
      "border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]",
    submitted:
      "border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]",
    unpaid:
      "border border-[color-mix(in_srgb,var(--color-primary)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))] text-[var(--color-primary)]",
    "partly paid":
      "border border-[color-mix(in_srgb,var(--color-success)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-white))] text-[var(--color-success)]",
    paid: "border border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[var(--color-success)] text-[var(--color-white)]",
    overdue:
      "border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] text-[var(--color-danger-strong)]",
    return:
      "border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]",
    cancelled:
      "border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] text-[var(--color-danger-strong)]",
  };

  const raw = String(status || "").trim();
  const lower = raw.toLowerCase();
  const known = (Object.keys(map) as SalesInvoiceStatusKey[]).includes(lower as SalesInvoiceStatusKey);
  const key: SalesInvoiceStatusKey = known ? (lower as SalesInvoiceStatusKey) : "unpaid";
  const label = known ? copy.statuses[key] ?? raw : raw || "—";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${map[key]}`}>
      <span className="text-[11px] font-semibold">{label}</span>
    </span>
  );
}

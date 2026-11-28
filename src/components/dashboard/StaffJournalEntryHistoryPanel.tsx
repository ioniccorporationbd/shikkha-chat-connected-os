"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiRotateCcw,
  FiUser,
} from "react-icons/fi";

import DetailSheet, { type DetailRow, type DetailSection } from "./DetailSheet";
import ListFilterBar from "./ListFilterBar";
import ListPagination from "./ListPagination";
import ShikkhaLoader from "./ShikkhaLoader";
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
import { statusTone } from "@/lib/payment-entry/status";
import { fetchJournalEntries, fetchJournalEntryDetail } from "@/lib/journal-entry/api";
import { journalListCopyFor, type JournalListCopy } from "@/lib/journal-entry/list-copy";
import type { JournalEntryRow } from "@/lib/journal-entry/types";

function statusKey(status: string): string {
  return String(status || "").trim().toLowerCase();
}

function statusLabel(status: string, copy: JournalListCopy): string {
  const key = statusKey(status);
  return copy.statuses[key as keyof typeof copy.statuses] || status || "—";
}

function StatusBadge({ status, copy }: { status: string; copy: JournalListCopy }) {
  const key = statusKey(status);
  const label = statusLabel(status, copy);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-2.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusTone(key) }} />
      <span className="text-[11.5px] font-semibold text-[var(--color-primary)]">{label}</span>
    </span>
  );
}

function detailSections(
  row: JournalEntryRow,
  copy: JournalListCopy,
  language: string,
  party: { partyType: string; party: string } | null
): DetailSection[] {
  const currency = row.currency || "BDT";
  const info: DetailRow[] = [
    { label: copy.dName, value: row.name },
    { label: copy.dPostingDate, value: formatDate(row.posting_date, language) },
    { label: copy.dVoucherType, value: row.voucher_type || "—" },
    { label: copy.dTitle, value: row.title || "—" },
    { label: copy.dCompany, value: row.company || "—" },
    { label: copy.dStatus, value: statusLabel(row.status, copy) },
  ];
  const partyRows: DetailRow[] = [
    { label: copy.dPartyType, value: party?.partyType || "—" },
    { label: copy.dParty, value: party?.party || "—" },
  ];
  const amount: DetailRow[] = [
    { label: copy.dDebit, value: formatAmount(row.total_debit, currency, language) },
    { label: copy.dCredit, value: formatAmount(row.total_credit, currency, language) },
  ];
  const reference: DetailRow[] = [];
  if (row.remark) reference.push({ label: copy.dRemark, value: row.remark });
  if (row.cheque_no) reference.push({ label: copy.dCheque, value: row.cheque_no });
  if (row.bill_no) reference.push({ label: copy.dBill, value: row.bill_no });

  const sections: DetailSection[] = [
    { key: "info", title: copy.dSecInfo, icon: <FiBookOpen size={15} />, rows: info },
    { key: "party", title: copy.dPartySection, icon: <FiUser size={15} />, rows: partyRows },
    { key: "amount", title: copy.dSecAmount, icon: <FiDollarSign size={15} />, rows: amount },
  ];
  if (reference.length) {
    sections.push({
      key: "ref",
      title: copy.dSecReference,
      icon: <FiFileText size={15} />,
      rows: reference,
    });
  }
  return sections;
}

/**
 * Right-side "জার্নাল এন্ট্রি তালিকা" table on `/userDashboard/journal-entry`.
 *
 * Styled after the payment-entry "পেমেন্ট তালিকা" table: a filter toolbar
 * (ফিল্টার) above the table, then the table, then the pagination footer. Rows
 * come from `/api/journal-entry/list` (all Journal Entries the signed-in user
 * may read). Bump `refreshToken` after creating a new entry to reload.
 */
export default function StaffJournalEntryHistoryPanel({
  refreshToken = 0,
}: {
  refreshToken?: number;
}) {
  const { language } = useLanguage();
  const copy = journalListCopyFor(language);

  const [rows, setRows] = useState<JournalEntryRow[]>([]);
  const [currency, setCurrency] = useState("BDT");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailRow, setDetailRow] = useState<JournalEntryRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailParty, setDetailParty] = useState<{ partyType: string; party: string } | null>(
    null
  );

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
      const result = await fetchJournalEntries(language);
      const entries = (result.entries ?? []).filter((row) => Boolean(row?.name));
      setRows(entries);
      setCurrency(result.summary?.currency || "BDT");
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error("[journal-entry:list] load failed", {
        code: err?.code ?? null,
        message: err?.message ?? null,
      });
      reportClientError({
        scope: "journal-entry:list",
        message: err?.message || "Journal entry history load failed",
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

  const statusOptions = useMemo(() => {
    const order = ["draft", "submitted", "cancelled"];
    const seen = new Set<string>();
    for (const row of rows) {
      const key = statusKey(row.status);
      if (key) seen.add(key);
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
      if (statusFilter !== "all" && statusKey(row.status) !== statusFilter) return false;
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
      if (!matchesQuery([row.name, row.voucher_type, row.title, row.remark, row.company], search)) {
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
    [filtered, pageStart, rowsPerPage]
  );
  const rangeStart = filtered.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + rowsPerPage, filtered.length);

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
      if (
        (min !== null && (!Number.isFinite(min) || min < 0)) ||
        (max !== null && (!Number.isFinite(max) || max < 0))
      ) {
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
    setApplied({
      amount: { ...amountDraft },
      fromDate: fromDraft,
      toDate: toDraft,
      search: searchDraft,
    });
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

  const openDetails = useCallback(
    async (row: JournalEntryRow) => {
      setDetailRow(row);
      setDetailParty(null);
      setDetailError("");
      setDetailLoading(true);
      try {
        const detail = await fetchJournalEntryDetail(row.name, language);
        const types = new Set<string>();
        const parties = new Set<string>();
        if (detail.party_type) types.add(detail.party_type);
        const topName = detail.party_name || detail.party;
        if (topName) parties.add(topName);
        for (const line of detail.accounts ?? []) {
          if (line.party_type) types.add(line.party_type);
          const name = line.party_name || line.party;
          if (name) parties.add(name);
        }
        setDetailParty({ partyType: [...types].join(", "), party: [...parties].join(", ") });
      } catch (error) {
        const err = error as { message?: string };
        console.error("[journal-entry:detail] load failed", { message: err?.message ?? null });
        reportClientError({
          scope: "journal-entry:detail",
          message: err?.message || "Journal entry detail load failed",
          detail: error,
        });
        setDetailError(err?.message || copy.detailError);
      } finally {
        setDetailLoading(false);
      }
    },
    [language, copy.detailError]
  );

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
          <FiBookOpen size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-[var(--color-primary)]">{copy.heading}</h1>
          <p className="mt-0.5 truncate text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {copy.subtitle}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="grid min-h-[220px] place-items-center rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-6 py-10">
          <ShikkhaLoader label={copy.loading} size="md" />
        </div>
      ) : loadError ? (
        <div className="grid min-h-[200px] place-items-center rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
            >
              <FiRotateCcw size={13} /> {copy.retry}
            </button>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="grid min-h-[200px] place-items-center rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-6 py-10 text-center">
          <div className="flex max-w-sm flex-col items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
              <FiBookOpen size={22} aria-hidden />
            </span>
            <p className="text-[15px] font-semibold text-[var(--color-primary)]">{copy.emptyTitle}</p>
            <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">{copy.emptyHint}</p>
          </div>
        </div>
      ) : (
        <>
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="text-[14px] font-semibold text-[var(--color-primary)]">{copy.listHeading}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-3 py-1.5 text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_64%,transparent)]">
                {copy.totalRecordsLabel}: <b className="text-[var(--color-primary)]">{filtered.length}</b>
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="grid min-h-[160px] place-items-center rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] px-6 py-8 text-center">
                <div className="flex max-w-sm flex-col items-center gap-2">
                  <p className="text-[14px] font-semibold text-[var(--color-primary)]">{copy.noMatchTitle}</p>
                  <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">{copy.noMatchHint}</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
                  >
                    <FiRotateCcw size={13} /> {copy.clearFilters}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] shadow-[0_20px_44px_-34px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]">
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colSl}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colId}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colDate}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colType}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colTitle}</th>
                        <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colDebit}</th>
                        <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colCredit}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colStatus}</th>
                        <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">{copy.colAction}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((row, index) => (
                        <tr
                          key={row.name}
                          className="border-b border-[color-mix(in_srgb,var(--color-primary)_7%,transparent)] last:border-b-0 hover:bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))]"
                        >
                          <td className="px-3 py-3 text-[12.5px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                            {pageStart + index + 1}
                          </td>
                          <td className="px-3 py-3 text-[12.5px] font-semibold text-[var(--color-primary)]">{row.name}</td>
                          <td className="px-3 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                            {row.posting_date ? formatDate(row.posting_date, language) : "—"}
                          </td>
                          <td className="px-3 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">{row.voucher_type || "—"}</td>
                          <td className="max-w-[220px] truncate px-3 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]" title={row.title || row.remark || ""}>
                            {row.title || row.remark || "—"}
                          </td>
                          <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-[var(--color-primary)]">
                            {formatAmount(row.total_debit, currency, language)}
                          </td>
                          <td className="px-3 py-3 text-right text-[12.5px] tabular-nums text-[var(--color-primary)]">
                            {formatAmount(row.total_credit, currency, language)}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={row.status} copy={copy} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <button
                              type="button"
                              onClick={() => void openDetails(row)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))]"
                            >
                              <span className="pointer-events-none">
                                <FiEye size={12} />
                              </span>
                              <span className="pointer-events-none">{copy.viewDetails}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
                  <ListPagination
                    copy={copy}
                    page={currentPage}
                    pageCount={totalPages}
                    onPageChange={setPage}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    total={filtered.length}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                    onRowsPerPageChange={(value) => {
                      setRowsPerPage(value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {detailRow ? (
        <DetailSheet
          open
          onClose={() => {
            setDetailRow(null);
            setDetailParty(null);
            setDetailError("");
          }}
          closeLabel={copy.close}
          eyebrow={copy.detailsHeading}
          title={detailRow.name}
          subtitle={detailRow.title || detailRow.voucher_type || ""}
          icon={<FiBookOpen size={20} />}
          badges={<StatusBadge status={detailRow.status} copy={copy} />}
          loading={detailLoading}
          loadingText={copy.detailLoading}
          error={detailError}
          errorTitle={copy.detailError}
          sections={detailSections(detailRow, copy, language, detailParty)}
          document={{
            brand: "Shikkha Chat",
            badges: statusLabel(detailRow.status, copy) ? [statusLabel(detailRow.status, copy)] : [],
            filename: `journal-${detailRow.name}`,
            printLabel: language === "en" ? "Print" : "প্রিন্ট",
            downloadLabel: language === "en" ? "Download" : "ডাউনলোড",
            footerNote: language === "en" ? "Staff copy" : "স্টাফ কপি",
            locale: language === "en" ? "en-GB" : "bn-BD",
          }}
        />
      ) : null}
    </section>
  );
}

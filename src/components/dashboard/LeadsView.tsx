"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiInbox,
  FiMail,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiPhone,
  FiTarget,
  FiUser,
} from "react-icons/fi";

import LeadDetailSheet from "./LeadDetailSheet";
import NewLeadModal from "./NewLeadModal";
import ListPagination from "./ListPagination";
import ShikkhaLoader from "./ShikkhaLoader";
import { ApiError } from "@/lib/api/http";
import { fetchLeads } from "@/lib/leads/api";
import { formatDate } from "@/lib/payment-entry/format";
import {
  DEFAULT_ROWS_PER_PAGE,
  ROWS_PER_PAGE_OPTIONS,
  genericPaginationCopy,
} from "@/lib/dashboard/list-controls";
import {
  formatCount,
  leadInitials,
  leadsCopyFor,
  leadStatusLabel,
  leadStatusTone,
  type LeadsCopy,
} from "@/lib/leads/messages";
import type { LeadRow, LeadsPayload } from "@/lib/leads/types";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { reportClientError } from "@/lib/log/report-error";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

const PAGE_SIZE = 200; // fetch-chunk; the whole list is loaded then paginated
const MAX_LOADED_ROWS = 10_000; // safety cap on the full-list fetch

/** Debounce for the search box so a keystroke does not fire one ERP query each. */
const SEARCH_DEBOUNCE_MS = 350;

function StatusChip({ status, copy }: { status: string; copy: LeadsCopy }) {
  if (!status) return <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">—</span>;
  const tone = leadStatusTone(status);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ backgroundColor: tone.bg, color: tone.fg }}
      data-lead-status={status}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone.fg }} />
      {leadStatusLabel(copy, status)}
    </span>
  );
}

function LeadAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] text-[12px] font-bold text-[var(--color-action)]"
    >
      {leadInitials(name)}
    </span>
  );
}

export default function LeadsView() {
  const { language } = useLanguage();
  const copy = useMemo(() => leadsCopyFor(language), [language]);

  const [rows, setRows] = useState<LeadRow[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [doctype, setDoctype] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Client-side pagination over the fully-loaded matching set (parity with the
  // expense-claim table): the whole list is fetched once, then sliced below.
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS_PER_PAGE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lead opened from the table's Action column (`View details`).
  const [detailName, setDetailName] = useState<string | null>(null);

  // The toolbar's "New Lead" form.
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  // Only the newest request may write state (type-ahead search + load-more +
  // the navbar refresh can overlap).
  const requestId = useRef(0);

  const load = useCallback(
    async (options: { silent?: boolean } = {}) => {
      const { silent = false } = options;
      const ticket = ++requestId.current;

      if (silent) setRefreshing(true);
      else setLoading(true);

      setError(null);
      setPage(1);

      try {
        // Fetch the whole filtered list in 200-row pages so the client-side
        // pagination below the table covers every row (matching expense-claim).
        const collected: LeadRow[] = [];
        let offset = 0;
        let firstPayload: LeadsPayload | null = null;

        for (;;) {
          const payload: LeadsPayload = await fetchLeads({
            language,
            search: search || undefined,
            status: status || undefined,
            start: offset,
            limit: PAGE_SIZE,
          });

          if (ticket !== requestId.current) return;
          if (!firstPayload) firstPayload = payload;

          collected.push(...payload.leads);
          if (!payload.has_more || payload.leads.length === 0) break;

          offset += payload.leads.length;
          // Hard safety cap so a misbehaving backend can never spin forever.
          if (collected.length >= MAX_LOADED_ROWS) break;
        }

        if (!firstPayload) return;
        setAvailable(firstPayload.available);
        setDoctype(firstPayload.doctype);
        setStatuses(firstPayload.statuses ?? []);
        setRows(collected);
      } catch (cause) {
        if (ticket !== requestId.current) return;
        setRows([]);
        setError(cause instanceof ApiError ? cause.message : copy.errorTitle);
        reportClientError({
          scope: "leads:list",
          message: "The CRM lead list could not be loaded",
          detail: cause instanceof Error ? cause.message : cause,
        });
      } finally {
        if (ticket === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [language, search, status, copy.errorTitle]
  );

  // First paint + every filter change (search / status / language) refetches
  // from the top. The microtask keeps the initial setState out of the effect
  // body (same pattern as ExpenseClaimView) and the `active` guard drops the
  // response of a request whose effect was already torn down.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  // Navbar ⟳ drives this panel too (see reload-registry).
  useReloadHandler(() => {
    void load({ silent: true });
  });

  // Debounce the search box into the query state.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // The full matching set is loaded, so the count is exact (no "+").
  const totalLabel = useMemo(
    () => copy.total(formatCount(rows.length, language)),
    [copy, rows.length, language]
  );

  const filtered = Boolean(search || status);

  // Client-side pagination window over the fully-loaded rows.
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageRows = rows.slice(pageStart, pageStart + rowsPerPage);
  const paginationCopy = genericPaginationCopy(language);

  return (
    <section
      className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}
      data-leads-view=""
    >
      {/* ------------------------------------------------------------- header */}
      <div className="flex flex-col gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))] text-[var(--color-action)]">
            <FiTarget size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold text-[var(--color-primary)]" data-leads-title="">
              {copy.title}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {copy.subtitle}
            </p>
            <p className="mt-1 truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]" data-leads-source="">
              {copy.sourceNote}
              {doctype ? ` · ${doctype}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load({ silent: true })}
            disabled={loading || refreshing}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-action)_28%,transparent)] px-3 py-2 text-[12px] font-semibold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />
            <span className="hidden sm:inline">{refreshing ? copy.refreshing : copy.refresh}</span>
          </button>
          <button
            type="button"
            data-leads-new=""
            onClick={() => setNewLeadOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-white)] shadow-[0_12px_26px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiPlus size={15} />
            <span className="hidden sm:inline">{copy.newLead.button}</span>
          </button>
        </div>

        {/* search + status */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <FiSearch
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
              size={15}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={copy.searchPlaceholder}
              data-leads-search=""
              className="w-full rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] py-2 pl-9 pr-3 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
            />
          </label>

          <label className="flex items-center gap-2 sm:w-[200px]">
            <span className="sr-only">{copy.statusLabel}</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              data-leads-status=""
              className="w-full rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3 py-2 text-[12.5px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_45%,transparent)]"
            >
              <option value="">{copy.allStatuses}</option>
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {leadStatusLabel(copy, option)}
                </option>
              ))}
            </select>
          </label>

          {!loading && !error && available && rows.length > 0 ? (
            <span
              className="shrink-0 text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
              data-leads-count=""
            >
              {totalLabel}
            </span>
          ) : null}
        </div>
      </div>

      {/* -------------------------------------------------------------- body */}
      {loading ? (
        <div className="grid place-items-center py-16" data-leads-loading="true">
          <ShikkhaLoader label={copy.loading} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" data-leads-error="true">
          <FiAlertCircle size={26} className="text-[var(--color-danger)]" />
          <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">{copy.errorTitle}</p>
          <p className="max-w-[46ch] text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-[var(--color-action)] px-4 py-2 text-[12.5px] font-semibold text-[var(--color-white)]"
          >
            {copy.retry}
          </button>
        </div>
      ) : !available ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center" data-leads-unavailable="true">
          <FiInbox size={26} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" />
          <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">{copy.unavailableTitle}</p>
          <p className="max-w-[46ch] text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.unavailableHint}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center" data-leads-empty={filtered ? "filtered" : "true"}>
          <FiInbox size={26} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" />
          <p className="text-[13.5px] font-semibold text-[var(--color-primary)]">
            {filtered ? copy.noMatchTitle : copy.emptyTitle}
          </p>
          <p className="max-w-[46ch] text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {filtered ? copy.noMatchHint : copy.emptyHint}
          </p>
        </div>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left" data-leads-table="">
              <thead className="bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))]">
                <tr>
                  {[
                    copy.columns.serial,
                    copy.columns.lead,
                    copy.columns.organization,
                    copy.columns.mobile,
                    copy.columns.email,
                    copy.columns.status,
                    copy.columns.source,
                    copy.columns.action,
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
                {pageRows.map((row, index) => (
                  <tr
                    key={row.name}
                    data-lead-row={row.name}
                    className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_4%,var(--color-white))]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                      {formatCount(pageStart + index + 1, language)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <LeadAvatar name={row.lead_name || row.name} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[var(--color-primary)]">
                            {row.lead_name || row.name}
                          </p>
                          <p className="truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
                            {row.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[190px] px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                      <span className="block truncate">{row.organization || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                      {row.mobile || "—"}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                      <span className="block truncate">{row.email || "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusChip status={row.status} copy={copy} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                      {row.source || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetailName(row.name)}
                        data-lead-details={row.name}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))]"
                      >
                        <FiEye size={12} className="pointer-events-none" />
                        <span className="pointer-events-none">{copy.viewDetails}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="divide-y divide-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] md:hidden">
            {pageRows.map((row) => (
              <li key={row.name} data-lead-row={row.name} className="px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <LeadAvatar name={row.lead_name || row.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-primary)]">
                        {row.lead_name || row.name}
                      </p>
                      <StatusChip status={row.status} copy={copy} />
                    </div>
                    {row.organization ? (
                      <p className="mt-0.5 truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
                        {row.organization}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {row.mobile ? (
                        <span className="inline-flex items-center gap-1">
                          <FiPhone size={11} />
                          {row.mobile}
                        </span>
                      ) : null}
                      {row.email ? (
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <FiMail size={11} />
                          <span className="truncate">{row.email}</span>
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <FiUser size={11} />
                        {formatDate(row.created, language)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailName(row.name)}
                      data-lead-details={row.name}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_7%,var(--color-white))]"
                    >
                      <FiEye size={12} className="pointer-events-none" />
                      <span className="pointer-events-none">{copy.viewDetails}</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {rows.length > 0 ? (
            <div className="border-t border-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-4 py-4 sm:px-5">
              <ListPagination
                copy={paginationCopy}
                page={currentPage}
                pageCount={totalPages}
                onPageChange={setPage}
                rangeStart={pageStart + 1}
                rangeEnd={pageStart + pageRows.length}
                total={rows.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setPage(1);
                }}
              />
            </div>
          ) : null}
        </>
      )}

      <LeadDetailSheet
        open={detailName !== null}
        name={detailName}
        onClose={() => setDetailName(null)}
      />

      <NewLeadModal
        open={newLeadOpen}
        language={language}
        onClose={() => setNewLeadOpen(false)}
        onCreated={() => {
          setNewLeadOpen(false);
          void load({ silent: true });
        }}
      />
    </section>
  );
}

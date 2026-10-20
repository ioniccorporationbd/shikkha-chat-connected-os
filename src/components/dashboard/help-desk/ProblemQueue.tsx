"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowRight, FiEye, FiInbox, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";

import HelpDeskBackButton from "@/components/dashboard/help-desk/HelpDeskBackButton";

import ProblemDetailCard from "@/components/dashboard/help-desk/ProblemDetailCard";
import ListPagination from "@/components/dashboard/ListPagination";
import { genericPaginationCopy } from "@/lib/dashboard/list-controls";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import {
  conversationPriorityLabel,
  conversationStatusLabel,
  conversationCopyFor,
} from "@/lib/help-desk/conversation-copy";
import { STATUS_TONE, PRIORITY_TONE } from "@/lib/help-desk/config";
import { listConversations } from "@/lib/help-desk/conversations";
import { formatDate, formatTime } from "@/lib/help-desk/format";
import type { ConversationSummary } from "@/lib/help-desk/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";
const ROWS_OPTIONS = [10, 20, 50] as const;

/** How long the search box waits after the last keystroke before it queries. */
const SEARCH_DEBOUNCE_MS = 320;

/**
 * The employee's two problem worklists.
 *
 * `open` is the New Problem queue: only tickets the ERP still reports as
 * `open` — the ones nobody has started working on. `solve` is the Solve Problem
 * queue: everything that has already left that untouched state (in progress,
 * waiting for the customer, resolved or closed).
 *
 * The split is a server-side status filter on the same conversation listing the
 * Messages index uses (`statuses=open` / `statuses=not_open`), so both queues
 * always agree with the ticket data — the browser never re-filters a page.
 * "View details" opens the problem card in place; the queue does not navigate
 * away, and refetches after a reply or a status change.
 */
export default function ProblemQueue({
  language,
  mode,
}: {
  language: string;
  /** `open` = New Problem, `solve` = Solve Problem. */
  mode: "open" | "solve";
}) {
  const copy = useMemo(() => conversationCopyFor(language), [language]);
  const paginationCopy = useMemo(() => genericPaginationCopy(language), [language]);

  /**
   * The timestamp a row is dated by. New Problem rows are dated by submission;
   * Solve Problem rows by the moment the ticket left Open (`resolution_date`,
   * falling back to submission then last activity when the ERP has no date).
   */
  const closedStamp = useCallback(
    (row: ConversationSummary) =>
      mode === "solve"
        ? row.resolvedAt || row.submittedAt || row.lastMessageAt
        : row.submittedAt || row.lastMessageAt,
    [mode],
  );

  const [rows, setRows] = useState<ConversationSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Title filter debounces like the search box so typing does not fire a query
  // per keystroke; dates apply immediately (they come from a picker).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTitleFilter(titleInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [titleInput]);

  const load = useCallback(async () => {
    try {
      const data = await listConversations({
        search,
        title: titleFilter,
        fromDate,
        toDate,
        dateField: "created",
        page,
        pageSize: rowsPerPage,
        includeEmpty: true,
        statuses: mode === "open" ? "open" : "not_open",
      });
      setRows(data.conversations);
      setTotal(data.total);
      setError(false);
    } catch {
      setRows([]);
      setTotal(0);
      setError(true);
    }
  }, [fromDate, mode, page, rowsPerPage, search, titleFilter, toDate]);

  // Shared header reload → refetch this worklist (its data lives in local state).
  useReloadHandler(load);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const retry = () => {
    setError(false);
    setRows(null);
    void load();
  };

  const list = rows ?? [];
  const pageCount = Math.max(1, Math.ceil(total / rowsPerPage));
  const rangeStart = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const rangeEnd = Math.min(page * rowsPerPage, total);

  const title = mode === "open" ? copy.queueNewTitle : copy.queueSolveTitle;
  const subtitle = mode === "open" ? copy.queueNewSubtitle : copy.queueSolveSubtitle;
  const emptyTitle = mode === "open" ? copy.queueNewEmptyTitle : copy.queueSolveEmptyTitle;
  const emptyHint = mode === "open" ? copy.queueNewEmptyHint : copy.queueSolveEmptyHint;

  return (
    <div className="flex flex-col gap-4">
      <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref="/userDashboard/help-desk" />

      {/* Heading + search */}
      <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 ${CARD_SHADOW} sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[19px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[21px]">
                {title}
              </h1>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">
                {copy.queueCount(total)}
              </span>
            </div>
            <p className="mt-0.5 max-w-2xl text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {subtitle}
            </p>
          </div>

          <label className="flex w-full items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3 py-2 lg:w-80">
            <FiSearch size={14} className="flex-none text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]" aria-hidden />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={copy.problemsSearch}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
            />
          </label>
        </div>

        {/* Date range + title: applied by the ERP before counting and paging, so
            the total and the visible rows always describe the same result set. */}
        <div className="mt-3 grid gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-3 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,150px))_minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.filtersFrom}
            </span>
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => {
                setFromDate(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-2.5 text-[12.5px] text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.filtersTo}
            </span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => {
                setToDate(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-2.5 text-[12.5px] text-[var(--color-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.filtersTitle}
            </span>
            <div className="flex h-9 items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-2.5">
              <FiSearch size={13} className="flex-none text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]" aria-hidden />
              <input
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
                placeholder={copy.filtersTitlePlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[12.5px] text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
              />
            </div>
          </label>

          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setTitleInput("");
              setTitleFilter("");
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
            disabled={!fromDate && !toDate && !titleFilter && !search}
            className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-[color-mix(in_srgb,var(--color-action)_38%,transparent)] px-3 text-[12px] font-bold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_8%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-40 lg:self-end"
          >
            <FiX size={13} aria-hidden />
            {copy.filtersClear}
          </button>
        </div>
      </section>

      {rows === null ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 ${CARD_SHADOW}`} aria-busy="true">
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <p className="text-[14px] font-semibold text-[var(--color-primary)]">{copy.messagesErrorTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">{copy.messagesErrorHint}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]"
          >
            <FiRefreshCw size={13} aria-hidden />
            {copy.messagesRetry}
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-8 text-center ${CARD_SHADOW}`}>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiInbox size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{emptyTitle}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">{emptyHint}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <section className={`hidden overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW} lg:block`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[58rem] border-collapse text-left">
                <thead>
                  <tr className="bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))]">
                    {[copy.colSl, copy.colTicket, copy.colCustomer, copy.colSubject, copy.colPriority, copy.colStatus, mode === "solve" ? copy.colClosedAt : copy.colSubmitted, copy.colAction].map(
                      (label) => (
                        <th
                          key={label}
                          className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]"
                        >
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, index) => (
                    <tr
                      key={row.ticketId}
                      className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
                    >
                      <td className="px-3 py-2.5 text-[12px] tabular-nums text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                        {(page - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[11px] font-bold text-[var(--color-primary)]">
                          {row.ticketId}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12.5px] font-semibold text-[var(--color-primary)]">
                        {row.customer}
                        {row.unread > 0 ? (
                          <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-action)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-white)]">
                            {row.unread}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[18rem] px-3 py-2.5">
                        <span className="block truncate text-[13px] font-semibold text-[var(--color-primary)]">{row.subject}</span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                          {row.lastMessage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${PRIORITY_TONE[row.priority]} 13%, white)`,
                            color: PRIORITY_TONE[row.priority],
                          }}
                        >
                          {conversationPriorityLabel[row.priority]?.[language === "en" ? "en" : "bn"] ?? row.priority}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${STATUS_TONE[row.status]} 13%, white)`,
                            color: STATUS_TONE[row.status],
                          }}
                        >
                          {conversationStatusLabel[row.status]?.[language === "en" ? "en" : "bn"] ?? row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="block text-[12px] font-semibold text-[var(--color-primary)]">
                          {formatDate(closedStamp(row), language)}
                        </span>
                        <span className="block text-[11px] font-medium tabular-nums text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                          {formatTime(closedStamp(row), language)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelected(row.ticketId)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-2.5 py-1.5 text-[11.5px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                        >
                          <FiEye size={12} aria-hidden />
                          {copy.queueViewDetails}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2.5 lg:hidden">
            {list.map((row) => (
              <li key={row.ticketId}>
                <button
                  type="button"
                  onClick={() => setSelected(row.ticketId)}
                  className={`block w-full rounded-2xl border ${CARD_BORDER} bg-[var(--color-white)] p-3.5 text-left ${CARD_SHADOW} transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)]`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] px-2 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">
                      {row.ticketId}
                    </span>
                    {row.unread > 0 ? (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--color-action)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-white)]">
                        {row.unread}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-[13.5px] font-semibold text-[var(--color-primary)]">{row.subject}</p>
                  <p className="mt-0.5 truncate text-[11.5px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,transparent)]">
                    {row.customer}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${STATUS_TONE[row.status]} 13%, white)`,
                        color: STATUS_TONE[row.status],
                      }}
                    >
                      {conversationStatusLabel[row.status]?.[language === "en" ? "en" : "bn"] ?? row.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {mode === "solve" && row.status === "closed" ? (
                        <span className="font-bold">{copy.stampClosed}</span>
                      ) : null}
                      <span>{formatDate(closedStamp(row), language)}</span>
                      <span className="font-semibold tabular-nums text-[var(--color-primary)]">{formatTime(closedStamp(row), language)}</span>
                    </span>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--color-primary)]">
                    {copy.queueViewDetails}
                    <FiArrowRight size={12} aria-hidden />
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <ListPagination
            copy={paginationCopy}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={total}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_OPTIONS}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(1);
            }}
          />
        </>
      )}

      {selected ? (
        <ProblemDetailCard
          ticketId={selected}
          language={language}
          onClose={() => setSelected(null)}
          onChanged={() => void load()}
        />
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiInbox, FiPlus, FiSearch, FiX } from "react-icons/fi";

import ListPagination from "@/components/dashboard/ListPagination";
import ShikkhaLoader from "@/components/dashboard/ShikkhaLoader";
import { HelpDeskErrorState } from "@/components/help-desk/HelpDeskStates";
import TicketEmptyState from "@/components/help-desk/TicketEmptyState";
import TicketList from "@/components/help-desk/TicketList";
import { genericPaginationCopy } from "@/lib/dashboard/list-controls";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { sortTicketsSmart, unseenSupportIds } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";

import HelpDeskBackButton from "./HelpDeskBackButton";

/** Page sizes offered under the table: 10 (default), 20 and 50 only. */
const ROWS_OPTIONS = [10, 20, 50] as const;
const DEFAULT_ROWS = 10;

export type TicketBoardVariant = "open" | "closed";

/** Which statuses belong to each board. */
const STATUS_BY_VARIANT: Record<TicketBoardVariant, string> = {
  open: "open",
  closed: "closed",
};

/**
 * A ticket board: one status, no filters.
 *
 * `open` renders the customer's open tickets, `closed` renders the solved
 * tickets — same table, same paging, same chrome, only the predicate and the
 * copy differ. No status chips, no search: the section title says what it
 * shows, so the list never needs filtering.
 */
export default function HelpDeskTicketBoard({
  copy,
  language,
  basePath,
  variant,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
  variant: TicketBoardVariant;
}) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [titleFilter, setTitleFilter] = useState("");

  const isSolved = variant === "closed";
  const links = helpDeskLinks(basePath);
  // Solved rows open the ticket conversation: solution, requirements, full history.

  const load = useCallback(async () => {
    try {
      setTickets(await listTickets());
    } catch {
      setLoadError(true);
      setTickets([]);
    }
  }, []);

  // Shared header reload → refetch this board (its data lives in local state).
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
    setLoadError(false);
    setTickets(null);
    void load();
  };

  const unseen = useMemo(() => unseenSupportIds(tickets ?? []), [tickets]);

  const wanted = STATUS_BY_VARIANT[variant];

  // This board already holds every authorised ticket in memory, so the date and
  // title filters run here and the visible total stays exact (no partial page
  // is ever filtered). Open rows are dated by submission; solved rows by their
  // resolution day, falling back to the last update when no date was recorded.
  const rows = useMemo(() => {
    const needle = titleFilter.trim().toLowerCase();
    const start = fromDate ? `${fromDate}T00:00:00` : "";
    const end = toDate ? `${toDate}T23:59:59.999` : "";
    return sortTicketsSmart(
      (tickets ?? []).filter((ticket) => {
        if (ticket.status !== wanted) return false;
        if (needle && !ticket.subject.toLowerCase().includes(needle)) return false;
        if (!start && !end) return true;
        const raw = isSolved ? ticket.resolvedAt || ticket.updatedAt : ticket.createdAt;
        if (!raw) return false;
        if (start && raw < start) return false;
        if (end && raw > end) return false;
        return true;
      }),
    );
  }, [fromDate, isSolved, tickets, titleFilter, toDate, wanted]);

  const filtersActive = Boolean(fromDate || toDate || titleFilter.trim());

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * rowsPerPage;
  const visible = rows.slice(start, start + rowsPerPage);

  const paginationCopy = useMemo(() => genericPaginationCopy(language), [language]);

  const Icon = isSolved ? FiCheckCircle : FiInbox;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HelpDeskBackButton label={copy.back} homeLabel={copy.helpDeskHome} fallbackHref={basePath} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-3 py-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
          {isSolved ? copy.solvedOnlyNote : copy.openOnlyNote}
        </span>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_40px_-34px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <Icon size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[20px]">
              {isSolved ? copy.solvedTitle : copy.listTitle}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {isSolved ? copy.solvedSubtitle : copy.listSubtitle}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href={isSolved ? links.tickets : links.solved}
          className="inline-flex flex-none items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] focus-visible:ring-offset-2"
        >
          {isSolved ? <FiInbox size={16} aria-hidden /> : <FiCheckCircle size={16} aria-hidden />}
          {isSolved ? copy.quickOpenTickets : copy.quickResolvedTickets}
        </Link>
        <Link
          href={links.newTicket}
          className="inline-flex flex-none items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 text-sm font-bold text-[var(--color-white)] shadow-[0_14px_26px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
        >
          <FiPlus size={16} className="text-[var(--color-white)]" aria-hidden />
          <span className="font-bold text-[var(--color-white)]">{copy.navNewTicket}</span>
        </Link>
        </div>
      </div>

      {/* Date range + title. Applied to the already-authorised full set held by
          this board, so the pagination total is always the real match count. */}
      <div className="grid gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-3 sm:grid-cols-2 lg:grid-cols-[repeat(2,minmax(0,150px))_minmax(0,1fr)_auto]">
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
              value={titleFilter}
              onChange={(event) => {
                setTitleFilter(event.target.value);
                setPage(1);
              }}
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
            setTitleFilter("");
            setPage(1);
          }}
          disabled={!filtersActive}
          className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 self-start rounded-xl border border-[color-mix(in_srgb,var(--color-action)_38%,transparent)] px-3 text-[12px] font-bold text-[var(--color-action)] transition hover:bg-[color-mix(in_srgb,var(--color-action)_8%,var(--color-white))] disabled:cursor-not-allowed disabled:opacity-40 lg:self-end"
        >
          <FiX size={13} aria-hidden />
          {copy.filtersClear}
        </button>
      </div>

      {tickets === null ? (
        <ShikkhaLoader size="lg" label={copy.loadingTickets} className="py-12" />
      ) : loadError ? (
        <HelpDeskErrorState copy={copy} onRetry={retry} basePath={basePath} />
      ) : rows.length === 0 && filtersActive ? (
        <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiSearch size={22} aria-hidden />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-[var(--color-primary)]">{copy.filtersActive}</p>
          <p className="mt-1 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            {copy.filtersClear} →
          </p>
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setTitleFilter("");
              setPage(1);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
          >
            <FiX size={13} className="text-[var(--color-white)]" aria-hidden />
            {copy.filtersClear}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <TicketEmptyState
          copy={copy}
          basePath={basePath}
          title={isSolved ? copy.solvedEmptyTitle : copy.emptyTitle}
          hint={isSolved ? copy.solvedEmptyHint : copy.emptyHint}
        />
      ) : (
        <>
          <TicketList
            tickets={visible}
            copy={copy}
            language={language}
            basePath={basePath}
            unseenIds={unseen}
            slStart={start + 1}
            stamp={isSolved ? "resolved" : "created"}
          />
          <ListPagination
            copy={paginationCopy}
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            rangeStart={start + 1}
            rangeEnd={start + visible.length}
            total={rows.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_OPTIONS}
            onRowsPerPageChange={(next) => {
              setRowsPerPage(next);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

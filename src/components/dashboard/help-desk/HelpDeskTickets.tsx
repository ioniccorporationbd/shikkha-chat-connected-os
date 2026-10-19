"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiInbox, FiPlus } from "react-icons/fi";

import { HelpDeskErrorState } from "@/components/help-desk/HelpDeskStates";
import ShikkhaLoader from "@/components/dashboard/ShikkhaLoader";
import TicketEmptyState from "@/components/help-desk/TicketEmptyState";
import TicketList from "@/components/help-desk/TicketList";
import ListPagination from "@/components/dashboard/ListPagination";
import { sortTicketsSmart, unseenSupportIds } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";
import { genericPaginationCopy } from "@/lib/dashboard/list-controls";

import HelpDeskBackButton from "./HelpDeskBackButton";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";

/** Page sizes offered under the table: 10 (default), 20 and 50 only. */
const ROWS_OPTIONS = [10, 20, 50] as const;
const DEFAULT_ROWS = 10;

/**
 * Open tickets panel.
 *
 * This section is deliberately unfiltered: it shows the customer's tickets
 * whose status is `open` and nothing else, so there are no chips, no search box
 * and no "all / resolved" toggles. The table is styled like the Service panel
 * (SL column, mint header, one outline action per row) and pages at 10 / 20 / 50
 * rows exactly like the Service table's page-size control.
 */
export default function HelpDeskTickets({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_ROWS);

  const load = useCallback(async () => {
    try {
      setTickets(await listTickets());
    } catch {
      setLoadError(true);
      setTickets([]);
    }
  }, []);

  // Shared header reload → refetch this panel (its data lives in local state).
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

  // Only `open` tickets belong in this section — no status chips, no search.
  const openTickets = useMemo(
    () => sortTicketsSmart((tickets ?? []).filter((ticket) => ticket.status === "open")),
    [tickets],
  );

  const pageCount = Math.max(1, Math.ceil(openTickets.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * rowsPerPage;
  const visible = openTickets.slice(start, start + rowsPerPage);

  const paginationCopy = useMemo(() => genericPaginationCopy(language), [language]);
  const links = helpDeskLinks(basePath);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HelpDeskBackButton label={copy.back} fallbackHref={basePath} />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] px-3 py-1 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden />
          {copy.openOnlyNote}
        </span>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_18px_40px_-34px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
            <FiInbox size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[20px]">{copy.listTitle}</h1>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">{copy.listSubtitle}</p>
          </div>
        </div>
        <Link
          href={links.newTicket}
          className="inline-flex flex-none items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 text-sm font-semibold text-[var(--color-white)] shadow-[0_14px_26px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
        >
          <FiPlus size={16} aria-hidden />
          {copy.navNewTicket}
        </Link>
      </div>

      {tickets === null ? (
        <ShikkhaLoader size="lg" label={copy.loadingTickets} className="py-12" />
      ) : loadError ? (
        <HelpDeskErrorState copy={copy} onRetry={retry} basePath={basePath} />
      ) : openTickets.length === 0 ? (
        <TicketEmptyState copy={copy} basePath={basePath} />
      ) : (
        <>
          <TicketList
            tickets={visible}
            copy={copy}
            language={language}
            basePath={basePath}
            unseenIds={unseen}
            slStart={start + 1}
          />
          <ListPagination
            copy={paginationCopy}
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            rangeStart={start + 1}
            rangeEnd={start + visible.length}
            total={openTickets.length}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={ROWS_OPTIONS}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setPage(1);
            }}
          />
        </>
      )}
    </div>
  );
}

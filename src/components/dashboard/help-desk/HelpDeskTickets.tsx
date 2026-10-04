"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { HelpDeskErrorState, TicketListSkeleton } from "@/components/help-desk/HelpDeskStates";
import TicketEmptyState from "@/components/help-desk/TicketEmptyState";
import TicketFilters from "@/components/help-desk/TicketFilters";
import TicketList from "@/components/help-desk/TicketList";
import { sortTicketsSmart, unseenSupportIds } from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket, TicketFilterState, TicketStatus } from "@/lib/help-desk/types";

import HelpDeskBreadcrumb from "./HelpDeskBreadcrumb";

const STATUS_VALUES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_for_user",
  "resolved",
  "closed",
];

/**
 * The ticket list, rendered inside the dashboard content area. Adds the smart
 * attention-first sort and the "new reply" indicator on top of the shared
 * list / filter / card components; the filter can be seeded from a quick-action
 * query string (`?status=…` / `?q=…` / `?focus=search`).
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
  const [filter, setFilter] = useState<TicketFilterState>({ status: "all", query: "" });

  // Seed the filter from the query string written by the overview quick actions.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    const queryParam = params.get("q") ?? "";
    const wantsFocus = params.get("focus") === "search";

    queueMicrotask(() => {
      setFilter((current) => ({
        status:
          statusParam && (STATUS_VALUES as readonly string[]).includes(statusParam)
            ? (statusParam as TicketStatus)
            : current.status,
        query: queryParam || current.query,
      }));
    });

    if (!wantsFocus) return undefined;

    const timer = window.setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  const load = useCallback(async () => {
    try {
      setTickets(await listTickets());
    } catch {
      setLoadError(true);
      setTickets([]);
    }
  }, []);

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

  const filtered = useMemo(() => {
    const query = filter.query.trim().toLowerCase();
    const list = (tickets ?? []).filter((ticket) => {
      const statusOk = filter.status === "all" || ticket.status === filter.status;
      if (!statusOk) return false;
      if (!query) return true;
      const categoryLabel = (copy.categories[ticket.category] ?? "").toLowerCase();
      return (
        ticket.id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        categoryLabel.includes(query)
      );
    });
    return sortTicketsSmart(list);
  }, [tickets, filter, copy]);

  const hasFilter = filter.status !== "all" || filter.query.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <HelpDeskBreadcrumb copy={copy} basePath={basePath} crumbs={[{ label: copy.listTitle }]} />

      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-primary)] sm:text-[21px]">{copy.listTitle}</h1>
        <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
          {copy.listSubtitle}
        </p>
      </div>

      <TicketFilters copy={copy} value={filter} onChange={setFilter} />

      {tickets === null ? (
        <TicketListSkeleton rows={4} />
      ) : loadError ? (
        <HelpDeskErrorState copy={copy} onRetry={retry} basePath={basePath} />
      ) : tickets.length === 0 ? (
        <TicketEmptyState copy={copy} basePath={basePath} />
      ) : (
        <TicketList
          tickets={filtered}
          copy={copy}
          language={language}
          hasFilter={hasFilter}
          basePath={basePath}
          unseenIds={unseen}
        />
      )}
    </div>
  );
}

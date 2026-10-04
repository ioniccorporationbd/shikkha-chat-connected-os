"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiLogIn } from "react-icons/fi";

import GuestTicketLookup from "@/components/help-desk/GuestTicketLookup";
import HelpDeskShell from "@/components/help-desk/HelpDeskShell";
import { HelpDeskErrorState, TicketListSkeleton } from "@/components/help-desk/HelpDeskStates";
import TicketEmptyState from "@/components/help-desk/TicketEmptyState";
import TicketFilters from "@/components/help-desk/TicketFilters";
import TicketList from "@/components/help-desk/TicketList";
import { useAuthStore } from "@/lib/auth/store";
import { LOGIN_PATH } from "@/lib/auth/session";
import { HD_CARD } from "@/lib/help-desk/config";
import { byUpdatedDesc } from "@/lib/help-desk/format";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";
import { listMyTickets, ownerKeyForContact } from "@/lib/help-desk/service";
import type { Ticket, TicketFilterState } from "@/lib/help-desk/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * Public My Tickets route — `/help-desk/tickets`.
 *
 * Signed-in users see their own tickets (filtered by the mock owner key);
 * guests get the tracking lookup plus a login prompt. Ownership filtering here
 * is a mock-phase convenience — the backend must enforce it server-side later.
 */
export default function HelpDeskTicketsPage() {
  const { language } = useLanguage();
  const copy = helpDeskCopyFor(language);

  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const authed = status === "authenticated" && Boolean(user);

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<TicketFilterState>({ status: "all", query: "" });

  const load = useCallback(async () => {
    if (!authed || !user) return;
    try {
      const key = ownerKeyForContact({ email: user.email, name: user.full_name });
      const mine = await listMyTickets(key);
      setTickets(mine.sort(byUpdatedDesc));
    } catch {
      setLoadError(true);
      setTickets([]);
    }
  }, [authed, user]);

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

  const filtered = useMemo(() => {
    const list = tickets ?? [];
    const query = filter.query.trim().toLowerCase();
    return list.filter((ticket) => {
      const statusOk = filter.status === "all" || ticket.status === filter.status;
      const queryOk =
        !query || ticket.id.toLowerCase().includes(query) || ticket.subject.toLowerCase().includes(query);
      return statusOk && queryOk;
    });
  }, [tickets, filter]);

  const hasFilter = filter.status !== "all" || filter.query.trim().length > 0;

  return (
    <HelpDeskShell active="tickets">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">{copy.listTitle}</h1>
        <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--color-primary)_68%,var(--color-white))]">
          {copy.listSubtitle}
        </p>
      </div>

      {!authed ? (
        <div className="space-y-4">
          <section className={`${HD_CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
            <div>
              <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.listGuestTitle}</h2>
              <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
                {copy.listGuestHint}
              </p>
            </div>
            <Link
              href={LOGIN_PATH}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
            >
              <FiLogIn className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
              <span className="text-sm font-semibold text-[var(--color-white)]">{copy.navLogin}</span>
            </Link>
          </section>
          <GuestTicketLookup copy={copy} language={language} />
        </div>
      ) : (
        <div className="space-y-5">
          <TicketFilters copy={copy} value={filter} onChange={setFilter} />

          {tickets === null ? (
            <TicketListSkeleton rows={4} />
          ) : loadError ? (
            <HelpDeskErrorState copy={copy} onRetry={retry} />
          ) : tickets.length === 0 ? (
            <TicketEmptyState copy={copy} />
          ) : (
            <TicketList tickets={filtered} copy={copy} language={language} hasFilter={hasFilter} />
          )}
        </div>
      )}
    </HelpDeskShell>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiHeadphones,
  FiInbox,
  FiList,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import { HelpDeskErrorState, TicketListSkeleton } from "@/components/help-desk/HelpDeskStates";
import TicketStatusBadge from "@/components/help-desk/TicketStatusBadge";
import { STATUS_TONE, PRIORITY_TONE } from "@/lib/help-desk/config";
import { isHelpDeskDemoEnabled } from "@/lib/help-desk/demo";
import { formatDateTime } from "@/lib/help-desk/format";
import {
  isUnresolved,
  latestSupportReply,
  sortTicketsSmart,
  summariseTickets,
  unseenSupportIds,
} from "@/lib/help-desk/insights";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/**
 * The smart Help Desk landing rendered inside the dashboard content area:
 * a branded hero, data-driven summary cards, quick actions, recent activity and
 * an unresolved spotlight. Every figure is computed from the ticket data.
 */
export default function HelpDeskOverview({
  copy,
  language,
  basePath,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
}) {
  const links = helpDeskLinks(basePath);

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await listTickets();
      setTickets(all);
    } catch {
      setError(true);
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
    setError(false);
    setTickets(null);
    void load();
  };

  const list = tickets ?? [];
  const summary = useMemo(() => summariseTickets(list), [list]);
  const unseen = useMemo(() => unseenSupportIds(list), [list]);
  const recent = useMemo(() => sortTicketsSmart(list).slice(0, 4), [list]);
  const unresolved = useMemo(() => list.filter((ticket) => isUnresolved(ticket.status)).slice(0, 4), [list]);

  const summaryCards: { key: string; label: string; value: number; tone: string; icon: typeof FiInbox }[] = [
    { key: "total", label: copy.summaryTotal, value: summary.total, tone: "#071e2e", icon: FiInbox },
    { key: "open", label: copy.statuses.open, value: summary.open, tone: STATUS_TONE.open, icon: FiAlertCircle },
    { key: "in_progress", label: copy.statuses.in_progress, value: summary.inProgress, tone: STATUS_TONE.in_progress, icon: FiRefreshCw },
    { key: "waiting", label: copy.statuses.waiting_for_user, value: summary.waiting, tone: STATUS_TONE.waiting_for_user, icon: FiClock },
    { key: "resolved", label: copy.statuses.resolved, value: summary.resolved, tone: STATUS_TONE.resolved, icon: FiCheckCircle },
  ];

  const quickActions: { key: string; label: string; href: string; icon: typeof FiPlusCircle }[] = [
    { key: "new", label: copy.navNewTicket, href: links.newTicket, icon: FiPlusCircle },
    { key: "open", label: copy.quickOpenTickets, href: `${links.tickets}?status=open`, icon: FiInbox },
    { key: "resolved", label: copy.quickResolvedTickets, href: `${links.tickets}?status=resolved`, icon: FiCheckCircle },
    { key: "search", label: copy.quickSearchTickets, href: `${links.tickets}?focus=search`, icon: FiSearch },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <section className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}>
        <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))_0%,var(--color-white)_72%)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]">
              <FiHeadphones size={24} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-semibold leading-tight sm:text-[23px]">
                {copy.overviewTitle}
              </h1>
              <p className="mt-0.5 max-w-2xl text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                {copy.overviewSubtitle}
              </p>
              {isHelpDeskDemoEnabled() ? (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-white)]">
                  {copy.demoBadge}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={links.newTicket}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
            >
              <FiPlusCircle size={15} className="text-[var(--color-white)]" aria-hidden />
              <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.navNewTicket}</span>
            </Link>
            <Link
              href={links.tickets}
              className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
            >
              <FiList size={15} className="text-[var(--color-primary)]" aria-hidden />
              <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.listTitle}</span>
            </Link>
          </div>
        </div>
      </section>

      {tickets === null ? (
        <TicketListSkeleton rows={3} />
      ) : error ? (
        <HelpDeskErrorState copy={copy} onRetry={retry} />
      ) : (
        <>
          {/* Summary */}
          <section className="flex flex-col gap-3">
            <h2 className="px-1 text-[15px] font-semibold">{copy.summaryHeading}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {summaryCards.map((card) => (
                <SummaryCard key={card.key} label={card.label} value={card.value} tone={card.tone} icon={card.icon} />
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:p-6`}>
            <h2 className="text-[15px] font-semibold">{copy.quickActions}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] text-[var(--color-primary)]">
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--color-primary)]">{action.label}</span>
                    <FiArrowRight
                      size={15}
                      className="ml-auto text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent + unresolved */}
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold">{copy.recentActivity}</h2>
                <Link
                  href={links.tickets}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                >
                  <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.landingViewAll}</span>
                  <FiArrowRight size={14} className="text-[var(--color-primary)]" aria-hidden />
                </Link>
              </div>

              {recent.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {copy.recentEmpty}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {recent.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      copy={copy}
                      language={language}
                      href={links.ticket(ticket.id)}
                      unseen={unseen}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:p-6`}>
              <h2 className="text-[15px] font-semibold">{copy.unresolvedHeading}</h2>
              {unresolved.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {copy.unresolvedEmpty}
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {unresolved.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={links.ticket(ticket.id)}
                        className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-3 py-2.5 transition hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PRIORITY_TONE[ticket.priority] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-[var(--color-primary)]">
                            {ticket.subject}
                          </span>
                          <span className="block text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                            {ticket.id} · {copy.priorities[ticket.priority]}
                          </span>
                        </span>
                        <TicketStatusBadge status={ticket.status} copy={copy} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: string;
  icon: typeof FiInbox;
}) {
  return (
    <div className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 ${CARD_SHADOW}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ backgroundColor: `color-mix(in srgb, ${tone} 16%, white)`, color: tone }}
        >
          <Icon size={17} aria-hidden />
        </span>
        <span className="text-[26px] font-bold leading-none text-[var(--color-primary)]">{value}</span>
      </div>
      <p className="mt-3 text-[12.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
        {label}
      </p>
    </div>
  );
}

function TicketRow({
  ticket,
  copy,
  language,
  href,
  unseen,
}: {
  ticket: Ticket;
  copy: HelpDeskCopy;
  language: string;
  href: string;
  unseen: ReadonlySet<string>;
}) {
  const reply = latestSupportReply(ticket);
  const showNew = unseen.has(ticket.id) && Boolean(reply);

  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold text-[var(--color-primary)]">{ticket.subject}</span>
            {showNew ? (
              <span className="shrink-0 rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-white)]">
                {copy.newReplyBadge}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {ticket.id} · {formatDateTime(ticket.updatedAt, language)}
          </span>
        </span>
        <TicketStatusBadge status={ticket.status} copy={copy} />
        <FiArrowRight size={15} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" aria-hidden />
      </Link>
    </li>
  );
}

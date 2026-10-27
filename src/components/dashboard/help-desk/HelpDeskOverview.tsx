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
  FiTool,
} from "react-icons/fi";

import { HelpDeskErrorState, TicketListSkeleton } from "@/components/help-desk/HelpDeskStates";
import NotificationBadge from "@/components/dashboard/help-desk/NotificationBadge";
import TicketStatusBadge from "@/components/help-desk/TicketStatusBadge";
import { STATUS_TONE, PRIORITY_TONE } from "@/lib/help-desk/config";
import { useReloadHandler } from "@/lib/dashboard/reload-registry";
import { formatDateTimeNumeric } from "@/lib/help-desk/format";
import { useHelpDeskBadges } from "@/lib/help-desk/use-badges";
import type { HelpDeskBadgeCounts } from "@/lib/help-desk/types";
import {
  isUnresolved,
  latestSupportReply,
  sortTicketsSmart,
  summariseTickets,
  unseenSupportIds,
} from "@/lib/help-desk/insights";
import { conversationCopyFor } from "@/lib/help-desk/conversation-copy";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import { listTickets } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";

import HelpDeskBackButton from "./HelpDeskBackButton";

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
  staff = false,
}: {
  copy: HelpDeskCopy;
  language: string;
  basePath: string;
  /** Employees also get the problem-management queue. */
  staff?: boolean;
}) {
  const links = helpDeskLinks(basePath);
  const conversationCopy = conversationCopyFor(language);

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
    setError(false);
    setTickets(null);
    void load();
  };

  const list = tickets ?? [];
  const summary = useMemo(() => summariseTickets(list), [list]);
  const unseen = useMemo(() => unseenSupportIds(list), [list]);
  const recent = useMemo(() => sortTicketsSmart(list).slice(0, 4), [list]);
  const unresolved = useMemo(() => list.filter((ticket) => isUnresolved(ticket.status)).slice(0, 4), [list]);

  // Real unread activity, straight from the ERP. Zero never renders a badge and
  // the New Ticket / file-ticket action never carries one.
  const badges = useHelpDeskBadges();

  const summaryCards: { key: string; label: string; value: number; tone: string; icon: typeof FiInbox }[] = [
    { key: "total", label: copy.summaryTotal, value: summary.total, tone: "var(--color-primary)", icon: FiInbox },
    { key: "open", label: copy.statuses.open, value: summary.open, tone: STATUS_TONE.open, icon: FiAlertCircle },
    { key: "waiting", label: copy.statuses.waiting_for_user, value: summary.waiting, tone: "#c98a1f", icon: FiClock },
    { key: "resolved", label: copy.statuses.resolved, value: summary.resolved, tone: STATUS_TONE.resolved, icon: FiCheckCircle },
  ];

  // The employee overview mirrors the customer one but its section buttons are
  // the two worklists the help desk is built around: New Problem (open tickets
  // only) and Solve Problem (everything already worked on). The customer keeps
  // file-ticket / open / solved. Messages is deliberately absent on both sides:
  // replies live on the ticket itself, so a separate inbox duplicated the
  // timeline and split unread state.
  const quickActions: { key: string; label: string; href: string; icon: typeof FiPlusCircle }[] = staff
    ? [
        { key: "new-problem", label: conversationCopy.navNewProblem, href: links.problems, icon: FiInbox },
        { key: "solve-problem", label: conversationCopy.navSolveProblem, href: links.solved, icon: FiTool },
      ]
    : [
        { key: "new", label: copy.navNewTicket, href: links.newTicket, icon: FiPlusCircle },
        { key: "open", label: copy.quickOpenTickets, href: links.tickets, icon: FiInbox },
        { key: "solved", label: copy.quickResolvedTickets, href: links.solved, icon: FiCheckCircle },
      ];

  // Hero buttons: the employee jumps straight into the New Problem queue; the
  // customer's two buttons (file a ticket / open list) are unchanged.
  const heroActions: { key: string; label: string; href: string; icon: typeof FiPlusCircle }[] = staff
    ? [
        { key: "new-problem", label: conversationCopy.navNewProblem, href: links.problems, icon: FiInbox },
      ]
    : [
        { key: "new", label: copy.navNewTicket, href: links.newTicket, icon: FiPlusCircle },
        { key: "list", label: copy.listTitle, href: links.tickets, icon: FiList },
      ];

  return (
    <div className="flex flex-col gap-4">
      <HelpDeskBackButton label={copy.back} fallbackHref="/" showHome={false} />

      {/* Hero */}
      <section className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}>
        <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))_0%,var(--color-white)_72%)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
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
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {heroActions.map((action, index) => {
              const Icon = action.icon;
              const primary = index === 0;
              return (
                <Link
                  key={action.key}
                  href={action.href}
                  className={
                    primary
                      ? "inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
                      : "inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  }
                >
                  <Icon size={15} className={primary ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"} aria-hidden />
                  <span className={primary ? "text-[13px] font-semibold text-[var(--color-white)]" : "text-[13px] font-semibold text-[var(--color-primary)]"}>
                    {action.label}
                  </span>
                  {primary ? null : (
                    <NotificationBadge count={badgeCountFor(action.key, badges)} label={action.label} />
                  )}
                </Link>
              );
            })}
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
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard key={card.key} label={card.label} value={card.value} tone={card.tone} icon={card.icon} />
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className={`rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:p-6`}>
            <h2 className="text-[15px] font-semibold">{copy.quickActions}</h2>
            <div className={`mt-3 grid gap-3 ${staff ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.key}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-white)]">
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-[var(--color-primary)]">{action.label}</span>
                      <NotificationBadge count={badgeCountFor(action.key, badges)} label={action.label} />
                    </span>
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
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
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
                        className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2.5 transition hover:border-[color-mix(in_srgb,var(--color-primary)_52%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PRIORITY_TONE[ticket.priority] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13px] font-semibold text-[var(--color-primary)]"
                            title={ticket.subject}
                          >
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
        className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_52%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              className="truncate text-[13.5px] font-semibold text-[var(--color-primary)]"
              title={ticket.subject}
            >
              {ticket.subject}
            </span>
            {showNew ? (
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-white))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
                {copy.newReplyBadge}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {ticket.id} · {formatDateTimeNumeric(ticket.updatedAt, language)}
          </span>
        </span>
        <TicketStatusBadge status={ticket.status} copy={copy} />
        <FiArrowRight size={15} className="text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" aria-hidden />
      </Link>
    </li>
  );
}

/** Which live count belongs to which section button (0 = no badge). */
function badgeCountFor(key: string, counts: HelpDeskBadgeCounts): number {
  switch (key) {
    case "new-problem":
      return counts.new_problem;
    case "solve-problem":
      return counts.solve_problem;
    case "open":
      return counts.open_tickets;
    case "solved":
      return counts.solved_tickets;
    default:
      // Filing a new ticket is never an unread state.
      return 0;
  }
}

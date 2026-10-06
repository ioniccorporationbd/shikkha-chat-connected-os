"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiArrowRight, FiClock, FiHeadphones, FiList, FiPlus, FiShield } from "react-icons/fi";

import { useAuthStore } from "@/lib/auth/store";
import {
  HELP_DESK_NEW_PATH,
  HELP_DESK_TICKETS_PATH,
  LOGIN_PATH,
} from "@/lib/auth/session";
import { HD_CARD, TICKET_CATEGORIES } from "@/lib/help-desk/config";
import { formatDateTime, byUpdatedDesc } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { listMyTickets, ownerKeyForContact } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";

import GuestTicketLookup from "./GuestTicketLookup";
import { TicketListSkeleton } from "./HelpDeskStates";
import TicketStatusBadge from "./TicketStatusBadge";
import TicketCategoryChip from "./TicketCategoryChip";

/** The Help Desk home page — hero, actions, guest lookup or recent tickets, topics. */
export default function HelpDeskLanding({
  copy,
  language,
}: {
  copy: HelpDeskCopy;
  language: string;
}) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const authed = status === "authenticated" && Boolean(user);

  const [recent, setRecent] = useState<Ticket[] | null>(null);

  const loadRecent = useCallback(async () => {
    if (!authed || !user) return;
    try {
      const key = ownerKeyForContact({ email: user.email, name: user.full_name });
      const mine = await listMyTickets(key);
      setRecent(mine.sort(byUpdatedDesc).slice(0, 3));
    } catch {
      setRecent([]);
    }
  }, [authed, user]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadRecent();
    });
    return () => {
      active = false;
    };
  }, [loadRecent]);

  const steps = [copy.landingStep1, copy.landingStep2, copy.landingStep3, copy.landingStep4];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section
        className={`${HD_CARD} relative overflow-hidden p-6 sm:p-9`}
        style={{
          backgroundImage:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 40%, white), white 60%)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-3xl bg-[var(--color-primary)] shadow-[0_14px_30px_color-mix(in_srgb,var(--color-primary)_34%,transparent)]">
            <FiHeadphones className="h-8 w-8 text-[var(--color-white)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] bg-[var(--color-white)] px-3 py-1">
              <FiShield className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
              <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.landingBadge}</span>
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-[var(--color-primary)] sm:text-3xl">
              {copy.title}
              <span className="ml-2 text-base font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
                {copy.titleEn}
              </span>
            </h1>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_78%,var(--color-white))]">
          {copy.subtitle}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={HELP_DESK_NEW_PATH}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 transition duration-200 hover:-translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
          >
            <FiPlus className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-white)]">{copy.landingCreate}</span>
          </Link>
          <Link
            href={HELP_DESK_TICKETS_PATH}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] px-5 py-3 transition duration-200 hover:-translate-y-[2px] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
          >
            <FiList className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.landingBrowse}</span>
          </Link>
        </div>

        <dl className="mt-6 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-[var(--color-primary)]">{copy.landingCreate}</dt>
            <dd className="text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
              {copy.landingCreateHint}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[var(--color-primary)]">{copy.landingBrowse}</dt>
            <dd className="text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
              {copy.landingBrowseHint}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: recent tickets (signed in) or guest lookup */}
        <div className="space-y-4">
          {authed ? (
            <section className={`${HD_CARD} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.landingMyTickets}</h2>
                <Link
                  href={HELP_DESK_TICKETS_PATH}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                >
                  <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.landingViewAll}</span>
                  <FiArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                </Link>
              </div>

              <div className="mt-4">
                {recent === null ? (
                  <TicketListSkeleton rows={3} />
                ) : recent.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_26%,var(--color-white))] p-5 text-center text-sm font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
                    {copy.landingMyTicketsEmpty}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recent.map((ticket) => (
                      <li key={ticket.id}>
                        <Link
                          href={`${HELP_DESK_TICKETS_PATH}/${ticket.id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-3 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
                              {ticket.id}
                            </span>
                            <span className="mt-0.5 block truncate text-sm font-semibold text-[var(--color-primary)]">
                              {ticket.subject}
                            </span>
                            <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
                              <FiClock className="h-3 w-3" aria-hidden />
                              {formatDateTime(ticket.updatedAt, language)}
                            </span>
                          </span>
                          <TicketStatusBadge status={ticket.status} copy={copy} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : (
            <>
              <GuestTicketLookup copy={copy} language={language} />
              <section className={`${HD_CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
                <p className="text-sm font-semibold text-[var(--color-primary)]">{copy.listGuestTitle}</p>
                <Link
                  href={LOGIN_PATH}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
                >
                  <span className="text-sm font-semibold text-[var(--color-white)]">{copy.navLogin}</span>
                </Link>
              </section>
            </>
          )}
        </div>

        {/* Right: topics + how it works */}
        <div className="space-y-4">
          <section className={`${HD_CARD} p-5`}>
            <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.landingTopicsTitle}</h2>
            <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--color-primary)_62%,var(--color-white))]">
              {copy.landingTopicsHint}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TICKET_CATEGORIES.map((category) => (
                <TicketCategoryChip key={category.id} category={category.id} copy={copy} />
              ))}
            </div>
          </section>

          <section className={`${HD_CARD} p-5`}>
            <h2 className="text-base font-bold text-[var(--color-primary)]">{copy.landingStepsTitle}</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-[var(--color-white)]">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-[var(--color-primary)]">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

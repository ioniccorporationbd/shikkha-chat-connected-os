"use client";

import Link from "next/link";
import { useState } from "react";
import { FiArrowRight, FiSearch } from "react-icons/fi";

import { HELP_DESK_TICKETS_PATH } from "@/lib/auth/session";
import { HD_CARD, HD_INPUT } from "@/lib/help-desk/config";
import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { lookupGuest } from "@/lib/help-desk/service";
import type { Ticket } from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

import TicketCategoryChip from "./TicketCategoryChip";
import TicketStatusBadge from "./TicketStatusBadge";

type Status = "idle" | "searching" | "found" | "notfound";

/**
 * Guest ticket tracking — no login, look a ticket up with its id + the email or
 * mobile used to file it. Powered by the mock service layer for now.
 */
export default function GuestTicketLookup({
  copy,
  language,
}: {
  copy: HelpDeskCopy;
  language: string;
}) {
  const [ticketId, setTicketId] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [match, setMatch] = useState<Ticket | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticketId.trim() || !contact.trim()) {
      toast.error(copy.toastValidationTicketId);
      return;
    }

    setStatus("searching");
    setMatch(null);
    const found = await lookupGuest(ticketId, contact);
    if (found) {
      setMatch(found);
      setStatus("found");
    } else {
      setStatus("notfound");
    }
  };

  return (
    <section className={`${HD_CARD} p-5 sm:p-6`} aria-labelledby="hd-guest-title">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_45%,var(--color-white))]">
          <FiSearch className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
        </span>
        <div>
          <h2 id="hd-guest-title" className="text-base font-bold text-[var(--color-primary)]">
            {copy.guestTitle}
          </h2>
          <p className="text-xs text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
            {copy.guestHint}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.guestTicketId}</span>
          <input
            type="text"
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
            placeholder={copy.guestPhTicketId}
            className={HD_INPUT}
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[var(--color-primary)]">{copy.guestContact}</span>
          <input
            type="text"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder={copy.guestPhContact}
            className={HD_INPUT}
            autoComplete="off"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === "searching"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-5 py-3 transition duration-200 hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
          >
            <FiSearch className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-white)]">
              {status === "searching" ? copy.guestTracking : copy.guestTrack}
            </span>
          </button>
        </div>
      </form>

      {status === "notfound" ? (
        <p className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-warning)_34%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-white))] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]">
          {copy.guestNotFound}
        </p>
      ) : null}

      {status === "found" && match ? (
        <div className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-4">
          <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
            {copy.guestFoundHint}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-primary)]">{match.id}</span>
            <TicketStatusBadge status={match.status} copy={copy} />
            <TicketCategoryChip category={match.category} copy={copy} />
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--color-primary)]">{match.subject}</h3>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[color-mix(in_srgb,var(--color-primary)_64%,var(--color-white))]">
              {formatDateTime(match.updatedAt, language)}
            </span>
            <Link
              href={`${HELP_DESK_TICKETS_PATH}/${match.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
            >
              <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.viewDetails}</span>
              <FiArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

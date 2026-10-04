"use client";

import Link from "next/link";
import { FiCheckCircle, FiPlus, FiShield } from "react-icons/fi";

import { HD_CARD } from "@/lib/help-desk/config";
import { formatDateTime } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";
import type { Ticket } from "@/lib/help-desk/types";

import TicketPriorityBadge from "./TicketPriorityBadge";
import TicketStatusBadge from "./TicketStatusBadge";

/** Success card shown after a ticket is created. */
export default function TicketSuccessCard({
  ticket,
  copy,
  language,
  basePath,
  onAnother,
}: {
  ticket: Ticket;
  copy: HelpDeskCopy;
  language: string;
  basePath?: string;
  onAnother: () => void;
}) {
  const links = helpDeskLinks(basePath);
  return (
    <section className={`${HD_CARD} overflow-hidden`} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-success)_10%,var(--color-white))] px-6 py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]">
          <FiCheckCircle className="h-8 w-8 text-[var(--color-white)]" aria-hidden />
        </span>
        <h2 className="text-xl font-bold text-[var(--color-primary)]">{copy.successTitle}</h2>
        <p className="max-w-md text-sm text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
          {copy.successHint}
        </p>
        <span className="mt-1 inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))] bg-[var(--color-white)] px-4 py-2">
          <FiShield className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
            {copy.successTicketId}
          </span>
          <span className="text-base font-extrabold tracking-wide text-[var(--color-primary)]">{ticket.id}</span>
        </span>
      </div>

      <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
        <Row label={copy.successSubject} value={ticket.subject} />
        <div>
          <dt className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
            {copy.successStatus}
          </dt>
          <dd className="mt-1">
            <TicketStatusBadge status={ticket.status} copy={copy} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
            {copy.successPriority}
          </dt>
          <dd className="mt-1">
            <TicketPriorityBadge priority={ticket.priority} copy={copy} />
          </dd>
        </div>
        <Row label={copy.successCreated} value={formatDateTime(ticket.createdAt, language)} />
        <Row
          label={copy.successContact}
          value={[ticket.contact.name, ticket.contact.email, ticket.contact.mobile].filter(Boolean).join(" · ")}
        />
      </dl>

      <div className="flex flex-col gap-3 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] p-5 sm:flex-row sm:items-center sm:justify-end sm:p-6">
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)] px-5 py-3 transition duration-200 hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          <FiPlus className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.successAnother}</span>
        </button>
        <Link
          href={links.ticket(ticket.id)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
        >
          <span className="text-sm font-semibold text-[var(--color-white)]">{copy.successView}</span>
        </Link>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[var(--color-primary)]">{value}</dd>
    </div>
  );
}

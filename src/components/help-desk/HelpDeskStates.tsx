"use client";

import Link from "next/link";
import { FiAlertTriangle, FiSearch } from "react-icons/fi";

import { HD_CARD } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { helpDeskLinks } from "@/lib/help-desk/paths";

/** Shimmering placeholder rows for the ticket list / recent-tickets preview. */
export function TicketListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`${HD_CARD} p-4`}>
          <div className="flex animate-pulse flex-col gap-3">
            <div className="h-4 w-32 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))]" />
            <div className="h-3 w-2/3 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]" />
              <div className="h-6 w-20 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a single ticket's details page. */
export function TicketDetailsSkeleton() {
  return (
    <div className={`${HD_CARD} p-5 sm:p-7`} aria-hidden>
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))]" />
        <div className="h-4 w-3/4 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]" />
        <div className="h-24 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" />
        <div className="h-16 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]" />
      </div>
    </div>
  );
}

/** Human-friendly error state (never a raw stack trace / HTTP dump). */
export function HelpDeskErrorState({
  copy,
  onRetry,
  basePath,
}: {
  copy: HelpDeskCopy;
  onRetry?: () => void;
  basePath?: string;
}) {
  const links = helpDeskLinks(basePath);
  return (
    <div className={`${HD_CARD} flex flex-col items-center gap-3 p-8 text-center`} role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-danger)_14%,var(--color-white))]">
        <FiAlertTriangle className="h-7 w-7 text-[var(--color-danger)]" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-[var(--color-primary)]">{copy.loadFailedTitle}</h2>
      <p className="max-w-md text-sm text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
        {copy.loadFailedHint}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
          >
            <span className="text-sm font-semibold text-[var(--color-white)]">{copy.retry}</span>
          </button>
        ) : null}
        <Link
          href={links.root}
          className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-primary)] px-5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.navHelpDesk}</span>
        </Link>
      </div>
    </div>
  );
}

/** "Ticket not found" state for an unknown / mistyped id. */
export function HelpDeskNotFound({ copy, basePath }: { copy: HelpDeskCopy; basePath?: string }) {
  const links = helpDeskLinks(basePath);
  return (
    <div className={`${HD_CARD} flex flex-col items-center gap-3 p-8 text-center`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_40%,var(--color-white))]">
        <FiSearch className="h-7 w-7 text-[var(--color-primary)]" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-[var(--color-primary)]">{copy.notFoundTitle}</h2>
      <p className="max-w-md text-sm text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
        {copy.notFoundHint}
      </p>
      <Link
        href={links.tickets}
        className="mt-1 inline-flex items-center justify-center rounded-2xl bg-[var(--color-action)] px-5 py-2.5 hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-[var(--color-white)]">{copy.backToList}</span>
      </Link>
    </div>
  );
}

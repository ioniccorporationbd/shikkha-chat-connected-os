"use client";

import Link from "next/link";
import { FiInbox } from "react-icons/fi";

import { HELP_DESK_NEW_PATH } from "@/lib/auth/session";
import { HD_CARD } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";

/** Calm empty state shown when the user has no tickets yet. */
export function TicketEmptyState({ copy }: { copy: HelpDeskCopy }) {
  return (
    <div className={`${HD_CARD} flex flex-col items-center gap-3 p-8 text-center sm:p-10`}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_38%,var(--color-white))]">
        <FiInbox className="h-8 w-8 text-[var(--color-primary)]" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-[var(--color-primary)]">{copy.emptyTitle}</h2>
      <p className="max-w-md text-sm text-[color-mix(in_srgb,var(--color-primary)_70%,var(--color-white))]">
        {copy.emptyHint}
      </p>
      <Link
        href={HELP_DESK_NEW_PATH}
        className="mt-1 inline-flex items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-[var(--color-white)]">{copy.emptyCta}</span>
      </Link>
    </div>
  );
}

export default TicketEmptyState;

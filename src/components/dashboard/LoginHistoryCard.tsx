"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiClock } from "react-icons/fi";

import type { DashboardActivityRow } from "@/lib/auth/types";
import type { DashboardCopy } from "@/lib/dashboard/messages";
import { formatLoginStamp } from "@/lib/format/datetime";

interface LoginHistoryCardProps {
  rows: DashboardActivityRow[];
  copy: DashboardCopy;
  language: string;
}

/** Internal session noise — the login history shows real account events only. */
const HIDDEN_EVENTS = new Set(["session_probe"]);
/** At most this many rows are ever rendered, whatever the data source returns. */
const MAX_ITEMS = 10;
/** Rows shown before the "see more" control appears. */
const DEFAULT_VISIBLE = 5;

function dotClass(row: DashboardActivityRow): string {
  // The timeline marks wear the SAME palette as the page's icon chips: the
  // brand primary green for a normal event and the Shikkha action red for a
  // failed attempt / deliberate sign-out — so the history reads in-theme
  // instead of with the muted success/danger tokens.
  if (row.status === "Failed") return "bg-[var(--color-action)]";
  if (row.status === "Blocked") return "bg-[var(--color-warning)]";
  if (row.event === "logout") return "bg-[var(--color-action)]";
  return "bg-[var(--color-primary)]";
}

/**
 * Login history — a compact vertical timeline of the account's sign-in events,
 * built from the real `dashboard.overview.activity` audit rows (never a hardcoded
 * list). At most 10 items are shown; the first 5 are visible, the rest expand in
 * place with no navigation.
 */
export default function LoginHistoryCard({ rows, copy, language }: LoginHistoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const items = useMemo(
    () => rows.filter((row) => !HIDDEN_EVENTS.has(row.event)).slice(0, MAX_ITEMS),
    [rows]
  );

  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-8 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)]">
          <FiClock size={20} />
        </span>
        <p className="text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {copy.loginHistoryEmpty}
        </p>
      </div>
    );
  }

  const visible = expanded ? items : items.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = Math.max(0, items.length - DEFAULT_VISIBLE);

  return (
    <div className="flex flex-col">
      <ol className="flex flex-col">
        {visible.map((row, index) => {
          const showRail = index !== visible.length - 1;

          return (
            <li key={row.name} className="relative flex gap-3.5 pb-3.5 last:pb-0">
              {showRail ? (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-[15px] top-9 w-px bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
                />
              ) : null}

              <span className="relative z-[1] mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)]">
                <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dotClass(row)}`} />
              </span>

              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--color-primary)]">
                    {copy.events[row.event] ?? row.event}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
                    <span>{copy.statuses[row.status] ?? row.status}</span>
                    {row.client_ip ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">{row.client_ip}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <time
                  dateTime={row.creation}
                  className="shrink-0 whitespace-nowrap pt-0.5 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_54%,transparent)]"
                >
                  {formatLoginStamp(row.creation, language)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 inline-flex items-center justify-center gap-1.5 self-stretch rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3.5 py-2 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-primary)]">
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            {expanded ? copy.seeLess : copy.seeMore(hiddenCount)}
          </span>
        </button>
      ) : null}
    </div>
  );
}

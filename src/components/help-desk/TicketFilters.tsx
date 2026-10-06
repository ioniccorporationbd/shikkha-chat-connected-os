"use client";

import { FiSearch, FiX } from "react-icons/fi";

import { HD_INPUT, TICKET_FILTERS } from "@/lib/help-desk/config";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import type { TicketFilterState, TicketStatus } from "@/lib/help-desk/types";

/** Status filter chips + a free-text search over ticket id / subject. */
export default function TicketFilters({
  copy,
  value,
  onChange,
}: {
  copy: HelpDeskCopy;
  value: TicketFilterState;
  onChange: (next: TicketFilterState) => void;
}) {
  const labelFor = (status: TicketStatus | "all") =>
    status === "all" ? copy.filterAll : copy.statuses[status];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.listTitle}>
        {TICKET_FILTERS.map((status) => {
          const isActive = value.status === status;
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange({ ...value, status })}
              className={`inline-flex items-center rounded-full border px-4 py-2 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_24%,var(--color-white))] bg-[var(--color-white)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  isActive ? "text-[var(--color-white)]" : "text-[var(--color-primary)]"
                }`}
              >
                {labelFor(status)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative w-full lg:max-w-xs">
        <FiSearch
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]"
          aria-hidden
        />
        <input
          type="search"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchPlaceholder}
          className={`${HD_INPUT} pl-11 pr-10`}
        />
        {value.query ? (
          <button
            type="button"
            onClick={() => onChange({ ...value, query: "" })}
            aria-label={copy.filterAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
          >
            <FiX className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

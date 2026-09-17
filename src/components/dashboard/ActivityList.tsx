import type { DashboardActivityRow } from "@/lib/auth/types";
import { relativeTime, type DashboardCopy } from "@/lib/dashboard/messages";

interface ActivityListProps {
  rows: DashboardActivityRow[];
  copy: DashboardCopy;
}

function dotClass(status: string): string {
  if (status === "Failed") return "bg-[#b4453a]";
  if (status === "Blocked") return "bg-[#c98a1f]";
  return "bg-[#2f7d5a]";
}

export default function ActivityList({ rows, copy }: ActivityListProps) {
  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
        {copy.activityEmpty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dotClass(row.status)}`} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[var(--color-primary)]">
              {copy.events[row.event] ?? row.event}
            </p>
            <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
              {[copy.statuses[row.status] ?? row.status, row.client_ip]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <span className="shrink-0 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_54%,transparent)]">
            {relativeTime(row.creation, copy)}
          </span>
        </li>
      ))}
    </ul>
  );
}

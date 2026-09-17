import { statIcon } from "@/lib/dashboard/icons";
import type { DashboardStat } from "@/lib/auth/types";

interface StatCardProps {
  stat: DashboardStat;
  scopeLabel: string;
}

export default function StatCard({ stat, scopeLabel }: StatCardProps) {
  const Icon = statIcon(stat.icon);

  return (
    <article className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_7%,transparent)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] text-[18px] text-[var(--color-primary)]">
          <Icon />
        </span>

        <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {scopeLabel}
        </span>
      </div>

      <p className="mt-4 text-[30px] font-semibold leading-none tabular-nums text-[var(--color-primary)]">
        {stat.value.toLocaleString("en-US")}
      </p>

      <p className="mt-2 text-[13px] font-medium text-[var(--color-primary)]">{stat.label}</p>

      <p className="mt-1 text-[12px] leading-snug text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {stat.hint}
      </p>
    </article>
  );
}

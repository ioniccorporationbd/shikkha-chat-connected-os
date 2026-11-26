import { createElement } from "react";

import { statIcon } from "@/lib/dashboard/icons";
import type { DashboardStat } from "@/lib/auth/types";

interface StatCardProps {
  stat: DashboardStat;
  scopeLabel: string;
}

export default function StatCard({ stat, scopeLabel }: StatCardProps) {
  const icon = statIcon(stat.icon);

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))_0%,var(--color-white)_62%)] p-4 shadow-[0_16px_38px_-24px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] hover:shadow-[0_26px_54px_-26px_color-mix(in_srgb,var(--color-primary)_58%,transparent)] sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_45%,transparent)] opacity-60 blur-2xl transition duration-500 group-hover:opacity-90"
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--color-primary)_92%,var(--color-white))_0%,var(--color-primary)_100%)] text-[18px] text-[var(--color-white)] shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {createElement(icon)}
        </span>

        <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_70%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {scopeLabel}
        </span>
      </div>

      <p className="relative mt-4 text-[30px] font-semibold leading-none tabular-nums text-[var(--color-primary)]">
        {stat.value.toLocaleString("en-US")}
      </p>

      <p className="relative mt-2 text-[13px] font-medium text-[var(--color-primary)]">{stat.label}</p>

      <p className="relative mt-1 text-[12px] leading-snug text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {stat.hint}
      </p>
    </article>
  );
}

import { FiExternalLink } from "react-icons/fi";

import { statIcon } from "@/lib/dashboard/icons";
import type { DashboardLink } from "@/lib/auth/types";

interface QuickLinksProps {
  links: DashboardLink[];
  emptyLabel: string;
  /** Localised copy keyed by `link.key`; falls back to the API values. */
  labels?: Record<string, { label: string; description: string }>;
}

export default function QuickLinks({ links, emptyLabel, labels = {} }: QuickLinksProps) {
  if (!links.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {links.map((link) => {
        const Icon = statIcon(link.icon);
        const localized = labels[link.key];

        return (
          <li key={link.key}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer noopener" : undefined}
              className="group flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3.5 py-3 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[15px] text-[var(--color-primary)]">
                <Icon />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[var(--color-primary)]">
                  {localized?.label ?? link.label}
                </span>
                <span className="block truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
                  {localized?.description ?? link.description}
                </span>
              </span>

              <FiExternalLink
                aria-hidden
                className="shrink-0 text-[14px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition group-hover:text-[var(--color-primary)]"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

import type { HelpDeskCopy } from "@/lib/help-desk/messages";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Dashboard → Help Desk → [crumb…] breadcrumb shared by every help-desk screen.
 * Real links, so navigation never depends on the browser Back button.
 */
export default function HelpDeskBreadcrumb({
  copy,
  basePath,
  crumbs = [],
}: {
  copy: HelpDeskCopy;
  basePath: string;
  crumbs?: Crumb[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12.5px]">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
      >
        <FiHome className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]" aria-hidden />
        <span className="font-medium text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
          {copy.breadcrumbDashboard}
        </span>
      </Link>

      <FiChevronRight className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--color-primary)_36%,transparent)]" aria-hidden />

      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
      >
        <span className="font-medium text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
          {copy.navHelpDesk}
        </span>
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.label} className="inline-flex items-center gap-1">
          <FiChevronRight
            className="h-3.5 w-3.5 text-[color-mix(in_srgb,var(--color-primary)_36%,transparent)]"
            aria-hidden
          />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="rounded-lg px-1.5 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
            >
              <span className="font-medium text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
                {crumb.label}
              </span>
            </Link>
          ) : (
            <span className="px-1.5 py-1 font-semibold text-[var(--color-primary)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

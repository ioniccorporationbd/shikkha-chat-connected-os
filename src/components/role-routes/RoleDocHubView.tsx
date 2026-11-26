"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import RoleDocHeader from "@/components/role-routes/RoleDocHeader";
import { ROLE_DOC_TEXT, visibleRouteTotal } from "@/lib/role-route-docs";
import { ROLE_ACCESS_GUIDES } from "@/lib/role-routes";

/**
 * `/dashboard` — the role-based entry point. Lists all eight Shikkha Chat Apps
 * dashboard roles; each card opens that role's page, which in turn lists every
 * sub-route of the role under its exact app name.
 */
export default function RoleDocHubView() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <RoleDocHeader crumbs={[{ label: ROLE_DOC_TEXT.badge }]} />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
          {ROLE_DOC_TEXT.badge[language]}
        </p>
        <h1 className="mt-2 max-w-[24ch] text-[28px] font-semibold leading-[1.25] text-[var(--color-primary)] sm:text-[36px]">
          {ROLE_DOC_TEXT.hubTitle[language]}
        </h1>
        <p className="mt-4 max-w-[68ch] text-[16px] leading-7 text-[color-mix(in_srgb,var(--color-black)_65%,var(--color-primary))]">
          {ROLE_DOC_TEXT.hubLead[language]}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {ROLE_ACCESS_GUIDES.map((guide) => {
            const routeTotal = visibleRouteTotal(guide);
            return (
              <li key={guide.key}>
                <Link
                  href={guide.dashboardRoute}
                  className="group flex h-full flex-col rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-primary)] hover:shadow-[0_22px_44px_-36px_rgba(3,37,33,0.55)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[18px] font-semibold text-[var(--color-primary)] group-hover:underline">
                      {guide.title[language]}
                    </h2>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[16px] text-[var(--color-primary)] transition group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </div>

                  <p className="mt-2 text-[13px] leading-6 text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
                    {guide.who[language]}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-3 py-1 text-[11px] font-semibold text-[var(--color-primary)]">
                      {guide.dashboardRoute}
                    </span>
                    <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[11px] font-medium text-[var(--color-primary)]">
                      {routeTotal} {ROLE_DOC_TEXT.countRoutes[language]}
                    </span>
                    <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[11px] font-medium text-[var(--color-primary)]">
                      {guide.menuGroups.length} {ROLE_DOC_TEXT.countGroups[language]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 text-[12px] leading-6 text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
          {ROLE_DOC_TEXT.provenance[language]}
        </p>
      </main>
    </div>
  );
}

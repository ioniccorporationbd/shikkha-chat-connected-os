"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ROLE_DOC_TEXT } from "@/lib/role-route-docs";

export type DocCrumb = {
  /** Bilingual label, or a plain string when it comes from the route data. */
  readonly label: { readonly bn: string; readonly en: string };
  readonly href?: string;
};

/**
 * Sticky header for the /dashboard route documentation pages: breadcrumbs on
 * the left, the site language switch on the right. Uses the same language
 * context as the marketing site, so BN/EN stays in sync with the rest of
 * Connected OS (light mode only).
 */
export default function RoleDocHeader({ crumbs }: { crumbs: readonly DocCrumb[] }) {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-soft)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] leading-6">
            <li>
              <Link
                href="/"
                className="font-semibold text-[var(--color-primary)] transition hover:underline"
              >
                {ROLE_DOC_TEXT.home[language]}
              </Link>
            </li>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={`${crumb.href ?? "crumb"}-${index}`} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-[color-mix(in_srgb,var(--color-black)_35%,var(--color-primary))]">
                    /
                  </span>
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="font-medium text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))] transition hover:text-[var(--color-primary)] hover:underline"
                    >
                      {crumb.label[language]}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className="max-w-[46vw] truncate font-semibold text-[var(--color-primary)] sm:max-w-none"
                    >
                      {crumb.label[language]}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div
          className="flex items-center gap-1 rounded-full border border-[var(--color-border-soft)] p-1"
          data-no-translate="true"
        >
          {(["bn", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={[
                "rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] transition",
                language === code
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))] hover:text-[var(--color-primary)]",
              ].join(" ")}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

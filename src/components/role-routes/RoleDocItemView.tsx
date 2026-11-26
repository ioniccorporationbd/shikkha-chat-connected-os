"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import RoleDocHeader from "@/components/role-routes/RoleDocHeader";
import RoleRouteSideNav from "@/components/role-routes/RoleRouteSideNav";
import {
  ROLE_DOC_TEXT,
  findRoleRoute,
  roleRouteEntries,
  visibleMenuGroups,
} from "@/lib/role-route-docs";

const cardClass =
  "rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 sm:p-6";
const mutedText =
  "text-[color-mix(in_srgb,var(--color-black)_65%,var(--color-primary))]";

/**
 * One documentation page per real Shikkha Chat Apps route. The page keeps the
 * exact route name (for example /dashboard/admin/reports/safety-events) and
 * explains — from the app's own sidebar definition and user manual — what that
 * route does, for whom, and how it fits into the role's workflow.
 */
export default function RoleDocItemView({ routePath }: { routePath: string }) {
  const { language } = useLanguage();
  const match = findRoleRoute(routePath);

  if (!match) return null;

  const { guide, group, item } = match;
  const siblings = roleRouteEntries(guide);
  const duplicateOfRoleRoot = item.path === guide.dashboardRoute;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <RoleDocHeader
        crumbs={[
          { label: ROLE_DOC_TEXT.badge, href: "/dashboard" },
          { label: guide.title, href: guide.dashboardRoute },
          { label: group.title },
          { label: item.label },
        ]}
      />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
              {guide.title[language]} · {group.title[language]}
            </p>

            <h1 className="mt-2 text-[26px] font-semibold leading-[1.3] text-[var(--color-primary)] sm:text-[32px]">
              {item.label[language]}
            </h1>

            <p className="mt-3 inline-block max-w-full break-all rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-3 py-1 font-mono text-[12px] font-medium text-[var(--color-primary)]">
              {item.path}
            </p>

            <section className={`mt-6 ${cardClass}`}>
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                {ROLE_DOC_TEXT.whatItDoes[language]}
              </h2>
              <p className={`mt-3 max-w-[68ch] text-[16px] leading-7 ${mutedText}`}>
                {item.description[language]}
              </p>
            </section>

            <section className={`mt-4 ${cardClass}`}>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                    {ROLE_DOC_TEXT.roleLabel[language]}
                  </dt>
                  <dd className="mt-1 text-[14px] font-semibold text-[var(--color-primary)]">
                    <Link href={guide.dashboardRoute} className="hover:underline">
                      {guide.title[language]}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                    {ROLE_DOC_TEXT.groupLabel[language]}
                  </dt>
                  <dd className="mt-1 text-[14px] font-semibold text-[var(--color-primary)]">
                    {group.title[language]}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                    {ROLE_DOC_TEXT.fullRoute[language]}
                  </dt>
                  <dd className="mt-1 break-all font-mono text-[13px] text-[var(--color-primary)]">
                    {item.path}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                    {ROLE_DOC_TEXT.signing[language]}
                  </dt>
                  <dd className={`mt-1 text-[13px] leading-6 ${mutedText}`}>
                    {guide.signingRoles.join(", ")}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={`mt-4 ${cardClass}`}>
              <h2 className="text-[17px] font-semibold text-[var(--color-primary)]">
                {ROLE_DOC_TEXT.otherRoutes[language]}
              </h2>
              <p className="mt-1 text-[12px] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
                {ROLE_DOC_TEXT.current[language]}: {item.path}
              </p>

              <ul className="mt-3 space-y-3">
                {visibleMenuGroups(guide).map((group_) => (
                  <li key={group_.key}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                      {group_.title[language]}
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-2">
                      {group_.items.map((sibling) => {
                        const active = sibling.path === item.path;
                        return (
                          <li key={sibling.path}>
                            <Link
                              href={sibling.path}
                              aria-current={active ? "page" : undefined}
                              className={[
                                "block rounded-full px-3 py-1 text-[12px] font-medium transition",
                                active
                                  ? "role-doc-pill-active"
                                  : "border border-[var(--color-border-soft)] text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
                              ].join(" ")}
                            >
                              {sibling.label[language]}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>

              {!duplicateOfRoleRoot ? (
                <p className="mt-4 text-[12px] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
                  {siblings.length} {ROLE_DOC_TEXT.countRoutes[language]} ·{" "}
                  <Link href={guide.dashboardRoute} className="font-semibold text-[var(--color-primary)] hover:underline">
                    {ROLE_DOC_TEXT.openRole[language]}
                  </Link>
                </p>
              ) : null}
            </section>

            <details className={`mt-4 ${cardClass}`}>
              <summary className="cursor-pointer list-none text-[17px] font-semibold text-[var(--color-primary)]">
                {ROLE_DOC_TEXT.workflow[language]}
              </summary>
              <ol className="mt-3 space-y-3">
                {guide.workflows.map((step, index) => (
                  <li key={step.title.en} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[12px] font-semibold text-[var(--color-primary)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--color-primary)]">
                        {step.title[language]}
                      </p>
                      <p className={`mt-1 text-[13px] leading-6 ${mutedText}`}>
                        {step.body[language]}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          </div>

          <aside className="lg:sticky lg:top-[76px] lg:h-fit">
            <RoleRouteSideNav guide={guide} activePath={item.path} />
          </aside>
        </div>

        <p className="mt-10 text-[12px] leading-6 text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
          {ROLE_DOC_TEXT.provenance[language]}
        </p>
      </main>
    </div>
  );
}

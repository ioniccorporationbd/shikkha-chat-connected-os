"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import RoleDocHeader from "@/components/role-routes/RoleDocHeader";
import RoleRouteSideNav from "@/components/role-routes/RoleRouteSideNav";
import { ROLE_DOC_TEXT, roleRouteCount } from "@/lib/role-route-docs";
import { roleAccessGuide, type RoleAccessKey } from "@/lib/role-routes";

const cardClass =
  "rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 sm:p-6";
const mutedText =
  "text-[color-mix(in_srgb,var(--color-black)_65%,var(--color-primary))]";

/**
 * `/dashboard/<role>` — the role's own page: who the role is, how many routes
 * it gets, every route grouped exactly like the app sidebar (each one linking
 * to its documentation page), the role's workflow and tips.
 */
export default function RoleDocRoleView({ roleKey }: { roleKey: RoleAccessKey }) {
  const { language } = useLanguage();
  const guide = roleAccessGuide(roleKey);

  if (!guide) return null;

  const routeTotal = roleRouteCount(guide);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <RoleDocHeader
        crumbs={[
          { label: ROLE_DOC_TEXT.badge, href: "/dashboard" },
          { label: guide.title },
        ]}
      />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
              {ROLE_DOC_TEXT.badge[language]}
            </p>

            <h1 className="mt-2 text-[28px] font-semibold leading-[1.25] text-[var(--color-primary)] sm:text-[34px]">
              {guide.title[language]}
            </h1>

            <p className={`mt-3 max-w-[62ch] text-[16px] leading-7 ${mutedText}`}>
              {guide.who[language]}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-3 py-1 text-[12px] font-semibold text-[var(--color-primary)]">
                {guide.dashboardRoute}
              </span>
              <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[12px] font-medium text-[var(--color-primary)]">
                {routeTotal} {ROLE_DOC_TEXT.countRoutes[language]}
              </span>
              <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[12px] font-medium text-[var(--color-primary)]">
                {guide.menuGroups.length} {ROLE_DOC_TEXT.countGroups[language]}
              </span>
              <span className="rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[12px] font-medium text-[var(--color-primary)]">
                {guide.workflows.length} {ROLE_DOC_TEXT.countSteps[language]}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {guide.menuGroups.map((group) => (
                <section key={group.key} className={cardClass}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[17px] font-semibold text-[var(--color-primary)]">
                      {group.title[language]}
                    </h2>
                    <span className="text-[12px] font-medium text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
                      {group.items.length} {ROLE_DOC_TEXT.countRoutes[language]}
                    </span>
                  </div>

                  <ul className="mt-3 divide-y divide-[var(--color-border-soft)]">
                    {group.items.map((item) => (
                      <li key={item.path}>
                        <Link
                          href={item.path}
                          className="group flex flex-col gap-1 rounded-xl px-2 py-3 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)] sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                        >
                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold text-[var(--color-primary)] group-hover:underline">
                              {item.label[language]}
                            </span>
                            <span className="mt-1 block max-w-[62ch] text-[13px] leading-6 text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
                              {item.description[language]}
                            </span>
                          </span>
                          <span className="shrink-0 self-start rounded-full border border-[var(--color-border-soft)] px-2.5 py-1 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                            {item.path}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <section className={cardClass}>
                <h2 className="text-[17px] font-semibold text-[var(--color-primary)]">
                  {ROLE_DOC_TEXT.workflow[language]}
                </h2>
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
              </section>

              <section className={cardClass}>
                <h2 className="text-[17px] font-semibold text-[var(--color-primary)]">
                  {ROLE_DOC_TEXT.tips[language]}
                </h2>
                <ul className="mt-3 space-y-2">
                  {guide.tips.map((tip) => (
                    <li
                      key={tip.en}
                      className={`flex gap-2 text-[13px] leading-6 ${mutedText}`}
                    >
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      <span>{tip[language]}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12px] leading-6 text-[color-mix(in_srgb,var(--color-black)_48%,var(--color-primary))]">
                  {ROLE_DOC_TEXT.signing[language]}: {guide.signingRoles.join(", ")}
                </p>
              </section>
            </div>
          </div>

          <aside className="lg:sticky lg:top-[76px] lg:h-fit">
            <RoleRouteSideNav guide={guide} activePath={guide.dashboardRoute} />
          </aside>
        </div>

        <p className="mt-10 text-[12px] leading-6 text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
          {ROLE_DOC_TEXT.provenance[language]}
        </p>
      </main>
    </div>
  );
}

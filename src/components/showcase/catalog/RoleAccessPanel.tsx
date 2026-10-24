"use client";

import SectionPanel from "@/components/hubs/shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  showcaseStatusLabel,
  SHOWCASE_TEXT,
  type ShowcaseCategory,
  type ShowcaseFeature,
} from "@/lib/feature-showcase";
import {
  ROLE_ACCESS_TEXT,
  roleAccessGuide,
  roleRouteCount,
  type RoleAccessKey,
} from "@/lib/role-routes";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

/*
 * -------------------------------------------------------------------------
 * ROLE ACCESS RIGHT-RAIL PANEL
 *
 * One panel per ROLE of the "Role-based Dashboards" catalog section. The top
 * card is the SAME SectionPanel design as every other catalog panel (variant
 * "dashboard", same surfaces, same reveal contract); underneath it a compact,
 * collapsible route explorer lists every verified route of the role:
 *
 *   • summary row → role name, who it is, dashboard route, signing ERP roles
 *   • workflow    → the role's real workflow steps (source user manual)
 *   • tips        → the role's real tips (checklist rows)
 *   • routes      → every sidebar module / AI Pathshala item / report, grouped
 *                   exactly like the app's sidebar, with localized description
 *
 * Nothing here is invented: routes come from `@/lib/role-routes`, generated
 * from `shikkha_chat_apps` (dashboard-shell.tsx + dashboard-routes.ts +
 * user-manual.json).
 * -------------------------------------------------------------------------
 */
export default function RoleAccessPanel({
  category,
  feature,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const guide = roleAccessGuide(feature.id as RoleAccessKey);

  if (!guide) {
    return null;
  }

  const t = ROLE_ACCESS_TEXT;
  const routeCount = roleRouteCount(guide);

  const workflowRows = guide.workflows.map((step, index) => ({
    title: `${index + 1}. ${step.title[lang]}`,
    description: step.body[lang],
    meta: [{ label: t.workflowLabel[lang], value: guide.roleNames[lang] }],
  }));

  return (
    <div className="max-w-[560px]">
      <SectionPanel
        id={catalogFeaturePanelId(category.id, feature.id)}
        variant="dashboard"
        pill={category.title[lang]}
        title={guide.title[lang]}
        description={guide.who[lang]}
        supporting={t.note[lang]}
        icon={SHOWCASE_ICONS[feature.icon]}
        showButtons={false}
        capabilities={guide.tips.map((tip) => tip[lang])}
        stats={[
          { value: String(routeCount), label: t.routesLabel[lang] },
          { value: String(guide.workflows.length), label: t.workflowLabel[lang] },
          { value: String(guide.signingRoles.length), label: t.signingLabel[lang] },
          {
            value: String(guide.menuGroups.length),
            label: t.groupLabel[lang],
          },
        ]}
        rows={[]}
      />

      {/* Route explorer — every verified sidebar module, AI Pathshala item and
          report of this role, grouped exactly like the app's sidebar, plus the
          role's access line and real workflow. Groups are collapsible so the
          rail keeps the same card rhythm as every other catalog section. */}
      <div className="mt-6">
        <p className="section-label-badge">{t.eyebrow[lang]}</p>
        <h3 className="section-description mt-3 font-semibold text-[var(--color-primary)]">
          {t.heading[lang]}
        </h3>

        <div className="mt-3 grid gap-3">
          <details className="rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="section-description font-semibold text-[var(--color-primary)]">
                {t.accessLabel[lang]}
              </span>
              <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                3
              </span>
            </summary>
            <ul className="mt-3 grid gap-2.5">
              {[
                { label: t.dashboardLabel[lang], value: guide.dashboardRoute },
                {
                  label: SHOWCASE_TEXT.statusLabel[lang],
                  value: showcaseStatusLabel(feature, lang),
                },
                {
                  label: t.signingLabel[lang],
                  value: guide.signingRoles.join(", "),
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="rounded-xl border border-[var(--color-border-soft)] p-3"
                >
                  <p className="capability-text text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                    {row.label}
                  </p>
                  <p className="capability-text mt-1 break-words font-semibold text-[var(--color-primary)]">
                    {row.value}
                  </p>
                </li>
              ))}
            </ul>
          </details>

          <details className="rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="section-description font-semibold text-[var(--color-primary)]">
                {t.workflowLabel[lang]}
              </span>
              <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                {guide.workflows.length}
              </span>
            </summary>
            <ul className="mt-3 grid gap-2.5">
              {workflowRows.map((row) => (
                <li
                  key={row.title}
                  className="rounded-xl border border-[var(--color-border-soft)] p-3"
                >
                  <p className="capability-text font-semibold text-[var(--color-primary)]">
                    {row.title}
                  </p>
                  <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
                    {row.description}
                  </p>
                </li>
              ))}
            </ul>
          </details>

          {guide.menuGroups.map((group) => (
            <details
              key={group.title[lang]}
              className="rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span className="section-description font-semibold text-[var(--color-primary)]">
                  {group.title[lang]}
                </span>
                <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                  {group.items.length}
                </span>
              </summary>

              <ul className="mt-3 grid gap-2.5">
                {group.items.map((item) => (
                  <li
                    key={`${group.title[lang]}-${item.path}`}
                    className="rounded-xl border border-[var(--color-border-soft)] p-3"
                  >
                    <p className="capability-text font-semibold text-[var(--color-primary)]">
                      {item.label[lang]}
                    </p>
                    <p className="capability-text mt-1 break-all text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                      {item.path}
                    </p>
                    <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
                      {item.description[lang]}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

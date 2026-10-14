"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  SHOWCASE_TEXT,
  showcaseAccessLabel,
  showcaseStatusLabel,
  type ShowcaseLanguage,
} from "@/lib/feature-showcase";

import { SHOWCASE_ICONS } from "./catalog/icons";

/* -------------------------------------------------------------------------
   Native rail nav language — these class strings are IDENTICAL to the rows
   the homepage rail renders for its own sections (LeftSidebar.tsx), so the
   Shikkha Chat Apps catalog reads as the rail's own navigation: a 16px-radius
   row, a plain 13px label, an inline 16px icon and a numbered child row. The
   idle / hover / active colours live in the unlayered `.sidebar-row` rule in
   globals.css (a base `a { color: inherit }` reset would otherwise win).
------------------------------------------------------------------------- */
const ROW =
  "sidebar-row group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]";
const ROW_LABEL =
  "sidebar-row-label inline-flex min-w-0 flex-1 items-center gap-3 text-[13px] leading-snug";
const ROW_ICON = "shrink-0 text-[16px]";
const ROW_INDEX =
  "sidebar-row-index w-5 shrink-0 text-center text-[12px] font-bold tabular-nums";
const CHEVRON =
  "shrink-0 text-[16px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const PANEL =
  "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";
const SUBLIST =
  "mt-1.5 ml-3 space-y-1 border-l border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] pl-2.5";
const MUTED = "text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";

/**
 * The Complete Shikkha Chat Apps route catalog, rendered in the homepage rail's
 * OWN navigation language (15 category dropdowns / 87 numbered feature rows).
 * It deliberately REPLACES the old site-section links. Route values are kept
 * informational only — no feature links to a nonexistent Connected OS page, so
 * no entry 404s; tapping a feature reveals its description, source route, who
 * it is for and status inline (see `feature-showcase.ts` for the route policy).
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  const [openCategory, setOpenCategory] = useState<string | null>(
    FEATURE_SHOWCASE[0]?.id ?? null,
  );
  const [openFeature, setOpenFeature] = useState<string | null>(null);

  return (
    <nav
      data-no-translate="true"
      aria-label={SHOWCASE_TEXT.heading[language]}
      className="mt-5 flex flex-col gap-1.5 sm:mt-6"
    >
      {FEATURE_SHOWCASE.map((category) => {
        const isOpen = openCategory === category.id;
        const CategoryIcon = SHOWCASE_ICONS[category.icon];
        const panelId = `showcase-panel-${category.id}`;

        return (
          <div key={category.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                setOpenCategory(isOpen ? null : category.id);
                setOpenFeature(null);
              }}
              className={[ROW, isOpen ? "is-open" : ""].join(" ")}
            >
              <span className={[ROW_LABEL, "font-semibold"].join(" ")}>
                <CategoryIcon className={ROW_ICON} aria-hidden />
                <span className="truncate">{category.title[language]}</span>
              </span>

              <FiChevronDown
                aria-hidden
                className={[CHEVRON, isOpen ? "rotate-180" : ""].join(" ")}
              />
            </button>

            <div
              id={panelId}
              className={[
                PANEL,
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className={SUBLIST}>
                  {category.features.map((feature, index) => {
                    const featureOpen = openFeature === feature.id;
                    const detailId = `showcase-detail-${feature.id}`;

                    return (
                      <div key={feature.id}>
                        <button
                          type="button"
                          aria-expanded={featureOpen}
                          aria-controls={detailId}
                          title={feature.route}
                          onClick={() =>
                            setOpenFeature(featureOpen ? null : feature.id)
                          }
                          className={[
                            ROW,
                            "py-2",
                            featureOpen ? "is-open" : "",
                          ].join(" ")}
                        >
                          <span className={ROW_LABEL}>
                            <span className={ROW_INDEX}>{index + 1}</span>
                            <span className="truncate font-medium tracking-[-0.01em]">
                              {feature.title[language]}
                            </span>
                          </span>
                        </button>

                        <div
                          id={detailId}
                          className={[
                            PANEL,
                            featureOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0",
                          ].join(" ")}
                        >
                          <div className="overflow-hidden">
                            <div className="mb-1 ml-2.5 mr-1 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)] px-2.5 py-2">
                              <p className={`text-[10.5px] leading-[1.4] ${MUTED}`}>
                                {feature.description[language]}
                              </p>
                              <dl className="mt-1.5 space-y-1 text-[10.5px] leading-[1.4]">
                                <div className="flex gap-1.5">
                                  <dt className={`shrink-0 font-semibold ${MUTED}`}>
                                    {SHOWCASE_TEXT.sourceRoute[language]}:
                                  </dt>
                                  <dd className="min-w-0 break-all font-mono text-[10px] text-[var(--color-primary)]">
                                    {feature.route}
                                  </dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className={`shrink-0 font-semibold ${MUTED}`}>
                                    {SHOWCASE_TEXT.whoCanUse[language]}:
                                  </dt>
                                  <dd className="min-w-0 font-semibold text-[var(--color-primary)]">
                                    {showcaseAccessLabel(feature.access, language)}
                                  </dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className={`shrink-0 font-semibold ${MUTED}`}>
                                    {SHOWCASE_TEXT.statusLabel[language]}:
                                  </dt>
                                  <dd className="min-w-0 font-semibold text-[var(--color-primary)]">
                                    {showcaseStatusLabel(feature, language)}
                                  </dd>
                                </div>
                              </dl>
                              <p className={`mt-1.5 text-[10px] leading-[1.4] ${MUTED}`}>
                                {SHOWCASE_TEXT.infoNote[language]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

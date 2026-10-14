"use client";

import { useEffect, useState } from "react";
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
import {
  catalogFeaturePanelId,
  catalogSectionId,
  parseCatalogFeaturePanelId,
} from "./catalog/sceneGroups";

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
 * Click a rail row → go to that section on the page. Fires the exact three
 * events the Connected OS scroll engine + the left rail already speak:
 *   • `connected-os-sidebar-navigate`  — closes the mobile drawer
 *   • `connected-os-scroll-to-section` — scrolls the page to the target
 *   • `connected-os-active-section`    — marks the target as active
 */
function navigateToSection(id: string) {
  window.dispatchEvent(new CustomEvent("connected-os-sidebar-navigate"));
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", { detail: { id } }),
  );
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", { detail: { id } }),
  );
}

/**
 * The Complete Shikkha Chat Apps route catalog, rendered in the homepage rail's
 * OWN navigation language (15 category dropdowns / 87 numbered feature rows).
 *
 * Following the old rail behaviour, clicking a dropdown link NAVIGATES to that
 * section: a category header scrolls to the category's video-bannered main
 * section, and a feature link scrolls to that feature's own middle + right
 * section. Scrolling the page also drives the rail back — the active section
 * opens its category and highlights the matching feature row.
 *
 * Route values stay informational only — no feature links to a nonexistent
 * Connected OS page, so no entry 404s.
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  const [openCategory, setOpenCategory] = useState<string | null>(
    FEATURE_SHOWCASE[0]?.id ?? null,
  );
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);

  // Follow the page: when the scroll-sync engine reports a catalog section as
  // the active one, open its category and highlight the feature row.
  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const parsed = parseCatalogFeaturePanelId(id);
      if (!parsed) return;

      setActiveFeatureId(parsed.featureId);
      setOpenCategory(parsed.categoryId);
    };

    window.addEventListener("connected-os-active-section", handleActiveSection);
    return () =>
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection,
      );
  }, []);

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
        const categoryHoldsActive = category.features.some(
          (feature) => feature.id === activeFeatureId,
        );

        return (
          <div key={category.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                const opening = !isOpen;
                setOpenCategory(opening ? category.id : null);
                setOpenFeature(null);
                // Clicking a dropdown navigates to that category's main section.
                if (opening) navigateToSection(catalogSectionId(category.id));
              }}
              className={[
                ROW,
                isOpen ? "is-open" : "",
                !isOpen && categoryHoldsActive ? "is-active" : "",
              ].join(" ")}
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
                    const isActive = activeFeatureId === feature.id;

                    return (
                      <div key={feature.id}>
                        <button
                          type="button"
                          aria-expanded={featureOpen}
                          aria-controls={detailId}
                          title={feature.route}
                          onClick={() => {
                            setOpenFeature(featureOpen ? null : feature.id);
                            setOpenCategory(category.id);
                            setActiveFeatureId(feature.id);
                            // Clicking a feature link navigates to its section.
                            navigateToSection(
                              catalogFeaturePanelId(category.id, feature.id),
                            );
                          }}
                          className={[
                            ROW,
                            "py-2",
                            featureOpen || isActive ? "is-active" : "",
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

"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  SHOWCASE_TEXT,
  type ShowcaseLanguage,
} from "@/lib/feature-showcase";
import { reportClientError } from "@/lib/log/report-error";
import { ROLE_ACCESS_GUIDES } from "@/lib/role-routes";

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

const ROLE_SECTION_ID = "role-access";

/**
 * "Role-based dashboards" is pinned to the very top of the rail; the remaining
 * catalog categories keep their existing order underneath it.
 */
const ORDERED_CATEGORIES = (() => {
  const index = FEATURE_SHOWCASE.findIndex((c) => c.id === ROLE_SECTION_ID);
  if (index <= 0) return FEATURE_SHOWCASE;

  const reordered = [...FEATURE_SHOWCASE];
  const [roleCategory] = reordered.splice(index, 1);
  return [roleCategory, ...reordered];
})();

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
 * OWN navigation language (category dropdowns / numbered feature rows).
 *
 * "Role-based dashboards" sits FIRST in the rail and is the only category that
 * links out: it starts FOLDED, and expanding it (heading click) lists the eight
 * dashboard roles as plain link rows —
 * no per-role chevron and no nested dropdown. Clicking a role drives the page
 * to that role's own section (middle stage + right rail), where every
 * sub-route the old dropdown used to list is still listed and selectable
 * (visibleMenuGroups(guide) in @/lib/role-route-docs drives that index).
 *
 * Every other category keeps its original behaviour: clicking a header or a
 * feature scrolls to that section of the page, and the page scroll drives the
 * rail back (active section opens its category).
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  // Combined state: `openCategory` for the accordion categories, `roleExpanded`
  // for the Role-based dashboards list. The section-focus engine keeps at most
  // ONE of them open: over the hero both are shut; over a video banner only
  // that section's dropdown opens (with no child link selected); inside a
  // section's main content the matching child row lights up.
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [roleExpanded, setRoleExpanded] = useState(false);
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const focusRef = useRef<{ kind: string; categoryId: string | null }>({
    kind: "hero",
    categoryId: null,
  });

  // Follow the page: the section-focus engine (CatalogScrollFocus) reports
  // whether the reader is over the hero, a section's video banner, or a
  // section's main content.
  useEffect(() => {
    const applyFocus = (focus: {
      kind: string;
      categoryId?: string | null;
      featureId?: string | null;
    }) => {
      const categoryId = focus.categoryId ?? null;
      focusRef.current = { kind: focus.kind, categoryId };

      if (focus.kind === "hero" || !categoryId) {
        // Hero banner (or the footer): everything relaxed.
        setOpenCategory(null);
        setRoleExpanded(false);
        setActiveFeatureId(null);
        return;
      }

      if (categoryId === ROLE_SECTION_ID) {
        // Role list is the open dropdown; a child role only lights up once
        // the reader is inside the content, never while on the video banner.
        setOpenCategory(null);
        setRoleExpanded(true);
      } else {
        setRoleExpanded(false);
        setOpenCategory(categoryId);
      }

      setActiveFeatureId(focus.kind === "content" ? focus.featureId ?? null : null);
    };

    const handleSectionFocus = (event: Event) => {
      try {
        const detail = (
          event as CustomEvent<{
            kind?: string;
            categoryId?: string | null;
            featureId?: string | null;
          }>
        ).detail;
        if (!detail || !detail.kind) return;
        applyFocus({
          kind: detail.kind,
          categoryId: detail.categoryId,
          featureId: detail.featureId,
        });
      } catch (error) {
        reportClientError({
          scope: "homepage:sidebar-focus",
          message: "Sidebar could not apply the section focus state",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Fallback: the rail inside a content section also broadcasts its nearest
    // panel. Trust it only while THAT section's content is the focused region,
    // so a neighbouring rail can never steal the highlight during a banner.
    const handleActiveSection = (event: Event) => {
      try {
        const id = (event as CustomEvent<{ id?: string }>).detail?.id;
        if (!id) return;

        const parsed = parseCatalogFeaturePanelId(id);
        if (!parsed) return;

        const focus = focusRef.current;
        if (focus.kind !== "content" || focus.categoryId !== parsed.categoryId) {
          return;
        }

        setActiveFeatureId(parsed.featureId);
      } catch (error) {
        reportClientError({
          scope: "homepage:sidebar-focus",
          message: "Sidebar could not follow the active rail panel",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    };

    window.addEventListener("connected-os-section-focus", handleSectionFocus);
    window.addEventListener("connected-os-active-section", handleActiveSection);
    return () => {
      window.removeEventListener("connected-os-section-focus", handleSectionFocus);
      window.removeEventListener("connected-os-active-section", handleActiveSection);
    };
  }, []);

  return (
    <nav
      data-no-translate="true"
      aria-label={SHOWCASE_TEXT.heading[language]}
      className="mt-5 flex flex-col gap-1.5 sm:mt-6"
    >
      {ORDERED_CATEGORIES.map((category) => {
        const isRoleCategory = category.id === ROLE_SECTION_ID;
        const isOpen = isRoleCategory ? roleExpanded : openCategory === category.id;
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
                if (isRoleCategory) {
                  // Expand/collapse the role list — the only other dropdown,
                  // so opening it closes the accordion category.
                  const opening = !roleExpanded;
                  setRoleExpanded(opening);
                  if (opening) setOpenCategory(null);
                  navigateToSection(catalogSectionId(category.id));
                  return;
                }

                const opening = !isOpen;
                setOpenCategory(opening ? category.id : null);
                if (opening) setRoleExpanded(false);
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
                {isRoleCategory ? (
                  <div className={SUBLIST}>
                    {ROLE_ACCESS_GUIDES.map((guide, index) => {
                      return (
                        <div key={guide.key}>
                          {/* One row per role — a plain link, no nested
                              dropdown and no chevron. Clicking brings the
                              MIDDLE stage to that role's radial map and the
                              RIGHT rail to the role's own section; every
                              sub-route the old dropdown listed is still
                              reachable there (the rail's route index) and on
                              the role's real /dashboard pages. The full
                              catalogue stays in code: visibleMenuGroups(guide)
                              in @/lib/role-route-docs. */}
                          <button
                            type="button"
                            onClick={() => {
                              setRoleExpanded(true);
                              setOpenCategory(null);
                              setActiveFeatureId(guide.key);
                              navigateToSection(
                                catalogFeaturePanelId(
                                  ROLE_SECTION_ID,
                                  guide.key,
                                ),
                              );
                            }}
                            className={[
                              ROW,
                              "w-full py-2",
                              activeFeatureId === guide.key ? "is-active" : "",
                            ].join(" ")}
                          >
                            <span className={ROW_LABEL}>
                              {/* Serial number in the rail's own numbering
                                  language — the same 1..N index every other
                                  category's child links carry. */}
                              <span className={ROW_INDEX}>{index + 1}</span>
                              <span className="truncate font-semibold tracking-[-0.01em]">
                                {guide.title[language]}
                              </span>
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={SUBLIST}>
                    {category.features.map((feature, index) => {
                      const isActive = activeFeatureId === feature.id;

                      return (
                        <div key={feature.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenCategory(category.id);
                              setActiveFeatureId(feature.id);
                              // Clicking a feature link navigates to its section —
                              // it no longer expands an inline description panel
                              // below the row.
                              navigateToSection(
                                catalogFeaturePanelId(category.id, feature.id),
                              );
                            }}
                            className={[
                              ROW,
                              "py-2",
                              isActive ? "is-active" : "",
                            ].join(" ")}
                          >
                            <span className={ROW_LABEL}>
                              <span className={ROW_INDEX}>{index + 1}</span>
                              <span className="truncate font-medium tracking-[-0.01em]">
                                {feature.title[language]}
                              </span>
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

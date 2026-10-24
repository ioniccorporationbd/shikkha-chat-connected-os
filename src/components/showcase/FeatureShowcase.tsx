"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  SHOWCASE_TEXT,
  type ShowcaseLanguage,
} from "@/lib/feature-showcase";
import { visibleMenuGroups, visibleRouteTotal } from "@/lib/role-route-docs";
import { ROLE_ACCESS_GUIDES } from "@/lib/role-routes";
import { setRoleRouteFocus, useRoleRouteFocus } from "@/lib/role-route-selection";

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
const NESTED =
  "mt-1 mb-1 ml-3 space-y-2 border-l border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] pl-2.5";

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

/** Closes the mobile drawer before a real page navigation. */
function closeRail() {
  window.dispatchEvent(new CustomEvent("connected-os-sidebar-navigate"));
}

/**
 * The Complete Shikkha Chat Apps route catalog, rendered in the homepage rail's
 * OWN navigation language (category dropdowns / numbered feature rows).
 *
 * "Role-based dashboards" sits FIRST in the rail and is the only category that
 * links out: expanding it lists the eight dashboard roles, and each role
 * expands again into its own sub-routes (the app's sidebar modules, AI
 * Pathshala and reports), every row opening its real documentation page under
 * /dashboard. The role row is never repeated as one of its own sub-routes.
 *
 * Every other category keeps its original behaviour: clicking a header or a
 * feature scrolls to that section of the page, and the page scroll drives the
 * rail back (active section opens its category).
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  // The other categories behave like an accordion (one open at a time, driven
  // by the page scroll). Role-based dashboards is deliberately NOT part of that
  // accordion: it is pinned first in the rail and stays expanded on its own so
  // the eight roles — and their sub-routes — are always one click away.
  const roleRouteFocus = useRoleRouteFocus();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [roleExpanded, setRoleExpanded] = useState(true);
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);

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
                  // Expand/collapse the role list; it never joins the accordion.
                  setRoleExpanded(!roleExpanded);
                  navigateToSection(catalogSectionId(category.id));
                  return;
                }

                const opening = !isOpen;
                setOpenCategory(opening ? category.id : null);
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
                    {ROLE_ACCESS_GUIDES.map((guide) => {
                      const roleOpen = openRole === guide.key;
                      const rolePanelId = `showcase-role-${guide.key}`;
                      const routeTotal = visibleRouteTotal(guide);

                      return (
                        <div key={guide.key}>
                          <div className="flex items-center gap-1">
                            {/* Clicking a role brings the MIDDLE stage to that
                                role's radial map (main route at the centre,
                                its sub-routes as circles). The chevron below
                                still expands the plain route list; the role's
                                own /dashboard page stays reachable from the
                                docs footer ("all roles, all routes"). */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleExpanded(true);
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
                                "min-w-0 flex-1 py-2",
                                activeFeatureId === guide.key
                                  ? "is-active"
                                  : "",
                              ].join(" ")}
                            >
                              <span className={ROW_LABEL}>
                                <span className="truncate font-semibold tracking-[-0.01em]">
                                  {guide.title[language]}
                                </span>
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold opacity-60">
                                {routeTotal}
                              </span>
                            </button>

                            <button
                              type="button"
                              aria-expanded={roleOpen}
                              aria-controls={rolePanelId}
                              aria-label={guide.title[language]}
                              onClick={() =>
                                setOpenRole(roleOpen ? null : guide.key)
                              }
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
                            >
                              <FiChevronDown
                                aria-hidden
                                className={[
                                  CHEVRON,
                                  roleOpen ? "rotate-180" : "",
                                ].join(" ")}
                              />
                            </button>
                          </div>

                          {/* The role's own sub-routes only — the role itself
                              is never repeated as one of its children. */}
                          <div
                            id={rolePanelId}
                            className={[
                              PANEL,
                              roleOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0",
                            ].join(" ")}
                          >
                            <div className="overflow-hidden">
                              <div className={NESTED}>
                                {visibleMenuGroups(guide).map((group) => (
                                  <div key={group.key}>
                                    <p className="px-3 pb-0.5 text-[11px] font-semibold tracking-[0.06em] text-[color-mix(in_srgb,var(--color-primary)_72%,var(--color-black))]">
                                      {group.title[language]}
                                    </p>
                                    <ul className="mt-1 space-y-0.5">
                                      {group.items.map((item) => (
                                        <li key={item.path}>
                                          <Link
                                            href={item.path}
                                            onClick={(event) => {
                                              /* In-page link, exactly like
                                                 every other rail dropdown
                                                 row: selecting it drives the
                                                 role's own section (middle
                                                 stage + right rail) into
                                                 view. The documentation page
                                                 stays reachable via the row's
                                                 real href (open in new tab). */
                                              event.preventDefault();
                                              const rolePanelId =
                                                catalogFeaturePanelId(
                                                  ROLE_SECTION_ID,
                                                  guide.key,
                                                );
                                              setRoleRouteFocus(
                                                guide.key,
                                                item.path,
                                              );
                                              navigateToSection(rolePanelId);
                                              // The role's own section takes it
                                              // from here: it aligns the chosen
                                              // row onto the rail's reading line
                                              // once the page scroll settles.
                                              window.dispatchEvent(
                                                new CustomEvent(
                                                  "connected-os-open-route",
                                                  {
                                                    detail: {
                                                      role: guide.key,
                                                      path: item.path,
                                                    },
                                                  },
                                                ),
                                              );
                                            }}
                                            aria-current={
                                              roleRouteFocus?.path === item.path
                                                ? "true"
                                                : undefined
                                            }
                                            className={[
                                              ROW,
                                              "py-1.5",
                                              roleRouteFocus?.path === item.path
                                                ? "is-active"
                                                : "",
                                            ].join(" ")}
                                          >
                                            <span className={ROW_LABEL}>
                                              <span className="truncate font-medium tracking-[-0.01em]">
                                                {item.label[language]}
                                              </span>
                                            </span>
                                          </Link>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}

                                <Link
                                  href="/dashboard"
                                  onClick={closeRail}
                                  className={[ROW, "py-1.5"].join(" ")}
                                >
                                  <span
                                    className={[
                                      ROW_LABEL,
                                      "font-semibold",
                                    ].join(" ")}
                                  >
                                    <span className="truncate">
                                      {language === "bn"
                                        ? "সব ভূমিকার সব রুট"
                                        : "All roles, all routes"}
                                    </span>
                                  </span>
                                  <span
                                    aria-hidden
                                    className="shrink-0 text-[12px]"
                                  >
                                    →
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
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

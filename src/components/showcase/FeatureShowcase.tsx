"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiBook,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiChevronDown,
  FiClipboard,
  FiClock,
  FiCompass,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiGrid,
  FiHeadphones,
  FiHeart,
  FiHome,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiNavigation,
  FiPieChart,
  FiServer,
  FiStar,
  FiTarget,
  FiTool,
  FiTrendingUp,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

import { dashboardPathFor, CLIENT_DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  FEATURE_SHOWCASE_EYEBROW,
  FEATURE_SHOWCASE_HEADING,
  FEATURE_SHOWCASE_SUBTITLE,
  isShowcaseLinkLocked,
  resolveShowcaseHref,
  type ShowcaseFeature,
  type ShowcaseIconKey,
  type ShowcaseLanguage,
  type ShowcasePersona,
} from "@/lib/feature-showcase";

/** Logical icon key → concrete Feather glyph. */
const ICONS: Record<ShowcaseIconKey, IconType> = {
  home: FiHome,
  student: FiAward,
  operational: FiBriefcase,
  tools: FiGrid,
  studentInformation: FiUser,
  sis: FiDatabase,
  enrollment: FiClipboard,
  specialPrograms: FiStar,
  familyEngagement: FiHeart,
  communications: FiMessageSquare,
  attendance: FiCheckCircle,
  classroom: FiGrid,
  lms: FiBookOpen,
  assessment: FiBarChart2,
  curriculum: FiBook,
  intervention: FiTarget,
  mtss: FiLayers,
  behavior: FiActivity,
  cclr: FiCompass,
  naviance: FiNavigation,
  resource: FiPieChart,
  financial: FiDollarSign,
  erp: FiServer,
  predictive: FiTrendingUp,
  talent: FiAward,
  recruiting: FiUserPlus,
  educator: FiUsers,
  helpDesk: FiHeadphones,
  payment: FiCreditCard,
  serviceBuild: FiTool,
  expense: FiDollarSign,
  checkin: FiClock,
  customer: FiUserPlus,
  dashboard: FiGrid,
};

/**
 * In-page sections owned by the homepage's scroll-locked engine. Navigating to
 * one must go through the same window events the left rail dispatches, so the
 * engine locks/scrolls the right pane consistently. Any anchor outside this set
 * falls back to a plain smooth `scrollIntoView`.
 */
const HUB_SECTION_IDS = new Set<string>([
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
  "student-achievement",
  "classroom-solutions",
  "learning-management-schoology",
  "assessment-performance-matters",
  "curriculum-instruction",
  "student-intervention",
  "mtss",
  "behavior-support",
  "college-career-life-readiness",
  "cclr-naviance",
  "operational-excellence",
  "resource-planning",
  "financial-strategy-allovue",
  "erp-systems",
  "predictive-enrollment",
  "talent-management",
  "recruiting-and-hr",
  "educator-support",
]);

function navigateToSection(id: string) {
  window.dispatchEvent(new CustomEvent("connected-os-sidebar-navigate"));

  if (HUB_SECTION_IDS.has(id)) {
    window.dispatchEvent(new CustomEvent("connected-os-scroll-to-section", { detail: { id } }));
    window.dispatchEvent(new CustomEvent("connected-os-active-section", { detail: { id } }));
    return;
  }

  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.dispatchEvent(new CustomEvent("connected-os-active-section", { detail: { id } }));
}

/* Reused rail surface tokens (mirror the left rail's own constants). */
const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-34px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";
const ROW =
  "sidebar-row group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]";

function FeatureRow({
  feature,
  href,
  active,
  locked,
  language,
}: {
  feature: ShowcaseFeature;
  href: string;
  active: boolean;
  locked: boolean;
  language: ShowcaseLanguage;
}) {
  const Icon = ICONS[feature.icon];
  const isAnchor = feature.href.startsWith("#");

  const inner = (
    <>
      <Icon className="mt-[1px] shrink-0 text-[16px]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold leading-snug">
            {feature.title[language]}
          </span>
          {locked ? <FiLock className="shrink-0 text-[12px] opacity-70" aria-hidden /> : null}
        </span>
        <span className="showcase-desc mt-0.5 line-clamp-2 block text-[11px] font-medium leading-[1.35]">
          {feature.description[language]}
        </span>
      </span>
    </>
  );

  const className = [ROW, active ? "is-active" : ""].join(" ");
  const ariaCurrent = active ? ("true" as const) : undefined;

  if (isAnchor) {
    return (
      <a
        href={href}
        aria-current={ariaCurrent}
        className={className}
        onClick={(event) => {
          event.preventDefault();
          navigateToSection(href.slice(1));
        }}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} aria-current={ariaCurrent} className={className}>
      {inner}
    </Link>
  );
}

/**
 * "Explore Shikkha Connected OS" — the customer-facing capability showcase that
 * lives inside the existing Connected OS sidebar. Collapsible categories, short
 * benefit-oriented descriptions, role-aware destinations, and the active route
 * highlighted, all reusing the rail's own visual language.
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const [openCategory, setOpenCategory] = useState<string | null>(
    FEATURE_SHOWCASE[0]?.id ?? null,
  );

  const dashboardHref = dashboardPathFor(user);
  const persona: ShowcasePersona =
    dashboardHref === CLIENT_DASHBOARD_PATH ? "client" : "staff";

  const resolveContext = { status, persona, loginHref: LOGIN_PATH, dashboardHref };

  const isActive = (feature: ShowcaseFeature) => {
    if (feature.access === "public") return false;
    return pathname === feature.href || pathname.startsWith(`${feature.href}/`);
  };

  return (
    <section
      data-no-translate="true"
      aria-label={FEATURE_SHOWCASE_HEADING[language]}
      className={`mt-4 overflow-hidden rounded-2xl border bg-[var(--color-white)] p-3.5 backdrop-blur-md ${CARD_BORDER} ${CARD_SHADOW}`}
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_38%,var(--color-white))] text-[17px] text-[var(--color-primary)]">
          <FiNavigation aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {FEATURE_SHOWCASE_EYEBROW[language]}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-primary)]">
            {FEATURE_SHOWCASE_HEADING[language]}
          </h3>
        </div>
      </header>

      <p className="mt-2.5 text-[11.5px] font-medium leading-[1.5] text-[color-mix(in_srgb,var(--color-primary)_64%,transparent)]">
        {FEATURE_SHOWCASE_SUBTITLE[language]}
      </p>

      <div className="mt-3 flex flex-col gap-1">
        {FEATURE_SHOWCASE.map((category) => {
          const isOpen = openCategory === category.id;
          const CategoryIcon = ICONS[category.icon];
          const panelId = `showcase-panel-${category.id}`;

          return (
            <div key={category.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenCategory(isOpen ? null : category.id)}
                className={[ROW, isOpen ? "is-open" : ""].join(" ")}
              >
                <CategoryIcon className="shrink-0 text-[16px]" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-[-0.01em]">
                  {category.title[language]}
                </span>
                <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                  {category.features.length}
                </span>
                <FiChevronDown
                  className={[
                    "shrink-0 text-[15px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isOpen ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>

              <div
                id={panelId}
                className={[
                  "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                ].join(" ")}
              >
                <div className="overflow-hidden">
                  <p className="mt-1.5 ml-3 pl-2.5 text-[11px] font-medium leading-[1.45] text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
                    {category.description[language]}
                  </p>
                  <div className="mt-1 ml-3 space-y-0.5 border-l border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] pl-2.5">
                    {category.features.map((feature) => (
                      <FeatureRow
                        key={feature.id}
                        feature={feature}
                        href={resolveShowcaseHref(feature, resolveContext)}
                        active={isActive(feature)}
                        locked={isShowcaseLinkLocked(feature, resolveContext)}
                        language={language}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

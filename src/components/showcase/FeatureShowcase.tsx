"use client";

import { useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBook,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClipboard,
  FiClock,
  FiCpu,
  FiCreditCard,
  FiEdit,
  FiEdit3,
  FiFilePlus,
  FiFileText,
  FiFlag,
  FiGlobe,
  FiGrid,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiImage,
  FiInfo,
  FiLayers,
  FiList,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiPieChart,
  FiSearch,
  FiShield,
  FiStar,
  FiTarget,
  FiTrendingUp,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  FEATURE_SHOWCASE_FEATURE_COUNT,
  SHOWCASE_TEXT,
  showcaseAccessLabel,
  showcaseStatusLabel,
  type ShowcaseCategory,
  type ShowcaseFeature,
  type ShowcaseIconKey,
  type ShowcaseLanguage,
} from "@/lib/feature-showcase";

/** Logical icon key → concrete Feather glyph. */
const ICONS: Record<ShowcaseIconKey, IconType> = {
  school: FiBookOpen,
  sparkles: FiStar,
  graduation: FiAward,
  parents: FiHeart,
  shield: FiShield,
  landmark: FiFlag,
  globe: FiGlobe,
  layout: FiGrid,
  users: FiUsers,
  userCheck: FiUserCheck,
  calendar: FiCalendar,
  clipboard: FiClipboard,
  chart: FiBarChart2,
  book: FiBook,
  brain: FiCpu,
  notebook: FiEdit3,
  quiz: FiHelpCircle,
  target: FiTarget,
  messages: FiMessageSquare,
  insight: FiTrendingUp,
  shieldAlert: FiAlertTriangle,
  policy: FiFileText,
  history: FiClock,
  building: FiBriefcase,
  outcome: FiCheckCircle,
  district: FiMapPin,
  equity: FiPieChart,
  enrollment: FiUserPlus,
  home: FiHome,
  notice: FiBell,
  syllabus: FiList,
  homework: FiEdit,
  fees: FiCreditCard,
  gallery: FiImage,
  facility: FiLayers,
  contact: FiPhone,
  admission: FiFilePlus,
  info: FiInfo,
};

/* Reused rail surface tokens (mirror the left rail's own constants). */
const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-34px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";
const ROW =
  "group flex w-full items-center gap-2.5 rounded-2xl px-2.5 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]";
const MUTED = "text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";

type FlatFeature = { readonly feature: ShowcaseFeature };

function matchesQuery(feature: ShowcaseFeature, q: string): boolean {
  const hay = `${feature.title.bn} ${feature.title.en} ${feature.description.bn} ${feature.description.en}`;
  return hay.toLowerCase().includes(q);
}

/** A single feature row + its expandable informational detail. */
function FeatureItem({
  feature,
  language,
  open,
  onToggle,
}: {
  feature: ShowcaseFeature;
  language: ShowcaseLanguage;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = ICONS[feature.icon];
  const detailId = `showcase-detail-${feature.id}`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={onToggle}
        className={[ROW, open ? "is-open" : ""].join(" ")}
      >
        <Icon className="mt-[1px] shrink-0 text-[15px]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold leading-snug">
            {feature.title[language]}
          </span>
          <span className="showcase-desc mt-0.5 line-clamp-2 block text-[10.5px] font-medium leading-[1.35]">
            {feature.description[language]}
          </span>
        </span>
        <FiChevronDown
          className={[
            "shrink-0 text-[14px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      <div
        id={detailId}
        className={[
          "grid transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="mb-1 ml-2.5 mr-1 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)] px-2.5 py-2">
            <dl className="space-y-1 text-[10.5px] leading-[1.4]">
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
                  {SHOWCASE_TEXT.sourceRoute[language]}:
                </dt>
                <dd className="min-w-0 break-all font-mono text-[10px] text-[var(--color-primary)]">
                  {feature.route}
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
}

function CategoryBlock({
  category,
  language,
  openCategory,
  setOpenCategory,
  openFeature,
  setOpenFeature,
}: {
  category: ShowcaseCategory;
  language: ShowcaseLanguage;
  openCategory: string | null;
  setOpenCategory: (id: string | null) => void;
  openFeature: string | null;
  setOpenFeature: (id: string | null) => void;
}) {
  const isOpen = openCategory === category.id;
  const CategoryIcon = ICONS[category.icon];
  const panelId = `showcase-panel-${category.id}`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpenCategory(isOpen ? null : category.id)}
        className={[ROW, isOpen ? "is-open" : ""].join(" ")}
      >
        <CategoryIcon className="shrink-0 text-[15px]" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-[-0.01em]">
          {category.title[language]}
        </span>
        <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
          {category.features.length}
        </span>
        <FiChevronDown
          className={[
            "shrink-0 text-[14px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
          <div className="mt-1 ml-3 space-y-0.5 border-l border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] pl-1.5">
            {category.features.map((feature) => (
              <FeatureItem
                key={feature.id}
                feature={feature}
                language={language}
                open={openFeature === feature.id}
                onToggle={() =>
                  setOpenFeature(openFeature === feature.id ? null : feature.id)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * "Explore Shikkha Connected OS" — the customer-facing feature showcase that
 * lives inside the existing Connected OS homepage sidebar. It carries the
 * COMPLETE Shikkha Chat Apps route catalog (15 categories / 87 features) as an
 * informational, searchable, bilingual accordion. Every entry opens an inline
 * detail view (who it is for · source route · status); nothing links to a
 * nonexistent Connected OS page (see `feature-showcase.ts` for the route policy).
 */
export default function FeatureShowcase() {
  const { language: rawLanguage } = useLanguage();
  const language: ShowcaseLanguage = rawLanguage === "en" ? "en" : "bn";

  const [openCategory, setOpenCategory] = useState<string | null>(
    FEATURE_SHOWCASE[0]?.id ?? null,
  );
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const results: FlatFeature[] | null = useMemo(() => {
    if (!q) return null;
    const out: FlatFeature[] = [];
    for (const category of FEATURE_SHOWCASE) {
      for (const feature of category.features) {
        if (matchesQuery(feature, q)) out.push({ feature });
      }
    }
    return out;
  }, [q]);

  return (
    <section
      data-no-translate="true"
      aria-label={SHOWCASE_TEXT.heading[language]}
      className={`mt-4 overflow-hidden rounded-2xl border bg-[var(--color-white)] p-3.5 backdrop-blur-md ${CARD_BORDER} ${CARD_SHADOW}`}
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_38%,var(--color-white))] text-[17px] text-[var(--color-primary)]">
          <FiGrid aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {SHOWCASE_TEXT.eyebrow[language]}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-primary)]">
            {SHOWCASE_TEXT.heading[language]}
          </h3>
        </div>
      </header>

      <p className="mt-2.5 text-[11px] font-medium leading-[1.5] text-[color-mix(in_srgb,var(--color-primary)_64%,transparent)]">
        {SHOWCASE_TEXT.subtitle[language]}
      </p>

      <p className={`mt-1.5 text-[10px] font-medium leading-[1.5] ${MUTED}`}>
        {SHOWCASE_TEXT.catalogNote[language]}{" "}
        <span className="font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {FEATURE_SHOWCASE_FEATURE_COUNT}
        </span>
      </p>

      {/* Search / filter across the whole catalog */}
      <div className="relative mt-2.5">
        <FiSearch
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SHOWCASE_TEXT.searchPlaceholder[language]}
          aria-label={SHOWCASE_TEXT.searchPlaceholder[language]}
          className="w-full rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] py-1.5 pl-7 pr-7 text-[11px] font-medium text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
        />
        {query ? (
          <button
            type="button"
            aria-label={SHOWCASE_TEXT.searchClear[language]}
            onClick={() => setQuery("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
          >
            <FiX aria-hidden />
          </button>
        ) : null}
      </div>

      {results ? (
        <div className="mt-2 flex flex-col gap-0.5">
          {results.length === 0 ? (
            <p className={`px-2.5 py-3 text-[11px] font-medium ${MUTED}`}>
              {SHOWCASE_TEXT.noResults[language]}
            </p>
          ) : (
            results.map(({ feature }) => (
              <FeatureItem
                key={feature.id}
                feature={feature}
                language={language}
                open={openFeature === feature.id}
                onToggle={() =>
                  setOpenFeature(openFeature === feature.id ? null : feature.id)
                }
              />
            ))
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-0.5">
          {FEATURE_SHOWCASE.map((category) => (
            <CategoryBlock
              key={category.id}
              category={category}
              language={language}
              openCategory={openCategory}
              setOpenCategory={(id) => {
                setOpenCategory(id);
                setOpenFeature(null);
              }}
              openFeature={openFeature}
              setOpenFeature={setOpenFeature}
            />
          ))}
        </div>
      )}
    </section>
  );
}

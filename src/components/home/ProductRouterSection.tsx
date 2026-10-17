"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  FiArrowUpRight,
  FiChevronRight,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { MdOutlineGridView } from "react-icons/md";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  FEATURE_SHOWCASE,
  FEATURE_SHOWCASE_FEATURE_COUNT,
  type ShowcaseCategory,
  type ShowcaseFeature,
  type ShowcaseLanguage,
} from "@/lib/feature-showcase";
import { SHOWCASE_ICONS } from "@/components/showcase/catalog/icons";
import {
  catalogFeaturePanelId,
  catalogSectionId,
} from "@/components/showcase/catalog/sceneGroups";

type RouterText = {
  eyebrow: string;
  heading: string;
  subheading: string;
  categorySuffix: string;
  featureSuffix: string;
  searchPlaceholder: string;
  searchClear: string;
  noResults: string;
  siteHeading: string;
  siteSubheading: string;
  home: string;
  helpDesk: string;
  expert: string;
};

const textContent: Record<ShowcaseLanguage, RouterText> = {
  bn: {
    eyebrow: "সাইট নেভিগেশন",
    heading: "সব সেকশন, এক ক্লিকে",
    subheading:
      "সাইডবারের প্রতিটি ড্রপডাউন সেকশন ও তার প্রতিটি বৈশিষ্ট্য এখানে সরাসরি শর্টকাট — গ্রুপ অনুযায়ী সাজানো, সার্চ দিয়ে খুঁজুন।",
    categorySuffix: "বিভাগ",
    featureSuffix: "বৈশিষ্ট্য",
    searchPlaceholder: "সেকশন বা বৈশিষ্ট্য খুঁজুন…",
    searchClear: "খোঁজ মুছুন",
    noResults: "কোনো সেকশন বা বৈশিষ্ট্য মেলেনি।",
    siteHeading: "সাইট লিংক",
    siteSubheading: "পুরো ওয়েবসাইটের দ্রুত লিংক।",
    home: "হোম",
    helpDesk: "হেল্প ডেস্ক",
    expert: "বিশেষজ্ঞের সাথে কথা বলুন",
  },
  en: {
    eyebrow: "Site navigation",
    heading: "Every section, one click away",
    subheading:
      "Every sidebar dropdown section and each of its features, laid out here as a direct shortcut — grouped, with search to find anything fast.",
    categorySuffix: "sections",
    featureSuffix: "features",
    searchPlaceholder: "Search sections or features…",
    searchClear: "Clear search",
    noResults: "No matching sections or features.",
    siteHeading: "Site links",
    siteSubheading: "Quick links across the whole website.",
    home: "Home",
    helpDesk: "Help Desk",
    expert: "Talk to an Expert",
  },
};

/**
 * Navigate to a section on the page — fires the exact three events the
 * Connected OS scroll engine and the left rail already speak (identical to
 * FeatureShowcase.navigateToSection), with a getElementById scroll fallback.
 */
function navigateToSection(id: string) {
  window.dispatchEvent(new CustomEvent("connected-os-sidebar-navigate"));
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", { detail: { id } })
  );
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", { detail: { id } })
  );
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

/** Shared easing — the site's --ease-smooth. */
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Footer-above "site navigation": a theme-matched shortcut directory that
 * mirrors the whole left rail. Every one of the 15 catalog categories becomes
 * a card and each of its 87 features a one-click shortcut, so the site's own
 * navigation language (rail rows) is reproducible here. Data comes from
 * FEATURE_SHOWCASE — the exact catalog the rail renders — so nothing drifts.
 */
export default function ProductRouterSection() {
  const { language } = useLanguage();
  const lang: ShowcaseLanguage = language === "en" ? "en" : "bn";
  const t = textContent[lang];
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return FEATURE_SHOWCASE;
    const matches = (text: { bn: string; en: string }) =>
      text.bn.toLowerCase().includes(q) || text.en.toLowerCase().includes(q);
    return FEATURE_SHOWCASE.map((category) => {
      const catMatch = matches(category.title);
      const features = catMatch
        ? category.features
        : category.features.filter((f) => matches(f.title));
      if (!catMatch && features.length === 0) return null;
      return { ...category, features } as ShowcaseCategory;
    }).filter((c): c is ShowcaseCategory => c !== null);
  }, [q]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (shouldReduceMotion) {
      setRevealed(true);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const shown = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        const ratio = shown / Math.max(1, Math.min(r.height, vh));
        if (ratio > 0.12) {
          setRevealed(true);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [shouldReduceMotion]);

  const reveal = useMemo(() => {
    const container: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } },
    };
    const up: Variants = shouldReduceMotion
      ? {
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { duration: 0.2 } },
        }
      : {
          hidden: { opacity: 0, y: 22 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
        };
    return { container, up };
  }, [shouldReduceMotion]);

  const siteLinks: Array<{ label: string; href: string; external?: boolean }> =
    [
      { label: t.home, href: "#top" },
      { label: t.helpDesk, href: "/help-desk", external: true },
      { label: t.expert, href: "#connect" },
    ];

  function goHref(href: string) {
    if (href === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (href.startsWith("#")) navigateToSection(href.slice(1));
    else window.location.assign(href);
  }

  return (
    <section
      ref={sectionRef}
      className="relative bg-[var(--color-white)] px-4 py-16 text-[var(--color-primary)] sm:px-6 lg:px-8 lg:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[360px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--color-action)_6%,transparent),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          variants={reveal.container}
          initial={shouldReduceMotion ? "show" : "hidden"}
          animate={revealed ? "show" : "hidden"}
        >
          {/* Header */}
          <motion.div
            variants={reveal.up}
            className="mx-auto mb-8 max-w-2xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-action)_35%,transparent)] bg-[var(--color-action-tint)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-action)]">
              <MdOutlineGridView className="text-[13px]" />
              {t.eyebrow}
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--color-primary)] sm:text-[30px]">
              {t.heading}
            </h2>
            <p className="mt-3 text-[14.5px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
              {t.subheading}
            </p>
            <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
              {FEATURE_SHOWCASE.length} {t.categorySuffix} ·{" "}
              {FEATURE_SHOWCASE_FEATURE_COUNT} {t.featureSuffix}
            </p>
          </motion.div>

          {/* Search */}
          <motion.div variants={reveal.up} className="mx-auto mb-6 max-w-md">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="h-12 w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] pl-11 pr-11 text-[14px] font-medium text-[var(--color-primary)] outline-none transition focus:border-[var(--color-action)] focus:bg-[var(--color-white)] focus:ring-4 focus:ring-[var(--color-action-ring)] placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t.searchClear}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]"
                >
                  <FiX className="text-[15px]" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Category cards — every rail dropdown + each of its features */}
          {filtered.length === 0 ? (
            <motion.p
              variants={reveal.up}
              className="py-12 text-center text-[14px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
            >
              {t.noResults}
            </motion.p>
          ) : (
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((category) => {
                const Icon = SHOWCASE_ICONS[category.icon];
                return (
                  <motion.div key={category.id} variants={reveal.up}>
                    <div className="group/panel flex h-full flex-col overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] shadow-[0_16px_40px_-28px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] transition-shadow duration-300 hover:shadow-[0_22px_50px_-26px_color-mix(in_srgb,var(--color-action)_26%,transparent)]">
                      <button
                        type="button"
                        onClick={() =>
                          navigateToSection(catalogSectionId(category.id))
                        }
                        className="flex w-full items-center gap-3 bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-4 py-3.5 text-left transition-colors duration-300 hover:bg-[var(--color-action-tint)]"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-white)] text-[18px] text-[var(--color-primary)] shadow-[0_6px_16px_-8px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] transition-colors duration-300 group-hover/panel:text-[var(--color-action)]">
                          <Icon />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-extrabold tracking-[-0.01em]">
                            {category.title[lang]}
                          </span>
                          <span className="block text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                            {category.features.length} {t.featureSuffix}
                          </span>
                        </span>
                        <FiChevronRight className="text-[16px] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition-transform duration-300 group-hover/panel:translate-x-0.5" />
                      </button>

                      <ul className="flex-1 p-2">
                        {category.features.map((feature, i) => (
                          <li key={feature.id}>
                            <button
                              type="button"
                              onClick={() =>
                                navigateToSection(
                                  catalogFeaturePanelId(
                                    category.id,
                                    feature.id
                                  )
                                )
                              }
                              className="group/row flex w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-left transition-colors duration-200 hover:bg-[var(--color-action-tint)]"
                            >
                              <span className="w-5 shrink-0 text-center text-[11px] font-bold tabular-nums text-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] group-hover/row:text-[var(--color-action)]">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold leading-snug text-[var(--color-primary)] group-hover/row:text-[var(--color-action)]">
                                {feature.title[lang]}
                              </span>
                              <FiChevronRight className="shrink-0 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] opacity-0 transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-[var(--color-action)] group-hover/row:opacity-100" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Whole-website links strip */}
          <motion.div
            variants={reveal.up}
            className="mt-6 rounded-[22px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-5 py-5 sm:px-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)]">
                  {t.siteHeading}
                </p>
                <p className="text-[12.5px] font-medium text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                  {t.siteSubheading}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {siteLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => goHref(link.href)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] bg-[var(--color-white)] px-4 py-2 text-[13px] font-bold text-[var(--color-primary)] transition duration-200 hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]"
                  >
                    {link.label}
                    {link.external ? (
                      <FiArrowUpRight className="text-[12px]" />
                    ) : (
                      <FiChevronRight className="text-[13px]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

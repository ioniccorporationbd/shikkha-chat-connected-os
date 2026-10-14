"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ShowcaseCategory, ShowcaseFeature } from "@/lib/feature-showcase";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

/*
 * -------------------------------------------------------------------------
 * CATALOG FEATURE MIDDLE SCENE — the CLASSIC Connected-OS middle layout
 * (the 13/10 design language), with the CURRENT card design kept intact.
 *
 *   • A bordered central FRAME (the "room") holds the current feature plus its
 *     first sibling — one of them rendered larger (the featured pair).
 *   • The remaining sibling features sit as mini-cards SCATTERED around the
 *     room at the original percentage positions — they land both inside the
 *     section and just outside the room frame, the classic in+out arrangement.
 *   • Every scattered card is tied to the room by a drawn connector line and
 *     reveals with the original framer-motion stagger (fade + rise).
 *   • The card VISUAL design (icon + title tile) is unchanged from the current
 *     catalog design; only the arrangement + animation follow the 13/10 branch.
 *   • A few sections keep every card inside the room (variant driven) so the
 *     middle rail still reads with per-section variation.
 * -------------------------------------------------------------------------
 */

const CARD_W = 118;
const CARD_H = 100;

// Scatter positions (percent of the stage). The room sits at centre; these ring
// it with a real spread — inner corners plus the four edges — so cards land
// both inside the section and just outside the room frame.
const SCATTER: ReadonlyArray<{ x: number; y: number }> = [
  { x: 14, y: 17 },
  { x: 86, y: 16 },
  { x: 10, y: 42 },
  { x: 90, y: 40 },
  { x: 16, y: 83 },
  { x: 84, y: 83 },
  { x: 50, y: 13 },
  { x: 50, y: 88 },
  { x: 31, y: 14 },
  { x: 69, y: 14 },
  { x: 28, y: 86 },
  { x: 72, y: 86 },
  { x: 9, y: 62 },
  { x: 91, y: 60 },
];

function scrollToPanel(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", { detail: { id } }),
  );
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", { detail: { id } }),
  );
}

export default function CatalogFeatureScene({
  category,
  feature,
  variant = 0,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
  /** Drives the per-section arrangement (scatter rotation + which sections keep
   *  every card inside the room). The card design itself is unchanged. */
  variant?: number;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);

  const panelId = catalogFeaturePanelId(category.id, feature.id);
  const siblings = useMemo(
    () => category.features.filter((item) => item.id !== feature.id),
    [category.features, feature.id],
  );

  const v = ((variant % 6) + 6) % 6;
  const allInside = v === 2 || v === 5; // a few sections keep every card inside
  const shift = (variant * 3) % SCATTER.length;

  // The room keeps the featured pair (hero + first sibling); the rest scatter.
  const insideCards = siblings.length ? [feature, siblings[0]] : [feature];
  const scattered = siblings.slice(1);

  const points = useMemo(
    () => scattered.map((_, i) => SCATTER[(i + shift) % SCATTER.length]),
    [scattered, shift],
  );

  const pageVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduce ? 0 : 0.07,
        delayChildren: reduce ? 0 : 0.12,
      },
    },
  };
  const itemVariants: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.55, ease: PREMIUM_EASE },
    },
  };

  const HeroIcon = SHOWCASE_ICONS[feature.icon];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_9%,var(--color-white))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 opacity-90 blur-[88px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[14%] top-[14%] h-[240px] w-[240px] rounded-full bg-[var(--color-secondary)]/12 blur-[86px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[10%] right-[12%] h-[280px] w-[280px] rounded-full bg-[var(--color-secondary)]/12 blur-[94px]"
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative h-full w-full"
      >
        {/* Connector lines from the room to every scattered card. */}
        {!allInside && scattered.length ? (
          <svg
            className="pointer-events-none absolute inset-0 z-[15] h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {points.map((p, i) => {
              const d = `M 500 500 L ${(p.x * 10).toFixed(1)} ${(p.y * 10).toFixed(1)}`;
              const hot = hovered === scattered[i].id;
              return (
                <g key={scattered[i].id}>
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="var(--color-secondary)"
                    strokeWidth={hot ? 20 : 14}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: hot ? 0.55 : 0.28 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: PREMIUM_EASE, delay: reduce ? 0 : 0.15 + i * 0.06 }}
                  />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="var(--color-white)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduce ? 0 : 0.55, ease: PREMIUM_EASE, delay: reduce ? 0 : 0.15 + i * 0.06 }}
                  />
                  <motion.path
                    d={d}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth={hot ? 6 : 4}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduce ? 0 : 0.6, ease: PREMIUM_EASE, delay: reduce ? 0 : 0.15 + i * 0.06 }}
                  />
                </g>
              );
            })}
          </svg>
        ) : null}

        {/* Central room — the featured pair (bordered frame + title pill). */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 top-[-54px] z-20 -translate-x-1/2">
              <span className="hc-scene-pill inline-flex h-[40px] min-w-[260px] items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-[var(--color-primary)] bg-[var(--color-white)] px-[34px] text-center text-[13px] font-black uppercase leading-[37px] tracking-[0.12em] text-[var(--color-primary)] shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
                {category.title[lang]}
              </span>
            </div>

            <div
              className={[
                "cf-room rounded-[26px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-[14px]",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                allInside ? "h-[352px] w-[470px]" : "h-[232px] w-[368px]",
              ].join(" ")}
            >
              {allInside ? (
                <div className="grid h-full w-full grid-cols-3 content-center gap-x-2.5 gap-y-2">
                  {[feature, ...siblings].map((item) => {
                    const Icon = SHOWCASE_ICONS[item.icon];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          scrollToPanel(catalogFeaturePanelId(category.id, item.id))
                        }
                        aria-label={item.title[lang]}
                        className="cf-room-tile group flex flex-col items-center justify-center gap-1.5 rounded-[14px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_7%,var(--color-white))] px-1.5 py-2 text-center outline-none transition-colors hover:border-[var(--color-action)] hover:bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))]"
                      >
                        <span className="text-[22px] leading-none text-[var(--color-primary)]">
                          <Icon />
                        </span>
                        <span className="card-title line-clamp-2">{item.title[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={
                    "grid h-full w-full items-stretch gap-3 " +
                    (insideCards.length > 1 ? "grid-cols-[124px_1fr]" : "grid-cols-1")
                  }
                >
                  {insideCards.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        scrollToPanel(
                          catalogFeaturePanelId(category.id, insideCards[1].id),
                        )
                      }
                      aria-label={insideCards[1].title[lang]}
                      className="cf-room-tile group flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[16px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_7%,var(--color-white))] px-2 text-center outline-none transition-colors hover:border-[var(--color-action)] hover:bg-[color-mix(in_srgb,var(--color-action)_10%,var(--color-white))]"
                    >
                      <span className="text-[24px] leading-none text-[var(--color-primary)]">
                        {(() => {
                          const Icon = SHOWCASE_ICONS[insideCards[1].icon];
                          return <Icon />;
                        })()}
                      </span>
                      <span className="card-title line-clamp-3">
                        {insideCards[1].title[lang]}
                      </span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => scrollToPanel(panelId)}
                    aria-label={feature.title[lang]}
                    className="cf-room-tile group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[18px] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-3 text-center outline-none transition-colors hover:border-[var(--color-action)] hover:bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))]"
                  >
                    <span className="text-[44px] leading-none text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
                      {HeroIcon ? <HeroIcon /> : null}
                    </span>
                    <span className="card-title max-w-[210px] text-center">
                      {feature.title[lang]}
                    </span>
                    <span className="text-[10px] font-normal uppercase tracking-[0.12em] text-[var(--color-action)] opacity-80">
                      {category.title[lang]}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Scattered sibling feature mini-cards (current tile design). */}
        {!allInside
          ? scattered.map((item, i) => {
              const p = points[i];
              const Icon = SHOWCASE_ICONS[item.icon];
              const tileId = catalogFeaturePanelId(category.id, item.id);
              const hot = hovered === item.id;

              return (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="cf-scatter-card absolute z-20"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    marginLeft: -CARD_W / 2,
                    marginTop: -CARD_H / 2,
                    width: CARD_W,
                  }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() =>
                    setHovered((current) => (current === item.id ? null : current))
                  }
                >
                  <button
                    type="button"
                    onClick={() => scrollToPanel(tileId)}
                    aria-label={item.title[lang]}
                    title={item.title[lang]}
                    className={
                      "connected-spot hc-orbit-tile group relative flex min-h-[100px] w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[9px] py-[10px] text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]" +
                      (hot ? " is-hot" : "")
                    }
                  >
                    <span className="connected-icon-float mb-[6px] text-[24px] leading-none text-[var(--color-primary)]">
                      <Icon />
                    </span>
                    <span className="card-title line-clamp-2 min-h-[30px] max-w-[100px] text-center font-normal">
                      {item.title[lang]}
                    </span>
                  </button>
                </motion.div>
              );
            })
          : null}
      </motion.div>
    </div>
  );
}

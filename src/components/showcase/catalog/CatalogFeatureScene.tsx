"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
 *     room — some land inside the section, some just outside the room frame.
 *   • No connector lines. The scattered cards SPAN IN FROM THE RIGHT, one after
 *     another in ANTICLOCKWISE order, staggered so the whole reveal runs for
 *     about one second each time the section scrolls into view.
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

// The staggered reveal runs for roughly one second in total.
const REVEAL_TOTAL_S = 1.0;
const REVEAL_LEAD_S = 0.08;
const REVEAL_CARD_S = 0.42;
const REVEAL_SPAN_S = Math.max(REVEAL_TOTAL_S - REVEAL_LEAD_S - REVEAL_CARD_S, 0.1); // ≈0.5s of stagger span

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

  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // Reveal the anticlockwise spotting when this section enters the viewport and
  // replay it on each re-entry. Mirrors the app's own scroll engine (a passive
  // rAF-throttled scroll listener) which is reliable inside this sticky-scroll
  // layout where IntersectionObserver proved laggy; the parent variants then
  // cascade the reveal to the room + scattered cards. Hysteresis prevents flicker.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf: number | null = null;
    let cur = false;
    const measure = () => {
      raf = null;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      const ratio = visible / Math.max(r.height, 1);
      const next = ratio >= 0.4 ? true : ratio < 0.15 ? false : cur;
      if (next !== cur) {
        cur = next;
        setShown(next);
      }
    };
    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

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

  // Each scattered card, tagged with its ANTICLOCKWISE rank around the room
  // (angle from the centre, 0° = right/east, increasing counter-clockwise).
  const cards = useMemo(() => {
    const arr = scattered.map((item, i) => {
      const p = points[i];
      const angle = Math.atan2(50 - p.y, p.x - 50);
      return { item, p, angle };
    });
    const order = [...arr].sort((a, b) => a.angle - b.angle);
    const rank = new Map<string, number>();
    order.forEach((c, idx) => rank.set(c.item.id, idx));
    return arr.map((c) => ({ ...c, rank: rank.get(c.item.id) ?? 0 }));
  }, [scattered, points]);

  const step = reduce ? 0 : REVEAL_SPAN_S / Math.max(cards.length, 1);

  const pageVariants: Variants = { hidden: {}, visible: {} };
  const roomVariants: Variants = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.5, ease: PREMIUM_EASE, delay: 0 },
    },
  };
  // Scattered cards span in from the RIGHT, sequentially in anticlockwise order.
  const cardVariants = (rank: number): Variants => ({
    hidden: reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 96 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reduce ? 0 : REVEAL_CARD_S,
        ease: PREMIUM_EASE,
        delay: reduce ? 0 : REVEAL_LEAD_S + rank * step,
      },
    },
  });
  const tileVariants = (i: number, count: number): Variants => ({
    hidden: reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 64 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: reduce ? 0 : 0.4,
        ease: PREMIUM_EASE,
        delay: reduce ? 0 : REVEAL_LEAD_S + i * (REVEAL_SPAN_S / Math.max(count, 1)),
      },
    },
  });

  const HeroIcon = SHOWCASE_ICONS[feature.icon];
  const roomTiles = allInside ? [feature, ...siblings] : insideCards;

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_9%,var(--color-white))]"
    >
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
        animate={shown ? "visible" : "hidden"}
        className="relative h-full w-full"
      >
        {/* Central room — the featured pair (bordered frame + title pill). */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={roomVariants} className="relative">
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
                  {roomTiles.map((item, i) => {
                    const Icon = SHOWCASE_ICONS[item.icon];
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        variants={tileVariants(i, roomTiles.length)}
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
                      </motion.button>
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

        {/* Scattered sibling feature mini-cards — span in from the right, one
            after another in anticlockwise order (current tile design). */}
        {!allInside
          ? cards.map(({ item, p, rank }) => {
              const Icon = SHOWCASE_ICONS[item.icon];
              const tileId = catalogFeaturePanelId(category.id, item.id);

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants(rank)}
                  className="cf-scatter-card absolute z-20"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    marginLeft: -CARD_W / 2,
                    marginTop: -CARD_H / 2,
                    width: CARD_W,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => scrollToPanel(tileId)}
                    aria-label={item.title[lang]}
                    title={item.title[lang]}
                    className="connected-spot hc-orbit-tile group relative flex min-h-[100px] w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[9px] py-[10px] text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
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

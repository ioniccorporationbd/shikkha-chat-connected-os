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
 *   • A bordered central FRAME (the "room") holds the MAIN (featured) card —
 *     the biggest card.
 *   • The section's other features sit as MINI-CARDS on a RING around the room.
 *     The ring starts at the RIGHT and runs ANTICLOCKWISE (right → top → left →
 *     bottom), so the cards SPAN IN CIRCULARLY, one after another, over ~1s.
 *   • EVERY card of a sub-section flies in from ONE shared direction, and the
 *     sub-sections cycle top → bottom → right → left → out of the centre card.
 *     Each main section starts that cycle at a different phase, so neighbouring
 *     sections read differently. In one or two sections only, the big centre
 *     card additionally drops in top/bottom.
 *   • Sizes follow a single hierarchy: the MAIN card is the biggest, exactly ONE
 *     ring card is a MEDIUM size, and every other card is SMALL.
 *
 * Section handling by feature count (the few-card sections read deliberately):
 *   • 1 card  → a single BIG card on its own.
 *   • 2 cards → BIG card in the middle + one MEDIUM card outside (right).
 *   • 3 cards → BIG inside + MEDIUM middle + the rest SMALL outside.
 *   • 4 cards → BIG inside + MEDIUM middle + the rest (two) SMALL outside.
 *   • 5+      → the full circular ring. (Every section now uses the SAME card
 *               design — the flat in-room grid variation was removed so the
 *               busy sections match every other card on the page.)
 *
 *   • No connector lines. The card VISUAL design is unchanged from the current
 *     catalog design; only the arrangement + animation change.
 * -------------------------------------------------------------------------
 */

// Card footprints (px). MAIN = biggest; one ring card = MEDIUM; rest = SMALL.
const BIG = { w: 250, h: 208 };
const MEDIUM = { w: 152, h: 132 };
const SMALL = { w: 104, h: 92 };

// The secondary ring sits on an ellipse around the central frame, starting at
// the RIGHT and running anticlockwise (right → top → left → bottom).
const RING_RX = 36; // % of stage width
const RING_RY = 38; // % of stage height

// Every ring card flies in from its OWN direction so that a single section
// shows MULTIPLE entrance themes at once (never one uniform direction for a
// whole section). `ringOffset` maps a direction variant + the card's ring angle
// to that card's hidden transform (travelled distance, px):
//   0 from the RIGHT   1 from the LEFT   2 from the TOP   3 from the BOTTOM
//   4 from OUTSIDE → IN (towards the centre along its own radius)
//   5 from INSIDE the centre card → OUT
const TRAVEL_H = 340;
const TRAVEL_V = 380;
const TRAVEL_OUT = 150;
const TRAVEL_IN = 300;
function ringOffset(dir: number, ang: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  switch (dir) {
    case 0:
      return { x: TRAVEL_H, y: 0 };
    case 1:
      return { x: -TRAVEL_H, y: 0 };
    case 2:
      return { x: 0, y: -TRAVEL_V };
    case 3:
      return { x: 0, y: TRAVEL_V };
    case 4:
      return { x: c * TRAVEL_OUT, y: -s * TRAVEL_OUT };
    default:
      return { x: -c * TRAVEL_IN, y: s * TRAVEL_IN };
  }
}

// The staggered reveal runs for roughly one second in total.
const REVEAL_TOTAL_S = 1.0;
const REVEAL_LEAD_S = 0.08;
const REVEAL_CARD_S = 0.42;
const REVEAL_SPAN_S = Math.max(REVEAL_TOTAL_S - REVEAL_LEAD_S - REVEAL_CARD_S, 0.1); // ≈0.5s

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
  index = 0,
  featureIndex = 0,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
  /** The section's order on the page. Drives the one entrance DIRECTION shared
   *  by every card of the section (neighbours get different directions). */
  index?: number;
  /** The feature's order WITHIN its main section. In the first main section this
   *  steps the entrance direction sub-section by sub-section. */
  featureIndex?: number;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const reduce = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // Reveal the circular spotting when this section enters the viewport and
  // replay it on each re-entry. A per-frame measurement loop (cheap: one
  // getBoundingClientRect per scene) reacts within a frame to both scroll AND
  // post-load layout shifts, which the app's lazy video banners cause — a
  // scroll-event or IntersectionObserver trigger proved flaky/slow here.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    let cur = false;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      const ratio = visible / Math.max(r.height, 1);
      const next = ratio >= 0.25 ? true : ratio < 0.1 ? false : cur;
      if (next !== cur) {
        cur = next;
        setShown(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const panelId = catalogFeaturePanelId(category.id, feature.id);
  const siblings = useMemo(
    () => category.features.filter((item) => item.id !== feature.id),
    [category.features, feature.id],
  );

  // EVERY main section steps the entrance direction down to its sub-sections:
  // the sub-sections cycle top → bottom → right → left → out of the centre card.
  // Each section starts the cycle at a different point (offset by the section's
  // order) so neighbouring sections still read differently from each other.
  const SUB_DIRS = [2, 3, 0, 1, 5] as const; // 2=top 3=bottom 0=right 1=left 5=out of centre
  const dir = SUB_DIRS[(((featureIndex + index) % SUB_DIRS.length) + SUB_DIRS.length) % SUB_DIRS.length];

  // In ONLY these one-or-two sections the BIG (centre) card additionally drops
  // in from the top/bottom as a small flourish (2=top, 3=bottom). Elsewhere the
  // centre card just eases in as before.
  const BIG_CARD_DIR: Record<number, number> = { 1: 2, 6: 3 };
  const bigDir = BIG_CARD_DIR[index];
  const BIG_DROP = 150; // px the centre card travels when it drops in

  // The ring = the section's other features, laid out on an ellipse that starts
  // at the RIGHT (i = 0, the MEDIUM card) and walks ANTICLOCKWISE from there.
  const ring = useMemo(() => {
    const items = siblings;
    const n = items.length;
    return items.map((item, i) => {
      const ang = n ? (i / n) * Math.PI * 2 : 0; // 0 = right, + = anticlockwise (up)
      const x = 50 + RING_RX * Math.cos(ang);
      const y = 50 - RING_RY * Math.sin(ang);
      return { item, i, ang, x, y };
    });
  }, [siblings]);

  const step = reduce ? 0 : REVEAL_SPAN_S / Math.max(ring.length, 1);

  const pageVariants: Variants = { hidden: {}, visible: {} };
  // The centre card normally eases in; in the one-or-two special sections
  // (`bigDir`) it additionally drops in from the top/bottom.
  const roomVariants: Variants = {
    hidden: reduce
      ? { opacity: 1, x: 0, y: 0 }
      : bigDir === 2
        ? { opacity: 0, x: 0, y: -BIG_DROP }
        : bigDir === 3
          ? { opacity: 0, x: 0, y: BIG_DROP }
          : { opacity: 0, x: 0, y: 16 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: reduce ? 0 : bigDir != null ? 0.6 : 0.5, ease: PREMIUM_EASE, delay: 0 },
    },
  };
  // EVERY ring card of the scene flies in from the SAME direction (`dir`) while
  // the STAGGER still walks anticlockwise from the right, so the cards cascade
  // in together from one shared direction.
  const ringVariants = (i: number, ang: number, dir: number): Variants => {
    const off = ringOffset(dir, ang);
    return {
      hidden: reduce ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: off.x, y: off.y },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: reduce ? 0 : REVEAL_CARD_S,
          ease: PREMIUM_EASE,
          delay: reduce ? 0 : REVEAL_LEAD_S + i * step,
        },
      },
    };
  };
  const HeroIcon = SHOWCASE_ICONS[feature.icon];

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
        {/* Central room — the MAIN (featured) card, the biggest card. */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={roomVariants} className="relative">
            <div className="absolute left-1/2 top-[-54px] z-20 -translate-x-1/2">
              <span className="hc-scene-pill inline-flex h-[40px] min-w-[260px] items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-[var(--color-primary)] bg-[var(--color-white)] px-[34px] text-center text-[13px] font-black uppercase leading-[37px] tracking-[0.12em] text-[var(--color-primary)] shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
                {category.title[lang]}
              </span>
            </div>

            <div
              className="cf-room rounded-[26px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-[18px] shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
              style={{ width: BIG.w + 36, height: BIG.h + 36 }}
            >
              <button
                type="button"
                onClick={() => scrollToPanel(panelId)}
                aria-label={feature.title[lang]}
                className="cf-room-tile group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-4 text-center outline-none transition-colors hover:border-[var(--color-action)] hover:bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))]"
              >
                <span className="text-[46px] leading-none text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
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
          </motion.div>
        </div>

        {/* Ring of the section's other features — a MEDIUM card first (at the
            right), then the SMALL cards, spanning in circularly anticlockwise. */}
        {ring.map(({ item, i, ang, x, y }) => {
              const Icon = SHOWCASE_ICONS[item.icon];
              const tileId = catalogFeaturePanelId(category.id, item.id);
              const size = i === 0 ? MEDIUM : SMALL;
              const isMedium = i === 0;

              return (
                <motion.div
                  key={item.id}
                  variants={ringVariants(i, ang, dir)}
                  className="cf-scatter-card absolute z-20"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    marginLeft: -size.w / 2,
                    marginTop: -size.h / 2,
                    width: size.w,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => scrollToPanel(tileId)}
                    aria-label={item.title[lang]}
                    title={item.title[lang]}
                    style={{ height: size.h }}
                    className="connected-spot hc-orbit-tile group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[10px] py-[10px] text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
                  >
                    <span
                      className={`connected-icon-float mb-[6px] leading-none text-[var(--color-primary)] ${
                        isMedium ? "text-[30px]" : "text-[22px]"
                      }`}
                    >
                      <Icon />
                    </span>
                    <span
                      className={`card-title line-clamp-2 text-center font-normal ${
                        isMedium ? "max-w-[132px]" : "max-w-[96px]"
                      }`}
                    >
                      {item.title[lang]}
                    </span>
                  </button>
                </motion.div>
              );
            })}
      </motion.div>
    </div>
  );
}

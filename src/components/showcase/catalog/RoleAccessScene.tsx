"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ShowcaseCategory, ShowcaseFeature } from "@/lib/feature-showcase";
import { focusedRouteEntry, roleRouteEntries } from "@/lib/role-route-docs";
import { ROLE_ACCESS_GUIDES, type RoleAccessKey } from "@/lib/role-routes";
import { setRoleRouteFocus, useRoleRouteFocus } from "@/lib/role-route-selection";

import { SHOWCASE_ICONS } from "./icons";

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

/* Card footprints — one BIG card in the central room, and EVERY card on the
   surrounding ring sharing one identical footprint (same height AND width, so
   the ring reads as a single frame around the selected route). */
const BIG = { w: 250, h: 208 };

/* Ring ellipse — starts at the RIGHT, runs anticlockwise, exactly like every
   other Connected OS catalog ring. */
const RING_RX = 36;
const RING_RY = 38;

/* EVERY other sub-route of the role is drawn on the ring — nothing is hidden.
   The cards shrink in even steps as the ring gets denser, and each bucket keeps
   one identical footprint, so the ring always reads as a single frame. */
const RING_BUCKETS = [
  { max: 8, w: 152, h: 132, icon: 30, fs: 0 },
  { max: 9, w: 140, h: 122, icon: 28, fs: 14 },
  { max: 10, w: 130, h: 114, icon: 26, fs: 13 },
  { max: 11, w: 122, h: 106, icon: 24, fs: 12 },
  { max: 12, w: 114, h: 100, icon: 22, fs: 12 },
  { max: Infinity, w: 106, h: 92, icon: 20, fs: 11 },
] as const;
type RingCardSpec = { w: number; h: number; icon: number; fs: number };
function ringCardSize(n: number): RingCardSpec {
  return RING_BUCKETS.find((bucket) => n <= bucket.max) ?? RING_BUCKETS[RING_BUCKETS.length - 1];
}

/* One ring holds up to RING_ONE_MAX cards; beyond that the stage grows a second,
   wider orbit so a 29-route role still shows EVERY route around the selection.
   Geometry below is overlap-free for every count from 1 to 29 routes. */
const RING_ONE_MAX = 14;
const INNER_MAX = 8;
const INNER_RING = { rx: 26.5, ry: 30 };
const OUTER_RING = { rx: 44.2, ry: 43.6 };
const INNER_CARD: RingCardSpec = { w: 122, h: 106, icon: 24, fs: 12 };
const OUTER_CARD: RingCardSpec = { w: 84, h: 74, icon: 18, fs: 10 };

const TRAVEL_H = 340;
const TRAVEL_V = 380;
const REVEAL_TOTAL_S = 1.0;
const REVEAL_LEAD_S = 0.08;
const REVEAL_CARD_S = 0.42;
const REVEAL_SPAN_S = Math.max(REVEAL_TOTAL_S - REVEAL_LEAD_S - REVEAL_CARD_S, 0.1);

// Round to 3dp — framer-motion serialises SSR transforms to 3dp, so feeding
// full-precision numbers here makes the client's inline style differ from the
// server markup and React logs a hydration mismatch.
const r3 = (v: number) => Math.round(v * 1000) / 1000;
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
      return { x: r3(c * 150), y: r3(-s * 150) };
    default:
      return { x: r3(-c * 300), y: r3(s * 300) };
  }
}

/*
 * -------------------------------------------------------------------------
 * ROLE ACCESS MIDDLE SCENE — School & Institution Management layout
 *
 * The Role-based Dashboards section now uses the SAME middle layout language
 * as School & Institution Management:
 *
 *   • a bordered central FRAME (the "room") holding the biggest card — here the
 *     SELECTED sub-route of the role (label, menu group, role icon);
 *   • a RING of smaller cards around it, starting at the right and walking
 *     anticlockwise, carrying EVERY other sub-route of the role in catalogue
 *     order (the ring shrinks its cards in even steps as it gets denser);
 *   • the same staggered, single-direction reveal as every other section.
 *
 * Clicking a ring card selects that sub-route: the centre card becomes it and
 * the right rail shows what the route does. Selection is shared through a tiny
 * external store, so the two stay in step in both directions — ring click →
 * rail, rail scroll → centre card.
 *
 * The route PATH is never printed: cards carry labels only.
 * -------------------------------------------------------------------------
 */
export default function RoleAccessScene({
  category,
  feature,
  index = 0,
  featureIndex = 0,
}: {
  category?: ShowcaseCategory;
  feature: ShowcaseFeature;
  index?: number;
  featureIndex?: number;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const reduce = useReducedMotion();
  const focus = useRoleRouteFocus();

  const guide = useMemo(
    () => ROLE_ACCESS_GUIDES.find((entry) => entry.key === (feature.id as RoleAccessKey)),
    [feature.id],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // Reveal when the section enters the viewport — same per-frame visibility
  // measure every catalog scene uses (cheap, layout-shift proof).
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

  const active = useMemo(
    () => (guide ? focusedRouteEntry(guide, focus) : null),
    [guide, focus],
  );


  const ring = useMemo(() => {
    if (!guide || !active) return [];
    // Every OTHER route of the role, in catalogue order: route 1 sits in the
    // centre, routes 2…n ring it; select route 3 and route 3 takes the centre
    // while 1, 2, 4, 5… ring it. Nothing is dropped.
    const items = roleRouteEntries(guide).filter(
      (entry) => entry.item.path !== active.item.path,
    );
    const n = items.length;
    // Same 3dp rounding as every other stage: identical strings on server and
    // client, so no hydration mismatch for the inline style.
    const round3 = (v: number) => Math.round(v * 1000) / 1000;
    const place = (
      slice: typeof items,
      ringIndex: { rx: number; ry: number },
      size: RingCardSpec,
      phase = 0,
    ) =>
      slice.map((entry, i) => {
        const ang = ((i + phase) / Math.max(slice.length, 1)) * Math.PI * 2;
        return {
          entry,
          i,
          x: round3(50 + ringIndex.rx * Math.cos(ang)),
          y: round3(50 - ringIndex.ry * Math.sin(ang)),
          ang,
          size,
        };
      });

    if (n <= RING_ONE_MAX) {
      return place(items, { rx: RING_RX, ry: RING_RY }, ringCardSize(n));
    }
    // Dense role (e.g. 29 admin routes): an inner orbit plus a wider outer one,
    // phase-shifted half a step so the two rings never line up radially.
    return [
      ...place(items.slice(0, INNER_MAX), INNER_RING, INNER_CARD),
      ...place(items.slice(INNER_MAX), OUTER_RING, OUTER_CARD, 0.5),
    ];
  }, [guide, active]);

  if (!guide || !active) return null;

  const Icon = SHOWCASE_ICONS[feature.icon];

  const SUB_DIRS = [2, 3, 0, 1, 5] as const;
  const dir =
    SUB_DIRS[
      (((featureIndex + index) % SUB_DIRS.length) + SUB_DIRS.length) % SUB_DIRS.length
    ];
  const step = reduce ? 0 : REVEAL_SPAN_S / Math.max(ring.length, 1);

  const pageVariants: Variants = { hidden: {}, visible: {} };
  const roomVariants: Variants = {
    hidden: reduce ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: reduce ? 0 : 0.5, ease: PREMIUM_EASE },
    },
  };
  const ringVariants = (i: number, ang: number): Variants => {
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

  return (
    <div
      ref={rootRef}
      data-scene-role={guide.key}
      className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_9%,var(--color-white))]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffffff]/70 opacity-90 blur-[88px]"
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
        {/* Central room — the biggest card = the SELECTED sub-route. */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={roomVariants} className="relative">
            {category?.title?.[lang] ? (
              <div className="absolute left-1/2 top-[-54px] z-20 -translate-x-1/2">
                <span className="hc-scene-pill inline-flex h-[40px] min-w-[260px] items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-[var(--color-primary)] bg-[var(--color-white)] px-[34px] text-center text-[13px] font-black uppercase leading-[37px] tracking-[0.12em] text-[var(--color-primary)] shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
                  {category.title[lang]}
                </span>
              </div>
            ) : null}
            <div
              className="cf-room rounded-[26px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-[18px] shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
              style={{ width: BIG.w + 36, height: BIG.h + 36 }}
            >
              <div
                aria-live="polite"
                className="group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-4 text-center"
              >
                <span className="text-[46px] leading-none text-[var(--color-primary)] transition-transform duration-300 group-hover:scale-110">
                  {Icon ? <Icon /> : null}
                </span>
                <motion.span
                  key={active.item.path}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduce ? 0 : 0.3, ease: PREMIUM_EASE }}
                  className="card-title line-clamp-2 max-w-[210px] text-center"
                >
                  {active.item.label[lang]}
                </motion.span>
                <span className="text-[10px] font-normal uppercase tracking-[0.12em] text-[var(--color-action)] opacity-80">
                  {active.group.title[lang]}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ring of neighbouring sub-routes (same menu group first). */}
        {ring.map(({ entry, i, x, y, ang, size }) => {

          return (
            <motion.div
              key={entry.item.path}
              variants={ringVariants(i, ang)}
              className="cf-scatter-card absolute z-20"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                marginLeft: `${-size.w / 2}px`,
                marginTop: `${-size.h / 2}px`,
                width: `${size.w}px`,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setRoleRouteFocus(guide.key, entry.item.path);
                  // Same gesture as the other sections' cards: the rail jumps to
                  // this route's row and flashes it.
                  window.dispatchEvent(
                    new CustomEvent("connected-os-open-route", {
                      detail: { role: guide.key, path: entry.item.path },
                    }),
                  );
                }}
                data-role-ring-card={entry.item.path}
                aria-label={entry.item.label[lang]}
                title={entry.item.label[lang]}
                style={{ height: `${size.h}px` }}
                className="connected-spot hc-orbit-tile group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[10px] py-[10px] text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
              >
                <span
                  className="connected-icon-float mb-[6px] leading-none text-[var(--color-primary)]"
                  style={{ fontSize: `${size.icon}px` }}
                >
                  {Icon ? <Icon /> : null}
                </span>
                <span
                  className="card-title line-clamp-2 text-center font-normal"
                  style={{
                    maxWidth: `${size.w - 16}px`,
                    ...(size.fs ? { fontSize: `${size.fs}px`, lineHeight: 1.2 } : {}),
                  }}
                >
                  {entry.item.label[lang]}
                </span>
              </button>
            </motion.div>
          );
        })}

      </motion.div>
    </div>
  );
}

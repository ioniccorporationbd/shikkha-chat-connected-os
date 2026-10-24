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

/* Card footprints — the SAME hierarchy as the School & Institution section:
   one MAIN card, one MEDIUM ring card, the rest SMALL. */
const BIG = { w: 250, h: 208 };
const MEDIUM = { w: 158, h: 146 };
const SMALL = { w: 112, h: 104 };

/* Ring ellipse — starts at the RIGHT, runs anticlockwise, exactly like every
   other Connected OS catalog ring. */
const RING_RX = 36;
const RING_RY = 38;

/* Only the neighbouring sub-routes are drawn on the ring (same menu group
   first). The complete list lives in the right rail, so the stage never turns
   into a wall of 29 cards — the middle keeps the School & Institution calm. */
const MAX_RING = 8;

const TRAVEL_H = 340;
const TRAVEL_V = 380;
const REVEAL_TOTAL_S = 1.0;
const REVEAL_LEAD_S = 0.08;
const REVEAL_CARD_S = 0.42;
const REVEAL_SPAN_S = Math.max(REVEAL_TOTAL_S - REVEAL_LEAD_S - REVEAL_CARD_S, 0.1);

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
      return { x: c * 150, y: -s * 150 };
    default:
      return { x: -c * 300, y: s * 300 };
  }
}

const SCENE_TEXT = {
  hint: {
    bn: "বৃত্তের সাব-রুটে ক্লিক করুন — ডান পাশে সেই রুটের কাজ বিস্তারিত দেখাবে",
    en: "Click a sub-route on the ring — its work opens in detail on the right",
  },
} as const;

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
 *     anticlockwise, carrying the role's neighbouring sub-routes (same menu
 *     group first, capped at MAX_RING);
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
    const entries = roleRouteEntries(guide).filter(
      (entry) => entry.item.path !== active.item.path,
    );
    const sameGroup = entries.filter((entry) => entry.group.key === active.group.key);
    const others = entries.filter((entry) => entry.group.key !== active.group.key);
    const items = [...sameGroup, ...others].slice(0, MAX_RING);
    const n = items.length;
    return items.map((entry, i) => {
      const ang = n ? (i / n) * Math.PI * 2 : 0;
      return {
        entry,
        i,
        x: 50 + RING_RX * Math.cos(ang),
        y: 50 - RING_RY * Math.sin(ang),
        ang,
      };
    });
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
            <div
              className="cf-room rounded-[26px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-[18px] shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
              style={{ width: BIG.w + 36, height: BIG.h + 36 }}
            >
              <div
                aria-live="polite"
                className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-[20px] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-4 text-center"
              >
                <span className="text-[42px] leading-none text-[var(--color-primary)]">
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
        {ring.map(({ entry, i, x, y, ang }) => {
          const size = i === 0 ? MEDIUM : SMALL;
          const isMedium = i === 0;

          return (
            <motion.div
              key={entry.item.path}
              variants={ringVariants(i, ang)}
              className="cf-scatter-card absolute z-20"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                marginLeft: -size.w / 2,
                marginTop: -size.h / 2,
                width: size.w,
                transition:
                  "left .55s cubic-bezier(.22,1,.36,1), top .55s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <button
                type="button"
                onClick={() => setRoleRouteFocus(guide.key, entry.item.path)}
                data-role-ring-card={entry.item.path}
                aria-label={entry.item.label[lang]}
                title={entry.item.label[lang]}
                style={{ height: size.h }}
                className="connected-spot hc-orbit-tile group relative flex w-full items-stretch justify-center overflow-hidden rounded-[16px] border-[2px] border-[var(--color-primary)] bg-[var(--color-white)] p-[5px] text-center shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] outline-none transition-shadow hover:shadow-[0_20px_44px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
              >
                <span className="flex w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[11px] border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-1.5 text-center">
                  <span
                    aria-hidden="true"
                    className={`shrink-0 leading-none text-[var(--color-primary)] ${
                      isMedium ? "text-[22px]" : "text-[16px]"
                    }`}
                  >
                    {Icon ? <Icon /> : null}
                  </span>
                  <span
                    className={`card-title line-clamp-3 ${
                      isMedium ? "max-w-[126px]" : "max-w-[90px]"
                    }`}
                  >
                    {entry.item.label[lang]}
                  </span>
                </span>
              </button>
            </motion.div>
          );
        })}

        {/* Reader hint — no paths, just what a click does. */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-white)]/85 px-4 py-1.5 text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))] backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
            {SCENE_TEXT.hint[lang]}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

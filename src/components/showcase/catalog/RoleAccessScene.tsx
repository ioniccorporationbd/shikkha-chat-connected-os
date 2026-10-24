"use client";

import { useMemo } from "react";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ShowcaseCategory, ShowcaseFeature } from "@/lib/feature-showcase";
import { roleRouteEntries, visibleRouteTotal } from "@/lib/role-route-docs";
import { ROLE_ACCESS_GUIDES, type RoleAccessKey } from "@/lib/role-routes";
import {
  roleRouteFocusCardId,
  setRoleRouteFocus,
  useRoleRouteFocus,
} from "@/lib/role-route-selection";

import { SHOWCASE_ICONS } from "./icons";

/*
 * -------------------------------------------------------------------------
 * ROLE ACCESS MIDDLE SCENE — the role's routes as a RADIAL MAP
 *
 * Used only by the "Role-based Dashboards" catalog section. Where every other
 * section puts a big card in the "room" and its sibling features on a ring,
 * this scene answers one question: for THIS role, what can I open?
 *
 *   • CENTRE  → the role itself (its main dashboard route, shown as a circle).
 *   • AROUND  → every real sub-route of that role as a small circle, laid out on
 *               one to three elliptical orbits (sidebar modules, AI Pathshala
 *               items, reports), in the same right → anticlockwise order the
 *               rest of the Connected OS rings use.
 *   • CLICK a circle → the RIGHT rail of the same role highlights that
 *               sub-route and describes what it does. Its internal path is not
 *               printed anywhere — only the title and the work.
 *
 * Routes come from `@/lib/role-routes` (generated from the real Shikkha Chat
 * Apps dashboard), so no circle is invented.
 * -------------------------------------------------------------------------
 */

type Ring = { rx: number; ry: number };

/** Orbit plans, as percentages of the stage. Chosen so 29 circles still fit. */
function ringPlan(count: number): Ring[] {
  if (count <= 8) return [{ rx: 34, ry: 24 }];
  if (count <= 20) return [{ rx: 27, ry: 15 }, { rx: 40, ry: 26 }];
  return [{ rx: 24, ry: 13 }, { rx: 34, ry: 21 }, { rx: 44, ry: 29 }];
}

/** Split `count` circles over `rings.length` orbits, the extras on outer ones. */
function ringCounts(count: number, rings: number): number[] {
  const base = Math.floor(count / rings);
  const extra = count - base * rings;
  return Array.from({ length: rings }, (_, i) => base + (i >= rings - extra ? 1 : 0));
}

/** Kill the "(English hint)" part of a bilingual label so circles stay small. */
function shortLabel(label: string): string {
  return label.replace(/\([^)]*\)/g, "").replace(/\s{2,}/g, " ").trim();
}

const GROUP_TINTS = [
  "color-mix(in srgb, var(--color-primary) 90%, var(--color-white))",
  "color-mix(in srgb, var(--color-secondary) 85%, var(--color-primary))",
  "color-mix(in srgb, var(--color-action) 85%, var(--color-primary))",
];

const SCENE_TEXT = {
  centreLabel: { bn: "মূল রুট", en: "Main route" },
  hint: {
    bn: "কেন্দ্রে মূল রুট · চারপাশে এই ভূমিকার সাব-রুট — যেকোনো বৃত্তে ক্লিক করুন",
    en: "Main route at the centre · this role's sub-routes around it — click any circle",
  },
  circleAria: { bn: "সাব-রুট দেখুন", en: "Show sub-route" },
  resetAria: { bn: "নির্বাচন বাতিল", en: "Clear selection" },
} as const;

export default function RoleAccessScene({
  category,
  feature,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
  index?: number;
  featureIndex?: number;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const focus = useRoleRouteFocus();

  const guide = useMemo(
    () => ROLE_ACCESS_GUIDES.find((entry) => entry.key === (feature.id as RoleAccessKey)),
    [feature.id],
  );

  const entries = useMemo(() => (guide ? roleRouteEntries(guide) : []), [guide]);
  const orbits = useMemo(() => {
    const plan = ringPlan(entries.length);
    const counts = ringCounts(entries.length, plan.length);
    const starts: number[] = [];
    counts.forEach((count, ringIndex) => {
      starts.push(ringIndex === 0 ? 0 : starts[ringIndex - 1] + counts[ringIndex - 1]);
    });
    return plan.map((ring, ringIndex) => {
      const slice = entries.slice(starts[ringIndex], starts[ringIndex] + counts[ringIndex]);
      const n = slice.length;
      return {
        ring,
        items: slice.map((entry, i) => {
          // 0 rad = right, growing anticlockwise (same as the other rings);
          // odd orbits are nudged half a step so circles never stack vertically.
          const ang = (i / Math.max(n, 1)) * Math.PI * 2 + (ringIndex % 2 ? Math.PI / Math.max(n, 1) : 0);
          return {
            ...entry,
            left: 50 + ring.rx * Math.cos(ang),
            top: 50 - ring.ry * Math.sin(ang),
          };
        }),
      };
    });
  }, [entries]);

  if (!guide) return null;

  const CentreIcon = SHOWCASE_ICONS[feature.icon];
  const total = visibleRouteTotal(guide);
  const selectedPath = focus?.roleKey === guide.key ? focus.path : null;

  const focusRoute = (path: string) => {
    setRoleRouteFocus(guide.key, path);
    // Bring the right-rail description card into view. Alignment (not
    // centring) is deliberate: the sync engine marks whichever panel sits at
    // the viewport centre as active, so a small upward nudge keeps THIS role's
    // panel at the centre — the middle map must not switch to a neighbour.
    window.requestAnimationFrame(() => {
      const card = document.getElementById(roleRouteFocusCardId(guide.key));
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const top = Math.max(0, window.scrollY + rect.top - 104);
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_9%,var(--color-white))]">
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

      <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2">
        <span className="hc-scene-pill inline-flex h-[34px] items-center justify-center whitespace-nowrap rounded-full border-[1.5px] border-[var(--color-primary)] bg-[var(--color-white)] px-5 text-[11px] font-black uppercase leading-[31px] tracking-[0.1em] text-[var(--color-primary)] shadow-[0_16px_44px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] sm:px-6">
          {category.title[lang]}
        </span>
      </div>

      {/* Centre — the role's MAIN route, always the same circle. */}
      <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          onClick={() => setRoleRouteFocus(guide.key, null)}
          aria-label={`${guide.title[lang]} — ${SCENE_TEXT.resetAria[lang]}`}
          className="grid h-[132px] w-[132px] place-items-center rounded-full border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] px-2 text-center shadow-[0_28px_80px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] transition hover:border-[var(--color-action)] sm:h-[168px] sm:w-[168px]"
        >
          <span className="flex flex-col items-center gap-1">
            <span className="text-[30px] leading-none text-[var(--color-primary)] sm:text-[40px]">
              {CentreIcon ? <CentreIcon /> : null}
            </span>
            <span className="line-clamp-2 px-1 text-[11px] font-black leading-tight text-[var(--color-primary)] sm:text-[13px]">
              {guide.title[lang]}
            </span>
            <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--color-action)] sm:text-[9px]">
              {SCENE_TEXT.centreLabel[lang]} · {total}
            </span>
          </span>
        </button>
      </div>

      {/* Orbits — every real sub-route of this role, one circle each. */}
      {orbits.map(({ items }, ringIndex) =>
        items.map(({ group, item, left, top }) => {
          const groupIndex = visibleGroupIndex(guide, group.key);
          const selected = selectedPath === item.path;

          return (
            <button
              key={`${ringIndex}-${item.path}`}
              type="button"
              aria-pressed={selected}
              aria-label={`${shortLabel(item.label[lang])} — ${SCENE_TEXT.circleAria[lang]}`}
              title={item.label[lang]}
              onClick={() => focusRoute(item.path)}
              style={{
                left: `clamp(40px, ${left}%, calc(100% - 40px))`,
                top: `clamp(64px, ${top}%, calc(100% - 40px))`,
                borderColor: GROUP_TINTS[groupIndex % GROUP_TINTS.length],
                transform: `translate(-50%, -50%) scale(${selected ? 1.12 : 1})`,
              }}
              className={[
                "absolute z-20 grid h-[54px] w-[54px] place-items-center overflow-hidden rounded-full border-[2px] bg-[var(--color-white)] px-1 text-center transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-40 hover:!scale-110 sm:h-[76px] sm:w-[76px]",
                selected
                  ? "shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_28%,transparent),0_18px_44px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
                  : "shadow-[0_10px_26px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
              ].join(" ")}
            >
              <span className="line-clamp-3 text-[7.5px] font-semibold leading-[1.06] text-[var(--color-primary)] sm:text-[9.5px]">
                {shortLabel(item.label[lang])}
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-[6px] h-[4px] w-[4px] rounded-full"
                style={{ background: GROUP_TINTS[groupIndex % GROUP_TINTS.length] }}
              />
            </button>
          );
        }),
      )}

      <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 w-[86%] -translate-x-1/2 text-center text-[10px] font-semibold leading-snug text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))] sm:text-[11px]">
        {SCENE_TEXT.hint[lang]}
      </p>
    </div>
  );
}

/** Stable order index of a menu group inside the role's visible groups. */
function visibleGroupIndex(
  guide: (typeof ROLE_ACCESS_GUIDES)[number],
  groupKey: string,
): number {
  const key = guide.menuGroups.findIndex((group) => group.key === groupKey);
  return key < 0 ? 0 : key;
}

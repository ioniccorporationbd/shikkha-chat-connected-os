"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import SectionPanel from "@/components/hubs/shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  showcaseStatusLabel,
  SHOWCASE_TEXT,
  type ShowcaseCategory,
  type ShowcaseFeature,
} from "@/lib/feature-showcase";
import {
  focusedRouteEntry,
  roleRouteEntries,
  visibleMenuGroups,
  visibleRouteTotal,
} from "@/lib/role-route-docs";
import { setRoleRouteFocus, useRoleRouteFocus } from "@/lib/role-route-selection";
import {
  ROLE_ACCESS_TEXT,
  roleAccessGuide,
  type RoleAccessKey,
} from "@/lib/role-routes";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

/** Localized copy for the always-on "selected sub-route" detail card. */
const DETAIL_TEXT = {
  selected: { bn: "নির্বাচিত সাব-রুট", en: "Selected sub-route" },
  subRoute: { bn: "সাব-রুট", en: "Sub-route" },
  reset: { bn: "প্রথম রুটে ফিরুন", en: "Back to the first route" },
  moreInGroup: { bn: "এই গ্রুপের আরও রুট", en: "More routes in this group" },
  whoCanUse: { bn: "এই ড্যাশবোর্ড কারা পান", en: "Who gets this dashboard" },
  workflow: { bn: "এই ভূমিকার কাজের ধারা", en: "Workflow of this role" },
  tips: { bn: "টিপস", en: "Tips" },
  docs: { bn: "সম্পূর্ণ ডকুমেন্টেশন", en: "Full documentation" },
  index: { bn: "এই ভূমিকার সব রুট", en: "Every route of this role" },
  inGroup: { bn: "এই গ্রুপে", en: "in this group" },
  indexLead: {
    bn: "গ্রুপ বেছে নিন, তারপর যেকোনো রুটে ক্লিক করুন — উপরের কার্ড ও মাঝের স্টেজ সেই রুটে বদলে যাবে।",
    en: "Pick a group, then click any route — the card above and the middle stage switch to it.",
  },
} as const;

/** How long a deliberate click shields the scroll-sync from overriding it. */
const CLICK_LOCK_MS = 1600;
/** Half-height of the band around the viewport centre that may claim focus. */
const SYNC_BAND_PX = 280;

/** The vertical line the rail reads at: the middle of what is still visible
 *  under the pinned detail card (plain viewport centre when it is not pinned). */
function readingLine(slot: DOMRect, pane: DOMRect | null, vh: number) {
  const pinnedBottom = pane ? Math.min(pane.bottom, vh) : vh / 2;
  return Math.min(
    Math.max((Math.max(pinnedBottom, slot.top) + vh) / 2, vh * 0.5),
    vh * 0.92,
  );
}

/*
 * -------------------------------------------------------------------------
 * ROLE ACCESS RIGHT-RAIL PANEL
 *
 * One panel per ROLE of the "Role-based Dashboards" catalog section, following
 * the School & Institution Management rail rhythm:
 *
 *   • a PINNED detail card (sticky while the role's panel is on screen) that
 *     always describes the sub-route currently on the middle stage: group, title,
 *     description, its group siblings, who gets the dashboard, the role's real
 *     workflow steps, a tip, and a link to the full document page. The route PATH
 *     is never printed — only the work it does.
 *   • the standard SectionPanel (variant "dashboard") for the role summary.
 *   • a compact ROUTE INDEX: every verified sidebar module / AI Pathshala item /
 *     report grouped exactly like the app's sidebar, as clickable chips.
 *
 * Scroll-sync: whichever chip sits nearest the viewport centre while this role's
 * panel holds the centre becomes the selected sub-route — so scrolling the rail
 * walks the middle stage through the role's routes exactly like scrolling the
 * School & Institution rail walks its panels.
 *
 * Nothing here is invented: routes come from `@/lib/role-routes`, generated from
 * `shikkha_chat_apps` (dashboard-shell.tsx + dashboard-routes.ts + user-manual).
 * -------------------------------------------------------------------------
 */
export default function RoleAccessPanel({
  category,
  feature,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const guide = roleAccessGuide(feature.id as RoleAccessKey);
  const focus = useRoleRouteFocus();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const clickLockRef = useRef(0);
  const announcedRef = useRef("");
  const flashTimerRef = useRef(0);
  const [flashPath, setFlashPath] = useState<string | null>(null);

  const guideKey = guide?.key ?? "";
  const panelId = catalogFeaturePanelId(category.id, feature.id);
  // `stamp` is the click's event time (same time origin as performance.now),
  // which keeps this handler render-pure for the React Compiler.
  const selectRoute = (path: string, stamp = 0) => {
    if (!guideKey) return;
    clickLockRef.current = stamp;
    setRoleRouteFocus(guideKey, path);
  };

  // Scroll-sync — the School & Institution behaviour, applied to sub-routes:
  // while THIS role's panel holds the viewport centre, whichever route chip sits
  // nearest that centre becomes the selected sub-route, so the middle stage and
  // the rail walk through the routes together as the reader scrolls.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !guideKey) return;
    let raf = 0;

    const pick = () => {
      raf = 0;
      // A deliberate click wins for a moment so the sync cannot fight it.
      if (performance.now() - clickLockRef.current < CLICK_LOCK_MS) return;

      const slot = root.closest(".right-panel-slot");
      if (!slot) return;
      const sr = slot.getBoundingClientRect();
      const vh = window.innerHeight || 0;

      // Reading line: the middle of the rail space still visible under the
      // pinned detail card. Falls back to the plain viewport centre when the
      // card is not pinned (phones).
      const pane = root.querySelector<HTMLElement>("[data-role-focus-card]");
      const line = readingLine(
        sr,
        pane ? pane.getBoundingClientRect() : null,
        vh,
      );
      if (sr.top > line || sr.bottom < line) {
        // Out of this role: allow a later re-entry to re-announce the scene.
        if (announcedRef.current === panelId) announcedRef.current = "";
        return;
      }

      const rows = root.querySelectorAll<HTMLElement>("[data-role-route-row]");
      let best: HTMLElement | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const row of rows) {
        const r = row.getBoundingClientRect();
        if (!r.height) continue;
        const d = Math.abs((r.top + r.bottom) / 2 - line);
        if (d < bestDist) {
          bestDist = d;
          best = row;
        }
      }
      // This role owns the reading line, so it also owns the middle stage.
      // Announced one frame late: the shared section engine (an ancestor) runs
      // its own pick in this frame and would otherwise overwrite the scene.
      if (announcedRef.current !== panelId) {
        requestAnimationFrame(() => {
          announcedRef.current = panelId;
          window.dispatchEvent(
            new CustomEvent("connected-os-active-section", {
              detail: { id: panelId },
            }),
          );
        });
      }

      const path = best?.dataset.roleRouteRow;
      if (!path || bestDist > SYNC_BAND_PX) return;
      setRoleRouteFocus(guideKey, path);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [guideKey, panelId]);

  // A ring-card click in the middle stage: bring that route's chip onto the
  // rail's reading line and flash it, so the click lands the reader on the
  // section (row + pinned details together) instead of changing state silently.
  useEffect(() => {
    if (!guideKey) return;
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ role?: string; path?: string }>).detail;
      if (!detail?.path) return;
      if (detail.role && detail.role !== guideKey) return;
      const root = rootRef.current;
      if (!root) return;

      clickLockRef.current = performance.now();
      setFlashPath(detail.path);
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => setFlashPath(null), 1800);

      const row = root.querySelector<HTMLElement>(
        `[data-role-route-row="${detail.path}"]`,
      );
      if (!row) return;
      const slotEl = root.closest(".right-panel-slot") ?? root;
      const pane = root.querySelector<HTMLElement>("[data-role-focus-card]");
      const line = readingLine(
        slotEl.getBoundingClientRect(),
        pane ? pane.getBoundingClientRect() : null,
        window.innerHeight || 0,
      );
      const r = row.getBoundingClientRect();
      const delta = (r.top + r.bottom) / 2 - line;
      if (Math.abs(delta) > 8) {
        window.scrollBy({ top: delta, behavior: "smooth" });
      }
    };
    window.addEventListener("connected-os-open-route", onOpen);
    return () => {
      window.removeEventListener("connected-os-open-route", onOpen);
      window.clearTimeout(flashTimerRef.current);
    };
  }, [guideKey]);

  if (!guide) {
    return null;
  }

  const t = ROLE_ACCESS_TEXT;
  const routeCount = visibleRouteTotal(guide);
  const entries = roleRouteEntries(guide);
  const active = focusedRouteEntry(guide, focus) ?? entries[0];
  const activeIndex = entries.findIndex((entry) => entry.item.path === active.item.path);
  const siblingsInGroup = entries.filter(
    (entry) =>
      entry.group.key === active.group.key && entry.item.path !== active.item.path,
  );
  const groups = visibleMenuGroups(guide);

  const workflowRows = guide.workflows.map((step, index) => ({
    title: `${index + 1}. ${step.title[lang]}`,
    description: step.body[lang],
  }));

  return (
    <div className="max-w-[560px]" ref={rootRef}>
      <SectionPanel
        id={catalogFeaturePanelId(category.id, feature.id)}
        variant="dashboard"
        pill={category.title[lang]}
        title={guide.title[lang]}
        description={guide.who[lang]}
        supporting={t.note[lang]}
        icon={SHOWCASE_ICONS[feature.icon]}
        showButtons={false}
        capabilities={guide.tips.map((tip) => tip[lang])}
        stats={[
          { value: String(routeCount), label: t.routesLabel[lang] },
          { value: String(guide.workflows.length), label: t.workflowLabel[lang] },
          { value: String(guide.signingRoles.length), label: t.signingLabel[lang] },
          {
            value: String(groups.length),
            label: t.groupLabel[lang],
          },
        ]}
        rows={[]}
      />

      {/* Pinned detail card — the rail's answer to a School & Institution style
          card: it always describes the sub-route currently on the middle stage,
          so scene and rail can never disagree. Pinned on desktop only; on phones
          the rail is the page, so it simply flows. The opaque wrapper keeps the
          route chips from peeking around the card's rounded corners. */}
      <div
        data-role-focus-card={guide.key}
        className="mb-5 rounded-[24px] bg-[var(--color-white)] lg:sticky lg:top-[82px] lg:z-30"
      >
        <div className="relative rounded-[24px] border-[2px] border-[var(--color-primary)] bg-[var(--color-white)] p-5 shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] lg:max-h-[76vh] lg:overflow-y-auto lg:overscroll-contain lg:pr-4">
          <div className="flex items-start justify-between gap-3">
            <p className="section-label-badge">{active.group.title[lang]}</p>
            <div className="flex items-center gap-2">
              <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                {DETAIL_TEXT.subRoute[lang]} {activeIndex + 1}/{routeCount}
              </span>
              <button
                type="button"
                onClick={(event) => selectRoute(entries[0].item.path, event.timeStamp)}
                aria-label={DETAIL_TEXT.reset[lang]}
                title={DETAIL_TEXT.reset[lang]}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-border-soft)] text-[13px] leading-none text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
              >
                ↺
              </button>
            </div>
          </div>

          <h3 className="mt-2.5 text-[20px] leading-snug font-black text-[var(--color-primary)]">
            {active.item.label[lang]}
          </h3>
          <p className="capability-text mt-2 text-[color-mix(in_srgb,var(--color-black)_74%,var(--color-primary))]">
            {active.item.description[lang]}
          </p>
          <p className="capability-text mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[color-mix(in_srgb,var(--color-black)_52%,var(--color-primary))]">
            <span className="font-semibold text-[var(--color-primary)]">{active.group.title[lang]}</span>
            <span aria-hidden="true">·</span>
            <span>
              {DETAIL_TEXT.inGroup[lang]} {active.group.items.length} {DETAIL_TEXT.subRoute[lang]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[var(--color-primary)]">{guide.dashboardRoute}</span>
          </p>

          {siblingsInGroup.length ? (
            <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
                {DETAIL_TEXT.moreInGroup[lang]}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {siblingsInGroup.slice(0, 4).map((entry) => (
                  <button
                    key={entry.item.path}
                    type="button"
                    onClick={(event) => selectRoute(entry.item.path, event.timeStamp)}
                    className="capability-text rounded-full border border-[var(--color-border-soft)] px-2.5 py-1 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    {entry.item.label[lang]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
              {DETAIL_TEXT.workflow[lang]}
            </p>
            <ul className="mt-2 grid gap-2">
              {workflowRows.slice(0, 2).map((row) => (
                <li
                  key={row.title}
                  className="rounded-xl bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] p-2.5"
                >
                  <p className="capability-text font-semibold text-[var(--color-primary)]">{row.title}</p>
                  <p className="capability-text mt-1 line-clamp-2 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
                    {row.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
              {DETAIL_TEXT.whoCanUse[lang]}
            </p>
            <p className="capability-text mt-1.5 font-semibold text-[var(--color-primary)]">
              {guide.signingRoles.join(", ")}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border-soft)] pt-3.5">
            <Link
              href={active.item.path}
              className="capability-text inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
            >
              {DETAIL_TEXT.docs[lang]}
              <span aria-hidden="true">→</span>
            </Link>
            <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
              <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
              {DETAIL_TEXT.selected[lang]} · {guide.title[lang]}
            </p>
          </div>
        </div>
      </div>

      {/* Route index — every verified route of the role, grouped like the app's
          sidebar. The chips are the scroll-sync targets for the middle stage. */}
      <div className="mt-6">
        <p className="section-label-badge">{t.routesLabel[lang]}</p>
        <h3 className="section-description mt-3 font-semibold text-[var(--color-primary)]">
          {DETAIL_TEXT.index[lang]}
        </h3>
        <p className="capability-text mt-2 text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
          {DETAIL_TEXT.indexLead[lang]}
        </p>

        <div className="mt-3 grid gap-3">
          <details className="rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="section-description font-semibold text-[var(--color-primary)]">
                {t.accessLabel[lang]}
              </span>
              <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                3
              </span>
            </summary>
            <ul className="mt-3 grid gap-2.5">
              {[
                { label: t.dashboardLabel[lang], value: guide.dashboardRoute },
                {
                  label: SHOWCASE_TEXT.statusLabel[lang],
                  value: showcaseStatusLabel(feature, lang),
                },
                {
                  label: t.signingLabel[lang],
                  value: guide.signingRoles.join(", "),
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="rounded-xl border border-[var(--color-border-soft)] p-3"
                >
                  <p className="capability-text text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                    {row.label}
                  </p>
                  <p className="capability-text mt-1 break-words font-semibold text-[var(--color-primary)]">
                    {row.value}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href={guide.dashboardRoute}
              className="capability-text mt-3 inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
            >
              {t.openRoute[lang]}
              <span aria-hidden="true">→</span>
            </Link>
          </details>

          <details className="rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="section-description font-semibold text-[var(--color-primary)]">
                {t.workflowLabel[lang]}
              </span>
              <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                {guide.workflows.length}
              </span>
            </summary>
            <ul className="mt-3 grid gap-2.5">
              {workflowRows.map((row) => (
                <li
                  key={row.title}
                  className="rounded-xl border border-[var(--color-border-soft)] p-3"
                >
                  <p className="capability-text font-semibold text-[var(--color-primary)]">
                    {row.title}
                  </p>
                  <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
                    {row.description}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="mt-4 grid gap-4">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="flex items-center justify-between gap-3">
                <p className="capability-text font-semibold uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                  {group.title[lang]}
                </p>
                <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                  {group.items.length}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.items.map((item) => {
                  const isActive = item.path === active.item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      data-role-route-row={item.path}
                      aria-pressed={isActive}
                      onClick={(event) => selectRoute(item.path, event.timeStamp)}
                      className={[
                        "flex min-h-[54px] items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                        isActive
                          ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))]"
                          : "border-[var(--color-border-soft)] bg-transparent hover:border-[var(--color-primary)]",
                        flashPath === item.path
                          ? "shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-action)_30%,transparent)]"
                          : "",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          isActive ? "bg-[var(--color-primary)]" : "bg-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-white))]",
                        ].join(" ")}
                      />
                      <span className="capability-text font-semibold leading-snug text-[var(--color-primary)]">
                        {item.label[lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="capability-text mt-4 inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
        >
          {t.allRoutes[lang]}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuCheck } from "react-icons/lu";

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

      /* Where must the page stop so THIS row sits exactly on the reading
         line? The line is a function of the scroll position (it is derived
         from the detail card's bottom edge), so scroll-then-measure is a
         moving target — and a caller that starts its own smooth scroll to the
         section would fight it. Solve the fixed point in absolute page
         coordinates instead and issue ONE scroll:

             rowAbs - y = clamp((max(paneAbsBottom, slotAbsTop) - y + vh) / 2)

         with both clamps (0.5vh / 0.92vh) applied while iterating. */
      const yNow = window.scrollY;
      const rowRect = row.getBoundingClientRect();
      const rowAbs = yNow + (rowRect.top + rowRect.bottom) / 2;
      const slotEl = root.closest(".right-panel-slot") ?? root;
      const pane = root.querySelector<HTMLElement>("[data-role-focus-card]");
      const paneRect = pane ? pane.getBoundingClientRect() : null;
      const slotRect = slotEl.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const mAbs = Math.max(
        paneRect ? yNow + paneRect.bottom : 0,
        yNow + slotRect.top,
      );
      const lineAt = (y: number) =>
        Math.min(Math.max((mAbs - y + vh) / 2, vh * 0.5), vh * 0.92);
      let target = rowAbs - lineAt(yNow);
      for (let i = 0; i < 4; i += 1) {
        const next = rowAbs - lineAt(target);
        if (Math.abs(next - target) < 0.5) break;
        target = next;
      }
      const maxScroll =
        document.documentElement.scrollHeight - (window.innerHeight || 0);
      target = Math.min(Math.max(target, 0), Math.max(maxScroll, 0));
      if (Math.abs(target - yNow) > 8) {
        clickLockRef.current = performance.now();
        window.scrollTo({ top: target, behavior: "smooth" });
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
  const groups = visibleMenuGroups(guide);

  const workflowRows = guide.workflows.map((step, index) => ({
    title: `${index + 1}. ${step.title[lang]}`,
    description: step.body[lang],
  }));

  // The whole rail is ONE card in the homepage's own panel language
  // (SectionPanel dashboard variant): icon tile + pill header, description,
  // supporting paragraph, tick-row capabilities, meta rows — and this role's
  // live sub-route / workflow / route index extended INSIDE the same surface,
  // so the section reads exactly like every other section's right rail.
  return (
    <div className="max-w-[560px]" ref={rootRef}>
      <SectionPanel
        id={panelId}
        variant="dashboard"
        pill={category.title[lang]}
        title={guide.title[lang]}
        description={guide.who[lang]}
        supporting={t.note[lang]}
        icon={SHOWCASE_ICONS[feature.icon]}
        showButtons={false}
        capabilities={guide.tips.map((tip) => tip[lang])}
        rows={[
          {
            title: t.accessLabel[lang],
            meta: [
              { label: t.dashboardLabel[lang], value: guide.dashboardRoute },
              {
                label: SHOWCASE_TEXT.statusLabel[lang],
                value: showcaseStatusLabel(feature, lang),
              },
              { label: t.signingLabel[lang], value: guide.signingRoles.join(", ") },
              { label: t.routesLabel[lang], value: String(routeCount) },
              { label: t.groupLabel[lang], value: String(groups.length) },
            ],
          },
        ]}
      >
        {/* Live sub-route card — always shows the route currently on the
            middle stage, in the same bordered-card language as the meta rows
            above it, so scene and rail can never disagree. */}
        <div data-role-focus-card={guide.key} className="mt-6 max-w-[560px]">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-4">
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

            <h3 className="section-description mt-2.5 text-[var(--color-primary)]">
              {active.item.label[lang]}
            </h3>
            <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
              {active.item.description[lang]}
            </p>

            <dl className="mt-2.5 space-y-1">
              {[
                {
                  label: DETAIL_TEXT.inGroup[lang],
                  value: `${active.group.items.length} ${DETAIL_TEXT.subRoute[lang]}`,
                },
                {
                  label: DETAIL_TEXT.whoCanUse[lang],
                  value: guide.signingRoles.join(", "),
                },
                {
                  label: t.dashboardLabel[lang],
                  value: guide.dashboardRoute,
                },
              ].map((row) => (
                <div key={row.label} className="flex gap-2">
                  <dt className="capability-text shrink-0 font-semibold text-[color-mix(in_srgb,var(--color-black)_55%,var(--color-primary))]">
                    {row.label}:
                  </dt>
                  <dd className="capability-text min-w-0 break-all text-[var(--color-primary)]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href={active.item.path}
              className="capability-text mt-3 inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] hover:underline"
            >
              {DETAIL_TEXT.docs[lang]}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* The role's real workflow, in the same bordered card. */}
        <div className="mt-3 max-w-[560px] rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4">
          <h3 className="section-description text-[var(--color-primary)]">
            {DETAIL_TEXT.workflow[lang]}
          </h3>
          <ul className="mt-2 grid gap-2">
            {workflowRows.map((row) => (
              <li key={row.title}>
                <p className="capability-text font-semibold text-[var(--color-primary)]">
                  {row.title}
                </p>
                <p className="capability-text mt-1 text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">
                  {row.description}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Route index — every verified route, grouped like the app's sidebar,
            as the panel's own tick rows (the scroll-sync targets). */}
        <div className="mt-6 max-w-[560px]">
          <p className="section-label-badge">{t.routesLabel[lang]}</p>
          <h3 className="section-description mt-3 text-[var(--color-primary)]">
            {DETAIL_TEXT.index[lang]}
          </h3>
          <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
            {DETAIL_TEXT.indexLead[lang]}
          </p>

          <div className="mt-3 grid gap-3">
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
                <div className="mt-2 grid gap-2">
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
                          "sc-hc-tick-row w-full items-center text-left",
                          isActive
                            ? "!border-[var(--color-primary)] !bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
                            : "",
                          flashPath === item.path
                            ? "shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-action)_30%,transparent)]"
                            : "",
                        ].join(" ")}
                      >
                        <span aria-hidden="true" className="sc-hc-tick-tile">
                          {isActive ? (
                            <LuCheck className="h-3.5 w-3.5" />
                          ) : (
                            <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-white)]" />
                          )}
                        </span>
                        <span
                          className={`capability-text font-semibold leading-snug ${
                            isActive
                              ? "text-[var(--color-primary)]"
                              : "text-[color-mix(in_srgb,var(--color-black)_75%,var(--color-primary))]"
                          }`}
                        >
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
      </SectionPanel>
    </div>
  );
}

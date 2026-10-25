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
import { roleRouteEntries, visibleRouteTotal } from "@/lib/role-route-docs";
import { routeDescription } from "@/lib/role-route-descriptions";
import {
  ROLE_ACCESS_TEXT,
  roleAccessGuide,
  type RoleAccessKey,
} from "@/lib/role-routes";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

/** Localized copy for the numbered link-documentation list. */
const DETAIL_TEXT = {
  listTitle: { bn: "এই ভূমিকার সব লিংক", en: "Every link of this role" },
  listLead: {
    bn: "নম্বর ধরে সাজানো — প্রতিটি লিংকের নাম আর সেই সেকশনের কাজ, সহজ ভাষায়।",
    en: "Numbered in sidebar order — the name of each link and, in plain words, what that section does.",
  },
  more: { bn: "রিড", en: "Read" },
  less: { bn: "কম দেখান", en: "Show less" },
} as const;

/** Descriptions are held to five lines; the rest sits behind the Read button. */
const DESC_LINES = 5;

/**
 * One numbered link of the role — number, title, and what the section does.
 *
 * The description is a proper short paragraph (five-plus lines) so a reader
 * understands the section without opening the app. It is held to DESC_LINES
 * lines; when the text runs longer, a small "Read" chip sits at the end of the
 * fifth line (bottom-right of the clamped block) and reveals the rest in place.
 */
function RouteDocRow({
  index,
  path,
  title,
  description,
  lang,
}: {
  index: number;
  path: string;
  title: string;
  description: string;
  lang: "bn" | "en";
}) {
  const pRef = useRef<HTMLParagraphElement | null>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = pRef.current;
    if (!el || open) return;
    const measure = () => setOverflow(el.scrollHeight - el.clientHeight > 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, description, lang]);

  const rowSurface = "color-mix(in srgb, var(--color-primary) 3%, #ffffff)";

  return (
    <div
      data-role-route-row={path}
      data-role-route-index={index}
      className="group flex w-full items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_11%,transparent)] px-3.5 py-3 transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
      style={{ background: rowSurface }}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#032521] text-[11.5px] font-extrabold leading-none text-white"
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="section-description !leading-snug text-[var(--color-primary)]">
          {title}
        </p>
        <div className="relative mt-1.5">
          <p
            ref={pRef}
            className="capability-text text-[color-mix(in_srgb,var(--color-primary)_46%,var(--color-black))]"
            style={
              open
                ? undefined
                : {
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: DESC_LINES,
                    overflow: "hidden",
                  }
            }
          >
            {description}
          </p>
          {overflow && !open ? (
            /* Sits at the tail of line five and finishes the sentence with a
               soft fade, so the "Read" chip never looks like a stray button. */
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              className="absolute bottom-0 right-0 inline-flex items-center gap-1 rounded-md pl-7 pr-1 text-[12px] font-bold leading-[1.6] text-[var(--color-action)] hover:underline"
              style={{
                background: `linear-gradient(to right, transparent, ${rowSurface} 32%)`,
              }}
            >
              {DETAIL_TEXT.more[lang]}
              <span aria-hidden="true">▾</span>
            </button>
          ) : null}
        </div>
        {open ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded
            className="capability-text mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--color-action)] hover:underline"
          >
            {DETAIL_TEXT.less[lang]}
            <span aria-hidden="true">▴</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/*
 * -------------------------------------------------------------------------
 * ROLE ACCESS RIGHT-RAIL PANEL
 *
 * One panel per ROLE of the "Role-based Dashboards" catalog section.
 *
 * Content = exactly what the left sidebar's "Role-based Dashboards" dropdown
 * used to hold for this role before its nested links were removed: every link
 * of that role, numbered 1 … N in sidebar order (admin = 29, student = 14,
 * teacher = 22 …). Each row carries the link's title and its description —
 * the work that section does — held to five lines, with a small "See more"
 * toggle when (and only when) the text truly overflows.
 *
 * Nothing here is invented: routes and copy come from `@/lib/role-routes`,
 * generated from `shikkha_chat_apps` (dashboard-shell.tsx + dashboard-routes.ts
 * + user-manual).
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

  if (!guide) {
    return null;
  }

  const t = ROLE_ACCESS_TEXT;
  const panelId = catalogFeaturePanelId(category.id, feature.id);
  const routeCount = visibleRouteTotal(guide);
  const entries = roleRouteEntries(guide);

  // The whole rail is ONE card in the homepage's own panel language
  // (SectionPanel dashboard variant): icon tile + pill header, role summary,
  // meta rows — then the role's links, numbered 1 … N, as the panel's own rows.
  return (
    <div className="max-w-[560px]">
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
            ],
          },
        ]}
      >
        {/* The role's links — 1 … N, title + description, five lines cap. */}
        <div className="mt-6 max-w-[560px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="section-description text-[var(--color-primary)]">
              {DETAIL_TEXT.listTitle[lang]}
            </h3>
            <span className="capability-text shrink-0 rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
              1–{routeCount}
            </span>
          </div>
          <p className="capability-text mt-1.5 text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
            {DETAIL_TEXT.listLead[lang]}
          </p>

          <ol className="mt-3 grid gap-2">
            {entries.map((entry, i) => (
              <li key={entry.item.path}>
                <RouteDocRow
                  index={i + 1}
                  path={entry.item.path}
                  title={entry.item.label[lang]}
                  description={routeDescription(entry.item.path, entry.item.description)[lang]}
                  lang={lang}
                />
              </li>
            ))}
          </ol>

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

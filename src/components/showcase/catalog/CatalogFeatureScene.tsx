"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ShowcaseCategory, ShowcaseFeature } from "@/lib/feature-showcase";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

/*
 * -------------------------------------------------------------------------
 * CATALOG FEATURE MIDDLE SCENE — the classic Connected-OS constellation
 *
 * One middle scene per FEATURE (per sidebar link). Instead of a plain grid we
 * restore the ORIGINAL Connected OS middle-section look:
 *
 *   • The current feature sits in the bordered central "room" (the hub).
 *   • Its sibling features float around the hub on an ellipse — some land
 *     fully inside the section, some spill just outside the room frame — so
 *     the middle reads as a scattered constellation, not a rigid grid.
 *   • Every orbiting card is tied to the hub by an animated connector line,
 *     drifts on a gentle idle float, lifts + lights its line on hover, and
 *     scrolls to its own right-rail panel on click (the established contract).
 *
 * Geometry is expressed as a percentage of the stage and applied with a fixed
 * half-size left/top offset, so NO layout transform is spent on positioning —
 * the reveal keyframe keeps sole ownership of `transform` on the slot and the
 * idle float / cursor tilt live on their own child wrappers. Pure CSS motion,
 * fully resolved under `prefers-reduced-motion`.
 * -------------------------------------------------------------------------
 */
const SECONDARY_BASE_DELAY_S = 0.25; // hub settles first, then the orbit cascades
const REVEAL_STEP_S = 0.08;

// Orbit geometry (percent of the stage). The hub sits at (HUB_X, HUB_Y); the
// sibling cards are spread on an ellipse around it.
const HUB_X = 50;
const HUB_Y = 55;
const RX = 36;
const RY = 31;
const CARD_W = 116;
const CARD_H = 104;

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
  /** Rotates the orbit start angle so each main section reads with its own
   *  arrangement of the same classic constellation (card design unchanged). */
  variant?: number;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";

  const panelId = catalogFeaturePanelId(category.id, feature.id);
  const [hovered, setHovered] = useState<string | null>(null);

  // Sibling features orbit the hub; a lone feature simply fills the hub.
  const orbit = category.features.filter((item) => item.id !== feature.id);
  const startDeg = -90 + ((((variant % 8) + 8) % 8) * 10);

  const points = useMemo(
    () =>
      orbit.map((_, index) => {
        const step = 360 / Math.max(orbit.length, 1);
        const angle = ((startDeg + step * index) * Math.PI) / 180;
        return {
          x: HUB_X + RX * Math.cos(angle),
          y: HUB_Y + RY * Math.sin(angle),
        };
      }),
    [orbit, startDeg],
  );

  const HeroIcon = SHOWCASE_ICONS[feature.icon];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 opacity-90 blur-[86px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[16%] top-[16%] h-[240px] w-[240px] rounded-full bg-[var(--color-secondary)]/10 blur-[84px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] right-[15%] h-[280px] w-[280px] rounded-full bg-[var(--color-secondary)]/10 blur-[92px]"
      />

      <div className="cf-orbit-stage">
        {/* Connectors from the hub to every orbiting card. */}
        <svg
          className="cf-orbit-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {points.map((point, index) => (
            <path
              key={orbit[index].id}
              d={`M ${HUB_X} ${HUB_Y} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`}
              pathLength={1}
              className={
                "cf-orbit-line" + (hovered === orbit[index].id ? " is-hot" : "")
              }
            />
          ))}
        </svg>

        <div className="cf-orbit-hub" aria-hidden="true" />

        {/* The central room — the current feature (the hub). */}
        <div className="cf-orbit-room-wrap">
          <button
            type="button"
            onClick={() => scrollToPanel(panelId)}
            aria-label={feature.title[lang]}
            className="cf-orbit-room catalog-reveal-pill"
          >
            <span aria-hidden="true" className="cf-orbit-room-sheen" />
            <span className="cf-orbit-hero-icon">{HeroIcon ? <HeroIcon /> : null}</span>
            <span className="cf-orbit-hero-title">{feature.title[lang]}</span>
            <span className="cf-orbit-hero-tag">{category.title[lang]}</span>
          </button>
        </div>

        {/* Orbiting sibling features. */}
        {orbit.map((tile, index) => {
          const point = points[index];
          const Icon = SHOWCASE_ICONS[tile.icon];
          const tileId = catalogFeaturePanelId(category.id, tile.id);
          const hot = hovered === tile.id;

          return (
            <div
              key={tile.id}
              className="connected-card-slot catalog-reveal-card cf-orbit-card"
              style={
                {
                  left: `calc(${point.x.toFixed(2)}% - ${CARD_W / 2}px)`,
                  top: `calc(${point.y.toFixed(2)}% - ${CARD_H / 2}px)`,
                  animationDelay: `${(
                    SECONDARY_BASE_DELAY_S +
                    index * REVEAL_STEP_S
                  ).toFixed(2)}s`,
                  "--card-i": index,
                } as CSSProperties
              }
              onMouseEnter={() => setHovered(tile.id)}
              onMouseLeave={() =>
                setHovered((current) => (current === tile.id ? null : current))
              }
            >
              <div
                className="cf-orbit-float"
                style={{ animationDelay: `${(index * 0.35).toFixed(2)}s` }}
              >
                <div className="connected-tilt">
                  <button
                    type="button"
                    onClick={() => scrollToPanel(tileId)}
                    aria-label={tile.title[lang]}
                    title={tile.title[lang]}
                    className={
                      "connected-spot hc-orbit-tile cf-orbit-tile group relative flex min-h-[104px] w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[9px] py-[10px] text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]" +
                      (hot ? " is-hot" : "")
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="connected-icon-float mb-[6px] text-[24px] leading-none"
                    >
                      <Icon />
                    </span>
                    <span className="card-title line-clamp-2 min-h-[30px] max-w-[104px] text-center font-normal">
                      {tile.title[lang]}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

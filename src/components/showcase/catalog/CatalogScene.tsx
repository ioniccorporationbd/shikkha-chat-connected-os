"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ShowcaseCategory } from "@/lib/feature-showcase";

import { SHOWCASE_ICONS } from "./icons";
import { catalogPanelId } from "./sceneGroups";

/*
 * -------------------------------------------------------------------------
 * CATALOG MIDDLE SCENE
 *
 * One middle scene per Shikkha Chat Apps catalog category. The scene shows the
 * category's features as the established middle-section card grid (the same
 * `.hc-orbit-*` / `.connected-card-slot` / `.connected-spot` visual language
 * the HC overview already used), animated in with the Connected OS "sequential
 * card reveal" contract:
 *
 *   Main card (the category heading pill) settles first → a ~1s pause →
 *   the secondary cards (the feature tiles) cascade in one-by-one with a small
 *   rise + fade, staggered ~80ms apart.
 *
 * The stage mounts exactly one scene at a time, so each time the scroll-sync
 * engine switches the active section the reveal replays for the new category.
 * The motion is pure CSS (`.catalog-reveal-*`, globals.css) so it is a
 * deterministic function of mount and resolves instantly under
 * `prefers-reduced-motion`.
 * -------------------------------------------------------------------------
 */
const SECONDARY_BASE_DELAY_S = 1.5; // main card (0.5s) + the deliberate ~1s pause
const REVEAL_STEP_S = 0.08;

function scrollToPanel(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", { detail: { id } }),
  );
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", { detail: { id } }),
  );
}

export default function CatalogScene({
  category,
}: {
  category: ShowcaseCategory;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";

  const panelId = catalogPanelId(category.id);
  const features = category.features;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffffff]/75 opacity-90 blur-[78px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[15%] top-[14%] h-[230px] w-[230px] rounded-full bg-[var(--color-secondary)]/10 blur-[82px]"
      />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="relative flex max-h-[88%] w-fit flex-col items-center">
          <button
            type="button"
            onClick={() => scrollToPanel(panelId)}
            className="hc-orbit-pill orbit-scene-title catalog-reveal-pill relative z-20 mb-4 h-[38px] min-w-[224px] max-w-[88vw] rounded-full px-[30px] text-center text-[14px] font-black leading-[38px] whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
          >
            {category.title[lang]}
          </button>

          <div
            className="relative w-fit rounded-[26px] border-[3px] bg-[#ffffff]/18 p-[8px] shadow-[0_28px_80px_color-mix(in_srgb,var(--color-primary)_9%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_78%,transparent)] backdrop-blur-[4px]"
            style={{ borderColor: "var(--color-secondary)" }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-white)_24%,transparent),transparent_35%,color-mix(in_srgb,var(--color-secondary)_8%,transparent))]"
            />

            <div className="connected-card-grid relative z-10 grid w-fit grid-cols-2 items-center justify-center gap-[clamp(10px,0.7vw,14px)]">
              {features.map((feature, index) => {
                const Icon = SHOWCASE_ICONS[feature.icon];

                return (
                  <div
                    key={feature.id}
                    className="connected-card-slot catalog-reveal-card"
                    style={{
                      animationDelay: `${(
                        SECONDARY_BASE_DELAY_S +
                        index * REVEAL_STEP_S
                      ).toFixed(2)}s`,
                    }}
                  >
                    <div className="connected-tilt">
                      <button
                        type="button"
                        onClick={() => scrollToPanel(panelId)}
                        aria-label={feature.title[lang]}
                        title={feature.title[lang]}
                        className="connected-spot hc-orbit-tile group relative flex min-h-[96px] w-full flex-col items-center justify-center overflow-hidden rounded-[18px] px-[9px] py-[10px] text-center outline-none transition-[transform,box-shadow] duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
                      >
                        <span
                          aria-hidden="true"
                          className="connected-icon-float mb-[6px] text-[24px] leading-none"
                        >
                          <Icon />
                        </span>
                        <span className="card-title line-clamp-2 min-h-[30px] max-w-[104px] text-center font-normal">
                          {feature.title[lang]}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

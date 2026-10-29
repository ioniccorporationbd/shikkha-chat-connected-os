"use client";

import { useEffect } from "react";

import { parseCatalogFeaturePanelId } from "@/components/showcase/catalog/sceneGroups";
import { reportClientError } from "@/lib/log/report-error";

/*
 * -------------------------------------------------------------------------
 * SECTION FOCUS ENGINE (homepage rail ↔ body scroll sync)
 *
 * The rail (FeatureShowcase) used to learn about the page ONLY from the rail
 * panels inside each content section (ScrollLockedContentSection broadcast).
 * That left two holes the product spec closes:
 *
 *   1. While the HERO is on screen the rail must be fully relaxed — no
 *      dropdown open, no child link selected. The old mount-time dispatch
 *      (HubSceneStage emitDefaultOnMount) opened the first dropdown on load.
 *   2. Reaching a section's VIDEO BANNER must open THAT section's dropdown
 *      only — with NO child link auto-selected; the child rows light up only
 *      after the reader actually scrolls into that section's main content.
 *
 * So this engine treats the page as an ordered list of regions (hero, then
 * banner + content per catalog category), finds the one under the viewport
 * centre, and broadcasts `connected-os-section-focus`:
 *
 *   { kind: "hero"   , categoryId: null , featureId: null }
 *   { kind: "banner" , categoryId: "sis", featureId: null   }
 *   { kind: "content", categoryId: "sis", featureId: "…"    }
 *
 * Anti-flicker contract (the reason this is not a naive scroll listener):
 *   • The scanner is rAF-throttled — NEVER more than one measurement a frame.
 *   • A banner ↔ content flip needs EDGE_HYSTERESIS px of real travel past the
 *     seam, so resting exactly on the boundary cannot toggle the dropdown.
 *   • A child row only changes hands when the challenger is clearly nearer
 *     (FEATURE_HYSTERESIS px), so two panels equidistant from the centre
 *     cannot flip the highlight back and forth.
 *   • Kind/category changes are committed only after IDLE_MS of a STABLE
 *     candidate. During a smooth programmatic glide the candidate changes
 *     every frame, so nothing is committed until it lands — the rail never
 *     blinks through every section it flies over. Feature changes inside the
 *     same content region commit immediately (they are highlight-only).
 *
 * Failures (measurement, dispatch, a detached section) are reported through
 * the existing client-error bridge: browser console + Frappe Error Log. Only
 * ids/kinds are sent — never a cookie, sid or token.
 * -------------------------------------------------------------------------
 */

const FOCUS_EVENT = "connected-os-section-focus";
const IDLE_MS = 130;
const EDGE_HYSTERESIS = 18;
const FEATURE_HYSTERESIS = 24;

type FocusKind = "hero" | "banner" | "content";

type FocusState = {
  kind: FocusKind;
  categoryId: string | null;
  featureId: string | null;
};

type Slot = { el: HTMLElement; id: string; featureId: string };

type Region = {
  kind: FocusKind;
  categoryId: string | null;
  el: HTMLElement;
  slots: Slot[];
};

function sameRegion(a: FocusState, b: FocusState) {
  return a.kind === b.kind && a.categoryId === b.categoryId;
}

function sameState(a: FocusState, b: FocusState) {
  return sameRegion(a, b) && a.featureId === b.featureId;
}

/** Collect the hero + every catalog main section (banner, then content). */
function buildRegions(): Region[] {
  const regions: Region[] = [];

  const hero = document.getElementById("intro");
  if (hero) regions.push({ kind: "hero", categoryId: null, el: hero, slots: [] });

  document
    .querySelectorAll<HTMLElement>("[data-catalog-main-section]")
    .forEach((wrapper) => {
      const categoryId = wrapper.dataset.catalogMainSection ?? null;
      if (!categoryId) return;

      // First catalog section inside the wrapper is the video banner; the
      // content section is the one whose id ends with "-content".
      const banner = wrapper.querySelector<HTMLElement>(
        "section[id^='catalog-section-']",
      );
      const content = wrapper.querySelector<HTMLElement>(
        "section[id^='catalog-section-'][id$='-content']",
      );

      if (banner && banner !== content) {
        regions.push({ kind: "banner", categoryId, el: banner, slots: [] });
      }

      if (content) {
        const slots = Array.from(
          content.querySelectorAll<HTMLElement>(".right-panel-slot"),
        )
          .map((el) => {
            const panelId =
              el.querySelector<HTMLElement>("[id^='catalog-panel-']")?.id ?? "";
            const parsed = panelId ? parseCatalogFeaturePanelId(panelId) : null;
            return parsed
              ? { el, id: panelId, featureId: parsed.featureId }
              : null;
          })
          .filter((slot): slot is Slot => slot !== null);

        regions.push({ kind: "content", categoryId, el: content, slots });
      }
    });

  return regions;
}

/** Featured child of a content region: the rail slot nearest the centre. */
function resolveFeature(region: Region, currentFeatureId: string | null) {
  if (!region.slots.length) return null;

  const centre = (window.innerHeight || 0) / 2;
  let winner: Slot | null = null;
  let bestDistance = Infinity;
  let currentDistance = Infinity;

  for (const slot of region.slots) {
    const rect = slot.el.getBoundingClientRect();
    const distance = Math.abs((rect.top + rect.bottom) / 2 - centre);

    if (distance < bestDistance) {
      bestDistance = distance;
      winner = slot;
    }

    if (currentFeatureId && slot.featureId === currentFeatureId) {
      currentDistance = distance;
    }
  }

  if (!winner) return null;

  // Keep the highlighted row unless the challenger is clearly nearer, so two
  // panels straddling the centre cannot flip the highlight every frame.
  if (
    currentFeatureId &&
    winner.featureId !== currentFeatureId &&
    Number.isFinite(currentDistance) &&
    bestDistance + FEATURE_HYSTERESIS > currentDistance
  ) {
    return currentFeatureId;
  }

  return winner.featureId;
}

export default function CatalogScrollFocus() {
  useEffect(() => {
    let regions = buildRegions();
    let current: FocusState = { kind: "hero", categoryId: null, featureId: null };
    let pending: FocusState | null = null;
    let raf: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const clearTimer = () => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const dispatchFocus = (state: FocusState) => {
      current = state;
      window.dispatchEvent(new CustomEvent(FOCUS_EVENT, { detail: { ...state } }));
    };

    const commit = (state: FocusState) => {
      if (!sameState(state, current)) dispatchFocus(state);
    };

    const measure = (): FocusState => {
      const vh = window.innerHeight || 0;
      const probe = vh / 2;

      if (!regions.length) return { kind: "hero", categoryId: null, featureId: null };

      // Last region whose top has passed the probe = the region under it.
      let picked = regions[0];
      for (const region of regions) {
        if (region.el.getBoundingClientRect().top <= probe) picked = region;
        else break;
      }

      // Edge hysteresis: resting on the banner/content (or hero/banner) seam
      // must not toggle the open dropdown back and forth.
      if (picked.kind !== current.kind && picked.categoryId === current.categoryId) {
        const rect = picked.el.getBoundingClientRect();

        if (current.kind === "content" && picked.kind === "banner") {
          if (probe > rect.bottom - EDGE_HYSTERESIS) {
            return {
              kind: current.kind,
              categoryId: current.categoryId,
              featureId: resolveFeature(
                regions.find((r) => r.kind === "content" && r.categoryId === current.categoryId) ??
                  picked,
                current.featureId,
              ),
            };
          }
        } else if (current.kind === "banner" && picked.kind === "content") {
          if (probe < rect.top + EDGE_HYSTERESIS) {
            return { kind: "banner", categoryId: current.categoryId, featureId: null };
          }
        }
      }

      if (picked.kind !== "content") {
        return { kind: picked.kind, categoryId: picked.categoryId, featureId: null };
      }

      return {
        kind: "content",
        categoryId: picked.categoryId,
        featureId: resolveFeature(picked, current.featureId),
      };
    };

    const evaluate = () => {
      raf = null;

      try {
        // A re-render (language toggle) can replace the sections; stale nodes
        // measure as zeroed rects, so rebuild before trusting the scan.
        if (regions.some((region) => !region.el.isConnected)) {
          regions = buildRegions();
        }

        const next = measure();

        if (sameState(next, current)) {
          pending = null;
          clearTimer();
          return;
        }

        if (sameRegion(next, current)) {
          // Only the highlighted child changed — safe to commit at once.
          pending = null;
          clearTimer();
          commit(next);
          return;
        }

        // A dropdown-level change: wait until the candidate stops moving so a
        // smooth glide never blinks every banner it passes through.
        pending = next;
        clearTimer();
        timer = setTimeout(() => {
          timer = null;
          const queued = pending;
          pending = null;
          if (queued) commit(queued);
        }, IDLE_MS);
      } catch (error) {
        reportClientError({
          scope: "homepage:scroll-focus",
          message: "Section focus engine failed to measure the page",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(evaluate);
    };

    const rebuild = () => {
      regions = buildRegions();
      schedule();
    };

    // First paint: adopt the hero state at once (no idle wait) so the rail
    // starts fully relaxed.
    try {
      const initial = measure();
      dispatchFocus(initial);
    } catch (error) {
      reportClientError({
        scope: "homepage:scroll-focus",
        message: "Section focus engine failed on mount",
        detail: error instanceof Error ? error.message : String(error),
      });
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", rebuild, { passive: true });

    // Sections can appear after a language toggle re-render or a lazy mount;
    // only rebuild when the section count actually changes (a body-subtree
    // observer fires constantly during normal React updates).
    let knownWrapperCount =
      document.querySelectorAll("[data-catalog-main-section]").length;

    const observer =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            const count =
              document.querySelectorAll("[data-catalog-main-section]").length;
            if (count === knownWrapperCount) return;
            knownWrapperCount = count;
            rebuild();
          });

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      clearTimer();
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", rebuild);
    };
  }, []);

  // The engine is behaviour-only; it renders nothing.
  return null;
}

"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type ScrollLockedContentSectionProps = {
  middle: ReactNode;
  right: ReactNode;
  sectionId?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/*
 * Per-scene scroll distance, in CSS pixels, measured from the reference
 * (PowerSchool Connected OS). Its scene blocks are content-height driven and
 * sit ~1600px apart on average (measured from label-block offsets in the
 * archived snapshot). Allocating this much pinned travel per scene is what
 * reproduces the reference's slower scroll rhythm and longer visual hold.
 * This single constant is the knob for the whole pinned progression.
 */
const SCENE_PITCH_PX = 1600;

/*
 * -------------------------------------------------------------------------
 * NATIVE SCROLL ENGINE (homepage-only — no backend impact).
 *
 * The engine lets the document scroll natively (no preventDefault anywhere) and
 * renders each hub as a TALL section (sceneCount × SCENE_PITCH_PX + 100svh)
 * whose inner `.connected-scroll-grid` is `position: sticky; top:0;
 * height:100svh` — the pinned visual stage. Because the section is
 * (sceneCount × 1600px) taller than one viewport, the stage stays pinned for
 * exactly that many pixels of native scroll.
 *
 * Each animation frame it derives two continuous, PURE functions of scroll
 * position and publishes them as CSS variables on the pinned grid, so
 * descendant scenes interpolate motion WITHOUT a React re-render per frame:
 *
 *   progress = clamp((scrollY - sectionTop) / (sectionHeight - viewportH), 0, 1)
 *   --scroll-progress = progress                                   (0..1, whole section)
 *   --scene-focus     = progress * (n - 1) + 0.5                   (0.5 .. n-0.5)
 *
 * `--scene-focus` is the KEY improvement over the old `--scene-p`. The old
 * variable wrapped 1 → 0 at every boundary (`progress*n - floor(progress*n)`),
 * and because it was published on the SHARED grid while the outgoing scene was
 * still mounted, the outgoing scene's transform snapped +24px → −24px mid-fade
 * — the visible "jump / reset" at scene boundaries. `--scene-focus` instead
 * runs monotonically across the whole section (scene k centred at k + 0.5), so
 * every scene derives its own local offset from it and NOTHING ever wraps.
 *
 * Scene SELECTION (which panel is "active") is derived from the same continuous
 * value — `index = round(progress * (n - 1))` — so the mounted window and the
 * right rail flip at exactly the shared boundary. `--scene-p` is still
 * published for backward compatibility.
 *
 * The scene ids/selection/rail wiring reuse the existing
 * `connected-os-active-section` (out) and `connected-os-scroll-to-section` (in)
 * events, so the hubs, LeftSidebar and every CTA keep working unchanged.
 * -------------------------------------------------------------------------
 */
export default function ScrollLockedContentSection({
  middle,
  right,
  sectionId = "connected-os-content-section",
}: ScrollLockedContentSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isNativeDesktop, setIsNativeDesktop] = useState(false);
  const [sceneCount, setSceneCount] = useState(0);

  const sceneIdsRef = useRef<string[]>([]);
  const activeIdRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const isNativeRef = useRef(false);

  // Cached geometry { documentTop, scrollTravel }. The scroll handler is a hot
  // path fired dozens of times a second; reading getBoundingClientRect() there
  // forces a synchronous layout every frame. We measure once on enable + on
  // resize (and a couple of deferred re-measures while media settles) and then
  // the per-frame maths is pure arithmetic — no forced layout.
  const geometryRef = useRef<{ top: number; pinned: number }>({
    top: 0,
    pinned: 1,
  });

  // Right-rail tween. Replaces the old per-boundary
  // scrollTo({behavior:'smooth'}) which, under rapid scene changes, issued
  // several competing native smooth-scrolls that fought each other and
  // oscillated. Here a SINGLE self-owned rAF tween pulls the rail toward the
  // latest target; a new target simply retargets the same running tween, so
  // there is never more than one animation and it can never overshoot-storm.
  const railRef = useRef<{ target: number | null; raf: number | null }>({
    target: null,
    raf: null,
  });

  // Ordered scene ids = every [id] in the right rail, in document (visual)
  // order. Verified to be exactly the hub's sectionOrder (8 / 10 / 8).
  const getSceneIds = () => {
    const panel = rightScrollRef.current;
    if (!panel) return [] as string[];

    return Array.from(panel.querySelectorAll<HTMLElement>("[id]"))
      .map((element) => element.id)
      .filter(Boolean);
  };

  const dispatchActiveSection = (id: string) => {
    if (!id || activeIdRef.current === id) return;

    activeIdRef.current = id;

    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", {
        detail: { id },
      })
    );
  };

  // Measure the pinned stage's document offset and its total scroll travel.
  const measureGeometry = () => {
    const section = sectionRef.current;
    if (!section) return;

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    geometryRef.current = {
      top: scrollY + section.getBoundingClientRect().top,
      pinned: Math.max(1, section.offsetHeight - viewportHeight),
    };
  };

  // PURE read of the current 0..1 progress through the pinned section, using
  // the cached geometry (no layout read).
  const computeProgress = () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const { top, pinned } = geometryRef.current;
    return clamp((scrollY - top) / pinned, 0, 1);
  };

  // --- right-rail tween ------------------------------------------------------
  const computeRailTarget = (index: number) => {
    const panel = rightScrollRef.current;
    const id = sceneIdsRef.current[index];
    if (!panel || !id) return null;

    const target = panel.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return null;

    const panelRect = panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offsetTop = panel.scrollTop + (targetRect.top - panelRect.top);
    const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);

    return clamp(
      offsetTop - (panel.clientHeight - targetRect.height) / 2,
      0,
      maxScroll
    );
  };

  const tickRail = () => {
    const panel = rightScrollRef.current;
    const state = railRef.current;
    if (!panel || state.target == null) {
      state.raf = null;
      return;
    }

    const diff = state.target - panel.scrollTop;
    if (Math.abs(diff) < 0.6) {
      panel.scrollTop = state.target;
      state.raf = null;
      return;
    }

    // Exponential ease-out — critically stable, never overshoots, and a new
    // target just changes where "home" is (the running tween retargets).
    panel.scrollTop += diff * 0.16;
    state.raf = requestAnimationFrame(tickRail);
  };

  const syncRailTo = (index: number, immediate = false) => {
    const target = computeRailTarget(index);
    if (target == null) return;

    const state = railRef.current;
    state.target = target;

    if (immediate) {
      const panel = rightScrollRef.current;
      if (panel) panel.scrollTop = target;
      if (state.raf != null) {
        cancelAnimationFrame(state.raf);
        state.raf = null;
      }
      return;
    }

    if (state.raf == null) state.raf = requestAnimationFrame(tickRail);
  };
  // ---------------------------------------------------------------------------

  const applyScene = (index: number, immediate = false) => {
    const ids = sceneIdsRef.current;
    if (!ids.length) return;

    const safeIndex = clamp(index, 0, ids.length - 1);
    const id = ids[safeIndex];

    if (id !== activeIdRef.current) {
      dispatchActiveSection(id);
      syncRailTo(safeIndex, immediate);
    }
  };

  const update = () => {
    rafRef.current = null;
    if (!isNativeRef.current) return;

    const n = sceneIdsRef.current.length;
    if (n === 0) return;

    const progress = computeProgress();
    const grid = gridRef.current;

    if (grid) {
      // 0..1 across the WHOLE pinned section (continuous, reversible).
      grid.style.setProperty("--scroll-progress", progress.toFixed(4));

      // Continuous scene position. Scene k is centred at k + 0.5, so focus
      // runs 0.5 .. n-0.5 and every scene derives its own `--local` from it.
      // Pure function of scroll position → identical forward and reverse and
      // NEVER wrapped back to 0 at a boundary (this is the reset fix).
      const focus = progress * (n - 1) + 0.5;
      grid.style.setProperty("--scene-focus", focus.toFixed(4));

      // Legacy intra-scene 0..1, kept for any other consumer of `--scene-p`.
      const legacy = clamp(progress * n - Math.floor(progress * n), 0, 1);
      grid.style.setProperty("--scene-p", legacy.toFixed(4));
    }

    // Nearest scene centre — matches `--scene-focus` so the mounted window and
    // the right rail both flip at exactly the same shared boundary.
    const index = clamp(Math.round(progress * (n - 1)), 0, n - 1);
    applyScene(index);
  };

  const scheduleUpdate = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(update);
  };

  // Track reduced-motion + viewport class. The pin engine only ever runs on
  // wide, non-reduced-motion viewports; every smaller / reduced case keeps the
  // natural stacked document layout (all scenes reachable, nothing trapped).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      const reduce = mediaQuery.matches;
      setReduceMotion(reduce);
      setIsNativeDesktop(!reduce && window.innerWidth >= 1280);
    };

    evaluate();
    mediaQuery.addEventListener("change", evaluate);
    window.addEventListener("resize", evaluate);

    return () => {
      mediaQuery.removeEventListener("change", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  // Native scroll wiring (only when the pinned desktop layout is active).
  useEffect(() => {
    const section = sectionRef.current;
    isNativeRef.current = isNativeDesktop;

    if (!isNativeDesktop || !section) {
      // Stand down: clear the published progress so stacked/mobile layouts
      // render at the neutral (centered) state.
      const grid = gridRef.current;
      grid?.style.removeProperty("--scene-p");
      grid?.style.removeProperty("--scroll-progress");
      grid?.style.removeProperty("--scene-focus");

      const rail = railRef.current;
      if (rail.raf != null) {
        cancelAnimationFrame(rail.raf);
        rail.raf = null;
      }
      return;
    }

    const ids = getSceneIds();
    sceneIdsRef.current = ids;
    setSceneCount(ids.length);

    const handleScroll = () => scheduleUpdate();
    const handleResize = () => {
      // Layout above the section (or the viewport itself) may have changed:
      // re-measure geometry, then re-derive everything.
      measureGeometry();
      scheduleUpdate();
    };

    const handleScrollToSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const currentIds = sceneIdsRef.current;
      const index = currentIds.indexOf(id);
      if (index < 0) return;

      const n = currentIds.length;
      measureGeometry();
      const { top, pinned } = geometryRef.current;
      // round(progress * (n - 1)) === index for progress = index / (n - 1).
      const progress = n > 1 ? index / (n - 1) : 0;
      const targetY = top + progress * pinned + 2;

      window.scrollTo({ top: targetY, behavior: "smooth" });
      applyScene(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize);
    window.addEventListener(
      "connected-os-scroll-to-section",
      handleScrollToSection
    );

    // Measure now and once the tall section has actually committed its height
    // (the inline height depends on sceneCount state). Media (posters, fonts)
    // can nudge layout, so re-measure a couple of times cheaply and again when
    // assets finish loading — after that the per-frame path never measures.
    measureGeometry();
    const settleRaf = requestAnimationFrame(() => {
      measureGeometry();
      update();
    });
    const settleTimer1 = window.setTimeout(handleResize, 300);
    const settleTimer2 = window.setTimeout(handleResize, 1000);

    return () => {
      cancelAnimationFrame(settleRaf);
      window.clearTimeout(settleTimer1);
      window.clearTimeout(settleTimer2);

      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const rail = railRef.current;
      if (rail.raf != null) {
        cancelAnimationFrame(rail.raf);
        rail.raf = null;
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
      window.removeEventListener(
        "connected-os-scroll-to-section",
        handleScrollToSection
      );
    };
  }, [isNativeDesktop]);

  const trailingHeight =
    isNativeDesktop && sceneCount > 1
      ? { height: `calc(${sceneCount * SCENE_PITCH_PX}px + 100svh)` }
      : undefined;

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className="connected-scroll-section relative scroll-mt-0"
      data-connected-scroll-section="true"
      data-native-scroll={isNativeDesktop ? "true" : undefined}
      data-scene-count={sceneCount || undefined}
      data-reduce-motion={reduceMotion ? "true" : undefined}
      style={trailingHeight}
    >
      <div ref={gridRef} className="connected-scroll-grid">
        <div className="connected-middle-pane relative">
          {middle}
        </div>

        <aside className="connected-right-pane bg-[var(--color-white)] shadow-[-18px_0_60px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
          <div
            ref={rightScrollRef}
            className="connected-right-scroll-panel right-scroll-panel no-scrollbar scroll-auto"
          >
            {right}
          </div>
        </aside>
      </div>
    </section>
  );
}

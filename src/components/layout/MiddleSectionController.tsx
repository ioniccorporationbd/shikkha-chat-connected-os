"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  SCENE_PITCH_PX,
  activeIndex as activeIndexOf,
  hubProgress,
  progressForIndex,
  sceneFocus,
} from "@/lib/connected-os/scrollModel";
import RightSidebarScrollViewport, {
  type RailSection,
} from "@/components/layout/RightSidebarScrollViewport";
import { getSceneAnimation } from "@/lib/connected-os/sceneAnimationRegistry";

type MiddleSectionControllerProps = {
  middle: ReactNode;
  right: ReactNode;
  sectionId?: string;
};

/*
 * =========================================================================
 * MIDDLE SECTION CONTROLLER  (homepage-only · no backend impact)
 * -------------------------------------------------------------------------
 * The single authoritative owner of Middle Section scroll + state.
 *
 *  • The document scrolls NATIVELY — the engine never calls preventDefault,
 *    never snaps and never runs a background settle. When the user stops, the
 *    page stays exactly where it is. The ONLY programmatic scroll is an
 *    explicit `connected-os-scroll-to-section` request (a nav item / CTA / rail
 *    marker click), and even that is a plain one-shot smooth scrollTo.
 *
 *  • Each hub is a TALL section (count × SCENE_PITCH_PX + 100svh) whose inner
 *    `.connected-scroll-grid` is `position: sticky; top:0; height:100svh` — the
 *    pinned stage. It stays pinned for exactly that many px of native scroll,
 *    then releases naturally into the next section (never traps the user).
 *
 *  • Every animation frame it derives two continuous, PURE functions of scroll
 *    position from `scrollModel` and publishes them as CSS variables on the
 *    pinned grid, so descendants interpolate motion with NO React re-render:
 *        --scroll-progress = 0..1 across the whole hub
 *        --scene-focus     = 0.5 .. count-0.5   (scene k centred at k+0.5)
 *    `--scene-focus` drives BOTH the middle scene stage AND the right-rail
 *    timeline, so the two can never desync.
 *
 *  • Scene SELECTION (`index = round(progress·(count-1))`) is derived from the
 *    same continuous value, so the mounted window flips at the shared boundary
 *    and the active key-point section always matches the active middle scene.
 *    Selection changes are pushed onto the rail panels here (is-active / inert /
 *    aria-hidden); the middle stage gates its own slots from the same event.
 *
 *  • The right rail is the scroll TIMELINE: its container is stationary and it
 *    shows one key-point section at a time through the ghost-free handoff. It
 *    is NOT an independent scroll region while the pinned stage drives scroll,
 *    so wheel / trackpad input over the rail advances the SAME timeline.
 * =========================================================================
 */
export default function MiddleSectionController({
  middle,
  right,
  sectionId = "connected-os-content-section",
}: MiddleSectionControllerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isNativeDesktop, setIsNativeDesktop] = useState(false);
  const [sceneCount, setSceneCount] = useState(0);
  const [sections, setSections] = useState<RailSection[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const sceneIdsRef = useRef<string[]>([]);
  const activeIdRef = useRef<string>("");
  const activeIdxRef = useRef<number>(-1);
  const rafRef = useRef<number | null>(null);
  const isNativeRef = useRef(false);

  // Cached geometry { top, pinned }. The scroll handler is a hot path, so it is
  // pure arithmetic over this cache — never a getBoundingClientRect() per frame.
  const geometryRef = useRef<{ top: number; pinned: number }>({ top: 0, pinned: 1 });

  const setRailRef = useCallback((element: HTMLDivElement | null) => {
    railRef.current = element;
  }, []);

  // Ordered key-point panels = every `.right-panel-section[id]` in the rail, in
  // document order (verified to be the hub's scene order: 8 / 10 / 8).
  const getPanels = () =>
    Array.from(
      railRef.current?.querySelectorAll<HTMLElement>(".right-panel-section") ??
        []
    );

  const dispatchActiveSection = (id: string) => {
    if (!id || activeIdRef.current === id) return;
    activeIdRef.current = id;
    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", { detail: { id } })
    );
  };

  const measureGeometry = () => {
    const section = sectionRef.current;
    if (!section) return;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    geometryRef.current = {
      top: scrollY + section.getBoundingClientRect().top,
      pinned: Math.max(1, section.offsetHeight - viewportHeight),
    };
  };

  const computeProgress = () => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const { top, pinned } = geometryRef.current;
    return hubProgress(scrollY, top, pinned);
  };

  // Push the active index onto the rail panels: exactly one interactive section
  // at a time. Focus is captured BEFORE toggling `inert` (making a slot inert
  // moves focus to <body>) and, if the focused control lived on the outgoing
  // panel, redirected into the incoming one so focus is never lost.
  const gateRail = (index: number) => {
    const panels = getPanels();
    if (!panels.length) return;

    const hadFocus = panels.some((panel) => panel.contains(document.activeElement));

    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle("is-active", on);
      if (on) {
        panel.removeAttribute("inert");
        panel.removeAttribute("aria-hidden");
      } else {
        panel.setAttribute("inert", "");
        panel.setAttribute("aria-hidden", "true");
      }
    });

    if (hadFocus) {
      const active = panels[index];
      const focusable = active?.querySelector<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus?.();
    }
  };

  const setupRail = () => {
    const panels = getPanels();
    const ids = panels.map((panel) => panel.id).filter(Boolean);
    sceneIdsRef.current = ids;

    const nextSections: RailSection[] = panels.map((panel) => {
      const title = panel.querySelector(".section-main-title")?.textContent;
      const badge = panel.querySelector(".section-label-badge")?.textContent;
      const label = (title || badge || panel.getAttribute("aria-label") || panel.id).trim();
      return { id: panel.id, label };
    });

    panels.forEach((panel, i) => {
      panel.style.setProperty("--rail-index", String(i));
      // Stamp the SAME per-scene ramps the middle stage uses, so the rail panel
      // and its middle scene fade in exact lockstep at every boundary.
      const anim = getSceneAnimation(panel.id);
      panel.style.setProperty("--sa-in-a", String(anim.enter[0]));
      panel.style.setProperty("--sa-in-b", String(anim.enter[1]));
      panel.style.setProperty("--sa-out-a", String(anim.exit[0]));
      panel.style.setProperty("--sa-out-b", String(anim.exit[1]));
    });

    setSections(nextSections);
    setSceneCount(ids.length);
  };

  const releaseRail = () => {
    const panels = getPanels();
    panels.forEach((panel) => {
      panel.classList.remove("is-active");
      panel.removeAttribute("inert");
      panel.removeAttribute("aria-hidden");
      panel.style.removeProperty("--rail-index");
    });
    setSections([]);
    setSceneCount(0);
  };

  const update = () => {
    rafRef.current = null;
    if (!isNativeRef.current) return;

    const n = sceneIdsRef.current.length;
    if (n === 0) return;

    const grid = gridRef.current;
    const progress = computeProgress();

    if (grid) {
      grid.style.setProperty("--scroll-progress", progress.toFixed(4));
      // Continuous scene position — the single source for BOTH panes.
      grid.style.setProperty("--scene-focus", sceneFocus(progress, n).toFixed(4));
      // Legacy intra-scene 0..1 (kept for any other consumer of `--scene-p`).
      grid.style.setProperty(
        "--scene-p",
        (progress * n - Math.floor(progress * n)).toFixed(4)
      );
    }

    const index = activeIndexOf(progress, n);

    // Only react when the active section actually changes — no per-frame state.
    if (index !== activeIdxRef.current) {
      activeIdxRef.current = index;
      setActiveIdx(index);
      gateRail(index);
      const id = sceneIdsRef.current[index];
      if (id) dispatchActiveSection(id);
    }
  };

  const scheduleUpdate = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(update);
  };

  // Track reduced-motion + viewport class. The pin engine only runs on wide,
  // non-reduced-motion viewports; every smaller / reduced case keeps the
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

  // Native scroll wiring (only while the pinned desktop layout is active).
  useEffect(() => {
    const section = sectionRef.current;
    isNativeRef.current = isNativeDesktop;

    if (!isNativeDesktop || !section) {
      // Stand down: clear published progress + rail gating so stacked / mobile
      // layouts render at the neutral state and stay fully scrollable.
      const grid = gridRef.current;
      grid?.style.removeProperty("--scene-p");
      grid?.style.removeProperty("--scroll-progress");
      grid?.style.removeProperty("--scene-focus");
      activeIdxRef.current = -1;
      activeIdRef.current = "";
      releaseRail();
      return;
    }

    setupRail();
    activeIdxRef.current = -1; // force the first update to gate + dispatch

    const handleScroll = () => scheduleUpdate();
    const handleResize = () => {
      measureGeometry();
      scheduleUpdate();
    };

    // Explicit, intentional user navigation only (nav item / CTA / rail marker).
    // The ONE place the engine ever scrolls — a plain one-shot native scroll.
    const handleScrollToSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const index = sceneIdsRef.current.indexOf(id);
      if (index < 0) return;

      measureGeometry();
      const n = sceneIdsRef.current.length;
      const { top, pinned } = geometryRef.current;
      const targetY = top + progressForIndex(index, n) * pinned + 2;

      window.scrollTo({ top: targetY, behavior: "smooth" });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("load", handleResize);
    window.addEventListener("connected-os-scroll-to-section", handleScrollToSection);

    // Measure now, then once the tall section has committed its height, then a
    // couple more cheap re-measures as media settles — after that the per-frame
    // path never measures.
    measureGeometry();
    const settleRaf = requestAnimationFrame(() => {
      measureGeometry();
      setupRail();
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

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleResize);
      window.removeEventListener(
        "connected-os-scroll-to-section",
        handleScrollToSection
      );
    };
    // Engine wiring is intentionally keyed ONLY on the viewport class: the
    // closures below (setupRail / gateRail / update / releaseRail) are stable
    // for a given mode and are rebuilt when the mode flips, so listing them
    // would only re-run the wiring pointlessly on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="connected-middle-pane relative">{middle}</div>

        <aside className="connected-right-pane bg-[var(--color-white)] shadow-[-18px_0_60px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
          <RightSidebarScrollViewport
            sections={sections}
            activeIndex={activeIdx}
            panelRef={setRailRef}
          >
            {right}
          </RightSidebarScrollViewport>
        </aside>
      </div>
    </section>
  );
}

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
 * -------------------------------------------------------------------------
 * NATIVE SCROLL ENGINE (homepage-only — no backend impact).
 *
 * The old engine hijacked wheel/touch (preventDefault) and drove the right
 * rail's internal scrollTop to advance scenes. That was an artificial scroll
 * trap and diverged from the reference site, which uses ordinary document
 * scrolling with a CSS `position: sticky` visual stage.
 *
 * This engine now:
 *   • Lets the document scroll natively (no preventDefault anywhere).
 *   • Renders each hub as a TALL section (sceneCount × 100svh) whose inner
 *     `.connected-scroll-grid` is `position: sticky; top:0; height:100svh`
 *     (set in globals.css) — the pinned visual stage.
 *   • Derives the active scene from actual document scroll progress:
 *       progress = clamp((scrollY - sectionTop) / (sectionHeight - viewportH), 0, 1)
 *       index    = clamp(floor(progress * sceneCount), 0, sceneCount - 1)
 *     so forward scrolling advances and reverse scrolling restores scenes.
 *   • Keeps the right rail in sync by scrolling IT to the active panel
 *     (the rail is overflow:hidden on desktop, so it never traps the wheel —
 *     gestures over it fall through to the document).
 *   • Reuses the existing `connected-os-active-section` (out) and
 *     `connected-os-scroll-to-section` (in) events, so HC/SA/OE hubs, the
 *     LeftSidebar and every section CTA keep working unchanged.
 * -------------------------------------------------------------------------
 */
export default function ScrollLockedContentSection({
  middle,
  right,
  sectionId = "connected-os-content-section",
}: ScrollLockedContentSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isNativeDesktop, setIsNativeDesktop] = useState(false);
  const [sceneCount, setSceneCount] = useState(0);

  const sceneIdsRef = useRef<string[]>([]);
  const activeIdRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);
  const isNativeRef = useRef(false);

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

  // Map the current document scroll position to a scene index (0..n-1).
  const computeIndexFromScroll = () => {
    const section = sectionRef.current;
    const n = sceneIdsRef.current.length;
    if (!section || n === 0) return { index: 0, progress: 0 };

    const rect = section.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const sectionTop = scrollY + rect.top;
    const pinned = Math.max(1, section.offsetHeight - viewportHeight);
    const progress = clamp((scrollY - sectionTop) / pinned, 0, 1);
    const index = n > 1 ? clamp(Math.floor(progress * n), 0, n - 1) : 0;

    return { index, progress };
  };

  // Keep the right rail showing the active scene's panel. The rail is
  // overflow:hidden on desktop, so this is a programmatic scroll only — the
  // wheel never gets trapped inside it.
  const syncRailTo = (index: number, behavior: ScrollBehavior = "smooth") => {
    const panel = rightScrollRef.current;
    const id = sceneIdsRef.current[index];
    if (!panel || !id) return;

    const target = panel.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;

    const panelRect = panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offsetTop = panel.scrollTop + (targetRect.top - panelRect.top);
    const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);
    const desired = clamp(
      offsetTop - (panel.clientHeight - targetRect.height) / 2,
      0,
      maxScroll
    );

    try {
      panel.scrollTo({ top: desired, behavior });
    } catch {
      panel.scrollTop = desired;
    }
  };

  const applyScene = (index: number, behavior?: ScrollBehavior) => {
    const ids = sceneIdsRef.current;
    if (!ids.length) return;

    const safeIndex = clamp(index, 0, ids.length - 1);
    const id = ids[safeIndex];

    if (id !== activeIdRef.current) {
      dispatchActiveSection(id);
      syncRailTo(safeIndex, behavior);
    }
  };

  const update = () => {
    rafRef.current = null;
    if (!isNativeRef.current) return;

    const { index } = computeIndexFromScroll();
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

    if (!isNativeDesktop || !section) return;

    const ids = getSceneIds();
    sceneIdsRef.current = ids;
    setSceneCount(ids.length);

    const handleScroll = () => scheduleUpdate();

    const handleScrollToSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const currentIds = sceneIdsRef.current;
      const index = currentIds.indexOf(id);
      if (index < 0) return;

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const sectionTop = scrollY + section.getBoundingClientRect().top;
      const pinned = Math.max(1, section.offsetHeight - viewportHeight);
      const n = currentIds.length;
      // floor(progress * n) === index for progress = index / (n - 1).
      const progress = n > 1 ? index / (n - 1) : 0;
      const targetY = sectionTop + progress * pinned + 2;

      window.scrollTo({ top: targetY, behavior: "smooth" });
      applyScene(index);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    window.addEventListener(
      "connected-os-scroll-to-section",
      handleScrollToSection
    );

    // Initial sync so a refresh mid-page (or deep scroll restoration) lands on
    // the correct scene instead of leaving a stale one.
    update();

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener(
        "connected-os-scroll-to-section",
        handleScrollToSection
      );
    };
  }, [isNativeDesktop]);

  const trailingHeight =
    isNativeDesktop && sceneCount > 1
      ? { height: `${sceneCount * 100}svh` }
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
      <div className="connected-scroll-grid">
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

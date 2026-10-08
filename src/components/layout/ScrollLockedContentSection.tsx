"use client";

import { ReactNode, useEffect, useRef } from "react";

type ScrollLockedContentSectionProps = {
  middle: ReactNode;
  right: ReactNode;
  sectionId?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/* -------------------------------------------------------------------------
 * Middle-section scroll pacing (frontend-only, no backend impact).
 *   WHEEL_SPEED     – multiplier applied to each wheel delta (higher = faster).
 *                     THIS is the single authoritative homepage scroll-speed
 *                     control (the locked/pinned scenes that make up the whole
 *                     Homepage progression). Raised 1.15 → 2.3 so the homepage
 *                     advances exactly 2× per equivalent wheel/trackpad input,
 *                     as requested. The multiplier is applied ONCE, and the
 *                     per-event input is clamped by MAX_WHEEL_DELTA first so the
 *                     ease/re-base logic still prevents scene skipping and
 *                     overshoot. Dashboard scrolling is unaffected (this engine
 *                     is homepage-only).
 *   MAX_WHEEL_DELTA – clamp one event so a fast flick can't jump whole scenes.
 *   SMOOTH_EASE     – per-frame interpolation toward the target scroll.
 *                     Lower = smoother & slower to settle, so the internal
 *                     scenes play out instead of skipping.
 * ----------------------------------------------------------------------- */
const WHEEL_SPEED = 2.3;
const MAX_WHEEL_DELTA = 90;
const SMOOTH_EASE = 0.26;

export default function ScrollLockedContentSection({
  middle,
  right,
  sectionId = "connected-os-content-section",
}: ScrollLockedContentSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  const touchStartYRef = useRef<number | null>(null);
  const targetScrollRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const activeIdRef = useRef<string>("");
  const snapLockRef = useRef(false);

  const shouldUseLockedDesktopScroll = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1280;
  };

  const getRightSectionIds = () => {
    const panel = rightScrollRef.current;
    if (!panel) return [];

    return Array.from(panel.querySelectorAll<HTMLElement>("[id]"))
      .map((element) => element.id)
      .filter(Boolean);
  };

  const hasRightSection = (id: string) => {
    const panel = rightScrollRef.current;
    if (!panel) return false;
    return Boolean(panel.querySelector<HTMLElement>(`#${CSS.escape(id)}`));
  };

  const dispatchActiveSection = (id: string) => {
    if (activeIdRef.current === id) return;

    activeIdRef.current = id;

    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", {
        detail: { id },
      })
    );
  };

  const getSectionMetrics = () => {
    const section = sectionRef.current;
    if (!section) return null;

    const rect = section.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    return { section, rect, viewportHeight };
  };

  const isSectionLockedInView = () => {
    const metrics = getSectionMetrics();
    if (!metrics) return false;

    const { rect, viewportHeight } = metrics;
    return rect.top <= 2 && rect.bottom >= viewportHeight - 2;
  };

  const isSectionNearViewport = () => {
    const metrics = getSectionMetrics();
    if (!metrics) return false;

    const { rect, viewportHeight } = metrics;
    return rect.top < viewportHeight * 0.72 && rect.bottom > viewportHeight * 0.28;
  };

  const snapSectionToTop = () => {
    const section = sectionRef.current;
    if (!section || snapLockRef.current) return;

    snapLockRef.current = true;

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    window.setTimeout(() => {
      snapLockRef.current = false;
      syncActiveSection();
    }, 480);
  };

  const syncActiveSection = () => {
    const panel = rightScrollRef.current;
    if (!panel) return;

    const ids = getRightSectionIds();
    if (!ids.length) return;

    // Measure against the panel viewport via getBoundingClientRect rather than
    // offsetTop: offsetTop is offsetParent-relative and reads 0 for panels whose
    // wrapper is positioned, which mis-mapped the active scene at the top.
    const panelRect = panel.getBoundingClientRect();
    const panelCenter = panelRect.top + panel.clientHeight / 2;

    let activeId = ids[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    ids.forEach((id) => {
      const element = panel.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!element) return;

      const elementRect = element.getBoundingClientRect();
      const elementCenter = elementRect.top + elementRect.height / 2;
      const distance = Math.abs(panelCenter - elementCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeId = id;
      }
    });

    dispatchActiveSection(activeId);
  };

  const stopSmoothScroll = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const smoothScrollToTarget = (targetValue: number) => {
    const panel = rightScrollRef.current;
    if (!panel) return false;

    const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);
    const target = clamp(targetValue, 0, maxScroll);

    targetScrollRef.current = target;

    stopSmoothScroll();

    const EASE = SMOOTH_EASE;

    const animate = () => {
      const currentPanel = rightScrollRef.current;
      if (!currentPanel) return;

      const current = currentPanel.scrollTop;
      const targetScroll = targetScrollRef.current;
      const distance = targetScroll - current;

      if (Math.abs(distance) < 0.6) {
        currentPanel.scrollTop = targetScroll;
        animationFrameRef.current = null;
        isProgrammaticScrollRef.current = false;
        syncActiveSection();
        return;
      }

      isProgrammaticScrollRef.current = true;
      currentPanel.scrollTop = current + distance * EASE;
      syncActiveSection();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return true;
  };

  const scrollRightPanelBy = (deltaY: number) => {
    const panel = rightScrollRef.current;
    if (!panel) return false;

    const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);
    const currentScroll = panel.scrollTop;

    const scrollingDown = deltaY > 0;
    const scrollingUp = deltaY < 0;

    const canScrollDown = currentScroll < maxScroll - 1;
    const canScrollUp = currentScroll > 1;

    if ((scrollingDown && !canScrollDown) || (scrollingUp && !canScrollUp)) {
      return false;
    }

    const clampedDelta = clamp(deltaY, -MAX_WHEEL_DELTA, MAX_WHEEL_DELTA);

    // Re-base on the *rendered* position (never the still-pending target) so a
    // fast flick accumulates toward a single controlled step instead of a
    // runaway target that completes the section instantly and skips scenes.
    const nextScroll = clamp(
      currentScroll + clampedDelta * WHEEL_SPEED,
      0,
      maxScroll
    );

    if (Math.abs(nextScroll - currentScroll) < 0.2) return false;

    smoothScrollToTarget(nextScroll);
    return true;
  };

  const scrollRightPanelTo = (id: string) => {
    const panel = rightScrollRef.current;
    if (!panel) return;

    const target = panel.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!target) return;

    const maxScroll = Math.max(0, panel.scrollHeight - panel.clientHeight);
    const panelRect = panel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTopInContent = panel.scrollTop + (targetRect.top - panelRect.top);

    smoothScrollToTarget(clamp(targetTopInContent, 0, maxScroll));
    dispatchActiveSection(id);
  };

  useEffect(() => {
    const panel = rightScrollRef.current;

    if (panel) {
      targetScrollRef.current = panel.scrollTop;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!shouldUseLockedDesktopScroll()) return;

      const metrics = getSectionMetrics();
      const currentPanel = rightScrollRef.current;
      if (!metrics || !currentPanel) return;

      const { rect, viewportHeight } = metrics;
      const sectionIsNear = isSectionNearViewport();
      const sectionIsLocked = isSectionLockedInView();
      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;

      const enteringFromTop =
        scrollingDown && rect.top > 2 && rect.top < viewportHeight * 0.72;
      const enteringFromBottom =
        scrollingUp && rect.top < -2 && rect.bottom > viewportHeight * 0.28;

      if (!sectionIsLocked && sectionIsNear && (enteringFromTop || enteringFromBottom)) {
        event.preventDefault();
        snapSectionToTop();
        return;
      }

      if (!sectionIsLocked) return;

      const maxScroll = Math.max(
        0,
        currentPanel.scrollHeight - currentPanel.clientHeight
      );
      const currentScroll = currentPanel.scrollTop;

      const canScrollDown = currentScroll < maxScroll - 1;
      const canScrollUp = currentScroll > 1;

      if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
        event.preventDefault();
        scrollRightPanelBy(event.deltaY);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!shouldUseLockedDesktopScroll()) return;

      const metrics = getSectionMetrics();
      if (!metrics) return;
      if (touchStartYRef.current === null) return;

      const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - currentY;

      touchStartYRef.current = currentY;

      if (Math.abs(deltaY) < 1) return;

      const { rect, viewportHeight } = metrics;
      const scrollingDown = deltaY > 0;
      const scrollingUp = deltaY < 0;
      const sectionIsLocked = isSectionLockedInView();
      const sectionIsNear = isSectionNearViewport();

      const enteringFromTop =
        scrollingDown && rect.top > 2 && rect.top < viewportHeight * 0.72;
      const enteringFromBottom =
        scrollingUp && rect.top < -2 && rect.bottom > viewportHeight * 0.28;

      if (!sectionIsLocked && sectionIsNear && (enteringFromTop || enteringFromBottom)) {
        event.preventDefault();
        snapSectionToTop();
        return;
      }

      if (!sectionIsLocked) return;

      const didScroll = scrollRightPanelBy(deltaY);

      if (didScroll) {
        event.preventDefault();
      }
    };

    const handleScrollToSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      if (!shouldUseLockedDesktopScroll()) {
        const pageTarget = document.getElementById(id);

        if (pageTarget) {
          pageTarget.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          dispatchActiveSection(id);
        }

        return;
      }

      if (!hasRightSection(id)) return;

      const section = sectionRef.current;

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      window.setTimeout(() => {
        scrollRightPanelTo(id);
      }, 150);
    };

    const handlePanelScroll = () => {
      const currentPanel = rightScrollRef.current;
      if (!currentPanel) return;

      if (!isProgrammaticScrollRef.current) {
        targetScrollRef.current = currentPanel.scrollTop;
      }

      syncActiveSection();
    };

    const handleWindowScroll = () => {
      if (isSectionLockedInView()) {
        syncActiveSection();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener(
      "connected-os-scroll-to-section",
      handleScrollToSection
    );

    panel?.addEventListener("scroll", handlePanelScroll, { passive: true });

    if (isSectionLockedInView()) {
      syncActiveSection();
    }

    return () => {
      stopSmoothScroll();

      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener(
        "connected-os-scroll-to-section",
        handleScrollToSection
      );

      panel?.removeEventListener("scroll", handlePanelScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className="connected-scroll-section relative scroll-mt-0"
      data-connected-scroll-section="true"
    >
      <div className="connected-scroll-grid">
        <div className="connected-middle-pane relative">
          {middle}
        </div>

        <aside className="connected-right-pane bg-[var(--color-white)] shadow-[-18px_0_60px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
          <div
            ref={rightScrollRef}
            className="connected-right-scroll-panel right-scroll-panel no-scrollbar overscroll-contain scroll-auto"
          >
            {right}
          </div>
        </aside>
      </div>
    </section>
  );
}

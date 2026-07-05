"use client";

import { ReactNode, useEffect, useRef } from "react";

type ScrollLockedContentSectionProps = {
  middle: ReactNode;
  right: ReactNode;
};

const rightSectionIds = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function ScrollLockedContentSection({
  middle,
  right,
}: ScrollLockedContentSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  const touchStartYRef = useRef<number | null>(null);

  const targetScrollRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const isSectionLockedInView = () => {
    const section = sectionRef.current;
    if (!section) return false;

    const rect = section.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    return rect.top <= 2 && rect.bottom >= viewportHeight - 2;
  };

  const syncActiveSection = () => {
    const panel = rightScrollRef.current;
    if (!panel) return;

    const panelCenter = panel.scrollTop + panel.clientHeight / 2;
    let activeId = rightSectionIds[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    rightSectionIds.forEach((id) => {
      const element = panel.querySelector<HTMLElement>(`#${id}`);
      if (!element) return;

      const elementCenter = element.offsetTop + element.offsetHeight / 2;
      const distance = Math.abs(panelCenter - elementCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeId = id;
      }
    });

    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", {
        detail: { id: activeId },
      })
    );
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

    const maxScroll = panel.scrollHeight - panel.clientHeight;
    const target = clamp(targetValue, 0, maxScroll);

    targetScrollRef.current = target;

    stopSmoothScroll();

    /**
     * Professional smoothness settings
     *
     * EASE 0.22-0.28 = soft smooth
     * EASE 0.30-0.38 = balanced professional
     * EASE 0.42+     = faster/native feel
     */
    const EASE = 0.34;

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

    const maxScroll = panel.scrollHeight - panel.clientHeight;
    const currentScroll = panel.scrollTop;

    const scrollingDown = deltaY > 0;
    const scrollingUp = deltaY < 0;

    const canScrollDown = currentScroll < maxScroll - 1;
    const canScrollUp = currentScroll > 1;

    if ((scrollingDown && !canScrollDown) || (scrollingUp && !canScrollUp)) {
      return false;
    }

    /**
     * Scroll speed
     *
     * 0.85 = little soft
     * 1.00 = normal/native speed
     * 1.15 = slightly faster
     */
    const SPEED = 1;

    const baseScroll =
      animationFrameRef.current === null ? currentScroll : targetScrollRef.current;

    const nextScroll = clamp(baseScroll + deltaY * SPEED, 0, maxScroll);

    if (Math.abs(nextScroll - currentScroll) < 0.2) return false;

    smoothScrollToTarget(nextScroll);
    return true;
  };

  const scrollRightPanelTo = (id: string) => {
    const panel = rightScrollRef.current;
    if (!panel) return;

    const target = panel.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;

    const maxScroll = panel.scrollHeight - panel.clientHeight;
    const targetTop = clamp(target.offsetTop, 0, maxScroll);

    smoothScrollToTarget(targetTop);

    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", {
        detail: { id },
      })
    );
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isSectionLockedInView()) return;

      const panel = rightScrollRef.current;
      if (!panel) return;

      const maxScroll = panel.scrollHeight - panel.clientHeight;
      const currentScroll = panel.scrollTop;

      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;

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
      if (!isSectionLockedInView()) return;
      if (touchStartYRef.current === null) return;

      const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      if (Math.abs(deltaY) < 1) return;

      const didScroll = scrollRightPanelBy(deltaY);

      if (didScroll) {
        event.preventDefault();
      }
    };

    const handleScrollToSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      const section = sectionRef.current;

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      window.setTimeout(() => {
        scrollRightPanelTo(id);
      }, 120);
    };

    const panel = rightScrollRef.current;

    const handlePanelScroll = () => {
      if (!panel) return;

      if (!isProgrammaticScrollRef.current) {
        targetScrollRef.current = panel.scrollTop;
      }

      syncActiveSection();
    };

    if (panel) {
      targetScrollRef.current = panel.scrollTop;
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener(
      "connected-os-scroll-to-section",
      handleScrollToSection
    );

    panel?.addEventListener("scroll", handlePanelScroll, { passive: true });

    syncActiveSection();

    return () => {
      stopSmoothScroll();

      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
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
      id="home-connections-content"
      className="relative h-screen overflow-hidden bg-white"
    >
      <div className="grid h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(430px,38vw)] 2xl:grid-cols-[minmax(0,1fr)_600px]">
        <div className="relative hidden h-screen overflow-hidden bg-[#f7fbff] lg:block">
          {middle}
        </div>

        <aside className="h-screen overflow-hidden border-l border-slate-200 bg-white shadow-[-18px_0_60px_rgba(15,23,42,0.04)]">
          <div
            ref={rightScrollRef}
            className="right-scroll-panel no-scrollbar h-full overflow-y-auto overscroll-contain scroll-auto"
          >
            {right}
          </div>
        </aside>
      </div>
    </section>
  );
}
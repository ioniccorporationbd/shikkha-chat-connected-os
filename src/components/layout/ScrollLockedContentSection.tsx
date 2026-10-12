"use client";

import { ReactNode, useEffect, useRef } from "react";

type ScrollLockedContentSectionProps = {
  middle: ReactNode;
  right: ReactNode;
  sectionId?: string;
};

/*
 * -------------------------------------------------------------------------
 * NORMAL-FLOW CONNECTED SECTION (homepage-only — no backend impact).
 *
 * This used to pin its stage: an over-tall section whose inner grid was
 * `position: sticky; top: 0` stayed fixed while the section scrolled past,
 * driving a scroll-linked scene crossfade. On real hardware that read as "the
 * sidebar gets stuck, then the whole section jumps forward".
 *
 * It now renders as an ordinary document block. The section is exactly as tall
 * as its content, nothing is pinned to the viewport as a whole, nothing hijacks
 * the wheel and nothing snaps. The right rail is a plain, stacked column of
 * key-point panels that scrolls with the page like any normal website.
 *
 * The one behaviour kept is the middle↔right synchronisation: an observer marks
 * the rail panel nearest the viewport centre as the active section and
 * broadcasts it on the SAME `connected-os-active-section` event the hubs and
 * LeftSidebar already consume, so the middle orbit stage and its label still
 * follow what the reader is looking at. (The middle stage itself stays on
 * screen through a light, self-releasing sticky column — see globals.css.)
 *
 * Both event channels are unchanged, so every CTA, nav item, product router and
 * hero control keeps working exactly as before:
 *   • `connected-os-active-section`    (out) — which section is currently read
 *   • `connected-os-scroll-to-section` (in)  — scroll to a tapped section
 * -------------------------------------------------------------------------
 */
export default function ScrollLockedContentSection({
  middle,
  right,
  sectionId = "connected-os-content-section",
}: ScrollLockedContentSectionProps) {
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  // Broadcast the rail panel nearest the viewport centre as the active section.
  // Pure, fully user-controlled document scrolling — no pin, no snap, no
  // programmatic glide. rAF-throttled so the hot scroll path never measures
  // more than once per frame.
  useEffect(() => {
    const rail = rightScrollRef.current;
    if (!rail) return;

    const slots = Array.from(
      rail.querySelectorAll<HTMLElement>(".right-panel-slot")
    );
    if (!slots.length) return;

    const ids = slots.map(
      (slot) => slot.querySelector<HTMLElement>("[id]")?.id ?? ""
    );

    let activeId = "";
    let raf: number | null = null;

    const pick = () => {
      raf = null;

      const viewportHeight = window.innerHeight || 0;
      const centre = viewportHeight / 2;
      let bestIndex = -1;
      let bestDistance = Infinity;

      slots.forEach((slot, index) => {
        const rect = slot.getBoundingClientRect();
        const distance = Math.abs((rect.top + rect.bottom) / 2 - centre);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      if (bestIndex < 0) return;

      // Only broadcast when the winning panel is actually on screen; otherwise
      // an off-screen section would still claim "active" as the page loads.
      const rect = slots[bestIndex].getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      const id = ids[bestIndex];
      if (id && id !== activeId) {
        activeId = id;
        window.dispatchEvent(
          new CustomEvent("connected-os-active-section", { detail: { id } })
        );
      }
    };

    const schedule = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Explicit user navigation (a nav item / CTA click): a plain one-shot native
  // scroll to the requested panel. Never an automatic glide or settle.
  useEffect(() => {
    const handleScrollToSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      const target =
        rightScrollRef.current?.querySelector<HTMLElement>(
          `#${CSS.escape(id)}`
        ) ?? document.getElementById(id);
      if (!target) return;

      const top = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    };

    window.addEventListener(
      "connected-os-scroll-to-section",
      handleScrollToSection
    );
    return () =>
      window.removeEventListener(
        "connected-os-scroll-to-section",
        handleScrollToSection
      );
  }, []);

  return (
    <section
      id={sectionId}
      className="connected-scroll-section relative scroll-mt-0"
      data-connected-scroll-section="true"
    >
      <div className="connected-scroll-grid">
        <div className="connected-middle-pane">{middle}</div>

        <aside className="connected-right-pane bg-[var(--color-white)] shadow-[-18px_0_60px_color-mix(in_srgb,var(--color-primary)_6%,transparent)]">
          <div
            ref={rightScrollRef}
            className="connected-right-scroll-panel right-scroll-panel scroll-auto"
          >
            {right}
          </div>
        </aside>
      </div>
    </section>
  );
}

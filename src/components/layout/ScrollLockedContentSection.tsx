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
  const sectionRef = useRef<HTMLElement | null>(null);

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

      const rect = target.getBoundingClientRect();
      // Centre the target panel. The sync engine marks whichever panel sits at
      // the viewport centre as active, so centring here keeps the clicked link,
      // the middle scene and the highlighted rail row in lock-step (a top-offset
      // scroll would leave a neighbouring panel at the centre and mark it).
      const top =
        rect.top +
        window.scrollY +
        rect.height / 2 -
        (window.innerHeight || 0) / 2;
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

  // Interactive layer: one delegated pointer listener drives the cursor-follow
  // spotlight (.connected-spot) and the card tilt (.connected-tilt). Coordinates
  // are written straight to CSS custom properties — no React state, no re-render.
  // Completely inert for reduced-motion users and never touches a card's own
  // transform (so the scroll-linked assemble + framer micro-motion stay intact).
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number | null = null;
    let last: PointerEvent | null = null;

    const paint = () => {
      raf = null;
      const e = last;
      if (!e) return;
      const from = e.target as Element | null;

      const spot = from?.closest?.(".connected-spot") as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--spot-mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--spot-my", `${e.clientY - r.top}px`);
      }

      const tilt = from?.closest?.(".connected-tilt") as HTMLElement | null;
      if (tilt && spot && tilt.contains(spot)) {
        const r = tilt.getBoundingClientRect();
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
        const rx = (0.5 - (e.clientY - r.top) / r.height) * 7;
        tilt.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
        tilt.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
      }
    };

    const onMove = (event: PointerEvent) => {
      last = event;
      if (raf == null) raf = requestAnimationFrame(paint);
    };

    const onOut = (event: PointerEvent) => {
      const from = event.target as Element | null;
      const related = event.relatedTarget as Node | null;
      const tilt = from?.closest?.(".connected-tilt") as HTMLElement | null;
      if (tilt && (!related || !tilt.contains(related))) {
        tilt.style.removeProperty("--tilt-rx");
        tilt.style.removeProperty("--tilt-ry");
      }
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerout", onOut);
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

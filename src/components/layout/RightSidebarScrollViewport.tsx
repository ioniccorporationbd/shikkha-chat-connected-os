"use client";

import type { ReactNode } from "react";

export type RailSection = {
  id: string;
  label: string;
};

type RightSidebarScrollViewportProps = {
  children: ReactNode;
  /** One entry per key-point section, in visual order (drives the timeline). */
  sections: RailSection[];
  /** Index of the section currently in focus. */
  activeIndex: number;
  /** Lets the engine own the panel container ref (it reads scene ids from it). */
  panelRef: (element: HTMLDivElement | null) => void;
};

/*
 * -------------------------------------------------------------------------
 * RIGHT SIDEBAR SCROLL VIEWPORT — the navigation / scroll timeline.
 *
 * The rail is a STATIONARY key-point reader: its container never zooms,
 * crossfades or translates. It shows exactly one section at a time, driven by
 * the engine's continuous `--scene-focus` through a ghost-free staggered
 * handoff (`.right-panel-section`, globals.css). A slim progress track on the
 * rail edge lists every key-point section, highlights the active one and lets
 * the user jump straight to any section (a plain `connected-os-scroll-to-section`
 * request — the SAME event the rest of the app already uses).
 *
 * The panel column is NOT an independent scroll region while the pinned stage
 * is driving: wheel / trackpad input over it bubbles to the page, so scrolling
 * anywhere in the hub advances the same single timeline. Only a section whose
 * own content is taller than the rail scrolls internally.
 * -------------------------------------------------------------------------
 */
export default function RightSidebarScrollViewport({
  children,
  sections,
  activeIndex,
  panelRef,
}: RightSidebarScrollViewportProps) {
  const jumpTo = (id: string) => {
    window.dispatchEvent(
      new CustomEvent("connected-os-scroll-to-section", { detail: { id } })
    );
  };

  return (
    <div className="rsv-shell" data-rail-viewport="true">
      <nav className="rsv-track" aria-label="Section timeline">
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            className={"rsv-marker" + (index === activeIndex ? " is-active" : "")}
            aria-current={index === activeIndex ? "true" : undefined}
            aria-label={section.label}
            onClick={() => jumpTo(section.id)}
          >
            <span className="rsv-marker-line" aria-hidden="true" />
            <span className="rsv-marker-dot" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <div
        ref={panelRef}
        className="rsv-panels connected-right-scroll-panel right-scroll-panel"
      >
        {children}
      </div>
    </div>
  );
}

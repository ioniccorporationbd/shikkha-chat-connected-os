"use client";

import { useEffect } from "react";

/*
 * =========================================================================
 * CONNECTED-OS HASH SYNC  (homepage-only · no backend impact)
 * -------------------------------------------------------------------------
 * Parity with the reference site's hash-driven navigation (PowerSchool's
 * connected-os URL is literally `…/connected-os/#intro` and its engine wires
 * `hashchange` + `scrollIntoView`). Our engine is event-driven only, so the
 * section the reader is currently on was never reflected in the address bar,
 * and a deep link like `/#sis` did nothing.
 *
 * This component adds the missing direction WITHOUT introducing any new scroll
 * owner — it never animates scroll on its own and never competes with the
 * pinned engine:
 *
 *   • OUTBOUND — as the engine's active key-point panel settles in view, mirror
 *     it into the URL with `history.replaceState` (no history spam, no scroll).
 *     While a hub section is NOT pinned on screen (hero, footer, gaps) the
 *     fragment is cleared, so a refresh never deep-links to a stale scene.
 *
 *   • INBOUND — on load (honouring an initial `#scene`) and on `hashchange`
 *     (manual edit / back-forward), jump to the named section. When the pinned
 *     engine owns the target scene we reuse its existing, one-shot
 *     `connected-os-scroll-to-section` request; otherwise we fall back to a
 *     plain `scrollIntoView` (stacked / mobile / reduced-motion layout).
 *
 * Mult-hub safety: three controllers are mounted at once, and each dispatches
 * its OWN `connected-os-active-section`. The outbound reader only ever trusts a
 * panel that is actually on screen, so the off-screen bystander hubs can never
 * flip the fragment. Reduced-motion is respected for the fallback scroll.
 * =========================================================================
 */

const PANEL_SELECTOR = ".right-panel-section";
const ACTIVE_PANEL_SELECTOR = ".right-panel-section.is-active";
const SECTION_SELECTOR = ".connected-scroll-section";

export default function ConnectedOsHashSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const engineOwnsScroll = () =>
      !!document.querySelector(`${SECTION_SELECTOR}[data-native-scroll="true"]`);

    const setFragment = (fragment: string) => {
      const next = fragment || window.location.pathname + window.location.search;
      if (window.location.hash === (fragment || "")) return;
      try {
        window.history.replaceState(null, "", next);
      } catch {
        /* replaceState can throw in exotic sandboxes — never break scroll */
      }
    };

    // --- INBOUND ---------------------------------------------------------
    let bootJumped = false;
    const jumpToHash = (initial = false) => {
      const raw = window.location.hash.replace(/^#/, "").trim();
      if (!raw) return;

      let id: string;
      try {
        id = decodeURIComponent(raw);
      } catch {
        id = raw;
      }

      const el = document.getElementById(id);
      if (!el) return;

      const isScene = el.classList.contains(PANEL_SELECTOR.slice(1));
      if (engineOwnsScroll() && isScene) {
        // Reuse the engine's single intentional programmatic scroll.
        window.dispatchEvent(
          new CustomEvent("connected-os-scroll-to-section", { detail: { id } })
        );
      } else {
        el.scrollIntoView({
          behavior: reduceMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
      if (initial) bootJumped = true;
    };

    // --- OUTBOUND --------------------------------------------------------
    // Skip outbound writes during boot so an initial `#scene` is not cleared
    // before the engine has had a chance to honour it.
    const bootGuardUntil = performance.now() + 1200;

    let raf = 0;
    let trailing = 0;
    const reflect = () => {
      if (performance.now() < bootGuardUntil) return;

      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Pick the active key-point panel that is MOST on screen right now. Only
      // the on-screen hub's panel counts — the two bystander hubs' active panels
      // sit far off screen, so their visible height is ~0.
      let bestId: string | null = null;
      let bestVisible = 0;
      const activePanels = Array.from(
        document.querySelectorAll<HTMLElement>(ACTIVE_PANEL_SELECTOR)
      );
      for (const panel of activePanels) {
        const r = panel.getBoundingClientRect();
        const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        if (visible > bestVisible) {
          bestVisible = visible;
          bestId = panel.id || null;
        }
      }

      if (bestId && bestVisible > vh * 0.05) {
        setFragment("#" + bestId);
        return;
      }

      // Nothing meaningfully on screen: clear the fragment only when no hub
      // section is pinned either (hero / footer / inter-section gaps).
      const inPinnedHub = Array.from(
        document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)
      ).some((section) => {
        const r = section.getBoundingClientRect();
        return r.top <= 2 && r.bottom >= vh - 2;
      });
      if (!inPinnedHub) setFragment("");
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        reflect();
      });
      // A trailing pass, run after the engine's own rAF has settled the active
      // class, so the fragment never lags a frame behind at a scroll stop.
      if (trailing) window.clearTimeout(trailing);
      trailing = window.setTimeout(() => {
        trailing = 0;
        reflect();
      }, 90);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // Reflect on the engine's own active-section signal too, so the fragment
    // never lags a scene behind at the exact moment a scroll settles.
    window.addEventListener("connected-os-active-section", schedule);
    window.addEventListener("hashchange", () => jumpToHash(false));

    // Honour an initial deep link once the engine geometry has settled.
    let bootTimer = 0;
    if (window.location.hash) {
      bootTimer = window.setTimeout(() => {
        if (!bootJumped) jumpToHash(true);
      }, 800);
    }
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("connected-os-active-section", schedule);
      if (raf) cancelAnimationFrame(raf);
      if (trailing) window.clearTimeout(trailing);
      if (bootTimer) window.clearTimeout(bootTimer);
    };
  }, []);

  return null;
}

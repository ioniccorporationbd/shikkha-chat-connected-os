/**
 * Connected OS — interruptible, eased scroll animation.
 * =====================================================
 * Used ONLY for explicit USER navigation — a nav item / CTA / rail-marker click
 * that fires the `connected-os-scroll-to-section` event. It is deliberately
 * NEVER wired to wheel / trackpad / touch scrolling: those stay 100 % native so
 * the user's input is never blocked, and ANY real gesture (wheel, touch,
 * pointer, key) instantly CANCELS a running animation so the page hands control
 * straight back to the user.
 *
 * The animation is a pure rAF loop that writes `window.scrollTo(0, y)` each
 * frame. Because the engine's scroll handler keeps publishing the continuous
 * `--scene-focus` on every frame, the Middle Section AND the Right Sidebar
 * advance together for the whole transition — their animation starts and
 * completes in lockstep, never one behind the other.
 *
 * No snapping, no background settle, no scroll trap: when the animation ends
 * (or is cancelled) the page simply stays where it is.
 */

export type ScrollAnimationHandle = {
  /** Stop the animation immediately, leaving the page where it currently is. */
  cancel: () => void;
};

/** Smooth accelerate-then-settle easing — a long journey should not lurch. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Gestures that mean "the user has taken over" — any one cancels the animation. */
const INTERRUPT_EVENTS = [
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;

export function animateScrollTo(
  targetY: number,
  durationMs: number,
  options: { reducedMotion?: boolean } = {}
): ScrollAnimationHandle {
  if (typeof window === "undefined") return { cancel: () => {} };

  const doc = document.documentElement;
  const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
  const toY = Math.max(0, Math.min(targetY, maxY));
  const fromY = window.scrollY || doc.scrollTop || 0;
  const delta = toY - fromY;

  // The document sets `scroll-behavior: smooth` globally (globals.css). Under
  // that rule every per-frame `scrollTo` would be re-interpolated by the
  // browser and the animation would lag then lurch, so force INSTANT
  // positioning for the whole transition and restore the original value when it
  // finishes or is cancelled.
  const docEl = document.documentElement;
  const prevScrollBehavior = docEl.style.scrollBehavior;

  // Instant (no animation) when motion is reduced, the distance is negligible,
  // or no duration is requested. Reduced-motion users still reach the target.
  if (options.reducedMotion || durationMs <= 0 || Math.abs(delta) < 1) {
    docEl.style.scrollBehavior = "auto";
    window.scrollTo(0, toY);
    docEl.style.scrollBehavior = prevScrollBehavior;
    return { cancel: () => {} };
  }

  let rafId = 0;
  let cancelled = false;

  const detach = () => {
    INTERRUPT_EVENTS.forEach((name) =>
      window.removeEventListener(name, onInterrupt, { capture: true })
    );
  };

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    detach();
    // Restore the document's own scroll-behavior for anything that follows.
    docEl.style.scrollBehavior = prevScrollBehavior;
  };

  function onInterrupt() {
    // Hand control straight back to the user; do NOT touch the scroll position.
    cancel();
  }

  const start = performance.now();

  // Force instant per-frame positioning (defeats the global `scroll-behavior:
  // smooth`); restored in `cancel()` when the transition ends.
  docEl.style.scrollBehavior = "auto";

  const step = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / durationMs);
    window.scrollTo(0, fromY + delta * easeInOutCubic(t));
    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      cancel();
    }
  };

  INTERRUPT_EVENTS.forEach((name) =>
    window.addEventListener(name, onInterrupt, { capture: true, passive: true })
  );
  rafId = requestAnimationFrame(step);

  return { cancel };
}

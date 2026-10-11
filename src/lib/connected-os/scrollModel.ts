/**
 * Connected OS — pure scroll model.
 * =================================
 * Every value here is a pure function of (scrollY, geometry, sceneCount): no
 * DOM reads, no side effects. That makes the whole progression deterministic,
 * fully reversible (forward == reverse), and unit-testable in isolation.
 */

/** Per-scene pinned scroll travel, in CSS px. The one progression knob. */
export const SCENE_PITCH_PX = 1600;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** 0..1 progress across the WHOLE pinned hub, from cached geometry. */
export function hubProgress(
  scrollY: number,
  sectionTop: number,
  pinned: number
): number {
  return clamp((scrollY - sectionTop) / Math.max(1, pinned), 0, 1);
}

/**
 * Continuous scene position. Scene k is centred at `k + 0.5`, so focus runs
 * from 0.5 (first scene centred) to count - 0.5 (last scene centred). Because
 * it is monotonic and never wraps, crossing a boundary can never reset or jump.
 */
export function sceneFocus(progress: number, count: number): number {
  return progress * (count - 1) + 0.5;
}

/** Nearest scene to the current focus — the one shown as "active". */
export function activeIndex(progress: number, count: number): number {
  return clamp(Math.round(progress * (count - 1)), 0, count - 1);
}

/** Progress that centres scene `index` — used for click-to-jump navigation. */
export function progressForIndex(index: number, count: number): number {
  return count > 1 ? index / (count - 1) : 0;
}

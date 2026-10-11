/**
 * Scene Animation Registry
 * =========================
 * The single, data-only source of truth for HOW each of the 26 Middle Section
 * scenes animates. No React, no DOM, no timers — just a configuration map.
 *
 * The scroll engine (`MiddleSectionController`) publishes ONE continuous
 * `--scene-focus`. Every mounted scene slot is stamped with its registry entry
 * (see `MiddleSceneStage`) as CSS custom properties, and `globals.css` turns
 * those into a PURE, reversible function of scroll position. Tuning a scene's
 * motion therefore means editing one row here — never the engine or the maths.
 *
 * Families give the 26 scenes a shared visual language while each scene keeps
 * its own direction + timing, so no two hubs animate identically.
 */

export type SceneFamily =
  | "overview" // a hub's opening scene: the whole panel assembles
  | "information" // data-centric: tiles converge from their reading side
  | "process" // sequential workflow: a directional staggered run
  | "diagram" // relationships/connectors: a gentle settle
  | "detail"; // content-first: the title leads, cards follow late

/** A `[start, end]` window in the scene's local progress (0 = enter, 1 = leave). */
export type SceneRamp = readonly [number, number];

export type SceneAnimation = {
  family: SceneFamily;
  /** Horizontal drift (px) the heading cluster converges from on entry. */
  dirX: number;
  /** Vertical lift (px) the heading cluster rises from on entry. */
  dirY: number;
  /** How far the title leads its cards, in local units. */
  titleLead: number;
  /** Stagger step between consecutive cards, in local units. */
  cardStep: number;
  /** Local progress window in which the scene arrives. */
  enter: SceneRamp;
  /** Local progress window in which the scene departs. */
  exit: SceneRamp;
};

/** Shared arrival/departure ramps per family — scenes inherit unless overridden. */
export const FAMILY_RAMPS: Record<
  SceneFamily,
  { enter: SceneRamp; exit: SceneRamp }
> = {
  overview: { enter: [0.02, 0.18], exit: [0.82, 0.98] },
  information: { enter: [0.02, 0.18], exit: [0.82, 0.98] },
  process: { enter: [0.02, 0.2], exit: [0.8, 0.98] },
  diagram: { enter: [0.03, 0.19], exit: [0.81, 0.98] },
  detail: { enter: [0.04, 0.2], exit: [0.8, 0.98] },
};

type SceneSeed = {
  family: SceneFamily;
  dirX?: number;
  dirY?: number;
  titleLead?: number;
  cardStep?: number;
};

/*
 * One row per scene (26 total: HC 8 · SA 10 · OE 8). Keys are the exact scene
 * ids the hubs register, so a hub scene with no row falls back to `information`.
 */
const SEEDS: Record<string, SceneSeed> = {
  // ── Home Connections (8) ───────────────────────────────────────────────
  "home-connections-panel": { family: "overview", dirY: 24 },
  "student-information": { family: "information", dirX: 16 },
  sis: { family: "information", dirX: 16, dirY: 12 },
  enrollment: { family: "process", dirX: -18 },
  "special-programs": { family: "diagram", dirY: 12 },
  "family-engagement": { family: "information", dirX: 16 },
  communications: { family: "process", dirX: 18 },
  "attendance-support": { family: "detail", dirY: 12 },

  // ── Student Achievement (10) ───────────────────────────────────────────
  "student-achievement": { family: "overview", dirY: 24 },
  "classroom-solutions": { family: "information", dirX: 16 },
  "learning-management-schoology": { family: "diagram", dirY: 12 },
  "assessment-performance-matters": { family: "information", dirX: 16 },
  "curriculum-instruction": { family: "process", dirX: -18 },
  "student-intervention": { family: "process", dirX: 18 },
  mtss: { family: "diagram", dirY: 12 },
  "behavior-support": { family: "detail", dirY: 12 },
  "college-career-life-readiness": { family: "information", dirX: 16 },
  "cclr-naviance": { family: "detail", dirY: 12 },

  // ── Operational Excellence (8) ─────────────────────────────────────────
  "operational-excellence": { family: "overview", dirY: 24 },
  "resource-planning": { family: "process", dirX: -18 },
  "financial-strategy-allovue": { family: "information", dirX: 16 },
  "erp-systems": { family: "diagram", dirY: 12 },
  "predictive-enrollment": { family: "information", dirX: 16 },
  "talent-management": { family: "information", dirX: 16, dirY: 12 },
  "recruiting-and-hr": { family: "process", dirX: 18 },
  "educator-support": { family: "detail", dirY: 12 },
};

function familyBaseLift(family: SceneFamily): number {
  if (family === "overview") return 22;
  if (family === "detail") return 12;
  return 16;
}

function build(seed: SceneSeed): SceneAnimation {
  const ramp = FAMILY_RAMPS[seed.family];
  return {
    family: seed.family,
    dirX: seed.dirX ?? 0,
    dirY: seed.dirY ?? familyBaseLift(seed.family),
    titleLead: seed.titleLead ?? 0.04,
    cardStep: seed.cardStep ?? 0.022,
    enter: ramp.enter,
    exit: ramp.exit,
  };
}

export const SCENE_REGISTRY: Record<string, SceneAnimation> = Object.fromEntries(
  Object.entries(SEEDS).map(([id, seed]) => [id, build(seed)])
);

/** Total registered scenes — asserted against the hubs (must be 26). */
export const SCENE_REGISTRY_SIZE = Object.keys(SCENE_REGISTRY).length;

const FALLBACK: SceneAnimation = build({ family: "information" });

/** Registry lookup with a safe fallback, so an unregistered scene still animates. */
export function getSceneAnimation(id: string): SceneAnimation {
  return SCENE_REGISTRY[id] ?? FALLBACK;
}

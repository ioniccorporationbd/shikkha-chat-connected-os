"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

import { getSceneAnimation } from "@/lib/connected-os/sceneAnimationRegistry";

export type HubScene = {
  id: string;
  title: string;
  node: ReactNode;
};

type MiddleSceneStageProps = {
  scenes: HubScene[];
  defaultActiveId: string;
  /** Emit the default active id on mount (Home Connections relies on this). */
  emitDefaultOnMount?: boolean;
};

/*
 * -------------------------------------------------------------------------
 * MIDDLE SCENE STAGE (shared by the HC / SA / OE hubs — REBUILT).
 *
 * The stage keeps the ACTIVE scene plus its two immediate neighbours mounted
 * so nothing ever remounts at a boundary. Each mounted slot is stamped with
 * its own entry from `sceneAnimationRegistry` (direction, ramps, title lead,
 * card stagger) and lets its opacity + drift be a PURE function of the
 * engine's continuous `--scene-focus` — see globals.css `.connected-scene-slot`.
 *
 * Because every value is a pure function of scroll position:
 *   • the same scroll position yields the same frame regardless of direction
 *     or speed (deterministic, reversible);
 *   • a boundary never remounts the outgoing scene (no flash, no re-entry);
 *   • the handoff is GHOST-FREE: the outgoing scene fades fully OUT before the
 *     incoming fades IN, so readable text from two scenes never overlaps;
 *   • no scale, perspective or scene-wide translate — opacity + a small,
 *     per-element drift only, so the stage can never appear to zoom.
 *
 * A11Y: only the ACTIVE slot is interactive; the two off-stage neighbours are
 * `inert` + `aria-hidden`, so their controls are neither tab-focusable nor
 * announced while they are off-stage.
 * -------------------------------------------------------------------------
 */
export default function MiddleSceneStage({
  scenes,
  defaultActiveId,
  emitDefaultOnMount = false,
}: MiddleSceneStageProps) {
  // Mirror the engine's pin gate (>=1280 and not reduced-motion): stacked /
  // reduced layouts render a single scene, the pinned stage renders a window.
  const [isNative, setIsNative] = useState(false);
  const [activeId, setActiveId] = useState(defaultActiveId);
  const reduce = useReducedMotion();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () =>
      setIsNative(!mediaQuery.matches && window.innerWidth >= 1280);

    evaluate();
    mediaQuery.addEventListener("change", evaluate);
    window.addEventListener("resize", evaluate);

    return () => {
      mediaQuery.removeEventListener("change", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id || !scenes.some((scene) => scene.id === id)) return;
      setActiveId((current) => (current === id ? current : id));
    };

    window.addEventListener("connected-os-active-section", handleActiveSection);

    if (emitDefaultOnMount) {
      window.dispatchEvent(
        new CustomEvent("connected-os-active-section", {
          detail: { id: defaultActiveId },
        })
      );
    }

    return () =>
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection
      );
  }, [scenes, defaultActiveId, emitDefaultOnMount]);

  const activeIndex = useMemo(() => {
    const found = scenes.findIndex((scene) => scene.id === activeId);
    return found < 0 ? 0 : found;
  }, [scenes, activeId]);

  const activeTitle = scenes[activeIndex]?.title ?? "";

  // Pinned stage: active scene + immediate neighbours stay mounted. Everywhere
  // else: a single scene.
  const visible = useMemo(() => {
    if (!isNative) return [{ scene: scenes[activeIndex], index: activeIndex }];

    return [activeIndex - 1, activeIndex, activeIndex + 1]
      .filter((index) => index >= 0 && index < scenes.length)
      .map((index) => ({ scene: scenes[index], index }));
  }, [isNative, activeIndex, scenes]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[var(--color-white)]">
      <div className="connected-blob-a pointer-events-none absolute left-[14%] top-[16%] h-[280px] w-[280px] rounded-full bg-[var(--color-secondary)] opacity-60 blur-[90px]" />
      <div className="connected-blob-b pointer-events-none absolute bottom-[14%] right-[12%] h-[340px] w-[340px] rounded-full bg-[var(--color-secondary)] opacity-60 blur-[105px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-60 blur-[85px]" />

      <div className="pointer-events-none absolute left-8 top-8 z-30 hidden lg:block">
        <motion.div
          key={activeTitle}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="section-label-badge hc-middle-badge"
        >
          {activeTitle}
        </motion.div>
      </div>

      <div className="connected-scene-layer relative z-10 h-screen w-full overflow-hidden">
        {visible.map(({ scene, index }) => {
          const anim = getSceneAnimation(scene.id);
          const isActive = !isNative || index === activeIndex;
          const offStage = isNative && !isActive;

          const slotStyle = {
            "--scene-index": index,
            "--sa-dir-x": `${anim.dirX}px`,
            "--sa-dir-y": `${anim.dirY}px`,
            "--sa-in-a": anim.enter[0],
            "--sa-in-b": anim.enter[1],
            "--sa-out-a": anim.exit[0],
            "--sa-out-b": anim.exit[1],
            "--sa-title-lead": anim.titleLead,
            "--sa-card-step": anim.cardStep,
          } as CSSProperties;

          return (
            <div
              key={scene.id}
              className={"connected-scene-slot" + (isActive ? " is-active" : "")}
              data-scene-family={anim.family}
              style={slotStyle}
              aria-hidden={offStage ? true : undefined}
              inert={offStage ? true : undefined}
            >
              <div className="connected-scene-motion flex h-full w-full items-center justify-center">
                {scene.node}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

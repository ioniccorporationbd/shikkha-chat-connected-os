"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";

export type HubScene = {
  id: string;
  title: string;
  node: ReactNode;
};

type HubSceneStageProps = {
  scenes: HubScene[];
  defaultActiveId: string;
  /** Emit the default active id on mount (preserves the Home Connections
   *  hub's original behaviour; SA/OE rely on the engine's own first dispatch). */
  emitDefaultOnMount?: boolean;
};

/*
 * -------------------------------------------------------------------------
 * SCROLL-SYNCHRONISED MIDDLE STAGE (shared by the HC / SA / OE hubs).
 *
 * Previously each hub rendered ONLY the active scene inside a keyed
 * <AnimatePresence> whose enter/exit were fixed-duration tweens (0.55s / 0.35s).
 * That produced three real defects:
 *   1. a visible jump at every scene boundary, because the shared `--scene-p`
 *      variable wrapped 1 → 0 and the still-mounted outgoing scene's transform
 *      snapped back;
 *   2. forward/reverse asymmetry (a tween does not care about scroll position);
 *   3. mount/unmount churn — the outgoing scene was a DIFFERENT React element
 *      from the incoming one, so nothing was continuous.
 *
 * This stage instead keeps the ACTIVE scene and its two immediate neighbours
 * mounted and lets their opacity + drift be a PURE function of the engine's
 * continuous `--scene-focus` (see globals.css `.connected-scene-slot`). Because
 * it is a pure function of scroll position:
 *   • the same scroll position yields the same frame regardless of direction
 *     or speed (deterministic);
 *   • a boundary never remounts the outgoing scene (no flash, no re-entry
 *     animation);
 *   • two neighbours meeting at a boundary always sum to full opacity, so the
 *     stage is never blank;
 *   • crossing the boundary never wraps a value back to 0 (no reset / no jump).
 *
 * The engine still owns scene SELECTION (it dispatches `connected-os-active-section`
 * exactly as before); this stage only decides which scenes to keep mounted and
 * lets CSS interpolate the transition. On stacked / mobile / reduced-motion
 * layouts it renders a single scene and the CSS motion is inert.
 * -------------------------------------------------------------------------
 */
export default function HubSceneStage({
  scenes,
  defaultActiveId,
  emitDefaultOnMount = false,
}: HubSceneStageProps) {
  // Mirror the engine's pin gate (>=1280 and not reduced-motion) so the stage
  // renders one scene in the stacked layout and the 3-scene window only where
  // the pinned engine is actually driving scroll progress.
  const [isNative, setIsNative] = useState(false);
  const [activeId, setActiveId] = useState(defaultActiveId);

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

  // On the pinned stage keep the active scene + its immediate neighbours
  // mounted (no remount at a boundary). Everywhere else, a single scene.
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
          initial={{ opacity: 0, y: -8, scale: 0.96, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="section-label-badge hc-middle-badge"
        >
          {activeTitle}
        </motion.div>
      </div>

      <div className="relative z-10 h-screen w-full overflow-hidden">
        {visible.map(({ scene, index }) => (
          <div
            key={scene.id}
            className={
              "connected-scene-slot" +
              (!isNative || index === activeIndex ? " is-active" : "")
            }
            style={{ "--scene-index": index } as CSSProperties}
          >
            <div className="connected-scene-motion flex h-full w-full items-center justify-center">
              {scene.node}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

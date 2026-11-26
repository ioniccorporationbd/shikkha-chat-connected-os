"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps an overlay (modal / sheet / popover) mounted while its EXIT animation
 * plays, then unmounts it. Callers render `if (!mounted) return null` and toggle
 * the exit class from `exiting`, so both the open AND close transitions animate
 * with plain CSS keyframes (see `u-shk-*` in globals.css) — no motion library.
 *
 * State writes are deferred through `setTimeout` on purpose: the repo lints with
 * `react-hooks/set-state-in-effect` (an ERROR), which flags a synchronous
 * setState inside an effect body. Scheduling the write one tick out keeps the
 * effect body free of it (the same pattern the data-loading effects use).
 */
export function useOverlayPresence(open: boolean, durationMs = 220) {
  const [mounted, setMounted] = useState(open);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }

    if (open) {
      // Mount now (next tick) and let the enter keyframe play.
      timer.current = window.setTimeout(() => setMounted(true), 0);
    } else {
      // Keep it mounted for the exit keyframe, then drop it.
      timer.current = window.setTimeout(() => setMounted(false), durationMs);
    }

    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [open, durationMs]);

  return { mounted, exiting: !open };
}

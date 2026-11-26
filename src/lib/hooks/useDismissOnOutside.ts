"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a popover / detail panel when the user clicks outside it or presses
 * Escape. Attach the returned ref to the panel's root element.
 *
 * - Uses a `pointerdown` listener in the capture phase so dismissal still
 *   works when inner elements call stopPropagation.
 * - The handler is kept in a ref, so an inline `onDismiss` (new identity each
 *   render) does not cause the listener to churn.
 * - Cleans up on unmount / when `active` flips to false (no leaked handlers).
 */
export function useDismissOnOutside(
  onDismiss: () => void,
  active: boolean = true,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (!node) return;
      if (node.contains(event.target as Node)) return;
      onDismissRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismissRef.current();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  return ref;
}

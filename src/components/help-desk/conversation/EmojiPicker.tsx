"use client";

import { useEffect, useRef } from "react";

import { EMOJI_GROUPS } from "@/lib/help-desk/emoji";

/**
 * The emoji sheet that opens above the composer.
 *
 * Purely a picker: it owns nothing but the dismiss behaviour (outside pointer,
 * Escape) and hands the chosen character back. Insertion and caret placement
 * stay in the composer, which is the only component that knows the textarea.
 * Laid out in a fixed grid so a phone keyboard never pushes it off-screen.
 */
export default function EmojiPicker({
  labels,
  title,
  onPick,
  onClose,
}: {
  /** Block labels, localised by the caller. */
  labels: Record<"smileys" | "gestures" | "objects", string>;
  title: string;
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Browsers scroll a focusable box into view when it takes focus, which can
  // leave the sheet opened half-scrolled. Always start at the top block.
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={title}
      className="absolute bottom-full right-0 z-40 mb-2 w-[min(19rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] shadow-[0_24px_48px_-24px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
    >
      <div ref={scrollerRef} className="hd-scrollbar-hidden max-h-[13.5rem] overflow-y-auto px-2 pb-2">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="sticky top-0 -mx-2 bg-[var(--color-white)] px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {labels[group.id]}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={`${group.id}-${emoji}`}
                  type="button"
                  onClick={() => onPick(emoji)}
                  className="grid h-9 place-items-center rounded-lg text-[20px] leading-none transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

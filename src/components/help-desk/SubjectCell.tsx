"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Characters shown in the subject column before the ellipsis. */
const SUBJECT_LIMIT = 15;

/** Split by code point so a Bangla cluster is never sliced in half. */
function clip(text: string): { short: string; truncated: boolean } {
  const chars = Array.from(text);
  if (chars.length <= SUBJECT_LIMIT) return { short: text, truncated: false };
  return { short: `${chars.slice(0, SUBJECT_LIMIT).join("")}...`, truncated: true };
}

/**
 * Placement of the popover in viewport coordinates. `anchor: "top"` sits below
 * the trigger, `anchor: "bottom"` flips above it when there is no room below.
 */
type Position = {
  anchor: "top" | "bottom";
  offset: number;
  left: number;
  maxWidth: number;
  maxHeight: number;
};

/** Hard ceiling for the popover: beyond this the content scrolls inside it. */
const POPOVER_MAX_HEIGHT = 300;
/** Breathing room kept between the popover and the viewport edge. */
const VIEWPORT_GAP = 12;
/** Space needed below the trigger before the popover is allowed to drop down. */
const MIN_ROOM_BELOW = 140;

/**
 * A subject that shows its first 15 characters and reveals the whole line in a
 * small popover on hover, tap or keyboard focus.
 *
 * The popover is `position: fixed` and measured from the trigger, because the
 * table sits inside an `overflow-x-auto` wrapper that would clip anything
 * absolutely positioned inside it.
 */
export default function SubjectCell({ subject }: { subject: string }) {
  const { short, truncated } = clip(subject);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  // Pinned = opened by click/tap (or keyboard), so it survives the pointer
  // leaving. Hover alone is "soft" and closes on mouse-out.
  const [pinned, setPinned] = useState(false);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    if (!truncated) return;
    const el = triggerRef.current;
    if (!el) return;
    clearTimer();
    const rect = el.getBoundingClientRect();
    const maxWidth = Math.min(352, window.innerWidth - VIEWPORT_GAP * 2);
    // Never let the popover leave the viewport horizontally.
    const left = Math.min(
      Math.max(VIEWPORT_GAP, rect.left),
      Math.max(VIEWPORT_GAP, window.innerWidth - maxWidth - VIEWPORT_GAP)
    );
    // Vertical: prefer below the trigger; flip above when a long subject would
    // otherwise run off the bottom of the screen. Height is capped, and the
    // content scrolls inside the popover (never the page).
    const roomBelow = window.innerHeight - rect.bottom - VIEWPORT_GAP;
    const roomAbove = rect.top - VIEWPORT_GAP;
    const flip = roomBelow < MIN_ROOM_BELOW && roomAbove > roomBelow;
    const maxHeight = Math.max(
      96,
      Math.min(POPOVER_MAX_HEIGHT, flip ? roomAbove : Math.max(roomBelow, 96))
    );
    setPosition({
      anchor: flip ? "bottom" : "top",
      offset: flip ? window.innerHeight - rect.top + 8 : rect.bottom + 8,
      left,
      maxWidth,
      maxHeight,
    });
  }, [clearTimer, truncated]);

  const hide = useCallback(() => {
    clearTimer();
    setPinned(false);
    setPosition(null);
  }, [clearTimer]);

  // A tiny grace period lets the pointer travel from the text into the popover
  // without the popover vanishing under it.
  const scheduleHide = useCallback(() => {
    if (pinned) return;
    clearTimer();
    hideTimer.current = setTimeout(() => setPosition(null), 120);
  }, [clearTimer, pinned]);

  // Tap/click pins the popover open (touch has no hover); clicking again,
  // clicking away or Escape closes it.
  const toggle = useCallback(() => {
    if (pinned) {
      hide();
      return;
    }
    setPinned(true);
    show();
  }, [hide, pinned, show]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!position) return;
    const close = () => hide();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || tipRef.current?.contains(target)) return;
      close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    if (pinned) document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [hide, pinned, position]);

  if (!truncated) {
    return <span className="truncate">{subject}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        tabIndex={0}
        role="button"
        aria-label={subject}
        aria-expanded={position !== null}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={() => {
          if (!pinned) hide();
        }}
        onClick={toggle}
        /* `hd-tint` drops the global red ring for a soft background tint
           (globals.css H-07) — a 1px ink box around text reads as a border. */
        className="hd-tint max-w-full cursor-default truncate rounded transition-colors focus-visible:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
      >
        {short}
      </span>

      {position ? (
        <span
          ref={tipRef}
          role="tooltip"
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleHide}
          style={{
            left: position.left,
            maxWidth: position.maxWidth,
            maxHeight: position.maxHeight,
            ...(position.anchor === "top" ? { top: position.offset } : { bottom: position.offset }),
          }}
          /* Long text, Bangla/English and unbroken URLs all wrap: `break-words`
             covers word boundaries, `overflow-wrap: anywhere` covers a single
             endless token, and `whitespace-pre-wrap` keeps the author's own
             line breaks. Anything taller than maxHeight scrolls inside. */
          className="fixed z-[90] block overflow-y-auto overscroll-contain whitespace-pre-wrap break-words rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2 text-left text-[12.5px] font-medium leading-relaxed text-[var(--color-primary)] shadow-[0_18px_40px_-20px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] [overflow-wrap:anywhere]"
        >
          {subject}
        </span>
      ) : null}
    </>
  );
}

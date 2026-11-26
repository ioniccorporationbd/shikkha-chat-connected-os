"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiChevronDown, FiCopy, FiCornerUpLeft, FiSmile } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";

/**
 * The six reactions the Help Desk allows — deliberately small, the same set the
 * ERP endpoint accepts. Anything else is rejected server-side.
 */
export const REACTION_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

const MENU_WIDTH = 192;
const MENU_HEIGHT = 136;
const REACT_EXTRA_HEIGHT = 44;

/**
 * The small chevron a message carries plus its popover: Reply, React, Copy.
 *
 * Nothing here decides whether an action is allowed — the caller only renders
 * the parts the ERP already lets this user do. The popover is drawn `fixed` and
 * clamped to the viewport so the thread's scroll container can never cut it,
 * and it closes on an outside press, Escape, scroll or resize; focus returns to
 * the chevron on close so keyboard users never lose their place.
 */
export default function MessageActionMenu({
  copy,
  mine,
  open,
  onOpenChange,
  onReply,
  onReact,
  onCopy,
}: {
  copy: ConversationCopy;
  /** My own message: mirror the popover to the right edge. */
  mine: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onCopy?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [reactOpen, setReactOpen] = useState(false);

  const close = useCallback(() => {
    onOpenChange(false);
    setReactOpen(false);
    setPosition(null);
  }, [onOpenChange]);

  // Measured on every open/resize: the popover is viewport-fixed, so the
  // trigger's live box decides where it goes — above the chevron when the space
  // below is short, and always inside the horizontal viewport.
  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const height = MENU_HEIGHT + (reactOpen ? REACT_EXTRA_HEIGHT : 0);
    let left = mine ? rect.right - MENU_WIDTH : rect.left;
    left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - MENU_WIDTH - 8));
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    setPosition({ top, left });
  }, [mine, reactOpen]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, measure]);

  // Outside press, Escape, scroll. The scroll listener is capture-phase so a
  // scroll of the thread (not just the window) also closes a stale popover.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
      triggerRef.current?.focus();
    };
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  // Keyboard focus moves into the popover, so the items are reachable without a
  // mouse the way a real menu behaves.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("[data-menu-item]")?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const pick = (action?: () => void) => {
    if (action) action();
    close();
  };

  const itemClass =
    "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-[12.5px] font-semibold text-[var(--color-primary)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] focus-visible:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] focus-visible:outline-none";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        onContextMenu={(event) => {
          // Long-press / right-click opens the menu instead of a browser menu.
          event.preventDefault();
          onOpenChange(true);
        }}
        aria-label={copy.menuAria}
        title={copy.menuAria}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          "grid h-6 w-6 flex-none place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)] transition",
          "opacity-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] group-hover/msg:opacity-100",
          // Touch screens have no hover: the chevron stays visible there.
          "max-sm:opacity-100",
          open
            ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)] opacity-100"
            : "hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] hover:text-[var(--color-primary)]",
        ].join(" ")}
      >
        <FiChevronDown size={14} aria-hidden />
      </button>

      {open && position ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={copy.menuAria}
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-[70] rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-1 shadow-[0_18px_40px_-22px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
        >
          {onReply ? (
            <button type="button" role="menuitem" data-menu-item onClick={() => pick(onReply)} className={itemClass}>
              <FiCornerUpLeft size={14} className="flex-none opacity-70" aria-hidden />
              {copy.replyAction}
            </button>
          ) : null}
          {onReact ? (
            <button
              type="button"
              role="menuitem"
              data-menu-item
              aria-expanded={reactOpen}
              onClick={() => setReactOpen((value) => !value)}
              className={itemClass}
            >
              <FiSmile size={14} className="flex-none opacity-70" aria-hidden />
              {copy.reactAction}
            </button>
          ) : null}
          {onCopy ? (
            <button type="button" role="menuitem" data-menu-item onClick={() => pick(onCopy)} className={itemClass}>
              <FiCopy size={14} className="flex-none opacity-70" aria-hidden />
              {copy.copyAction}
            </button>
          ) : null}

          {onReact && reactOpen ? (
            <div
              role="group"
              aria-label={copy.reactionTitle}
              className="mt-1 flex items-center justify-between gap-0.5 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] px-1 pt-1.5"
            >
              {REACTION_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => pick(() => onReact(emoji))}
                  aria-label={`${copy.reactionTitle} ${emoji}`}
                  className="grid h-7 w-7 flex-none place-items-center rounded-lg text-[15px] leading-none transition hover:scale-110 hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

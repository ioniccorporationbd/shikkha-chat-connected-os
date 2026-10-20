"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiBookmark,
  FiCheckSquare,
  FiCopy,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiTrash2,
} from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";

export type MessageMenuAction = "reply" | "copy" | "pin" | "forward" | "select" | "delete";

type Item = {
  key: MessageMenuAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

/**
 * WhatsApp-style message menu: a compact popover anchored where the reader
 * clicked. Only the actions the backend really supports are rendered, so no
 * dead buttons ever reach production.
 */
export default function MessageActionMenu({
  copy,
  x,
  y,
  pinned = false,
  canReply = false,
  canCopy = false,
  canPin = false,
  canForward = false,
  canDelete = false,
  onAction,
  onClose,
}: {
  copy: ConversationCopy;
  x: number;
  y: number;
  pinned?: boolean;
  canReply?: boolean;
  canCopy?: boolean;
  canPin?: boolean;
  canForward?: boolean;
  canDelete?: boolean;
  onAction: (action: MessageMenuAction) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });

  const items: Item[] = [
    ...(canReply
      ? [{ key: "reply" as const, label: copy.replyAction, icon: <FiCornerUpLeft size={14} aria-hidden /> }]
      : []),
    ...(canCopy
      ? [{ key: "copy" as const, label: copy.copyAction, icon: <FiCopy size={14} aria-hidden /> }]
      : []),
    ...(canPin
      ? [
          {
            key: "pin" as const,
            label: pinned ? copy.unpinAction : copy.pinAction,
            icon: <FiBookmark size={14} aria-hidden className={pinned ? "fill-current" : undefined} />,
          },
        ]
      : []),
    ...(canForward
      ? [
          {
            key: "forward" as const,
            label: copy.forwardAction,
            icon: <FiCornerUpRight size={14} aria-hidden />,
          },
        ]
      : []),
    ...(canReply ? [{ key: "select" as const, label: copy.selectAction, icon: <FiCheckSquare size={14} aria-hidden /> }] : []),
    ...(canDelete
      ? [{ key: "delete" as const, label: copy.deleteAction, icon: <FiTrash2 size={14} aria-hidden />, danger: true }]
      : []),
  ];

  // Keep the panel inside the viewport: flip left/up when the click is near an
  // edge, and never let it cover the whole screen.
  useLayoutEffect(() => {
    const node = panel.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;
    if (left + rect.width + margin > window.innerWidth) left = window.innerWidth - rect.width - margin;
    if (left < margin) left = margin;
    if (top + rect.height + margin > window.innerHeight) top = y - rect.height;
    if (top < margin) top = margin;
    setPos({ left, top, ready: true });
  }, [x, y]);

  useEffect(() => {
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const node = panel.current;
      if (node && event.target instanceof Node && node.contains(event.target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const buttons = panel.current ? [...panel.current.querySelectorAll<HTMLButtonElement>("button")] : [];
      if (!buttons.length) return;
      event.preventDefault();
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === "ArrowDown"
          ? buttons[(index + 1) % buttons.length]
          : buttons[(index - 1 + buttons.length) % buttons.length];
      next?.focus();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const first = panel.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panel}
      role="menu"
      aria-label={copy.menuAria}
      style={{ left: pos.left, top: pos.top }}
      className={[
        "fixed z-[80] min-w-[11.5rem] overflow-hidden rounded-xl bg-[var(--color-white)] py-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.18)] ring-1 ring-[rgba(15,23,42,0.06)]",
        pos.ready ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          onClick={() => {
            onAction(item.key);
            onClose();
          }}
          className={[
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12.5px] font-semibold transition focus-visible:outline-none focus-visible:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))]",
            item.danger
              ? "text-[var(--color-action)] hover:bg-[color-mix(in_srgb,var(--color-action)_8%,var(--color-white))]"
              : "text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]",
          ].join(" ")}
        >
          <span className={item.danger ? "text-[var(--color-action)]" : "text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]"}>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}

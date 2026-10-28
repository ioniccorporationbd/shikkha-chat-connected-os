"use client";

import Link from "next/link";
import { FiMessageSquare } from "react-icons/fi";

/**
 * The "all conversations" action on a ticket: a solid brand-red pill with a
 * message icon, visually identical to the Back / Help Desk actions above it so
 * the three read as one row of actions. Only the styling lives here — the
 * destination is passed in, and navigation is untouched.
 */
export const CONVERSATION_ACTION_CLASS =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] shadow-[0_12px_24px_-16px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 active:translate-y-0";

export default function ConversationActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={CONVERSATION_ACTION_CLASS}
      // Inline colour for the same reason as the nav pills: the unlayered
      // `a { color: inherit }` reset outranks Tailwind's text-* utilities.
      style={{ color: "var(--color-white)" }}
    >
      <FiMessageSquare size={14} className="shrink-0" aria-hidden style={{ color: "var(--color-white)" }} />
      <span className="font-bold" style={{ color: "var(--color-white)" }}>
        {label}
      </span>
    </Link>
  );
}

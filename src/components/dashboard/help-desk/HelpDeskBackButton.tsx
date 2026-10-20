"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiArrowLeft, FiHeadphones } from "react-icons/fi";

/**
 * The two navigation controls that sit at the top of every Help Desk subpage:
 * `Back` and `Help Desk`.
 *
 * * Back does a real navigation — browser history when there is a page to
 *   return to, otherwise the section parent (`fallbackHref`) so the control is
 *   never a dead click (the URL may have been opened in a fresh tab).
 * * Help Desk jumps to *this user's* Help Desk overview. The role is read from
 *   the pathname, so a customer can never land on the employee dashboard and
 *   vice versa. The overview page itself hides it (`showHome={false}`).
 *
 * Styling is the standard Help Desk action button: brand-red pill, bold white
 * label, white icon.
 */

const ACTION_CLASS =
  "inline-flex min-h-10 w-fit items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] shadow-[0_12px_24px_-16px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 active:translate-y-0";

/** Role-aware Help Desk overview for the current dashboard. */
export function helpDeskHomeFor(pathname: string): string {
  return pathname.startsWith("/clientDashboard") ? "/clientDashboard/help-desk" : "/userDashboard/help-desk";
}

export default function HelpDeskBackButton({
  label,
  fallbackHref,
  homeLabel,
  showHome = true,
}: {
  label: string;
  fallbackHref: string;
  /** Localized "Help Desk" label; falls back to Bangla. */
  homeLabel?: string;
  /** Set false on the overview itself, which is already the destination. */
  showHome?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const homeHref = helpDeskHomeFor(pathname);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }
          router.push(fallbackHref);
        }}
        className={ACTION_CLASS}
      >
        <FiArrowLeft size={14} className="text-[var(--color-white)]" aria-hidden />
        <span className="font-bold text-[var(--color-white)]">{label}</span>
      </button>

      {showHome ? (
        <Link
          href={homeHref}
          className={ACTION_CLASS}
          aria-label={homeLabel || "হেল্প ডেস্ক"}
          // Inline color: the global unlayered `a { color: inherit }` rule beats
          // layered utilities, which would otherwise paint dark text on the red
          // button. Inline style keeps white text for links without !important.
          style={{ color: "var(--color-white)" }}
        >
          <FiHeadphones size={14} className="text-[var(--color-white)]" aria-hidden style={{ color: "var(--color-white)" }} />
          <span className="font-bold" style={{ color: "var(--color-white)" }}>{homeLabel || "হেল্প ডেস্ক"}</span>
        </Link>
      ) : null}
    </div>
  );
}

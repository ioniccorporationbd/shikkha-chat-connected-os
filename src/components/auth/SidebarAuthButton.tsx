"use client";

import Link from "next/link";
import { FiGrid, FiLogIn } from "react-icons/fi";

import { authCopyFor } from "@/lib/auth/messages";
import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "?";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

type SidebarAuthButtonProps = {
  /**
   * `sidebar` is the button in the sidebar header, right of the logo.
   * `compact` is the floating twin that is rendered while the sidebar is
   * collapsed (below the 1536px breakpoint the sidebar becomes a drawer), so
   * a sign-in button is always on screen.
   */
  variant?: "sidebar" | "compact";
};

/**
 * The sign-in / dashboard affordance, normally sitting immediately right of the
 * logo.
 *
 * Rendered inside the marketing sidebar, so it must not depend on the
 * dashboard: it reads the auth store that `AuthBootstrap` hydrates.
 *
 * Three deliberate implementation details:
 *
 * 1. `guest` and `loading` render the same sign-in link. The account state is
 *    only known after /api/auth/me resolves, and a sign-in button must never be
 *    hidden behind that round trip (a slow or unreachable ERP used to leave a
 *    grey skeleton instead of a button - the button was simply missing).
 * 2. `data-no-translate` opts this subtree out of the language provider's DOM
 *    walker (which only maps whole text nodes), so the label follows
 *    `useLanguage()` deterministically in both directions.
 * 3. The text utilities live on an inner <span>, never on the <a> itself: this
 *    project ships unlayered reset rules (`a { color: inherit }`,
 *    `button, a, input { font: inherit }`) that outrank Tailwind's layered
 *    utilities, so colour/size/weight on the anchor would silently do nothing
 *    (and white-on-white in the sidebar). Icon sizes are passed as props for
 *    the same reason.
 */
export default function SidebarAuthButton({
  variant = "sidebar",
}: SidebarAuthButtonProps = {}) {
  const { language } = useLanguage();
  const copy = authCopyFor(language);

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const compact = variant === "compact";

  if (status === "authenticated" && user) {
    const name = user.full_name || user.name;

    return (
      <Link
        href={DASHBOARD_PATH}
        data-no-translate="true"
        title={`${copy.signedInAs}: ${name}`}
        className={[
          "flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] transition hover:opacity-92",
          compact ? "px-2.5 py-2" : "mt-1 px-2.5 py-2",
        ].join(" ")}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[var(--color-white)] text-[10px] font-semibold text-[var(--color-primary)]">
          {initials(name)}
        </span>
        <span className="hidden max-w-[86px] truncate text-[12.5px] font-medium text-[var(--color-white)] sm:block">
          {copy.openDashboard}
        </span>
        <FiGrid aria-hidden size={15} className="text-[var(--color-white)] sm:hidden" />
      </Link>
    );
  }

  return (
    <Link
      href={LOGIN_PATH}
      data-no-translate="true"
      className={[
        "group inline-flex shrink-0 items-center whitespace-nowrap rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] transition hover:bg-[var(--color-primary)]",
        compact ? "px-3 py-2" : "mt-1 px-3.5 py-2.5",
      ].join(" ")}
    >
      <span
        className={[
          "inline-flex items-center gap-2 font-semibold text-[var(--color-primary)] transition group-hover:text-[var(--color-white)]",
          compact ? "text-[12.5px]" : "text-[13px]",
        ].join(" ")}
      >
        <FiLogIn aria-hidden size={15} />
        {copy.signIn}
      </span>
    </Link>
  );
}

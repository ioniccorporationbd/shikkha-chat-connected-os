"use client";

import Link from "next/link";
import { FiGrid, FiLogIn } from "react-icons/fi";

import UserAvatar from "@/components/dashboard/UserAvatar";
import { authCopyFor } from "@/lib/auth/messages";
import { dashboardPathFor, LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
        href={dashboardPathFor(user)}
        data-no-translate="true"
        title={`${copy.signedInAs}: ${name}`}
        className={[
          "flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] transition duration-300 hover:-translate-y-[2px] hover:shadow-[0_14px_28px_-10px_color-mix(in_srgb,var(--color-primary)_62%,transparent)]",
          compact ? "px-2.5 py-2" : "mt-1 px-2.5 py-2",
        ].join(" ")}
      >
        <UserAvatar user={user} size={24} rounded="rounded-lg" tone="soft" className="shrink-0" />
        <span className="hidden max-w-[86px] truncate text-[13px] font-medium text-[var(--color-white)] sm:block">
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
        "group relative inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] shadow-[0_1px_2px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] transition duration-300 ease-out",
        "hover:-translate-y-[2px] hover:border-[color-mix(in_srgb,var(--color-primary)_68%,var(--color-secondary))] hover:shadow-[0_14px_28px_-10px_color-mix(in_srgb,var(--color-primary)_62%,transparent)]",
        "active:translate-y-0 active:shadow-[0_6px_14px_-8px_color-mix(in_srgb,var(--color-primary)_58%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_85%,var(--color-white))] focus-visible:ring-offset-2",
        compact ? "px-3 py-2" : "mt-1 px-3.5 py-2.5",
      ].join(" ")}
    >
      {/*
        Hover fill: a brand gradient that wipes in from the left (scale-x + fade)
        so the colour change reads clearly without moving the label.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_60%,var(--color-secondary)))] opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
      />
      <span
        className={[
          "relative z-10 inline-flex items-center gap-2 font-semibold text-[var(--color-primary)] transition-colors duration-300 group-hover:text-[var(--color-white)]",
          compact ? "text-[13px]" : "text-[13px]",
        ].join(" ")}
      >
        <FiLogIn aria-hidden size={15} />
        {copy.signIn}
      </span>
    </Link>
  );
}

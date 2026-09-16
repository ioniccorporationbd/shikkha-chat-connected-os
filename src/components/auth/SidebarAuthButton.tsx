"use client";

import Link from "next/link";
import { FiGrid, FiLogIn } from "react-icons/fi";

import { authCopyFor } from "@/lib/auth/copy";
import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/language";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "?";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

/**
 * The sidebar sign-in affordance, sitting immediately right of the logo.
 *
 * Rendered inside the marketing sidebar, so it must not depend on the
 * dashboard: it reads the auth store that `AuthBootstrap` hydrates.
 *
 * Two deliberate implementation details:
 *
 * 1. `data-no-translate` opts this subtree out of the language provider's DOM
 *    walker (which only maps whole text nodes), so the label follows
 *    `useLanguage()` deterministically in both directions.
 * 2. The text utilities live on an inner <span>, never on the <a> itself: this
 *    project ships unlayered reset rules (`a { color: inherit }`,
 *    `button, a, input { font: inherit }`) that outrank Tailwind's layered
 *    utilities, so colour/size/weight on the anchor would silently do nothing
 *    (and white-on-white in the sidebar). Icon sizes are passed as props for
 *    the same reason.
 */
export default function SidebarAuthButton() {
  const { language } = useLanguage();
  const copy = authCopyFor(language);

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (status === "loading") {
    return (
      <span
        aria-hidden
        data-no-translate="true"
        className="mt-1 block h-[42px] w-[104px] shrink-0 animate-pulse rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]"
      />
    );
  }

  if (status === "authenticated" && user) {
    const name = user.full_name || user.name;

    return (
      <Link
        href={DASHBOARD_PATH}
        data-no-translate="true"
        title={`${copy.signedInAs}: ${name}`}
        className="mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-2.5 py-2 transition hover:opacity-92"
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
      className="group mt-1 inline-flex shrink-0 items-center whitespace-nowrap rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] px-3.5 py-2.5 transition hover:bg-[var(--color-primary)]"
    >
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)] transition group-hover:text-[var(--color-white)]">
        <FiLogIn aria-hidden size={15} />
        {copy.signIn}
      </span>
    </Link>
  );
}

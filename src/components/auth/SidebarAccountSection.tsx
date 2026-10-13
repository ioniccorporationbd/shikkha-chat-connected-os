"use client";

import Link from "next/link";
import { FiChevronRight, FiGrid, FiLogIn, FiUserPlus } from "react-icons/fi";

import { authCopyFor } from "@/lib/auth/messages";
import { registerCopyFor } from "@/lib/auth/register-messages";
import { dashboardPathFor, LOGIN_PATH, REGISTER_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * The account-action section that sits directly beneath the home-page logo —
 * a stack of the three entry actions, each laid out like the buttons in the
 * dashboard rail (full-width, `rounded-2xl`, icon + label, one below the other)
 * rather than the old inline pills.
 *
 * Visibility follows the auth store that `AuthBootstrap` hydrates from
 * `GET /api/auth/me`:
 *
 *   - signed in  → a single "Dashboard" button (role-aware destination via
 *                  `dashboardPathFor`), and the sign-in / register buttons are
 *                  gone because they no longer apply;
 *   - signed out → "Log In" + "Registration", and no Dashboard button.
 *
 * `guest` and `loading` share the signed-out branch on purpose: a call to action
 * must never be hidden behind the `/api/auth/me` round trip (the same rule the
 * individual sidebar buttons follow).
 *
 * Like the rest of the sidebar chrome this subtree opts out of the language
 * DOM walker (`data-no-translate`) and keeps every text/colour utility on an
 * inner <span> — this project ships unlayered reset rules (`a { color: inherit }`,
 * `button, a { font: inherit }`) that outrank Tailwind's layered utilities on the
 * <a>/<button> element itself, so colour/size/weight there would silently do
 * nothing. Icon sizes are passed as props for the same reason.
 */
export default function SidebarAccountSection() {
  const { language } = useLanguage();
  const authCopy = authCopyFor(language);
  const registerCopy = registerCopyFor(language);

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  // Shared button skins — deliberately mirrored from DashboardShell's
  // `navButtonClass`/`navLabelClass` so the two sidebars read as one system.
  const primaryButton =
    "group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[var(--color-action)] px-3.5 py-2.5 text-left shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_72%,transparent)] transition duration-300 hover:-translate-y-[2px] hover:bg-[var(--color-action-hover)] hover:shadow-[0_20px_40px_-18px_color-mix(in_srgb,var(--color-action)_80%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2";
  const secondaryButton =
    "group flex w-full items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3.5 py-2.5 text-left text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition duration-300 hover:-translate-y-[2px] hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2";
  const primaryLabel =
    "inline-flex min-w-0 flex-1 items-center gap-3 text-[13px] font-semibold leading-snug text-[var(--color-white)]";
  const secondaryLabel =
    "inline-flex min-w-0 flex-1 items-center gap-3 text-[13px] font-medium leading-snug";

  if (status === "authenticated" && user) {
    const name = user.full_name || user.name;

    return (
      <section
        aria-label={authCopy.openDashboard}
        data-no-translate="true"
        className="flex flex-col gap-2"
      >
        <Link
          href={dashboardPathFor(user)}
          title={`${authCopy.signedInAs}: ${name}`}
          className={primaryButton}
        >
          <span className={primaryLabel}>
            <FiGrid aria-hidden size={16} className="shrink-0" />
            <span className="truncate">{authCopy.openDashboard}</span>
          </span>
          <FiChevronRight
            aria-hidden
            size={15}
            className="shrink-0 text-[color-mix(in_srgb,var(--color-white)_80%,transparent)] transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label={authCopy.signIn}
      data-no-translate="true"
      className="flex flex-col gap-2"
    >
      <Link href={LOGIN_PATH} className={secondaryButton}>
        <span className={secondaryLabel}>
          <FiLogIn aria-hidden size={16} className="shrink-0" />
          <span className="truncate">{authCopy.signIn}</span>
        </span>
      </Link>

      <Link href={REGISTER_PATH} className={primaryButton}>
        <span className={primaryLabel}>
          <FiUserPlus aria-hidden size={16} className="shrink-0" />
          <span className="truncate">{registerCopy.button}</span>
        </span>
      </Link>
    </section>
  );
}

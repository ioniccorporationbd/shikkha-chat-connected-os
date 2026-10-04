"use client";

import Image from "next/image";
import Link from "next/link";
import { FiGlobe, FiGrid, FiHeadphones, FiHome, FiList, FiLogIn } from "react-icons/fi";

import { useAuthStore } from "@/lib/auth/store";
import {
  dashboardPathFor,
  HELP_DESK_PATH,
  HELP_DESK_TICKETS_PATH,
  LOGIN_PATH,
} from "@/lib/auth/session";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";

type ActiveTab = "home" | "new" | "tickets";

/**
 * Public Help Desk header. Reuses the existing brand asset (same logo as the
 * auth surfaces) and the global language switch, and offers Home / Help Desk /
 * My tickets plus a Login or Dashboard action depending on session state.
 *
 * NOTE (repo convention): text/colour/font utilities always live on an inner
 * element, never on the `<a>`/`<button>` itself, so the site-wide unlayered
 * reset can't override them.
 */
export default function HelpDeskHeader({ active }: { active?: ActiveTab }) {
  const { language, toggleLanguage } = useLanguage();
  const copy = helpDeskCopyFor(language);
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const authed = status === "authenticated" && Boolean(user);

  const navClass = (isActive: boolean) =>
    `group inline-flex items-center gap-2 rounded-2xl border px-3 py-2 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${
      isActive
        ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-secondary)_50%,var(--color-white))]"
        : "border-transparent hover:bg-[color-mix(in_srgb,var(--color-secondary)_32%,var(--color-white))]"
    }`;

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_16%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-white)_94%,var(--color-secondary))] p-4 shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_9%,transparent)] sm:flex-row sm:items-center sm:justify-between">
      <Link href="/" className="inline-flex items-center gap-3 focus-visible:outline-none">
        <Image
          src="/images/logo.png"
          alt={copy.brand}
          width={165}
          height={66}
          priority
          className="h-9 w-auto"
        />
      </Link>

      <nav className="flex flex-wrap items-center gap-1.5" aria-label={copy.navHelpDesk}>
        <Link href="/" className={navClass(false)}>
          <FiHome className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.navHome}</span>
        </Link>

        <Link href={HELP_DESK_PATH} className={navClass(active === "home")} aria-current={active === "home" ? "page" : undefined}>
          <FiHeadphones className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.navHelpDesk}</span>
        </Link>

        <Link href={HELP_DESK_TICKETS_PATH} className={navClass(active === "tickets")} aria-current={active === "tickets" ? "page" : undefined}>
          <FiList className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.navMyTickets}</span>
        </Link>

        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-white))] px-3 py-2 transition duration-200 hover:bg-[color-mix(in_srgb,var(--color-secondary)_32%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
          aria-label={language === "en" ? "বাংলা ভাষায় দেখান" : "Switch to English"}
        >
          <FiGlobe className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            {language === "en" ? "বাংলা" : "English"}
          </span>
        </button>

        {authed ? (
          <Link
            href={dashboardPathFor(user)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
          >
            <FiGrid className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-white)]">{copy.navDashboard}</span>
          </Link>
        ) : (
          <Link
            href={LOGIN_PATH}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2 transition duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
          >
            <FiLogIn className="h-4 w-4 text-[var(--color-white)]" aria-hidden />
            <span className="text-sm font-semibold text-[var(--color-white)]">{copy.navLogin}</span>
          </Link>
        )}
      </nav>
    </header>
  );
}

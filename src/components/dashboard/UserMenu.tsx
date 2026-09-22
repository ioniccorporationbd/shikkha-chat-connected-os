"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown, FiGrid, FiLogOut } from "react-icons/fi";

import UserAvatar from "@/components/dashboard/UserAvatar";
import { authCopyFor } from "@/lib/auth/messages";
import { dashboardPathFor } from "@/lib/auth/session";
import type { DashboardProfileRow, SessionUser } from "@/lib/auth/types";
import { dashboardCopyFor } from "@/lib/dashboard/messages";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type UserMenuProps = {
  user: SessionUser;
  displayName: string;
  /** Profile rows from the dashboard payload, as the ERP sent them. */
  profile?: DashboardProfileRow[];
  signingOut: boolean;
  onSignOut: () => void;
};

/** The header already shows the name and email, so the body skips them. */
const SKIP_ROWS = new Set(["Full Name", "Email"]);
const MAX_ROWS = 4;

/**
 * The account dropdown that hangs off the signed-in user's name in the
 * dashboard header.
 *
 * It is the only place the portal shows the *full* profile: the picture (when
 * the account has one), the account type (ERP `user_type`: desk vs portal), the
 * remaining profile fields and the account's roles, plus the two actions that
 * make sense there — open the dashboard this account belongs on, and sign out.
 *
 * Closing rules: outside click, `Escape` (returns focus to the trigger, so the
 * menu is usable from the keyboard), and a click on either action.
 *
 * Text utilities live on inner elements, never on the <button>/<a>: this project
 * ships unlayered reset rules that outrank Tailwind's utilities on those tags.
 */
export default function UserMenu({
  user,
  displayName,
  profile,
  signingOut,
  onSignOut,
}: UserMenuProps) {
  const { language } = useLanguage();
  const copy = authCopyFor(language).userMenu;
  const dashCopy = dashboardCopyFor(language);

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const rows = (profile ?? []).filter((row) => !SKIP_ROWS.has(row.label)).slice(0, MAX_ROWS);
  const accountType = (user.user_type ?? "").trim();
  const accountLabel = accountType
    ? accountType.toLowerCase() === "system user"
      ? copy.systemUser
      : copy.websiteUser
    : "";
  const dashboardHref = dashboardPathFor(user);

  return (
    <div ref={wrapperRef} className="relative" data-no-translate="true">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${copy.open}: ${displayName}`}
        className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-2 py-1.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_85%,var(--color-white))]"
      >
        <UserAvatar user={user} size={26} rounded="rounded-lg" />
        <span className="hidden max-w-[150px] truncate text-[13px] font-medium sm:block">
          {displayName}
        </span>
        <FiChevronDown
          aria-hidden
          size={14}
          className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={copy.open}
          className="absolute right-0 z-50 mt-2 w-[292px] origin-top-right overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] shadow-[0_28px_60px_color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
        >
          <div className="flex items-start gap-3 bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] px-4 py-4">
            <UserAvatar user={user} size={44} rounded="rounded-2xl" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{displayName}</p>
              {user.email ? (
                <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {user.email}
                </p>
              ) : null}
              {accountLabel ? (
                <span className="mt-1.5 inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {accountLabel}
                </span>
              ) : null}
            </div>
          </div>

          {rows.length ? (
            <dl className="flex flex-col gap-2 px-4 py-3">
              {rows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <dt className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                    {dashCopy.profileFields[row.label] ?? row.label}
                  </dt>
                  <dd className="max-w-[58%] break-words text-right text-[12px] font-medium">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {user.roles?.length ? (
            <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {copy.roles}
              </span>
              {user.roles.slice(0, 4).map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] px-2 py-0.5 text-[11px]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-1 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] p-2">
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <FiGrid aria-hidden size={15} />
              <span className="text-[13px] font-medium">{copy.dashboard}</span>
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={onSignOut}
              disabled={signingOut}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] disabled:opacity-60"
            >
              <FiLogOut aria-hidden size={15} />
              <span className="text-[13px] font-medium">
                {signingOut ? copy.signingOut : copy.signOut}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  FiChevronDown,
  FiEdit2,
  FiHome,
  FiLock,
  FiLogOut,
  FiRefreshCw,
} from "react-icons/fi";

import DashboardLanguageToggle from "@/components/dashboard/DashboardLanguageToggle";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { authCopyFor } from "@/lib/auth/messages";
import { profileCopyFor } from "@/lib/auth/profile-messages";
import type { DashboardProfileRow, SessionUser } from "@/lib/auth/types";
import { dashboardCopyFor } from "@/lib/dashboard/messages";
import { formatBdMobile } from "@/lib/format/mobile";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type UserMenuProps = {
  user: SessionUser;
  displayName: string;
  /** Profile rows from the dashboard payload, as the ERP sent them. */
  profile?: DashboardProfileRow[];
  signingOut: boolean;
  refreshing?: boolean;
  onSignOut: () => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onReload: () => void;
};

/** The header already shows the name and email, so the body skips them. */
const SKIP_ROWS = new Set(["Full Name", "Email"]);
const MAX_ROWS = 4;
/** Roles shown before the "+N more" control appears. */
const MAX_ROLES = 3;

/**
 * The account dropdown in the dashboard header, styled after the SSPL panel:
 * a brand-gradient identity header, a small info card per profile field, the
 * account's roles (collapsed to three with a "+N more" toggle), then the account
 * actions.
 *
 * Every value is dynamic (from the session/dashboard payload) — nothing here is
 * hardcoded demo data.
 *
 * Closing rules: outside click, `Escape` (returns focus to the trigger), or a
 * click on any action. Text/colour utilities live on inner elements, never on
 * the <button>/<a> (this project ships unlayered reset rules that outrank
 * Tailwind utilities on those tags).
 */
export default function UserMenu({
  user,
  displayName,
  profile,
  signingOut,
  refreshing = false,
  onSignOut,
  onEditProfile,
  onChangePassword,
  onReload,
}: UserMenuProps) {
  const { language } = useLanguage();
  const copy = authCopyFor(language).userMenu;
  const profileCopy = profileCopyFor(language);
  const dashCopy = dashboardCopyFor(language);

  const [open, setOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
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

  const roles = user.roles ?? [];
  const hiddenRoles = Math.max(0, roles.length - MAX_ROLES);
  const visibleRoles = rolesOpen ? roles : roles.slice(0, MAX_ROLES);

  const runThen = (action: () => void) => () => {
    setOpen(false);
    action();
  };

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
        className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-2 py-1.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_85%,var(--color-white))]"
      >
        <UserAvatar
          user={user}
          size={28}
          rounded="rounded-full"
          className="ring-2 ring-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]"
        />
        <span className="hidden max-w-[150px] truncate text-[13px] font-semibold text-[var(--color-primary)] sm:block">
          {displayName}
        </span>
        <span
          className={`shrink-0 text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <FiChevronDown aria-hidden size={14} />
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={copy.open}
          className="absolute right-0 z-50 mt-2 w-[326px] max-w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] shadow-[0_30px_64px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
        >
          {/* identity header — brand gradient like the SSPL account summary */}
          <div className="flex items-center gap-3 bg-[linear-gradient(135deg,var(--color-primary)_0%,color-mix(in_srgb,var(--color-primary)_80%,var(--color-secondary))_100%)] px-4 py-4">
            <UserAvatar
              user={user}
              size={46}
              rounded="rounded-full"
              tone="soft"
              className="ring-2 ring-[color-mix(in_srgb,var(--color-white)_55%,transparent)]"
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[var(--color-white)]">
                {displayName}
              </p>
              {user.email ? (
                <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-white)_78%,transparent)]">
                  {user.email}
                </p>
              ) : null}
              {accountLabel ? (
                <span className="mt-1.5 inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_14%,transparent)] px-2 py-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-white)]">
                    {accountLabel}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {rows.length ? (
            <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3 py-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {dashCopy.profileFields[row.label] ?? row.label}
                  </p>
                  <p className="mt-0.5 break-words text-[12px] font-medium text-[var(--color-primary)]">
                    {/mobile|phone|মোবাইল|ফোন/i.test(row.label) ? formatBdMobile(row.value) : row.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {roles.length ? (
            <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {copy.roles}
              </span>
              {visibleRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]"
                >
                  {role}
                </span>
              ))}
              {hiddenRoles > 0 ? (
                <button
                  type="button"
                  onClick={() => setRolesOpen((value) => !value)}
                  aria-expanded={rolesOpen}
                  className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2 py-0.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                >
                  <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                    {rolesOpen ? dashCopy.lessRoles : dashCopy.moreRoles(hiddenRoles)}
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-1 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] p-2">
            <button
              type="button"
              role="menuitem"
              onClick={runThen(onEditProfile)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-primary)]">
                <FiEdit2 aria-hidden size={15} />
                {copy.editProfile}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={runThen(onChangePassword)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-primary)]">
                <FiLock aria-hidden size={15} />
                {profileCopy.menuPassword}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={runThen(onReload)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-primary)]">
                <span className={refreshing ? "animate-spin" : undefined}>
                  <FiRefreshCw aria-hidden size={15} />
                </span>
                {profileCopy.menuRefresh}
              </span>
            </button>

            <Link
              href="/"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[var(--color-primary)]">
                <FiHome aria-hidden size={15} />
                {copy.backToSite}
              </span>
            </Link>

            {/* Full-width language switch, directly above Sign out (item 15). */}
            <div className="px-2 pb-0.5 pt-1.5">
              <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {dashCopy.languageLabel}
              </p>
              <DashboardLanguageToggle variant="full" />
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={runThen(onSignOut)}
              disabled={signingOut}
              className="mt-1 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--color-action)] px-3 py-2.5 transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2.5 text-[13px] font-semibold text-[var(--color-white)]">
                <FiLogOut aria-hidden size={15} />
                {signingOut ? copy.signingOut : copy.signOut}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

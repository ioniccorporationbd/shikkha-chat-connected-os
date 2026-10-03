"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  FiClock,
  FiEdit2,
  FiHome,
  FiLock,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import ActivityList from "@/components/dashboard/ActivityList";
import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal";
import CheckInOutView from "@/components/dashboard/CheckInOutView";
import CreateCustomerView from "@/components/dashboard/CreateCustomerView";
import EditProfileModal from "@/components/dashboard/EditProfileModal";
import PanelCard from "@/components/dashboard/PanelCard";
import QuickLinks from "@/components/dashboard/QuickLinks";
import StatCard from "@/components/dashboard/StatCard";
import UserAvatar from "@/components/dashboard/UserAvatar";
import UserMenu from "@/components/dashboard/UserMenu";
import { postJson } from "@/lib/api/http";
import { authCopyFor } from "@/lib/auth/messages";
import { useDashboardQuery } from "@/lib/auth/queries";
import { CLIENT_DASHBOARD_PATH, LOGIN_PATH, STAFF_DASHBOARD_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type { DashboardPayload } from "@/lib/auth/types";
import { dashboardCopyFor, localizeStat } from "@/lib/dashboard/messages";
import { NAV_ICONS } from "@/lib/dashboard/icons";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

interface DashboardShellProps {
  initialData?: DashboardPayload;
  initialError?: string;
  /**
   * `staff` (default) is the desk panel at `/userDashboard`; `client` is the
   * customer-facing panel at `/clientDashboard`. The two differ only in the nav
   * they advertise and the subtitle they carry — every figure in the payload is
   * already scoped to the account by the ERP.
   */
  scope?: "staff" | "client";
}

/**
 * Only real, working navigation lives in the rail. The former placeholder
 * entries (analytics / reports / users / settings) pointed at static "coming
 * soon" cards and have been removed — the rail now advertises exactly what the
 * dashboard can actually do.
 */
const STAFF_NAV_KEYS = ["overview"] as const;
const CLIENT_NAV_KEYS = ["overview"] as const;

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW = "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

/** Profile rows already shown in the identity header of the account card. */
const SKIP_PROFILE_ROWS = new Set(["Full Name", "Email"]);
/** Roles shown before the "+N more" control appears. */
const MAX_ROLES = 3;

export default function DashboardShell({
  initialData,
  initialError,
  scope = "staff",
}: DashboardShellProps) {
  const { language } = useLanguage();
  const copy = dashboardCopyFor(language);
  const authCopy = authCopyFor(language).userMenu;

  const isClient = scope === "client";
  const navKeys = isClient ? CLIENT_NAV_KEYS : STAFF_NAV_KEYS;
  const subtitle = isClient ? copy.clientSubtitle : copy.subtitle;

  const router = useRouter();
  const pathname = usePathname();
  const resetSession = useAuthStore((state) => state.reset);
  const storeUser = useAuthStore((state) => state.user);

  const [signingOut, setSigningOut] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  // The active panel is driven by the URL, not local state: "Create Customer"
  // has its own route inside this shell, so the address bar reflects it and the
  // browser Back button works. The client scope has no such sub-route.
  const basePath = isClient ? CLIENT_DASHBOARD_PATH : STAFF_DASHBOARD_PATH;
  const createCustomerPath = `${basePath}/create-customer`;
  const checkinPath = `${basePath}/check-in-out`;
  const onCreateView = !isClient && pathname.startsWith(createCustomerPath);
  const onCheckinView = !isClient && pathname.startsWith(checkinPath);

  const { data, isFetching, isError, error, refetch } = useDashboardQuery(initialData);

  const user = data?.user ?? initialData?.user ?? storeUser ?? null;
  const loadError = data ? undefined : isError ? (error as Error)?.message || initialError : initialError;

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);

    try {
      await postJson("/api/auth/logout");
    } catch {
      // The portal cookie is cleared by the route regardless of the ERP answer.
    }

    resetSession();
    router.replace(LOGIN_PATH);
    router.refresh();
  }, [resetSession, router]);

  const handleReload = useCallback(async () => {
    try {
      const result = await refetch();
      if (result.error) toast.error(copy.reloadFailed);
      else toast.success(copy.reloadDone);
    } catch {
      toast.error(copy.reloadFailed);
    }
  }, [refetch, copy]);

  const displayName = user?.full_name || user?.name || "";
  const accountType = (user?.user_type ?? "").trim();
  const accountLabel = accountType
    ? accountType.toLowerCase() === "system user"
      ? authCopy.systemUser
      : authCopy.websiteUser
    : "";

  // The "Create Customer" rail link is visible to a System User only, on the
  // staff panel — a Website User (portal customer) never sees it.
  const isSystemUser = accountType.toLowerCase() === "system user" || Boolean(user?.is_admin);
  const showCreateCustomer = !isClient && isSystemUser;
  const showCheckin = !isClient && isSystemUser;

  const roles = user?.roles ?? [];
  const hiddenRoles = Math.max(0, roles.length - MAX_ROLES);
  const visibleRoles = rolesOpen ? roles : roles.slice(0, MAX_ROLES);

  const infoRows = (data?.profile ?? [])
    .filter((row) => !SKIP_PROFILE_ROWS.has(row.label))
    .slice(0, 4);

  const navButtonClass = (active: boolean) =>
    active
      ? "flex w-full items-center gap-3 rounded-2xl bg-[var(--color-primary)] px-3 py-2.5 text-left shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]"
      : "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] hover:text-[var(--color-primary)]";

  const navLabelClass = (active: boolean) =>
    `inline-flex items-center gap-3 text-[13px] ${active ? "font-semibold text-[var(--color-white)]" : "font-medium"}`;

  /** The rail nav, shared by the desktop sidebar and the mobile drawer. */
  const renderNav = () => {
    const items = navKeys.map((key) => {
      const Icon = NAV_ICONS[key];
      const active = !onCreateView && !onCheckinView;

      return (
        <button
          key={key}
          type="button"
          onClick={() => {
            router.push(basePath);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <Icon className="text-[16px]" />
            {copy.nav[key]}
          </span>
        </button>
      );
    });

    if (showCreateCustomer) {
      const CreateIcon = NAV_ICONS.customers;
      const active = onCreateView;

      items.push(
        <button
          key="create-customer"
          type="button"
          onClick={() => {
            router.push(createCustomerPath);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <CreateIcon className="text-[16px]" />
            {copy.nav.customers}
          </span>
        </button>
      );
    }

    if (showCheckin) {
      const CheckinIcon = NAV_ICONS.checkin;
      const active = onCheckinView;

      items.push(
        <button
          key="check-in-out"
          type="button"
          onClick={() => {
            router.push(checkinPath);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <CheckinIcon className="text-[16px]" />
            {copy.nav.checkin}
          </span>
        </button>
      );
    }

    return items;
  };

  /** Brand logo, shared by the desktop rail and the mobile drawer. */
  const renderLogo = (onClick?: () => void) => (
    <Link href="/" onClick={onClick} className="block w-full" aria-label={copy.backHome}>
      <span className="relative block h-11 w-[150px] transition duration-300 hover:scale-[1.02]">
        <Image
          src="/images/logo.png"
          alt="Shikkha Chat"
          fill
          priority
          sizes="150px"
          className="object-contain object-left"
        />
      </span>
    </Link>
  );

  /** The prominent "back to home" action (kept above the Overview nav). */
  const renderHomeAction = (onClick?: () => void) => (
    <Link
      href="/"
      onClick={onClick}
      className="group flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-3.5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-20px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] active:translate-y-0"
    >
      <FiHome aria-hidden size={16} className="shrink-0 text-[var(--color-white)]" />
      <span className="text-[13px] font-black tracking-[-0.01em] text-[var(--color-white)]">
        {copy.backHome}
      </span>
    </Link>
  );

  /**
   * The rail footer holds a single action — sign out. The language switch that
   * used to live here was a duplicate of the one in the account dropdown and
   * has been removed (the dropdown is the one place language is chosen).
   */
  const renderSidebarFooter = () => (
    <div className="mt-5 flex flex-col gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-5">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-white))] px-3 py-2.5 text-left transition hover:border-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_14%,var(--color-white))] disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-3 text-[13px] font-semibold text-[var(--color-danger-strong)]">
          <FiLogOut size={16} />
          {signingOut ? copy.signingOut : copy.signOut}
        </span>
      </button>
    </div>
  );

  return (
    <div
      data-no-translate="true"
      className="min-h-screen w-full bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[var(--color-primary)]"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col lg:flex-row lg:items-start lg:gap-6 lg:px-5 lg:py-6">
        {/* ---------------------------------------------------------- rail */}
        <aside
          className={`hidden w-[252px] shrink-0 self-start flex-col rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-4 ${CARD_SHADOW} lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain`}
        >
          {renderLogo()}

          <div className="mt-5">{renderHomeAction()}</div>

          <p className="mt-5 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
            {copy.navHeading}
          </p>

          <nav className="mt-2 flex flex-col gap-1.5">{renderNav()}</nav>

          {renderSidebarFooter()}
        </aside>

        {/* ------------------------------------------------- mobile drawer */}
        {navOpen ? (
          <div className="fixed inset-0 z-[120] lg:hidden" data-no-translate="true">
            <div
              aria-hidden
              onClick={() => setNavOpen(false)}
              className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 flex w-[276px] max-w-[82vw] flex-col overflow-y-auto rounded-r-[26px] border-r border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-4 shadow-[0_40px_90px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
              <div className="flex items-start justify-between gap-2">
                {renderLogo(() => setNavOpen(false))}

                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label={copy.closeMenu}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))]"
                >
                  <span className="text-[var(--color-primary)]">
                    <FiX size={16} />
                  </span>
                </button>
              </div>

              <div className="mt-5">{renderHomeAction(() => setNavOpen(false))}</div>

              <p className="mt-5 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                {copy.navHeading}
              </p>
              <nav className="mt-2 flex flex-col gap-1.5">{renderNav()}</nav>

              {renderSidebarFooter()}
            </div>
          </div>
        ) : null}

        {/* ---------------------------------------------------------- main */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5 lg:p-0">
          <header
            className={`flex items-center justify-between gap-3 rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] px-4 py-3 ${CARD_SHADOW} sm:px-5`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label={copy.openMenu}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))] lg:hidden"
              >
                <span className="text-[var(--color-primary)]">
                  <FiMenu size={16} />
                </span>
              </button>

              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">
                  {onCreateView ? copy.nav.customers : copy.nav.overview}
                </p>
                <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleReload}
                disabled={isFetching}
                aria-label={copy.refresh}
                title={copy.refresh}
                className="grid h-9 w-9 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] disabled:opacity-70"
              >
                <span className="text-[var(--color-primary)]">
                  <FiRefreshCw size={15} className={isFetching ? "animate-spin" : undefined} />
                </span>
              </button>

              {user ? (
                <UserMenu
                  user={user}
                  displayName={displayName}
                  profile={data?.profile}
                  signingOut={signingOut}
                  refreshing={isFetching}
                  onSignOut={handleSignOut}
                  onEditProfile={() => setEditOpen(true)}
                  onReload={handleReload}
                />
              ) : null}
            </div>
          </header>

          <main className="flex min-w-0 flex-col gap-4 pb-4">
            {onCreateView ? (
              <CreateCustomerView onBack={() => router.push(basePath)} />
            ) : onCheckinView ? (
              <CheckInOutView onBack={() => router.push(basePath)} />
            ) : (
              <>
            {/* Overview top profile section (item 1) */}
            <section
              className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}
            >
              <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))_0%,var(--color-white)_70%)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    user={user ?? { full_name: displayName, name: displayName }}
                    size={72}
                    rounded="rounded-3xl"
                    className="shadow-[0_16px_36px_-20px_color-mix(in_srgb,var(--color-primary)_75%,transparent)]"
                  />

                  <div className="min-w-0">
                    <h1 className="truncate text-[20px] font-semibold leading-tight sm:text-[23px]">
                      {displayName || copy.greetingFallback}
                    </h1>
                    {user?.name ? (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                        <span className="font-medium">@{user.name}</span>
                      </p>
                    ) : null}
                    {accountLabel ? (
                      <span className="mt-2 inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] px-2.5 py-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                          {accountLabel}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                      <FiEdit2 size={15} />
                      {authCopy.editProfile}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                  >
                    <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
                      <FiLock size={15} />
                      {authCopy.changePassword}
                    </span>
                  </button>
                </div>
              </div>

              {(infoRows.length || roles.length) ? (
                <div className="grid gap-4 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] p-5 sm:grid-cols-2 sm:p-6">
                  {infoRows.length ? (
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {infoRows.map((row) => (
                        <div key={row.label} className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                            {copy.profileFields[row.label] ?? row.label}
                          </dt>
                          <dd className="mt-0.5 break-words text-[13px] font-medium text-[var(--color-primary)]">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {roles.length ? (
                    <div className={infoRows.length ? "sm:border-l sm:border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] sm:pl-4" : ""}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.roleLabel}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {visibleRoles.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] px-2.5 py-1 text-[11px] font-medium text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
                          >
                            {role}
                          </span>
                        ))}
                        {hiddenRoles > 0 ? (
                          <button
                            type="button"
                            onClick={() => setRolesOpen((value) => !value)}
                            aria-expanded={rolesOpen}
                            className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                          >
                            <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                              {rolesOpen ? copy.lessRoles : copy.moreRoles(hiddenRoles)}
                            </span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            {showCheckin ? (
              <section
                className={`flex flex-col gap-3 rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:flex-row sm:items-center sm:justify-between sm:p-6`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]">
                    <FiClock size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold">{copy.nav.checkin}</h2>
                    <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.checkinCardHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(checkinPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5"
                >
                  <span className="text-[13px] font-semibold text-[var(--color-white)]">
                    {copy.openAction}
                  </span>
                </button>
              </section>
            ) : null}

            {loadError ? (
              <PanelCard title={copy.errorTitle} hint={loadError}>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:opacity-90"
                >
                  {copy.retry}
                </button>
              </PanelCard>
            ) : null}

            {!data && !loadError ? (
              <PanelCard title={copy.loadingTitle} hint={copy.loadingHint}>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="h-[132px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                    />
                  ))}
                </div>
              </PanelCard>
            ) : null}

            {data ? (
              <>
                <section className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                    <h2 className="text-[15px] font-semibold">{copy.metricsHeading}</h2>
                    <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.metricsHint}
                    </p>
                  </div>

                  {data.stats.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {data.stats.map((stat) => (
                        <StatCard
                          key={stat.key}
                          stat={localizeStat(stat, copy)}
                          scopeLabel={stat.scope === "site" ? copy.scopeSite : copy.scopePersonal}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.metricsHint}
                    </p>
                  )}
                </section>

                <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                  <PanelCard title={copy.activityHeading} hint={copy.activityHint}>
                    <ActivityList rows={data.activity} copy={copy} />
                  </PanelCard>

                  <div className="flex flex-col gap-4">
                    <PanelCard title={copy.profileHeading} hint={copy.profileHint}>
                      <dl className="flex flex-col gap-2.5">
                        {data.profile.map((row) => (
                          <div key={row.label} className="flex items-start justify-between gap-4">
                            <dt className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                              {copy.profileFields[row.label] ?? row.label}
                            </dt>
                            <dd className="max-w-[60%] break-words text-right text-[13px] font-medium">
                              {row.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </PanelCard>

                    <PanelCard title={copy.quickLinksHeading} hint={copy.quickLinksHint}>
                      <QuickLinks
                        links={data.quick_links}
                        labels={copy.links}
                        emptyLabel={copy.quickLinksEmpty}
                      />
                    </PanelCard>

                    <PanelCard title={copy.systemHeading}>
                      <dl className="flex flex-col gap-2.5">
                        {[
                          [copy.systemApi, data.system.api],
                          [copy.systemVersion, data.system.version],
                          [copy.systemServer, data.system.base_url],
                          [
                            copy.systemSession,
                            `${data.system.session_expiry_hours} ${copy.hoursSuffix}`,
                          ],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-start justify-between gap-4">
                            <dt className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                              {label}
                            </dt>
                            <dd className="max-w-[62%] break-all text-right text-[12px] font-medium">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </PanelCard>
                  </div>
                </div>
              </>
            ) : null}
              </>
            )}
          </main>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fallbackName={displayName}
        fallbackEmail={user?.email}
      />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

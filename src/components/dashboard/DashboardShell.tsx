"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  FiCamera,
  FiClock,
  FiDollarSign,
  FiEdit2,
  FiHome,
  FiLock,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiSmartphone,
  FiX,
} from "react-icons/fi";

import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal";
import CheckInOutView from "@/components/dashboard/CheckInOutView";
import CustomerRoutes from "@/components/dashboard/CustomerRoutes";
import HelpDeskDashboard, { type HelpDeskView } from "@/components/dashboard/help-desk/HelpDeskDashboard";
import EditProfileModal from "@/components/dashboard/EditProfileModal";
import ProfileImageMenu from "@/components/dashboard/ProfileImageMenu";
import LogoutConfirmModal from "@/components/dashboard/LogoutConfirmModal";
import ExpenseClaimView from "@/components/dashboard/ExpenseClaimView";
import LoginHistoryCard from "@/components/dashboard/LoginHistoryCard";
import NewExpenseClaimView from "@/components/dashboard/NewExpenseClaimView";
import PanelCard from "@/components/dashboard/PanelCard";
import PaymentEntryView from "@/components/dashboard/PaymentEntryView";
import PaymentSuccessView from "@/components/dashboard/payment/PaymentSuccessView";
import ServiceBuildView from "@/components/dashboard/ServiceBuildView";
import QuickLinks from "@/components/dashboard/QuickLinks";
import StatCard from "@/components/dashboard/StatCard";
import UserAvatar from "@/components/dashboard/UserAvatar";
import UserMenu from "@/components/dashboard/UserMenu";
import { postJson } from "@/lib/api/http";
import { authCopyFor } from "@/lib/auth/messages";
import { useDashboardQuery } from "@/lib/auth/queries";
import { CLIENT_DASHBOARD_PATH, LOGIN_PATH, PAYMENT_HISTORY_PATH, PAYMENT_SUCCESS_PATH, SERVICE_BUILD_PATH, STAFF_DASHBOARD_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type { DashboardPayload } from "@/lib/auth/types";
import { dashboardCopyFor, localizeStat } from "@/lib/dashboard/messages";
import { dashboardSnapshot } from "@/lib/dashboard/snapshot";
import { runSmartReload } from "@/lib/dashboard/smart-reload";
import { formatBdMobile } from "@/lib/format/mobile";
import { NAV_ICONS } from "@/lib/dashboard/icons";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";
import { HELP_DESK_SEGMENT } from "@/lib/help-desk/paths";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [imageIntent, setImageIntent] = useState<"change-photo" | "remove-photo" | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  // The active panel is driven by the URL, not local state: "Create Customer"
  // has its own route inside this shell, so the address bar reflects it and the
  // browser Back button works. The client scope has no such sub-route.
  const basePath = isClient ? CLIENT_DASHBOARD_PATH : STAFF_DASHBOARD_PATH;
  const createCustomerPath = `${basePath}/create-customer`;
  const checkinPath = `${basePath}/check-in-out`;
  const expenseClaimPath = `${basePath}/expense-claim`;
  const expenseClaimNewPath = `${expenseClaimPath}/new`;
  const onCreateView = !isClient && pathname.startsWith(createCustomerPath);
  const onCheckinView = !isClient && pathname.startsWith(checkinPath);
  const onExpenseClaimNewView = !isClient && pathname.startsWith(expenseClaimNewPath);
  const onExpenseClaimView =
    !isClient && pathname.startsWith(expenseClaimPath) && !onExpenseClaimNewView;
  // The client panel's own sub-route: the account's Payment Entry history.
  const onPaymentHistoryView = isClient && pathname.startsWith(PAYMENT_HISTORY_PATH);
  // The client panel's child route: the confirmation page for a just-created
  // Payment Entry (`/clientDashboard/payment-entry/success`). It renders inside
  // this shell, and `onPaymentHistoryView` stays true for it so the Payment
  // Entry rail item remains the active one.
  const onPaymentSuccessView = isClient && pathname.startsWith(PAYMENT_SUCCESS_PATH);
  // The client panel's own sub-route: the account's Service Build (Sales Invoice) history.
  const onServiceBuildView = isClient && pathname.startsWith(SERVICE_BUILD_PATH);
  // The help desk is a dashboard-internal module on BOTH panels — the same
  // shared component, mounted under each panel's own help-desk route.
  const helpDeskPath = `${basePath}/${HELP_DESK_SEGMENT}`;
  const onHelpDeskView = pathname.startsWith(helpDeskPath);
  const helpDeskSuffix = onHelpDeskView ? pathname.slice(helpDeskPath.length) : "";
  const onHelpDeskNew = helpDeskSuffix === "/new";
  const onHelpDeskTickets = helpDeskSuffix === "/tickets";
  const onHelpDeskDetail = helpDeskSuffix.startsWith("/tickets/");
  const helpDeskTicketId = onHelpDeskDetail
    ? decodeURIComponent(helpDeskSuffix.slice("/tickets/".length))
    : undefined;
  const helpDeskView: HelpDeskView = onHelpDeskNew
    ? "new"
    : onHelpDeskDetail
      ? "detail"
      : onHelpDeskTickets
        ? "tickets"
        : "overview";

  const viewTitle = onHelpDeskView
    ? copy.nav.helpDesk
    : onPaymentHistoryView
    ? copy.nav.paymentHistory
    : onServiceBuildView
      ? copy.nav.serviceBuild
      : onExpenseClaimNewView
      ? copy.nav.expenseClaim
      : onExpenseClaimView
        ? copy.nav.expenseClaim
        : onCheckinView
          ? copy.nav.checkin
          : onCreateView
            ? copy.nav.customers
            : copy.nav.overview;

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

  // Every Logout button opens the confirmation dialog first; only "Yes" runs the
  // real sign-out flow above (existing auth/session logic, unchanged). This is
  // the single confirmation modal shared by the sidebar rail and the dropdown.
  const requestSignOut = useCallback(() => setSignOutOpen(true), []);
  const confirmSignOut = useCallback(async () => {
    setSignOutOpen(false);
    await handleSignOut();
  }, [handleSignOut]);

  const handleReload = useCallback(async () => {
    // Smart reload (shared helper): snapshot → refetch → compare. Nothing
    // changed → a lightweight query refresh is enough; something changed → a
    // full browser reload so every panel resyncs. Runs once per click, so a
    // reload can never loop.
    await runSmartReload({
      before: data,
      refetch: async () => {
        const result = await refetch();
        return { data: result.data, error: result.error };
      },
      snapshot: dashboardSnapshot,
      copy: {
        unchanged: copy.reloadNoChanges,
        changed: copy.reloadChanged,
        failed: copy.reloadFailed,
      },
    });
  }, [refetch, copy, data]);

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
  const showExpenseClaim = !isClient && isSystemUser;

  const roles = user?.roles ?? [];
  // The Payment History link is a customer-panel feature: it appears only on the
  // client dashboard, and only for an account that is a customer (a Website User,
  // or one holding the Customer role). The staff panel never shows it, so there
  // is no duplicate link on the desk.
  const isWebsiteUser = accountType.toLowerCase() === "website user";
  const showPaymentHistory = isClient && (isWebsiteUser || roles.includes("Customer"));
  // The Service Build link is likewise a customer-panel feature: client scope,
  // customer accounts only, shown directly below Payment History.
  const showServiceBuild = isClient && (isWebsiteUser || roles.includes("Customer"));
  const hiddenRoles = Math.max(0, roles.length - MAX_ROLES);
  const visibleRoles = rolesOpen ? roles : roles.slice(0, MAX_ROLES);

  // Profile rows the ERP sends for the account (label → value).
  const profileRow = (label: string) =>
    (data?.profile ?? []).find((row) => row.label.toLowerCase() === label.toLowerCase())?.value ?? "";

  // The Overview shows the account's mobile in the local 01XXXXXXXXX form.
  const mobileRaw =
    (data?.profile ?? []).find((row) => /mobile|phone|মোবাইল|ফোন/i.test(row.label))?.value ?? "";
  const mobileNumber = formatBdMobile(mobileRaw);

  const username = user?.name ?? "";
  const emailValue = user?.email ?? "";

  // Only the meaningful, non-empty profile fields — never a blank row.
  const profileInfo = [
    { label: "Full Name", value: displayName },
    { label: "Username", value: username && username !== emailValue ? username : "" },
    { label: "Mobile", value: mobileNumber },
    { label: "Email", value: emailValue },
    { label: "Designation", value: user?.designation ?? profileRow("Designation") },
    { label: "Department", value: user?.department ?? profileRow("Department") },
    { label: "Location", value: profileRow("Location") },
    { label: "Time Zone", value: user?.time_zone ?? profileRow("Time Zone") },
    { label: "Language", value: user?.language ?? profileRow("Language") },
  ].filter((row) => String(row.value ?? "").trim() !== "");

  // Prefill the New Ticket form from the signed-in profile (name/email/mobile).
  const helpDeskContact = {
    name: displayName || undefined,
    email: user?.email || undefined,
    mobile:
      (data?.profile ?? []).find((row) => /mobile|phone|মোবাইল/i.test(row.label))?.value || undefined,
  };

  const navButtonClass = (active: boolean) =>
    active
      ? "flex w-full items-center gap-3 rounded-2xl bg-[var(--color-action)] px-3 py-2.5 text-left shadow-[0_12px_26px_-14px_color-mix(in_srgb,var(--color-action)_70%,transparent)]"
      : "group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]";

  const navLabelClass = (active: boolean) =>
    `inline-flex min-w-0 flex-1 items-center gap-3 text-[13px] leading-snug ${active ? "font-semibold text-[var(--color-white)]" : "font-medium"}`;

  /** The rail nav, shared by the desktop sidebar and the mobile drawer. */
  const renderNav = () => {
    const items = navKeys.map((key) => {
      const Icon = NAV_ICONS[key];
      const active = !onCreateView && !onCheckinView && !onExpenseClaimView && !onExpenseClaimNewView && !onPaymentHistoryView && !onServiceBuildView && !onHelpDeskView;

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
            <Icon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav[key]}</span>
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
            <CreateIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.customers}</span>
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
            <CheckinIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.checkin}</span>
          </span>
        </button>
      );
    }

    if (showExpenseClaim) {
      const ExpenseIcon = NAV_ICONS.expenseclaim;
      const active = onExpenseClaimView || onExpenseClaimNewView;

      items.push(
        <button
          key="expense-claim"
          type="button"
          onClick={() => {
            router.push(expenseClaimPath);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <ExpenseIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.expenseClaim}</span>
          </span>
        </button>
      );
    }

    if (showPaymentHistory) {
      const PaymentIcon = NAV_ICONS.paymenthistory;
      const active = onPaymentHistoryView;

      items.push(
        <button
          key="payment-history"
          type="button"
          onClick={() => {
            router.push(PAYMENT_HISTORY_PATH);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <PaymentIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.paymentHistory}</span>
          </span>
        </button>
      );
    }

    if (showServiceBuild) {
      const ServiceIcon = NAV_ICONS.servicebuild;
      const active = onServiceBuildView;

      items.push(
        <button
          key="service-build"
          type="button"
          onClick={() => {
            router.push(SERVICE_BUILD_PATH);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <ServiceIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.serviceBuild}</span>
          </span>
        </button>
      );
    }

    // --- Support -----------------------------------------------------------
    // The Help Desk is a dashboard-internal module on BOTH panels and for every
    // signed-in role (system user, employee, customer). It is real navigation —
    // the address bar changes and Back works — and it is "active" whenever a
    // help-desk screen is open, because those screens render inside this shell.
    items.push(
      <div
        key="help-desk-divider"
        aria-hidden
        className="my-1.5 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
      />
    );

    {
      const HelpDeskIcon = NAV_ICONS.helpdesk;
      const active = onHelpDeskView;

      items.push(
        <button
          key="help-desk"
          type="button"
          onClick={() => {
            router.push(helpDeskPath);
            setNavOpen(false);
          }}
          aria-current={active ? "page" : undefined}
          className={navButtonClass(active)}
        >
          <span className={navLabelClass(active)}>
            <HelpDeskIcon className="shrink-0 text-[16px]" />
            <span className="truncate">{copy.nav.helpDesk}</span>
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
      className="group flex items-center justify-center gap-2.5 rounded-2xl border border-[var(--color-action)] bg-[var(--color-action)] px-3.5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] hover:shadow-[0_22px_44px_-20px_color-mix(in_srgb,var(--color-action)_75%,transparent)] active:translate-y-0"
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
        onClick={requestSignOut}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--color-action)] px-3.5 py-2.5 transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
      >
        <span className="inline-flex items-center justify-center gap-2.5 text-[13px] font-semibold text-[var(--color-white)]">
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
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
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
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] lg:hidden"
              >
                <span className="text-[var(--color-primary)]">
                  <FiMenu size={16} />
                </span>
              </button>

              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">
                  {viewTitle}
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
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-action)] bg-[var(--color-action)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-70"
              >
                <span className="text-[var(--color-white)]">
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
                  onSignOut={requestSignOut}
                  onEditProfile={() => setEditOpen(true)}
                  onChangePassword={() => setPasswordOpen(true)}
                  onReload={handleReload}
                />
              ) : null}
            </div>
          </header>

          <main className="flex min-w-0 flex-col gap-4 pb-4">
            {onHelpDeskView ? (
              <HelpDeskDashboard
                view={helpDeskView}
                basePath={helpDeskPath}
                ticketId={helpDeskTicketId}
                copy={helpDeskCopyFor(language)}
                language={language}
                contact={helpDeskContact}
              />
            ) : onPaymentSuccessView ? (
              <PaymentSuccessView onBack={() => router.push(PAYMENT_HISTORY_PATH)} />
            ) : onPaymentHistoryView ? (
              <PaymentEntryView onBack={() => router.push(basePath)} />
            ) : onServiceBuildView ? (
              <ServiceBuildView onBack={() => router.push(basePath)} />
            ) : onCreateView ? (
              <CustomerRoutes path={createCustomerPath} onExit={() => router.push(basePath)} />
            ) : onCheckinView ? (
              <CheckInOutView onBack={() => router.push(basePath)} />
            ) : onExpenseClaimNewView ? (
              <NewExpenseClaimView onBack={() => router.push(expenseClaimPath)} />
            ) : onExpenseClaimView ? (
              <ExpenseClaimView
                onBack={() => router.push(basePath)}
                onNew={() => router.push(expenseClaimNewPath)}
              />
            ) : (
              <>
            {/* Overview — profile hero (item 1) */}
            <section
              className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}
            >
              <div className="flex flex-col gap-5 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))_0%,var(--color-white)_70%)] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setImageMenuOpen((value) => !value)}
                      aria-haspopup="menu"
                      aria-expanded={imageMenuOpen}
                      aria-label={copy.changePhoto}
                      className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_55%,transparent)]"
                    >
                      <UserAvatar
                        user={user ?? { full_name: displayName, name: displayName }}
                        size={112}
                        rounded="rounded-full"
                        sizeClass="h-24 w-24 sm:h-28 sm:w-28"
                        className="ring-4 ring-[var(--color-white)] shadow-[0_20px_44px_-22px_color-mix(in_srgb,var(--color-primary)_75%,transparent)]"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <span className="flex flex-col items-center gap-1 text-[var(--color-white)]">
                          <FiCamera size={22} />
                          <span className="text-[10.5px] font-semibold">{copy.changePhoto}</span>
                        </span>
                      </span>
                    </button>

                    <ProfileImageMenu
                      open={imageMenuOpen}
                      hasImage={Boolean((user?.user_image ?? "").trim())}
                      onChangePhoto={() => {
                        setImageMenuOpen(false);
                        setImageIntent("change-photo");
                        setEditOpen(true);
                      }}
                      onRemovePhoto={() => {
                        setImageMenuOpen(false);
                        setImageIntent("remove-photo");
                        setEditOpen(true);
                      }}
                      onClose={() => setImageMenuOpen(false)}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                      {copy.greeting}
                    </p>
                    <h1 className="mt-0.5 truncate text-[23px] font-bold leading-tight tracking-[-0.01em] sm:text-[27px]">
                      {displayName || copy.greetingFallback}
                    </h1>

                    <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 sm:justify-start">
                      {mobileNumber ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-2.5 py-1 text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
                          <FiSmartphone size={12} />
                          <span className="tabular-nums">{mobileNumber}</span>
                        </span>
                      ) : null}

                      {user?.name ? (
                        <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-2.5 py-1 text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_78%,transparent)]">
                          <span className="truncate font-medium">@{user.name}</span>
                        </span>
                      ) : null}

                      {accountLabel ? (
                        <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] px-2.5 py-1">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            {accountLabel}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:justify-start lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] disabled:opacity-60"
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

              {(profileInfo.length || roles.length) ? (
                <div className="grid gap-4 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] p-5 sm:grid-cols-2 sm:p-6">
                  {profileInfo.length ? (
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {profileInfo.map((row) => (
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
                    <div className={profileInfo.length ? "sm:border-l sm:border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] sm:pl-4" : ""}>
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
                            className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)]"
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
                    <h2 className="text-[15px] font-semibold"><span className="truncate">{copy.nav.checkin}</span></h2>
                    <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.checkinCardHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(checkinPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)]"
                >
                  <span className="text-[13px] font-semibold text-[var(--color-white)]">
                    {copy.openAction}
                  </span>
                </button>
              </section>
            ) : null}

            {showExpenseClaim ? (
              <section
                className={`flex flex-col gap-3 rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] p-5 ${CARD_SHADOW} sm:flex-row sm:items-center sm:justify-between sm:p-6`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]">
                    <FiDollarSign size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold"><span className="truncate">{copy.nav.expenseClaim}</span></h2>
                    <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.expenseClaimCardHint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(expenseClaimPath)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)]"
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
                  className="rounded-2xl bg-[var(--color-action)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
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
                  <PanelCard title={copy.loginHistoryHeading} hint={copy.loginHistoryHint}>
                    <LoginHistoryCard rows={data.activity} copy={copy} language={language} />
                  </PanelCard>

                  <div className="flex flex-col gap-4">
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
        onClose={() => {
          setEditOpen(false);
          setImageIntent(null);
        }}
        fallbackName={displayName}
        fallbackEmail={user?.email}
        intent={imageIntent}
        onIntentHandled={() => setImageIntent(null)}
      />
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <LogoutConfirmModal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={confirmSignOut}
        signingOut={signingOut}
        copy={{
          title: copy.logoutConfirmTitle,
          message: copy.logoutConfirmMessage,
          yes: copy.logoutConfirmYes,
          no: copy.logoutConfirmNo,
          signing: copy.logoutConfirmSigning,
        }}
      />
    </div>
  );
}

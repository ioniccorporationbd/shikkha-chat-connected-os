"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { FiBell, FiHome, FiLogOut, FiRefreshCw } from "react-icons/fi";

import ActivityList from "@/components/dashboard/ActivityList";
import PanelCard from "@/components/dashboard/PanelCard";
import QuickLinks from "@/components/dashboard/QuickLinks";
import StatCard from "@/components/dashboard/StatCard";
import { postJson } from "@/lib/api/http";
import { useDashboardQuery } from "@/lib/auth/queries";
import { LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type { DashboardPayload } from "@/lib/auth/types";
import { dashboardCopyFor, localizeStat } from "@/lib/dashboard/copy";
import { NAV_ICONS } from "@/lib/dashboard/icons";
import { useLanguage } from "@/lib/language";

interface DashboardShellProps {
  initialData?: DashboardPayload;
  initialError?: string;
}

const NAV_KEYS = ["overview", "analytics", "reports", "users", "settings"] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "?";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]";

export default function DashboardShell({ initialData, initialError }: DashboardShellProps) {
  const { language } = useLanguage();
  const copy = dashboardCopyFor(language);

  const router = useRouter();
  const resetSession = useAuthStore((state) => state.reset);
  const storeUser = useAuthStore((state) => state.user);

  const [signingOut, setSigningOut] = useState(false);

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

  const displayName = user?.full_name || user?.name || "";

  return (
    <div
      data-no-translate="true"
      className="min-h-screen w-full bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[var(--color-primary)]"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-0 lg:flex-row lg:gap-6 lg:px-5 lg:py-6">
        {/* ---------------------------------------------------------- rail */}
        <aside
          className={`hidden w-[252px] shrink-0 flex-col rounded-3xl border ${CARD_BORDER} bg-[var(--color-white)] p-4 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] lg:flex`}
        >
          <Link href="/" className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--color-primary)] text-[15px] font-semibold text-[var(--color-white)]">
              SC
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">Shikkha Chat</span>
              <span className="block truncate text-[11px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                {copy.brandSubtitle}
              </span>
            </span>
          </Link>

          <p className="mt-6 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
            {copy.navHeading}
          </p>

          <nav className="mt-2 flex flex-col gap-1.5">
            {NAV_KEYS.map((key, index) => {
              const Icon = NAV_ICONS[key];
              const active = index === 0;

              if (active) {
                return (
                  <span
                    key={key}
                    aria-current="page"
                    className="flex items-center gap-3 rounded-2xl bg-[var(--color-primary)] px-3 py-2.5 text-[13px] font-medium text-[var(--color-white)] shadow-[0_12px_26px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
                  >
                    <Icon className="text-[16px]" />
                    {copy.nav[key]}
                  </span>
                );
              }

              return (
                <span
                  key={key}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]"
                >
                  <Icon className="text-[16px]" />
                  <span className="flex-1">{copy.nav[key]}</span>
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide">
                    {copy.soon}
                  </span>
                </span>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))]"
            >
              <FiHome size={16} />
              <span className="text-[13px]">{copy.backToSite}</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-3 py-2.5 text-left transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] disabled:opacity-60"
            >
              <FiLogOut size={16} />
              <span className="text-[13px]">{signingOut ? copy.signingOut : copy.signOut}</span>
            </button>
          </div>
        </aside>

        {/* ---------------------------------------------------------- main */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5 lg:p-0">
          <header
            className={`flex items-center justify-between gap-3 rounded-3xl border ${CARD_BORDER} bg-[var(--color-white)] px-4 py-3 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] sm:px-5`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--color-primary)] text-[12px] font-semibold text-[var(--color-white)] lg:hidden">
                SC
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{copy.nav.overview}</p>
                <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                aria-label={copy.refresh}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))]"
              >
                <FiRefreshCw size={15} className={isFetching ? "animate-spin" : undefined} />
              </button>

              <span
                aria-hidden
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[15px]"
              >
                <FiBell />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b4453a]" />
              </span>

              {displayName ? (
                <span className="flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-2.5 py-1.5">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--color-primary)] text-[10px] font-semibold text-[var(--color-white)]">
                    {initials(displayName)}
                  </span>
                  <span className="hidden max-w-[150px] truncate text-[12.5px] font-medium sm:block">
                    {displayName}
                  </span>
                </span>
              ) : null}
            </div>
          </header>

          <main className="flex min-w-0 flex-col gap-4 pb-4">
            <section
              className={`rounded-3xl border ${CARD_BORDER} bg-[var(--color-white)] px-4 py-5 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] sm:px-6`}
            >
              <h1 className="text-[22px] font-semibold leading-tight sm:text-[26px]">
                {displayName ? `${copy.greeting}, ${displayName}` : copy.greetingFallback}
              </h1>
              <p className="mt-1.5 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                {copy.subtitle}
              </p>

              {user?.roles?.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {copy.roleLabel}
                  </span>
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

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
                    <p className="text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
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
                    <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
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
                            <dd className="max-w-[60%] break-words text-right text-[12.5px] font-medium">
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
          </main>
        </div>
      </div>
    </div>
  );
}

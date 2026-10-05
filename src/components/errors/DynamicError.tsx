"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiClock,
  FiCompass,
  FiCreditCard,
  FiGitMerge,
  FiHome,
  FiLogIn,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiServer,
  FiShieldOff,
  FiWifiOff,
} from "react-icons/fi";

import {
  resolveErrorConfig,
  type ErrorActionKey,
  type ErrorIconKey,
  type ErrorTone,
} from "@/lib/errors/status-config";
import { dashboardPathFor } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useOptionalLanguage } from "@/lib/i18n/LanguageProvider";

export type { LegacyErrorKind as ErrorKind } from "@/lib/errors/status-config";

const ICONS: Record<ErrorIconKey, ComponentType<{ size?: number }>> = {
  "alert-circle": FiAlertCircle,
  "log-in": FiLogIn,
  "credit-card": FiCreditCard,
  "shield-off": FiShieldOff,
  search: FiSearch,
  clock: FiClock,
  "git-merge": FiGitMerge,
  "rotate-ccw": FiRotateCcw,
  server: FiServer,
  "wifi-off": FiWifiOff,
};

/** Accent colour per tone — calm, never a full-bleed red page. */
const TONE_ACCENT: Record<ErrorTone, string> = {
  amber: "var(--color-warning)",
  danger: "var(--color-danger-strong)",
  info: "var(--color-primary)",
  neutral: "var(--color-primary)",
};

const ACTION_LABEL: Record<ErrorActionKey, { bn: string; en: string }> = {
  home: { bn: "হোমে ফিরে যান", en: "Back to home" },
  dashboard: { bn: "ড্যাশবোর্ডে ফিরুন", en: "Go to dashboard" },
  login: { bn: "লগ ইন করুন", en: "Sign in" },
  back: { bn: "ফিরে যান", en: "Go back" },
  retry: { bn: "আবার চেষ্টা করুন", en: "Try again" },
};

const ACTION_ICON: Record<ErrorActionKey, ComponentType<{ size?: number }>> = {
  home: FiHome,
  dashboard: FiCompass,
  login: FiLogIn,
  back: FiArrowLeft,
  retry: FiRefreshCw,
};

function dashboardHref(): string {
  try {
    const user = useAuthStore.getState().user;
    if (user) return dashboardPathFor(user);
  } catch {
    /* store unavailable (e.g. global-error) — fall through to home */
  }
  return "/";
}

export default function DynamicError({
  kind,
  status,
  errorCode,
  message,
  requestId,
  onRetry,
  showBack,
  showHome,
}: {
  /** Legacy shape kept for existing boundaries. Maps to a status. */
  kind?: "not-found" | "server" | "generic";
  /** HTTP status that selects copy, icon, tone and actions. */
  status?: number;
  /** Optional stable error/reference code (dev-detail only). */
  errorCode?: string;
  /** Localized override for the description line. */
  message?: string;
  /** Optional request id (dev-detail only). */
  requestId?: string;
  /** Retry handler — defaults to a full reload when omitted. */
  onRetry?: () => void;
  /** Force-add a "Go back" action. */
  showBack?: boolean;
  /** Force-add a "Back to home" action. */
  showHome?: boolean;
}) {
  const { language } = useOptionalLanguage();
  const lang = language === "en" ? "en" : "bn";
  const config = resolveErrorConfig({ status, kind });
  const copy = config.copy[lang];
  const Icon = ICONS[config.icon];
  const accent = TONE_ACCENT[config.tone];

  const retry = onRetry ?? (() => window.location.reload());

  const goBack = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  };

  // Ordered action list from config, then any forced extras (deduped).
  const keys: ErrorActionKey[] = [config.primary];
  if (config.secondary) keys.push(config.secondary);
  if (showBack && !keys.includes("back")) keys.push("back");
  if (showHome && !keys.includes("home")) keys.push("home");

  const renderAction = (key: ErrorActionKey, index: number) => {
    const A = ACTION_ICON[key];
    const label = ACTION_LABEL[key][lang];
    const primary = index === 0;

    if (key === "retry" || key === "back") {
      const onClick = key === "retry" ? retry : goBack;
      return (
        <button
          key={key}
          type="button"
          onClick={onClick}
          className={
            primary
              ? "inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5"
              : "inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] px-5 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
          }
        >
          <span
            className={
              primary
                ? "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]"
                : "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]"
            }
          >
            <A size={15} />
            {label}
          </span>
        </button>
      );
    }

    const href =
      key === "home" ? "/" : key === "login" ? "/login" : dashboardHref();
    return (
      <Link
        key={key}
        href={href}
        className={
          primary
            ? "inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5"
            : "inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] px-5 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
        }
      >
        <span
          className={
            primary
              ? "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]"
              : "inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]"
          }
        >
          <A size={15} />
          {label}
        </span>
      </Link>
    );
  };

  const isDev = process.env.NODE_ENV !== "production";
  const showTech = isDev && (!!status || !!errorCode || !!requestId);

  return (
    <div
      data-no-translate="true"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-4 py-16"
    >
      <div className="pointer-events-none absolute left-[12%] top-[14%] h-[260px] w-[260px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[12%] right-[10%] h-[300px] w-[300px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_55%,transparent)] blur-[110px]" />

      <div className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] p-8 text-center shadow-[0_40px_90px_-30px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] sm:p-10">
        <Image
          src="/images/logo.png"
          alt="Shikkha Chat"
          width={176}
          height={48}
          priority
          className="mx-auto h-10 w-auto object-contain"
        />

        <span
          aria-hidden
          className="mx-auto mt-7 grid h-16 w-16 place-items-center rounded-3xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${accent} 12%, var(--color-white))`,
            color: accent,
          }}
        >
          <Icon size={28} />
        </span>

        <p
          className="mt-5 text-[12px] font-black uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          {copy.code}
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[26px]">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_66%,transparent)]">
          {message ?? copy.description}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {keys.map(renderAction)}
        </div>

        {showTech ? (
          <p className="mt-6 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-4 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]">
            {typeof status === "number" ? `status: ${status}` : null}
            {errorCode ? `${typeof status === "number" ? " · " : ""}code: ${errorCode}` : null}
            {requestId ? `${typeof status === "number" || errorCode ? " · " : ""}req: ${requestId}` : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

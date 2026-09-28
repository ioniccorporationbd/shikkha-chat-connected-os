"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
} from "react-icons/fi";

import { ApiError, postJson } from "@/lib/api/http";
import { authCopyFor, authErrorMessage } from "@/lib/auth/messages";
import { registerCopyFor } from "@/lib/auth/register-messages";
import { preferredRedirect, REGISTER_PATH, safeRedirectPath } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type { LoginOtpStartPayload, SessionPayload } from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] py-3 pl-11 pr-4 text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]";

// This project's reset sets `font: inherit` on inputs, so the type size is
// carried by the wrapper and inherited by the field.
const FIELD_WRAPPER_CLASS = "relative block text-[14px]";

const ICON_CLASS =
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]";

const SUBMIT_CLASS =
  "group relative mt-1 inline-flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-primary)] px-4 py-3 shadow-[0_6px_16px_-10px_color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_18px_32px_-14px_color-mix(in_srgb,var(--color-primary)_72%,transparent)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none";

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Mode = "password" | "otp";

export default function LoginForm() {
  const { language } = useLanguage();
  const copy = authCopyFor(language);
  const registerCopy = registerCopyFor(language);

  const router = useRouter();
  const searchParams = useSearchParams();

  const setSession = useAuthStore((state) => state.setSession);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const nextPath = useMemo(
    () => safeRedirectPath(searchParams.get("next")),
    [searchParams]
  );
  const expired = searchParams.get("expired") === "1";

  const [mode, setMode] = useState<Mode>("password");

  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [reveal, setReveal] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [maskedTarget, setMaskedTarget] = useState("");
  const [delivery, setDelivery] = useState<{ sms: boolean; email: boolean } | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [ttl, setTtl] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: skip the form — and land on the dashboard this account's
  // role belongs on (`?next=` never decides that).
  useEffect(() => {
    if (status === "authenticated") router.replace(preferredRedirect(nextPath, user));
  }, [nextPath, router, status, user]);

  // Countdowns are client-only state started after mount, so the server and the
  // first client render always agree (no hydration mismatch).
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => setResendIn((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (ttl <= 0) return;
    const id = window.setInterval(() => setTtl((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [ttl]);

  function switchMode(next: Mode) {
    if (busy || next === mode) return;
    setMode(next);
    setError(null);
    setOtpSent(false);
    setOtp("");
    setDelivery(null);
  }

  function handleApiError(thrown: unknown) {
    const apiError = thrown as ApiError;
    const code = apiError?.code ?? "network_error";
    const message = apiError?.message ?? String(thrown);
    console.error(`[login] ${code}: ${message}`);
    setError(authErrorMessage(language, code, apiError?.message ?? ""));
    setBusy(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<SessionPayload>("/api/auth/login", {
        usr: usr.trim(),
        pwd,
      });

      setSession(payload?.user ?? null);

      // `busy` stays true on purpose: the button keeps its loading state until
      // the dashboard route takes over.
      router.replace(preferredRedirect(payload?.redirect_to ?? nextPath, payload?.user));
      router.refresh();
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  async function handleSendOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;

    const target = identifier.trim();
    if (!target) {
      setError(authErrorMessage(language, "validation_error", ""));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<LoginOtpStartPayload>("/api/auth/login/otp", {
        identifier: target,
        language,
      });

      setMaskedTarget(payload?.target ?? target);
      setDelivery(payload?.delivery ?? null);
      setResendIn(payload?.resend_after_seconds ?? 30);
      setTtl(payload?.expires_in_seconds ?? 0);
      setOtp("");
      setOtpSent(true);
      setBusy(false);
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<SessionPayload>("/api/auth/login/otp/verify", {
        identifier: identifier.trim(),
        otp: otp.trim(),
        language,
      });

      setSession(payload?.user ?? null);
      router.replace(preferredRedirect(payload?.redirect_to ?? nextPath, payload?.user));
      router.refresh();
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  const smsFailed = otpSent && delivery?.sms === false;
  const emailFailed = otpSent && delivery?.email === false;

  const tabs: { key: Mode; label: string }[] = [
    { key: "password", label: copy.modePassword },
    { key: "otp", label: copy.modeOtp },
  ];

  return (
    <section
      data-no-translate="true"
      className="relative z-10 w-full max-w-[460px] rounded-[28px] border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] p-6 shadow-[0_36px_80px_color-mix(in_srgb,var(--color-primary)_38%,transparent)] sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--color-primary)] text-[13px] font-semibold text-[var(--color-white)]">
          SC
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--color-primary)]">
            Shikkha Chat
          </p>
          <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.panelSubtitle}
          </p>
        </div>
      </div>

      <h1 className="mt-6 text-[21px] font-semibold leading-tight text-[var(--color-primary)]">
        {copy.panelTitle}
      </h1>

      {/* Password vs OTP sign-in. */}
      <div
        role="tablist"
        aria-label={copy.panelTitle}
        className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))] p-1"
      >
        {tabs.map((tab) => {
          const active = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchMode(tab.key)}
              disabled={busy}
              className={[
                "rounded-xl px-3 py-2 transition duration-200 disabled:cursor-not-allowed disabled:opacity-70",
                active
                  ? "bg-[var(--color-primary)] shadow-[0_6px_16px_-10px_color-mix(in_srgb,var(--color-primary)_72%,transparent)]"
                  : "bg-transparent hover:bg-[color-mix(in_srgb,var(--color-secondary)_34%,transparent)]",
              ].join(" ")}
            >
              <span
                className={[
                  "block text-[13px] font-semibold",
                  active ? "text-[var(--color-white)]" : "text-[var(--color-primary)]",
                ].join(" ")}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {expired ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
          <FiShield aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
          {copy.expiredNotice}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-danger-strong)]"
        >
          {error}
        </p>
      ) : null}

      {mode === "password" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.emailLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiMail aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]" />
              <input
                type="email"
                name="usr"
                autoComplete="username"
                required
                value={usr}
                onChange={(event) => setUsr(event.target.value)}
                placeholder={copy.emailPlaceholder}
                className={FIELD_CLASS}
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.passwordLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiLock aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]" />
              <input
                type={reveal ? "text" : "password"}
                name="pwd"
                autoComplete="current-password"
                required
                value={pwd}
                onChange={(event) => setPwd(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                className={`${FIELD_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setReveal((value) => !value)}
                aria-label={reveal ? copy.hidePassword : copy.showPassword}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_26%,var(--color-white))] hover:text-[var(--color-primary)]"
              >
                {reveal ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </span>
          </label>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_58%,var(--color-secondary)))] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 disabled:group-hover:opacity-0"
            />
            <span className="relative z-10 text-[14px] font-semibold text-[var(--color-white)]">
              {busy ? copy.submitting : copy.submit}
            </span>
          </button>
        </form>
      ) : otpSent ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerifyOtp} noValidate>
          <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
            <FiMail aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
            {copy.otpHint.replace("{target}", maskedTarget)}
          </p>

          {smsFailed ? (
            <p className="flex items-start gap-2 rounded-2xl border border-[#f0d18a] bg-[#fdf7e6] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
              <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
              {copy.smsNotSent}
            </p>
          ) : null}
          {emailFailed ? (
            <p className="flex items-start gap-2 rounded-2xl border border-[#f0d18a] bg-[#fdf7e6] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
              <FiAlertTriangle aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
              {copy.emailNotSent}
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.otpLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiKey aria-hidden className={ICON_CLASS} />
              <input
                type="text"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={copy.otpPlaceholder}
                className={`${FIELD_CLASS} tracking-[0.4em]`}
              />
            </span>
          </label>

          <div className="flex items-center justify-between text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            <span>{ttl > 0 ? copy.otpTtl.replace("{time}", formatClock(ttl)) : ""}</span>
            <button
              type="button"
              onClick={() => void handleSendOtp()}
              disabled={busy || resendIn > 0}
              className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline"
            >
              {resendIn > 0 ? copy.resendWait.replace("{s}", String(resendIn)) : copy.resend}
            </button>
          </div>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_58%,var(--color-secondary)))] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 disabled:group-hover:opacity-0"
            />
            <span className="relative z-10 text-[14px] font-semibold text-[var(--color-white)]">
              {busy ? copy.verifyingOtp : copy.verifyOtp}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.changeIdentifier}
          </button>
        </form>
      ) : (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendOtp} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.identifierLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiPhone aria-hidden className={ICON_CLASS} />
              <input
                type="text"
                name="identifier"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={copy.identifierPlaceholder}
                className={FIELD_CLASS}
              />
            </span>
          </label>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_58%,var(--color-secondary)))] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 disabled:group-hover:opacity-0"
            />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiShield aria-hidden size={15} />
              {busy ? copy.sendingOtp : copy.sendOtp}
            </span>
          </button>
        </form>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {copy.needHelp}
      </p>

      <p className="mt-4 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
        {registerCopy.newHere}{" "}
        <Link
          href={REGISTER_PATH}
          className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {registerCopy.button}
        </Link>
      </p>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
      >
        <FiArrowLeft aria-hidden />
        {copy.backHome}
      </Link>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
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

const SUBMIT_SHEEN =
  "pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_58%,var(--color-secondary)))] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 disabled:group-hover:opacity-0";

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Sign-in is a fixed three-step flow: give the email/mobile, then the password,
// then the one-time code that the password step sends to both channels.
type Step = "identifier" | "password" | "otp";

const STEP_ORDER: Step[] = ["identifier", "password", "otp"];

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

  const [step, setStep] = useState<Step>("identifier");

  const [identifier, setIdentifier] = useState("");
  const [pwd, setPwd] = useState("");
  const [reveal, setReveal] = useState(false);

  const [otp, setOtp] = useState("");
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

  function handleApiError(thrown: unknown) {
    const apiError = thrown as ApiError;
    const code = apiError?.code ?? "network_error";
    const message = apiError?.message ?? String(thrown);
    console.error(`[login] ${code}: ${message}`);
    setError(authErrorMessage(language, code, apiError?.message ?? ""));
    setBusy(false);
  }

  function handleIdentifier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    if (!identifier.trim()) {
      setError(authErrorMessage(language, "validation_error", ""));
      return;
    }

    setError(null);
    setStep("password");
  }

  function backToIdentifier() {
    setError(null);
    setStep("identifier");
  }

  function backToPassword() {
    setError(null);
    setOtp("");
    setDelivery(null);
    setResendIn(0);
    setTtl(0);
    setStep("password");
  }

  async function handleSendOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;

    if (!pwd) {
      setError(authErrorMessage(language, "validation_error", ""));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<LoginOtpStartPayload>("/api/auth/login/otp", {
        identifier: identifier.trim(),
        password: pwd,
        language,
      });

      setMaskedTarget(payload?.target ?? identifier.trim());
      setDelivery(payload?.delivery ?? null);
      setResendIn(payload?.resend_after_seconds ?? 30);
      setTtl(payload?.expires_in_seconds ?? 0);
      setOtp("");
      setStep("otp");
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

  const smsFailed = step === "otp" && delivery?.sms === false;
  const emailFailed = step === "otp" && delivery?.email === false;

  const stepIndex = STEP_ORDER.indexOf(step);
  const stepTitle =
    step === "identifier"
      ? copy.identifierStepTitle
      : step === "password"
        ? copy.passwordStepTitle
        : copy.otpStepTitle;
  const stepHint =
    step === "identifier"
      ? copy.identifierStepHint
      : step === "password"
        ? copy.passwordStepHint
        : null;

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
        {stepTitle}
      </h1>

      {/* Step indicator: email/mobile -> password -> OTP. */}
      <p className="mt-2 text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
        {copy.stepLabel.replace("{n}", String(stepIndex + 1))}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {STEP_ORDER.map((name, index) => (
          <span
            key={name}
            className={[
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index <= stepIndex
                ? "bg-[var(--color-primary)]"
                : "bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
            ].join(" ")}
          />
        ))}
      </div>

      {stepHint ? (
        <p className="mt-3 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {stepHint}
        </p>
      ) : null}

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

      {step === "identifier" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleIdentifier} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.identifierLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiUser aria-hidden className={ICON_CLASS} />
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
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              {copy.next}
              <FiArrowRight aria-hidden size={15} />
            </span>
          </button>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendOtp} noValidate>
          {/* Accessibility: a password form needs a username field inside the
              same form. The identifier is collected in the previous step, so
              mirror it here, visually hidden, to satisfy the browser's
              password-manager/autofill heuristics. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={identifier}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5">
            <span className="min-w-0 truncate text-[13px] text-[var(--color-primary)]">
              {identifier.trim()}
            </span>
            <button
              type="button"
              onClick={backToIdentifier}
              className="shrink-0 rounded-xl px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_34%,transparent)]"
            >
              <span className="text-[12px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
                {copy.backToIdentifier}
              </span>
            </button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.passwordLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiLock aria-hidden className={ICON_CLASS} />
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
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiShield aria-hidden size={15} />
              {busy ? copy.sendingOtp : copy.sendOtp}
            </span>
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
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
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 text-[14px] font-semibold text-[var(--color-white)]">
              {busy ? copy.verifyingOtp : copy.verifyOtp}
            </span>
          </button>

          <button
            type="button"
            onClick={backToPassword}
            className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.backToPassword}
          </button>
        </form>
      ) : null}

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

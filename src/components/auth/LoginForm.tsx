"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiHome,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
} from "react-icons/fi";

import AuthBrand from "@/components/auth/AuthBrand";
import AuthCard from "@/components/auth/AuthCard";
import OtpInput from "@/components/auth/OtpInput";
import { ApiError, postJson } from "@/lib/api/http";
import { authCopyFor, authErrorMessage } from "@/lib/auth/messages";
import { registerCopyFor } from "@/lib/auth/register-messages";
import { preferredRedirect, REGISTER_PATH, safeRedirectPath } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import {
  AUTH_HOME_BUTTON_CLASS,
  AUTH_HOME_INNER_CLASS,
  maskIdentity,
} from "@/lib/auth/ui";
import type {
  LoginOtpStartPayload,
  ResetDonePayload,
  ResetOtpStartPayload,
  SessionPayload,
} from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

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

// Sign-in is a two-step flow: one form holds email/mobile AND the password, then
// the one-time code the password step sends to both channels.
type LoginStep = "credentials" | "otp";
const LOGIN_STEPS: LoginStep[] = ["credentials", "otp"];

// Forgot password: email/mobile -> code -> the new password is on its way.
type ForgotStep = "identify" | "otp" | "done";

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

  const [view, setView] = useState<"login" | "forgot">("login");
  const [step, setStep] = useState<LoginStep>("credentials");

  const [identifier, setIdentifier] = useState("");
  const [pwd, setPwd] = useState("");
  const [reveal, setReveal] = useState(false);

  const [otp, setOtp] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [ttl, setTtl] = useState(0);

  // Forgot-password flow.
  const [forgotStep, setForgotStep] = useState<ForgotStep>("identify");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotTarget, setForgotTarget] = useState("");
  const [forgotChannel, setForgotChannel] = useState<"email" | "sms" | null>(null);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotResendIn, setForgotResendIn] = useState(0);
  const [forgotTtl, setForgotTtl] = useState(0);

  const [busy, setBusy] = useState(false);

  const expiredNotified = useRef(false);

  // Already signed in: skip the form — and land on the dashboard this account's
  // role belongs on (`?next=` never decides that).
  useEffect(() => {
    if (status === "authenticated") router.replace(preferredRedirect(nextPath, user));
  }, [nextPath, router, status, user]);

  // A just-expired session is context, not a field error — surface it once as an
  // info toast rather than a permanent inline banner.
  useEffect(() => {
    if (expired && !expiredNotified.current) {
      expiredNotified.current = true;
      toast.info(copy.expiredNotice);
    }
  }, [copy.expiredNotice, expired]);

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

  useEffect(() => {
    if (forgotResendIn <= 0) return;
    const id = window.setInterval(
      () => setForgotResendIn((value) => (value <= 1 ? 0 : value - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [forgotResendIn]);

  useEffect(() => {
    if (forgotTtl <= 0) return;
    const id = window.setInterval(() => setForgotTtl((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [forgotTtl]);

  function handleApiError(thrown: unknown) {
    const apiError = thrown as ApiError;
    const code = apiError?.code ?? "network_error";
    const message = apiError?.message ?? String(thrown);
    console.error(`[login] ${code}: ${message}`);
    toast.error(authErrorMessage(language, code, apiError?.message ?? ""));
    setBusy(false);
  }

  // The code goes to both channels at sign-in; whichever address the caller
  // typed is the one we name back to them (masked, never the raw value).
  const typedEmail = identifier.includes("@");
  const loginTarget = typedEmail
    ? maskedEmail || maskedTarget || maskIdentity(identifier)
    : maskedMobile || maskedTarget || maskIdentity(identifier);

  async function sendLoginOtp() {
    if (busy) return;

    if (!identifier.trim() || !pwd) {
      toast.warning(authErrorMessage(language, "validation_error", ""));
      return;
    }

    setBusy(true);

    try {
      const payload = await postJson<LoginOtpStartPayload>("/api/auth/login/otp", {
        identifier: identifier.trim(),
        password: pwd,
        language,
      });

      setMaskedTarget(payload?.target ?? maskIdentity(identifier));
      setMaskedEmail(payload?.email ?? "");
      setMaskedMobile(payload?.mobile ?? "");
      setResendIn(payload?.resend_after_seconds ?? 30);
      setTtl(payload?.expires_in_seconds ?? 0);
      setOtp("");
      setStep("otp");
      setBusy(false);
      // Do not claim a blanket "sent" when the channel the caller is waiting on
      // failed - name the real per-channel outcome instead.
      const smsFailed = payload?.delivery?.sms === false;
      const emailFailed = payload?.delivery?.email === false;
      const primaryFailed = typedEmail ? emailFailed : smsFailed;
      if (!primaryFailed) toast.success(copy.otpSentNotice);
      if (smsFailed) toast.warning(copy.smsNotSent);
      if (emailFailed) toast.warning(copy.emailNotSent);
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  function handleCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendLoginOtp();
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);

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

  function backToCredentials() {
    setOtp("");
    setResendIn(0);
    setTtl(0);
    setStep("credentials");
  }

  function openForgot() {
    setForgotIdentifier(identifier.trim());
    setForgotOtp("");
    setForgotTarget("");
    setForgotChannel(null);
    setForgotResendIn(0);
    setForgotTtl(0);
    setForgotStep("identify");
    setView("forgot");
  }

  function backToLoginForm() {
    setView("login");
    setStep("credentials");
  }

  async function sendForgotOtp() {
    if (busy) return;

    if (!forgotIdentifier.trim()) {
      toast.warning(authErrorMessage(language, "validation_error", ""));
      return;
    }

    setBusy(true);

    try {
      const payload = await postJson<ResetOtpStartPayload>("/api/auth/forgot/otp", {
        identifier: forgotIdentifier.trim(),
        language,
      });

      setForgotTarget(payload?.target ?? maskIdentity(forgotIdentifier));
      setForgotChannel(payload?.channel ?? null);
      setForgotResendIn(payload?.resend_after_seconds ?? 30);
      setForgotTtl(payload?.expires_in_seconds ?? 0);
      setForgotOtp("");
      setForgotStep("otp");
      setBusy(false);
      toast.success(copy.otpSentNotice);
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  function handleForgotSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendForgotOtp();
  }

  async function handleForgotVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);

    try {
      const payload = await postJson<ResetDonePayload>("/api/auth/forgot/otp/verify", {
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        language,
      });

      setForgotTarget(payload?.target ?? forgotTarget);
      setForgotChannel(payload?.channel ?? forgotChannel);
      setForgotStep("done");
      setBusy(false);
      toast.success(copy.forgotSuccessTitle);
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  function returnToLogin() {
    setView("login");
    setStep("credentials");
    setPwd("");
    setOtp("");
    setResendIn(0);
    setTtl(0);
    setForgotStep("identify");
    setForgotOtp("");
    toast.success(copy.resetNotice);
  }

  const isLogin = view === "login";

  const stepIndex = isLogin
    ? LOGIN_STEPS.indexOf(step)
    : forgotStep === "identify"
      ? 0
      : 1;
  const showDots = isLogin || forgotStep !== "done";

  const title = isLogin
    ? step === "credentials"
      ? copy.identifierStepTitle
      : copy.otpStepTitle
    : forgotStep === "identify"
      ? copy.forgotTitle
      : forgotStep === "otp"
        ? copy.forgotOtpTitle
        : copy.forgotSuccessTitle;

  const hint = isLogin
    ? step === "credentials"
      ? copy.identifierStepHint
      : null
    : forgotStep === "identify"
      ? copy.forgotHint
      : null;

  const loginOtpHint = (typedEmail ? copy.otpHintEmail : copy.otpHintMobile).replace(
    "{target}",
    loginTarget
  );
  const forgotOtpHint = (
    forgotChannel === "email" ? copy.forgotOtpHintEmail : copy.forgotOtpHintMobile
  ).replace("{target}", forgotTarget);
  const forgotDoneBody = (
    forgotChannel === "email" ? copy.forgotSuccessBodyEmail : copy.forgotSuccessBodyMobile
  ).replace("{target}", forgotTarget);

  return (
    <AuthCard>
      <AuthBrand subtitle={copy.panelSubtitle} />

      <h1 className="mt-6 text-center text-[21px] font-semibold leading-tight text-[var(--color-primary)]">
        {title}
      </h1>

      {/* Step indicator: sign-in is email/mobile+password -> OTP; reset is
          email/mobile -> OTP. The success screen has no step. */}
      {showDots ? (
        <>
          <p className="mt-2 text-center text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
            {copy.stepLabel.replace("{n}", String(stepIndex + 1))}
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {[0, 1].map((index) => (
              <span
                key={index}
                className={[
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  index <= stepIndex
                    ? "bg-[var(--color-primary)]"
                    : "bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      ) : null}

      {hint ? (
        <p className="mt-3 text-center text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {hint}
        </p>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Sign in: one form (email/mobile + password) -> OTP               */}
      {/* ---------------------------------------------------------------- */}
      {isLogin && step === "credentials" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleCredentials} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.identifierLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiUser aria-hidden className={ICON_CLASS} />
              <input
                type="text"
                name="username"
                autoComplete="username"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={copy.identifierPlaceholder}
                className={FIELD_CLASS}
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.passwordLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiLock aria-hidden className={ICON_CLASS} />
              <input
                type={reveal ? "text" : "password"}
                name="password"
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

          <div className="-mt-1 flex justify-end">
            <button
              type="button"
              onClick={openForgot}
              className="rounded-xl px-1.5 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)]"
            >
              <span className="text-[12px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
                {copy.forgotPassword}
              </span>
            </button>
          </div>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiShield aria-hidden size={15} />
              {busy ? copy.sendingOtp : copy.sendOtp}
            </span>
          </button>
        </form>
      ) : null}

      {isLogin && step === "otp" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerifyOtp} noValidate>
          <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
            <FiMail aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
            {loginOtpHint}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.otpLabel}
            </span>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={busy}
              loading={busy}
              ariaLabelPrefix={copy.otpLabel}
            />
          </div>

          <div className="flex items-center justify-between text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            <span>{ttl > 0 ? copy.otpTtl.replace("{time}", formatClock(ttl)) : ""}</span>
            <button
              type="button"
              onClick={() => void sendLoginOtp()}
              disabled={busy || resendIn > 0}
              className="rounded-lg px-1.5 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <span className="text-[12px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline disabled:no-underline">
                {resendIn > 0 ? copy.resendWait.replace("{s}", String(resendIn)) : copy.resend}
              </span>
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
            onClick={backToCredentials}
            className="inline-flex items-center justify-center gap-2 rounded-xl py-1 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 transition hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.backToIdentifier}
          </button>
        </form>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Forgot password: email/mobile -> OTP -> new password sent         */}
      {/* ---------------------------------------------------------------- */}
      {!isLogin && forgotStep === "identify" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleForgotSend} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.forgotIdentifierLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiUser aria-hidden className={ICON_CLASS} />
              <input
                type="text"
                name="identifier"
                autoComplete="username"
                required
                value={forgotIdentifier}
                onChange={(event) => setForgotIdentifier(event.target.value)}
                placeholder={copy.forgotIdentifierPlaceholder}
                className={FIELD_CLASS}
              />
            </span>
          </label>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiMail aria-hidden size={15} />
              {busy ? copy.forgotSending : copy.forgotSend}
            </span>
          </button>

          <button
            type="button"
            onClick={backToLoginForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl py-1 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 transition hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.forgotBackToLogin}
          </button>
        </form>
      ) : null}

      {!isLogin && forgotStep === "otp" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleForgotVerify} noValidate>
          <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
            <FiMail aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
            {forgotOtpHint}
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.otpLabel}
            </span>
            <OtpInput
              value={forgotOtp}
              onChange={setForgotOtp}
              disabled={busy}
              loading={busy}
              ariaLabelPrefix={copy.otpLabel}
            />
          </div>

          <div className="flex items-center justify-between text-[12px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
            <span>{forgotTtl > 0 ? copy.otpTtl.replace("{time}", formatClock(forgotTtl)) : ""}</span>
            <button
              type="button"
              onClick={() => void sendForgotOtp()}
              disabled={busy || forgotResendIn > 0}
              className="rounded-lg px-1.5 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <span className="text-[12px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline disabled:no-underline">
                {forgotResendIn > 0
                  ? copy.forgotResendWait.replace("{s}", String(forgotResendIn))
                  : copy.forgotResend}
              </span>
            </button>
          </div>

          <button type="submit" disabled={busy} className={SUBMIT_CLASS}>
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 text-[14px] font-semibold text-[var(--color-white)]">
              {busy ? copy.forgotVerifying : copy.forgotVerify}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setForgotOtp("");
              setForgotStep("identify");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl py-1 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 transition hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.forgotChangeIdentifier}
          </button>
        </form>
      ) : null}

      {!isLogin && forgotStep === "done" ? (
        <div className="mt-5 flex flex-col gap-4">
          <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--color-primary)]">
            <FiCheckCircle aria-hidden className="mt-0.5 shrink-0 text-[15px]" />
            {forgotDoneBody}
          </p>

          <button type="button" onClick={returnToLogin} className={SUBMIT_CLASS}>
            <span aria-hidden className={SUBMIT_SHEEN} />
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiArrowRight aria-hidden size={15} />
              {copy.forgotReturnToLogin}
            </span>
          </button>
        </div>
      ) : null}

      <p className="mt-4 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {copy.needHelp}
      </p>

      {isLogin ? (
        <p className="mt-4 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {registerCopy.newHere}{" "}
          <Link
            href={REGISTER_PATH}
            className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {registerCopy.button}
          </Link>
        </p>
      ) : null}

      <Link href="/" className={AUTH_HOME_BUTTON_CLASS}>
        <span className={AUTH_HOME_INNER_CLASS}>
          <FiHome aria-hidden size={15} />
          {copy.backHome}
        </span>
      </Link>
    </AuthCard>
  );
}

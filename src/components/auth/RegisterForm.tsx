"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { ApiError, getJson, postJson } from "@/lib/api/http";
import {
  registerCopyFor,
  registerErrorMessage,
  registerStepLabel,
} from "@/lib/auth/register-messages";
import { dashboardPathFor, LOGIN_PATH, preferredRedirect } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type {
  RegisterAvailabilityPayload,
  RegisterResultPayload,
  RegisterStartPayload,
} from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] py-3 pl-11 pr-4 text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]";

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

type Step = "details" | "otp";

export default function RegisterForm() {
  const { language } = useLanguage();
  const copy = registerCopyFor(language);

  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<Step>("details");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);

  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [delivery, setDelivery] = useState<{ sms: boolean; email: boolean } | null>(null);

  const [resendIn, setResendIn] = useState(0);
  const [ttl, setTtl] = useState(0);

  const [emailHint, setEmailHint] = useState<null | { ok: boolean; text: string }>(null);
  const [mobileHint, setMobileHint] = useState<null | { ok: boolean; text: string }>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputRef = useRef<HTMLInputElement | null>(null);

  // Already signed in: no reason to stay on the sign-up form.
  useEffect(() => {
    if (status === "authenticated" && user) router.replace(dashboardPathFor(user));
  }, [router, status, user]);

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

  const otpTarget = useMemo(() => {
    const parts = [];
    if (delivery?.email) parts.push(maskedEmail);
    if (delivery?.sms) parts.push(maskedMobile);
    return (parts.length ? parts : [maskedEmail || maskedMobile]).filter(Boolean).join(" · ");
  }, [delivery, maskedEmail, maskedMobile]);

  const checkAvailability = useCallback(
    async (field: "email" | "mobile", value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        if (field === "email") setEmailHint(null);
        else setMobileHint(null);
        return;
      }

      try {
        const query = new URLSearchParams({ [field]: trimmed });
        const result = await getJson<RegisterAvailabilityPayload>(
          `/api/auth/register/availability?${query.toString()}`
        );
        const available = field === "email" ? result.email_available : result.mobile_available;
        const hint = {
          ok: available,
          text: available ? "" : field === "email" ? copy.emailTaken : copy.mobileTaken,
        };
        if (field === "email") setEmailHint(hint);
        else setMobileHint(hint);
      } catch (thrown) {
        // A failed probe is not an error the user must act on - submit still
        // enforces uniqueness server-side. But log *why* it failed so the
        // console names the cause (e.g. code=upstream_error / not_configured)
        // instead of leaving only a bare 502 from axios.
        const apiError = thrown as ApiError;
        console.error(
          `[register] availability probe failed (${field}=${trimmed}): ` +
            `status=${apiError?.status ?? "?"} code=${apiError?.code ?? "network_error"} ` +
            `message=${apiError?.message ?? String(thrown)}`
        );
        if (field === "email") setEmailHint(null);
        else setMobileHint(null);
      }
    },
    [copy.emailTaken, copy.mobileTaken]
  );

  function handleApiError(thrown: unknown) {
    const apiError = thrown as ApiError;
    const code = apiError?.code ?? "network_error";
    const message = apiError?.message ?? String(thrown);

    // Name the real cause in the console (code + portal/ERP message) so the
    // only trace of a failure is not the generic axios line.
    console.error(`[register] ${code}: ${message}`);

    setError(registerErrorMessage(language, code, apiError?.message ?? ""));
    setBusy(false);
  }

  async function handleSendOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<RegisterStartPayload>("/api/auth/register", {
        full_name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        language,
      });

      setMaskedEmail(payload?.email ?? "");
      setMaskedMobile(payload?.mobile ?? "");
      setDelivery(payload?.delivery ?? null);
      setResendIn(payload?.resend_after_seconds ?? 30);
      setTtl(payload?.expires_in_seconds ?? 0);
      setOtp("");
      setStep("otp");
      setBusy(false);

      // Focus the code field once the OTP screen paints.
      window.setTimeout(() => otpInputRef.current?.focus(), 50);
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const payload = await postJson<RegisterResultPayload>("/api/auth/register/verify", {
        full_name: fullName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        otp: otp.trim(),
        language,
      });

      setSession(payload?.user ?? null);
      router.replace(preferredRedirect(payload?.redirect_to, payload?.user));
      router.refresh();
    } catch (thrown) {
      handleApiError(thrown);
    }
  }

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
        {step === "details" ? copy.panelTitle : copy.otpTitle}
      </h1>
      <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
        {registerStepLabel(language, step === "details" ? 1 : 2)}
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-danger-strong)]"
        >
          {error}
        </p>
      ) : null}

      {step === "details" ? (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSendOtp} noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.nameLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiUser aria-hidden className={ICON_CLASS} />
              <input
                type="text"
                name="full_name"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={copy.namePlaceholder}
                className={FIELD_CLASS}
              />
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.emailLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiMail aria-hidden className={ICON_CLASS} />
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailHint(null);
                }}
                onBlur={() => void checkAvailability("email", email)}
                placeholder={copy.emailPlaceholder}
                className={FIELD_CLASS}
              />
            </span>
            {emailHint && !emailHint.ok ? (
              <span className="text-[12px] font-medium text-[var(--color-danger-strong)]">
                {emailHint.text}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.mobileLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiPhone aria-hidden className={ICON_CLASS} />
              <input
                type="tel"
                name="mobile"
                autoComplete="tel"
                required
                inputMode="tel"
                value={mobile}
                onChange={(event) => {
                  setMobile(event.target.value);
                  setMobileHint(null);
                }}
                onBlur={() => void checkAvailability("mobile", mobile)}
                placeholder={copy.mobilePlaceholder}
                className={FIELD_CLASS}
              />
            </span>
            {mobileHint && !mobileHint.ok ? (
              <span className="text-[12px] font-medium text-[var(--color-danger-strong)]">
                {mobileHint.text}
              </span>
            ) : null}
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiShield aria-hidden size={15} />
              {busy ? copy.sendingOtp : copy.sendOtp}
            </span>
          </button>
        </form>
      ) : (
        <form className="mt-5 flex flex-col gap-4" onSubmit={handleVerify} noValidate>
          <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)]">
            <FiMail aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
            {copy.otpHint.replace("{target}", otpTarget)}
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-primary)]">
              {copy.otpLabel}
            </span>
            <span className={FIELD_WRAPPER_CLASS}>
              <FiKey aria-hidden className={ICON_CLASS} />
              <input
                ref={otpInputRef}
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
            <span className="relative z-10 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
              <FiCheck aria-hidden size={16} />
              {busy ? copy.verifying : copy.verify}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("details");
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
          >
            <FiArrowLeft aria-hidden />
            {copy.changeDetails}
          </button>
        </form>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {copy.haveAccount}{" "}
        <Link href={LOGIN_PATH} className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
          {copy.signIn}
        </Link>
      </p>

      <Link
        href="/"
        className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
      >
        <FiArrowLeft aria-hidden />
        {copy.backHome}
      </Link>
    </section>
  );
}

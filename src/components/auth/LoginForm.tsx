"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";

import { ApiError, postJson } from "@/lib/api/http";
import { authCopyFor, authErrorMessage } from "@/lib/auth/messages";
import { safeRedirectPath } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import type { SessionPayload } from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] py-3 pl-11 pr-4 text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]";

// This project's reset sets `font: inherit` on inputs, so the type size is
// carried by the wrapper and inherited by the field.
const FIELD_WRAPPER_CLASS = "relative block text-[14px]";

export default function LoginForm() {
  const { language } = useLanguage();
  const copy = authCopyFor(language);

  const router = useRouter();
  const searchParams = useSearchParams();

  const setSession = useAuthStore((state) => state.setSession);
  const status = useAuthStore((state) => state.status);

  const nextPath = useMemo(
    () => safeRedirectPath(searchParams.get("next")),
    [searchParams]
  );
  const expired = searchParams.get("expired") === "1";

  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in: skip the form.
  useEffect(() => {
    if (status === "authenticated") router.replace(nextPath);
  }, [nextPath, router, status]);

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
      router.replace(safeRedirectPath(payload?.redirect_to ?? nextPath));
      router.refresh();
    } catch (thrown) {
      const apiError = thrown as ApiError;
      setError(
        authErrorMessage(language, apiError?.code ?? "network_error", apiError?.message ?? "")
      );
      setBusy(false);
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
          <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.panelSubtitle}
          </p>
        </div>
      </div>

      <h1 className="mt-6 text-[21px] font-semibold leading-tight text-[var(--color-primary)]">
        {copy.panelTitle}
      </h1>

      {expired ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))] px-3.5 py-2.5 text-[12.5px] text-[var(--color-primary)]">
          <FiShield aria-hidden className="mt-0.5 shrink-0 text-[14px]" />
          {copy.expiredNotice}
        </p>
      ) : null}

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-[var(--color-primary)]">
            {copy.emailLabel}
          </span>
          <span className={FIELD_WRAPPER_CLASS}>
            <FiMail
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
            />
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
          <span className="text-[12.5px] font-medium text-[var(--color-primary)]">
            {copy.passwordLabel}
          </span>
          <span className={FIELD_WRAPPER_CLASS}>
            <FiLock
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
            />
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

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border border-[#b4453a33] bg-[#b4453a14] px-3.5 py-2.5 text-[12.5px] font-medium text-[#8f3329]"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="group relative mt-1 inline-flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-primary)] px-4 py-3 shadow-[0_6px_16px_-10px_color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_18px_32px_-14px_color-mix(in_srgb,var(--color-primary)_72%,transparent)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {/* Same hover colour change as the sidebar sign-in pill. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_58%,var(--color-secondary)))] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 disabled:group-hover:opacity-0"
          />
          <span className="relative z-10 text-[14px] font-semibold text-[var(--color-white)]">
            {busy ? copy.submitting : copy.submit}
          </span>
        </button>
      </form>

      <p className="mt-4 text-[11.5px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_56%,transparent)]">
        {copy.needHelp}
      </p>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
      >
        <FiArrowLeft aria-hidden />
        {copy.backHome}
      </Link>
    </section>
  );
}

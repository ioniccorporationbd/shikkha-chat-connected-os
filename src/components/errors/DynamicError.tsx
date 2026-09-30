"use client";

import Image from "next/image";
import Link from "next/link";
import { FiAlertTriangle, FiCompass, FiHome, FiRefreshCw } from "react-icons/fi";

import { useOptionalLanguage } from "@/lib/i18n/LanguageProvider";

export type ErrorKind = "not-found" | "server" | "generic";

type Copy = {
  code: string;
  title: string;
  description: string;
  home: string;
  retry: string;
};

/**
 * One reusable error surface for every situation — 404, 500 and anything else.
 * `kind` swaps the copy/icon; the layout, branding and actions stay identical so
 * we never copy-paste separate 404/500 pages. No stack traces are ever shown.
 */
const COPY: Record<"bn" | "en", Record<ErrorKind, Copy>> = {
  bn: {
    "not-found": {
      code: "404",
      title: "পেজটি খুঁজে পাওয়া যায়নি",
      description:
        "আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে। আপনি হোমপেজে ফিরে যেতে পারেন।",
      home: "হোমে ফিরে যান",
      retry: "আবার চেষ্টা করুন",
    },
    server: {
      code: "500",
      title: "সার্ভারে সাময়িক সমস্যা হয়েছে",
      description:
        "কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন — সমস্যা থাকলে একটু পরে আবার আসুন।",
      home: "হোমে ফিরে যান",
      retry: "আবার চেষ্টা করুন",
    },
    generic: {
      code: "!",
      title: "কিছু একটা ভুল হয়েছে",
      description: "এই মুহূর্তে অনুরোধটি সম্পন্ন করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।",
      home: "হোমে ফিরে যান",
      retry: "আবার চেষ্টা করুন",
    },
  },
  en: {
    "not-found": {
      code: "404",
      title: "Page not found",
      description:
        "The page you are looking for doesn’t exist or has been moved. You can head back home.",
      home: "Back to home",
      retry: "Try again",
    },
    server: {
      code: "500",
      title: "Something went wrong on our side",
      description:
        "An unexpected error occurred. Please try again — if it persists, come back in a little while.",
      home: "Back to home",
      retry: "Try again",
    },
    generic: {
      code: "!",
      title: "Something went wrong",
      description: "We couldn’t complete that request right now. Please try again.",
      home: "Back to home",
      retry: "Try again",
    },
  },
};

export default function DynamicError({
  kind,
  onRetry,
}: {
  kind: ErrorKind;
  onRetry?: () => void;
}) {
  const { language } = useOptionalLanguage();
  const copy = COPY[language === "en" ? "en" : "bn"][kind];
  const Icon = kind === "not-found" ? FiCompass : FiAlertTriangle;

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
          className="mx-auto mt-7 grid h-16 w-16 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]"
        >
          <Icon size={28} />
        </span>

        <p className="mt-5 text-[12px] font-black uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
          {copy.code}
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold leading-tight text-[var(--color-primary)] sm:text-[26px]">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_66%,transparent)]">
          {copy.description}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-primary)] px-5 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
                <FiRefreshCw size={15} />
                {copy.retry}
              </span>
            </button>
          ) : null}

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
              <FiHome size={15} />
              {copy.home}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

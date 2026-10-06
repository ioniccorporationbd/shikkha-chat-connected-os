"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FiArrowUpRight, FiArrowUp } from "react-icons/fi";

import { dashboardPathFor, LOGIN_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Lang = "bn" | "en";

/**
 * A single, unified homepage footer (Part G).
 *
 * The old marketing funnel shipped two stacked bottom blocks (a pre-footer CTA
 * plus a footer). They are merged here into ONE bottom section that keeps the
 * better of the two designs — a dark brand band with the brand mark, two
 * navigation columns and a slim legal bar — and links only to anchors/routes
 * that actually exist on the connected-OS homepage. No contact details are
 * invented.
 */
const COPY: Record<
  Lang,
  {
    brand: string;
    tagline: string;
    colExplore: string;
    colPlatform: string;
    explore: { label: string; href: string }[];
    helpDesk: string;
    dashboard: string;
    signIn: string;
    rights: string;
    builtBy: string;
    backToTop: string;
  }
> = {
  bn: {
    brand: "Shikkha Chat",
    tagline: "আপনার প্রতিষ্ঠান। সংযুক্ত।",
    colExplore: "ঘুরে দেখুন",
    colPlatform: "প্ল্যাটফর্ম",
    explore: [
      { label: "হোম কানেকশন", href: "#connect" },
      { label: "শিক্ষার্থী অর্জন", href: "#student-achievement-video" },
      { label: "অপারেশনাল উৎকর্ষতা", href: "#operational-excellence" },
    ],
    helpDesk: "হেল্প ডেস্ক",
    dashboard: "ড্যাশবোর্ড",
    signIn: "সাইন ইন",
    rights: "সর্বস্বত্ব সংরক্ষিত।",
    builtBy: "নির্মিত: আইওনিক কর্পোরেশন",
    backToTop: "উপরে ফিরে যান",
  },
  en: {
    brand: "Shikkha Chat",
    tagline: "Your Institution. Connected.",
    colExplore: "Explore",
    colPlatform: "Platform",
    explore: [
      { label: "Home Connections", href: "#connect" },
      { label: "Student Achievement", href: "#student-achievement-video" },
      { label: "Operational Excellence", href: "#operational-excellence" },
    ],
    helpDesk: "Help Desk",
    dashboard: "Dashboard",
    signIn: "Sign in",
    rights: "All rights reserved.",
    builtBy: "Built by IONIC Corporation",
    backToTop: "Back to top",
  },
};

export default function SiteFooter() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as Lang;
  const c = useMemo(() => COPY[currentLanguage], [currentLanguage]);

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const signedIn = status === "authenticated" && !!user;
  const accountHref = signedIn ? dashboardPathFor(user!) : LOGIN_PATH;
  const accountLabel = signedIn ? c.dashboard : c.signIn;

  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full border-t border-[color-mix(in_srgb,var(--color-white)_10%,transparent)] bg-[var(--color-primary-dark)] text-[color-mix(in_srgb,var(--color-white)_82%,transparent)]">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-14 sm:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
          <div>
            <span
              data-no-translate="true"
              className="text-[22px] font-black tracking-[-0.02em] text-[var(--color-white)]"
            >
              {c.brand}
            </span>
            <p className="mt-3 max-w-[34ch] text-[14px] leading-6 text-[color-mix(in_srgb,var(--color-white)_66%,transparent)]">
              {c.tagline}
            </p>
          </div>

          <nav className="flex flex-col gap-4" aria-label={c.colExplore}>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-white)_58%,transparent)]">
              {c.colExplore}
            </h4>
            <ul className="flex flex-col gap-3">
              {c.explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[color-mix(in_srgb,var(--color-white)_82%,transparent)] transition-colors duration-200 hover:text-[var(--color-white)]"
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="flex flex-col gap-4" aria-label={c.colPlatform}>
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-white)_58%,transparent)]">
              {c.colPlatform}
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/help-desk"
                  className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[color-mix(in_srgb,var(--color-white)_82%,transparent)] transition-colors duration-200 hover:text-[var(--color-white)]"
                >
                  <span>{c.helpDesk}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={accountHref}
                  data-no-translate="true"
                  className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-[color-mix(in_srgb,var(--color-white)_82%,transparent)] transition-colors duration-200 hover:text-[var(--color-white)]"
                >
                  <span>{accountLabel}</span>
                  <FiArrowUpRight aria-hidden size={14} />
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[color-mix(in_srgb,var(--color-white)_14%,transparent)] pt-6">
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-white)_60%,transparent)]">
            <span data-no-translate="true">© {year} {c.brand}.</span>{" "}
            {c.rights} · {c.builtBy}
          </p>

          <Link
            href="#intro"
            aria-label={c.backToTop}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_10%,transparent)] text-[var(--color-white)] transition duration-300 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--color-white)_18%,transparent)]"
          >
            <FiArrowUp aria-hidden size={18} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

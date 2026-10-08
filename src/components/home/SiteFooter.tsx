"use client";

import Image from "next/image";
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
 * better of the two designs — a dark brand band with the Shikkha Chat brand
 * mark (logo), two navigation columns and a slim legal bar — and links only to
 * anchors/routes that actually exist on the connected-OS homepage. No contact
 * details are invented.
 *
 * Every user-visible string lives in COPY below, so the whole footer stays
 * data-driven and easy to customise (brand, tagline, columns, legal line).
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

/**
 * The Shikkha Chat brand mark (logo). Repeated in a couple of places, so it is
 * kept as one small component for consistency.
 */
function BrandLogo({ brand }: { brand: string }) {
  return (
    <span className="inline-flex items-center rounded-2xl bg-[var(--color-white)] px-4 py-2.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.65)] ring-1 ring-[color-mix(in_srgb,var(--color-white)_14%,transparent)]">
      <Image
        src="/images/logo.png"
        alt={brand}
        width={158}
        height={64}
        sizes="158px"
        className="h-9 w-auto object-contain sm:h-10"
      />
    </span>
  );
}

/** A footer navigation column — a heading plus a list of links. */
function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <nav className="flex flex-col gap-4" aria-label={heading}>
      <h4 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-white)_58%,transparent)]">
        {heading}
      </h4>
      <ul className="flex flex-col gap-3">{children}</ul>
    </nav>
  );
}

/** A single footer link with a red underline-grow micro-interaction. */
function FooterLink({
  href,
  label,
  external,
  dataNoTranslate,
}: {
  href: string;
  label: string;
  external?: boolean;
  dataNoTranslate?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(dataNoTranslate ? { "data-no-translate": "true" } : {})}
      className="group inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-[color-mix(in_srgb,var(--color-white)_82%,transparent)] transition-colors duration-200 hover:text-[var(--color-white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
    >
      <span className="relative">
        {label}
        <span
          aria-hidden
          className="absolute -bottom-0.5 left-0 h-px w-0 bg-[var(--color-action)] transition-all duration-300 group-hover:w-full"
        />
      </span>
      {external ? (
        <FiArrowUpRight
          aria-hidden
          size={14}
          className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      ) : null}
    </Link>
  );
}

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
    <footer className="relative w-full overflow-hidden bg-[var(--color-primary-dark)] text-[color-mix(in_srgb,var(--color-white)_82%,transparent)]">
      {/* slim brand accent hairline along the top edge */}
      <div
        aria-hidden
        className="h-[3px] w-full bg-gradient-to-r from-[var(--color-action)] via-[color-mix(in_srgb,var(--color-action)_45%,transparent)] to-transparent"
      />

      <div className="mx-auto w-full max-w-[1240px] px-6 py-14 sm:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
          {/* brand column */}
          <div className="flex flex-col items-start">
            <Link
              href="/"
              aria-label={c.brand}
              className="rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
            >
              <BrandLogo brand={c.brand} />
            </Link>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-6 text-[color-mix(in_srgb,var(--color-white)_66%,transparent)]">
              {c.tagline}
            </p>
          </div>

          <FooterColumn heading={c.colExplore}>
            {c.explore.map((item) => (
              <li key={item.href}>
                <FooterLink href={item.href} label={item.label} />
              </li>
            ))}
          </FooterColumn>

          <FooterColumn heading={c.colPlatform}>
            <li>
              <FooterLink href="/help-desk" label={c.helpDesk} />
            </li>
            <li>
              <FooterLink
                href={accountHref}
                label={accountLabel}
                external
                dataNoTranslate
              />
            </li>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[color-mix(in_srgb,var(--color-white)_14%,transparent)] pt-6">
          <p className="text-[13px] text-[color-mix(in_srgb,var(--color-white)_60%,transparent)]">
            <span data-no-translate="true">
              © {year} {c.brand}.
            </span>{" "}
            {c.rights} · {c.builtBy}
          </p>

          <Link
            href="#intro"
            aria-label={c.backToTop}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_10%,transparent)] text-[var(--color-white)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-action)] hover:bg-[var(--color-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
          >
            <FiArrowUp aria-hidden size={18} />
          </Link>
        </div>
      </div>
    </footer>
  );
}

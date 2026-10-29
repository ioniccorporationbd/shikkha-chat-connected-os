"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FiAward, FiBriefcase, FiGrid, FiHome, FiMenu, FiX } from "react-icons/fi";
import SidebarAuthButton from "@/components/auth/SidebarAuthButton";
import SidebarRegisterButton from "@/components/auth/SidebarRegisterButton";
import SidebarAccountSection from "@/components/auth/SidebarAccountSection";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

import FeatureShowcase from "@/components/showcase/FeatureShowcase";

type ActiveSectionId =
  | "home-connections-panel"
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support"
  | "student-achievement"
  | "classroom-solutions"
  | "learning-management-schoology"
  | "assessment-performance-matters"
  | "curriculum-instruction"
  | "student-intervention"
  | "mtss"
  | "behavior-support"
  | "college-career-life-readiness"
  | "cclr-naviance"
  | "operational-excellence"
  | "resource-planning"
  | "financial-strategy-allovue"
  | "erp-systems"
  | "predictive-enrollment"
  | "talent-management"
  | "recruiting-and-hr"
  | "educator-support"
  | "my-connected-os";

type LanguageCode = "bn" | "en";

type MenuChild = {
  title: string;
  href: string;
};

/** Leading icon for each rail group, so links read as icon + label. */
const GROUP_ICONS: Record<string, IconType> = {
  home: FiHome,
  student: FiAward,
  operational: FiBriefcase,
  myOs: FiGrid,
};

const sidebarWidthClass =
  "w-[min(88vw,300px)] sm:w-[310px] xl:w-[300px] 2xl:w-[272px]";

const sidebarPaddingClass = "px-4 py-5 sm:px-5 sm:py-6 xl:py-7";

/* Homepage rail nav rows — the Dashboard rail's navigation language applied to
   the homepage's SQUARE outer shell. A Dashboard row is borderless on one 16px
   radius: selected = solid action red + white text/icon, idle hover = a light
   action tint (never a heavy neutral fill), and a plain 13px label with a plain
   inline 16px icon (the Dashboard never wraps icons/chevrons in decorative
   chips). The idle / hover / active colour is declared in the unlayered
   `.sidebar-row` rule in globals.css, because the base `a { color: inherit }`
   reset outranks Tailwind's layered text-* utilities on <a> rows. */
const sidebarRowClass =
  "sidebar-row group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]";
const sidebarRowLabelClass =
  "sidebar-row-label inline-flex min-w-0 flex-1 items-center gap-3 text-[14px] leading-snug";
const sidebarRowIconClass = "shrink-0 text-[16px]";
const sidebarRowIndexClass =
  "sidebar-row-index w-5 shrink-0 text-center text-[12px] font-bold tabular-nums";

/* -------------------------------------------------------------------------
   Premium surface system
   One muted border + soft shadow family for every card and pill in the rail,
   so the sidebar reads as a single balanced surface instead of a stack of
   harsh full-strength outlines. Everything stays inside the existing brand
   tokens (primary #032521 / secondary #a2c4c0), only softened with color-mix,
   so no new palette is introduced.
------------------------------------------------------------------------- */
const sidebarText = {
  bn: {
    logoHome: "শিক্ষা চ্যাট হোম",
    talkToExpert: "বিশেষজ্ঞের সাথে কথা বলুন",
    overview: "সারসংক্ষেপ",
    menu: "মেনু",
    bannerTitle: "সংযুক্ত শিক্ষা সিস্টেম",
    bannerSubtitle: "শিক্ষা চ্যাট সংযুক্ত ওএস",
    closeMenu: "মেনু বন্ধ করুন",
    bangla: "বাংলা",
    english: "English",
    groups: {
      home: "হোম কানেকশন",
      student: "শিক্ষার্থী অর্জন",
      operational: "অপারেশনাল উৎকর্ষতা",
      myOs: "আমার সংযুক্ত সিস্টেম",
    },
    sections: {
      homeConnectionsPanel: "হোম কানেকশন সারাংশ",
      studentInformation: "শিক্ষার্থীর তথ্য",
      sis: "শিক্ষার্থী তথ্য ব্যবস্থা",
      enrollment: "ভর্তি ব্যবস্থাপনা",
      specialPrograms: "বিশেষ কার্যক্রম",
      familyEngagement: "পরিবারের সম্পৃক্ততা",
      communications: "যোগাযোগ ব্যবস্থা",
      attendanceSupport: "উপস্থিতি সহায়তা",

      studentAchievement: "শিক্ষার্থী অর্জন",
      classroomSolutions: "শ্রেণিকক্ষ সমাধান",
      learningManagementSchoology: "লার্নিং ব্যবস্থাপনা",
      assessmentPerformanceMatters: "মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণ",
      curriculumInstruction: "কারিকুলাম ও পাঠদান",
      studentIntervention: "শিক্ষার্থী সহায়তা ব্যবস্থা",
      mtss: "বহুস্তরীয় সহায়তা ব্যবস্থা",
      behaviorSupport: "আচরণগত সহায়তা",
      collegeCareerLifeReadiness: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
      cclrNaviance: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",

      operationalExcellence: "অপারেশনাল উৎকর্ষতা",
      resourcePlanning: "রিসোর্স পরিকল্পনা",
      financialStrategyAllovue: "আর্থিক কৌশল ব্যবস্থাপনা",
      erpSystems: "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা",
      predictiveEnrollment: "পূর্বাভাসভিত্তিক ভর্তি ব্যবস্থাপনা",
      talentManagement: "প্রতিভা ব্যবস্থাপনা",
      recruitingHr: "নিয়োগ ও মানবসম্পদ",
      educatorSupport: "শিক্ষক সহায়তা",
    },
  },
  en: {
    logoHome: "Shikkha Chat home page",
    talkToExpert: "Talk to an Expert",
    overview: "Overview",
    menu: "Menu",
    bannerTitle: "Connected Education System",
    bannerSubtitle: "Shikkha Chat Connected OS",
    closeMenu: "Close menu",
    bangla: "বাংলা",
    english: "English",
    groups: {
      home: "Home Connections",
      student: "Student Achievement",
      operational: "Operational Excellence",
      myOs: "My Connected System",
    },
    sections: {
      homeConnectionsPanel: "Home Connections Summary",
      studentInformation: "Student Information",
      sis: "Student Information System",
      enrollment: "Enrollment Management",
      specialPrograms: "Special Programs",
      familyEngagement: "Family Engagement",
      communications: "Communications",
      attendanceSupport: "Attendance Support",

      studentAchievement: "Student Achievement",
      classroomSolutions: "Classroom Solutions",
      learningManagementSchoology: "Learning Management System",
      assessmentPerformanceMatters: "Assessment and Performance Analytics",
      curriculumInstruction: "Curriculum and Instruction",
      studentIntervention: "Student Intervention",
      mtss: "Multi-Tiered System of Supports",
      behaviorSupport: "Behavior Support",
      collegeCareerLifeReadiness: "College, Career and Life Readiness",
      cclrNaviance: "Career and Life Readiness Guidance",

      operationalExcellence: "Operational Excellence",
      resourcePlanning: "Resource Planning",
      financialStrategyAllovue: "Financial Strategy Management",
      erpSystems: "Enterprise Resource Planning Systems",
      predictiveEnrollment: "Predictive Enrollment Management",
      talentManagement: "Talent Management",
      recruitingHr: "Recruiting and Human Resources",
      educatorSupport: "Educator Support",
    },
  },
} as const;


const homeConnectionSectionIds: ActiveSectionId[] = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

const studentAchievementSectionIds: ActiveSectionId[] = [
  "student-achievement",
  "classroom-solutions",
  "learning-management-schoology",
  "assessment-performance-matters",
  "curriculum-instruction",
  "student-intervention",
  "mtss",
  "behavior-support",
  "college-career-life-readiness",
  "cclr-naviance",
];

const operationalExcellenceSectionIds: ActiveSectionId[] = [
  "operational-excellence",
  "resource-planning",
  "financial-strategy-allovue",
  "erp-systems",
  "predictive-enrollment",
  "talent-management",
  "recruiting-and-hr",
  "educator-support",
];


function getIdFromHref(href: string) {
  return href.replace("#", "") as ActiveSectionId;
}

function isHomeConnectionSection(id: string) {
  return homeConnectionSectionIds.includes(id as ActiveSectionId);
}

function isStudentAchievementSection(id: string) {
  return studentAchievementSectionIds.includes(id as ActiveSectionId);
}

function isOperationalExcellenceSection(id: string) {
  return operationalExcellenceSectionIds.includes(id as ActiveSectionId);
}


function dispatchActiveSection(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", {
      detail: { id },
    })
  );
}

function moveRightSidebarTo(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", {
      detail: { id },
    })
  );

  dispatchActiveSection(id);
}

function smoothPageScrollTo(id: string) {
  const element = document.getElementById(id);

  if (element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  dispatchActiveSection(id);
}

function handleSidebarNavigate(id: ActiveSectionId) {
  window.dispatchEvent(new CustomEvent("connected-os-sidebar-navigate"));

  if (
    isHomeConnectionSection(id) ||
    isStudentAchievementSection(id) ||
    isOperationalExcellenceSection(id)
  ) {
    moveRightSidebarTo(id);
    return;
  }

  smoothPageScrollTo(id);
}

function Logo({ language }: { language: LanguageCode }) {
  const text = sidebarText[language];

  return (
    <Link href="#intro" className="block w-full" aria-label={text.logoHome}>
      <div className="relative h-[56px] w-full transition duration-300 hover:scale-[1.02] sm:h-[66px] xl:h-[76px] 2xl:h-[92px]">
        <Image
          src="/images/logo.png"
          alt={text.logoHome}
          fill
          priority
          sizes="240px"
          className="object-contain object-left"
        />
      </div>
    </Link>
  );
}


function SidebarChildLink({
  child,
  active,
  index,
}: {
  child: MenuChild;
  active: boolean;
  index: number;
}) {
  const id = getIdFromHref(child.href);

  return (
    <Link
      href={child.href}
      onClick={(event) => {
        event.preventDefault();
        handleSidebarNavigate(id);
      }}
      aria-current={active ? "true" : undefined}
      className={[sidebarRowClass, "py-2", active ? "is-active" : ""].join(" ")}
    >
      <span className={[sidebarRowLabelClass, "font-semibold tracking-[-0.01em]"].join(" ")}>
        <span className={sidebarRowIndexClass}>{index}</span>
        <span className="truncate">{child.title}</span>
      </span>
    </Link>
  );
}

function SidebarLink({
  title,
  href,
  active,
  icon,
  onClick,
}: {
  title: string;
  href: string;
  active: boolean;
  icon?: IconType;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={[sidebarRowClass, active ? "is-active" : ""].join(" ")}
    >
      <span className={[sidebarRowLabelClass, "font-semibold"].join(" ")}>
        {icon
          ? (() => {
              const LinkIcon = icon;
              return <LinkIcon className={sidebarRowIconClass} />;
            })()
          : null}
        <span className="truncate">{title}</span>
      </span>
    </Link>
  );
}

export default function LeftSidebar() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sidebarText[currentLanguage];

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* H-01 — the rail is a permanent fixture at ≥1536px and an off-canvas drawer
     below it. Track that breakpoint so the closed drawer can be made truly
     non-interactive without ever disabling the always-on desktop rail. */
  const [isDesktopRail, setIsDesktopRail] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const wasDrawerOpenRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1536px)");
    const sync = () => setIsDesktopRail(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  const drawerHidden = !drawerOpen && !isDesktopRail;

  /* H-01 — when a closed drawer held focus, hand it back to the menu trigger so
     keyboard users are never dropped onto an inert element. */
  useEffect(() => {
    const wasOpen = wasDrawerOpenRef.current;
    wasDrawerOpenRef.current = drawerOpen;

    if (!wasOpen || drawerOpen || isDesktopRail) return;

    const aside = asideRef.current;
    const active = document.activeElement;
    const focusLost =
      !active || active === document.body || (aside?.contains(active) ?? false);

    if (focusLost) openButtonRef.current?.focus();
  }, [drawerOpen, isDesktopRail]);

  useEffect(() => {
    const handleDrawerClose = () => setDrawerOpen(false);
    window.addEventListener("connected-os-sidebar-navigate", handleDrawerClose);

    return () =>
      window.removeEventListener(
        "connected-os-sidebar-navigate",
        handleDrawerClose
      );
  }, []);

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="sidebar-open-button fixed left-3 top-3 z-[80] grid h-10 w-10 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_16%,transparent)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_30%,var(--color-white))] sm:left-4 sm:top-4 sm:h-12 sm:w-12 sm:rounded-2xl"
        aria-label={text.menu}
      >
        <FiMenu aria-hidden size={22} />
      </button>

      {/* The sidebar is a collapsed drawer below 1536px (it lives off-canvas at
          translateX(-100%)); this compact twin keeps a sign-in button on screen
          without opening the drawer. CSS hides it again from 1536px up, where
          the real button is always visible. */}
      {drawerOpen ? null : (
        <div className="sidebar-quick-login fixed left-16 top-3 z-[80] sm:left-20 sm:top-4">
          <div className="flex items-center gap-2">
            <SidebarRegisterButton variant="compact" />
            <SidebarAuthButton variant="compact" />
          </div>
        </div>
      )}

      {drawerOpen ? (
        <button
          type="button"
          aria-label={text.closeMenu}
          onClick={() => setDrawerOpen(false)}
          className="sidebar-mobile-backdrop u-shk-fade-in fixed inset-0 z-[85] bg-[color-mix(in_srgb,var(--color-black)_35%,transparent)] backdrop-blur-[2px]"
        />
      ) : null}

      <aside
        ref={asideRef}
        aria-hidden={drawerHidden ? true : undefined}
        inert={drawerHidden ? true : undefined}
        className={[
          [
            "connected-sidebar fixed left-0 top-0 z-[90] flex h-screen max-w-[calc(100vw-16px)] flex-col overflow-hidden",
            "border-r border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)]",
            "shadow-[12px_0_40px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
            "transition-transform duration-500 will-change-transform",
            sidebarWidthClass,
          ].join(" "),
          drawerOpen ? "is-open" : "",
        ].join(" ")}
      >
        <div
          className={[
            "no-scrollbar relative flex h-full flex-col overflow-y-auto bg-[var(--color-white)]",
            sidebarPaddingClass,
          ].join(" ")}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="sidebar-close-button mb-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] text-[18px] text-[var(--color-primary)] shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-white)]"
              aria-label={text.closeMenu}
            >
              <FiX aria-hidden size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <Logo language={currentLanguage} />

            {/* Account actions (Log In / Registration / Dashboard) — a stacked
                section directly beneath the logo, styled like the buttons in
                the dashboard rail. Logged in → only Dashboard; logged out →
                Log In + Registration. */}
            <SidebarAccountSection />
          </div>

          {/* Native rail nav, now driven by the complete Shikkha Chat Apps
              route catalog (15 categories / 87 features). This REPLACES the
              old homepage section links (Home Connections / Student Achievement
              / Operational Excellence / My Connected System): every category is
              a native dropdown and every feature a native numbered child row, so
              the catalog reads exactly like the rail's own navigation language.
              The site-nav groups are intentionally removed per an explicit
              request; route values stay informational only (no links to
              nonexistent Connected OS pages) — see src/lib/feature-showcase.ts. */}
          <FeatureShowcase />

          <div className="mt-auto border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-5">
            {/* Demo-request CTA at the foot of the rail: background is the
                brand primary #032521 (--color-primary); `.sidebar-demo-cta`
                in globals.css lifts the label one type step above the rail
                rows. The modal and its flow stay untouched. */}
            <Link
              href="#connect"
              className="sidebar-demo-cta flex h-12 items-center justify-center rounded-2xl border border-[#032521] bg-[#032521] text-[var(--color-white)] shadow-[0_16px_34px_-18px_color-mix(in_srgb,#032521_78%,transparent)] transition duration-300 hover:-translate-y-1 hover:bg-[#06453c] sm:h-[56px]"
            >
              {text.talkToExpert}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
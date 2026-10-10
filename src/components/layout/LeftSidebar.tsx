"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import { FiArrowRight, FiAward, FiBriefcase, FiChevronDown, FiCompass, FiGrid, FiHeadphones, FiHome, FiMenu, FiX } from "react-icons/fi";
import SidebarAuthButton from "@/components/auth/SidebarAuthButton";
import SidebarRegisterButton from "@/components/auth/SidebarRegisterButton";
import DashboardLanguageToggle from "@/components/dashboard/DashboardLanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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

type OpenGroup = "home" | "student" | "operational" | null;
type LanguageCode = "bn" | "en";

type MenuChild = {
  title: string;
  href: string;
};

type MenuGroup = {
  title: string;
  href: string;
  group?: OpenGroup;
  children?: MenuChild[];
};

const colorPrimary = "var(--color-primary)";
const colorSecondary = "var(--color-secondary)";
const colorWhite = "var(--color-white)";

/** Leading icon for each rail group, so links read as icon + label. */
const GROUP_ICONS: Record<string, IconType> = {
  home: FiHome,
  student: FiAward,
  operational: FiBriefcase,
  myOs: FiGrid,
};

const sidebarWidthClass =
  "w-[min(88vw,300px)] sm:w-[310px] xl:w-[300px] 2xl:w-[300px]";

const sidebarPaddingClass = "px-4 py-5 sm:px-5 sm:py-6 xl:py-7";

/* Strict text sizing, rebalanced for a clearer hierarchy: card titles and nav
   group labels share one calm size, nested links sit a step below, and the
   uppercase eyebrow label is small and light so it reads as a quiet heading
   rather than body copy. */
const sidebarTitleTextClass = "text-[15px] font-semibold tracking-[-0.02em]";

const sidebarSubtitleTextClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em]";

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
  "sidebar-row-label inline-flex min-w-0 flex-1 items-center gap-3 text-[13px] leading-snug";
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
const cardBorderClass =
  "border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]";
const cardShadowClass =
  "shadow-[0_18px_44px_-32px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";
const sidebarText = {
  bn: {
    logoHome: "শিক্ষা চ্যাট হোম",
    languageMode: "ভাষা নির্বাচন",
    interfaceTitle: "বাংলা ইন্টারফেস",
    currentlyViewing: "বর্তমানে দেখছেন",
    theK12Os: "কে–টুয়েলভ অপারেটিং সিস্টেম",
    talkToExpert: "বিশেষজ্ঞের সাথে কথা বলুন",
    helpDesk: "হেল্প ডেস্ক",
    overview: "সারসংক্ষেপ",
    menu: "মেনু",
    bannerTitle: "সংযুক্ত শিক্ষা সিস্টেম",
    bannerSubtitle: "শিক্ষা চ্যাট সংযুক্ত ওএস",
    closeMenu: "মেনু বন্ধ করুন",
    toggleLanguage: "ভাষা পরিবর্তন করুন",
    bangla: "বাংলা",
    english: "English",
    bnShort: "বাংলা",
    enShort: "English",
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
    languageMode: "Language Mode",
    interfaceTitle: "English Interface",
    currentlyViewing: "Currently viewing",
    theK12Os: "The K-12 Operating System",
    talkToExpert: "Talk to an Expert",
    helpDesk: "Help Desk",
    overview: "Overview",
    menu: "Menu",
    bannerTitle: "Connected Education System",
    bannerSubtitle: "Shikkha Chat Connected OS",
    closeMenu: "Close menu",
    toggleLanguage: "Change language",
    bangla: "বাংলা",
    english: "English",
    bnShort: "বাংলা",
    enShort: "English",
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

function getSidebarMenu(language: LanguageCode): MenuGroup[] {
  const text = sidebarText[language];

  return [
    {
      title: text.groups.home,
      href: "#home-connections-panel",
      group: "home",
      children: [
        {
          title: text.sections.studentInformation,
          href: "#student-information",
        },
        {
          title: text.sections.sis,
          href: "#sis",
        },
        {
          title: text.sections.enrollment,
          href: "#enrollment",
        },
        {
          title: text.sections.specialPrograms,
          href: "#special-programs",
        },
        {
          title: text.sections.familyEngagement,
          href: "#family-engagement",
        },
        {
          title: text.sections.communications,
          href: "#communications",
        },
        {
          title: text.sections.attendanceSupport,
          href: "#attendance-support",
        },
      ],
    },
    {
      title: text.groups.student,
      href: "#student-achievement",
      group: "student",
      children: [
        {
          title: text.sections.studentAchievement,
          href: "#student-achievement",
        },
        {
          title: text.sections.classroomSolutions,
          href: "#classroom-solutions",
        },
        {
          title: text.sections.learningManagementSchoology,
          href: "#learning-management-schoology",
        },
        {
          title: text.sections.assessmentPerformanceMatters,
          href: "#assessment-performance-matters",
        },
        {
          title: text.sections.curriculumInstruction,
          href: "#curriculum-instruction",
        },
        {
          title: text.sections.studentIntervention,
          href: "#student-intervention",
        },
        {
          title: text.sections.mtss,
          href: "#mtss",
        },
        {
          title: text.sections.behaviorSupport,
          href: "#behavior-support",
        },
        {
          title: text.sections.collegeCareerLifeReadiness,
          href: "#college-career-life-readiness",
        },
        {
          title: text.sections.cclrNaviance,
          href: "#cclr-naviance",
        },
      ],
    },
    {
      title: text.groups.operational,
      href: "#operational-excellence",
      group: "operational",
      children: [
        {
          title: text.sections.operationalExcellence,
          href: "#operational-excellence",
        },
        {
          title: text.sections.resourcePlanning,
          href: "#resource-planning",
        },
        {
          title: text.sections.financialStrategyAllovue,
          href: "#financial-strategy-allovue",
        },
        {
          title: text.sections.erpSystems,
          href: "#erp-systems",
        },
        {
          title: text.sections.predictiveEnrollment,
          href: "#predictive-enrollment",
        },
        {
          title: text.sections.talentManagement,
          href: "#talent-management",
        },
        {
          title: text.sections.recruitingHr,
          href: "#recruiting-and-hr",
        },
        {
          title: text.sections.educatorSupport,
          href: "#educator-support",
        },
      ],
    },
    {
      title: text.groups.myOs,
      href: "#my-connected-os",
    },
  ];
}

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

const allSectionIds: ActiveSectionId[] = [
  ...homeConnectionSectionIds,
  ...studentAchievementSectionIds,
  ...operationalExcellenceSectionIds,
  "my-connected-os",
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

function getGroupById(id: string): OpenGroup {
  if (isHomeConnectionSection(id)) return "home";
  if (isStudentAchievementSection(id)) return "student";
  if (isOperationalExcellenceSection(id)) return "operational";
  return null;
}

function getGroupColor(group: OpenGroup, isMyConnected = false) {
  if (group === "student") return colorSecondary;

  if (group === "home" || group === "operational" || isMyConnected) {
    return colorPrimary;
  }

  return colorPrimary;
}

function getActiveTitle(activeId: ActiveSectionId | null, currentMenu: MenuGroup[]) {
  if (activeId === null) return "";
  for (const item of currentMenu) {
    if (getIdFromHref(item.href) === activeId) return item.title;

    const child = item.children?.find(
      (childItem) => getIdFromHref(childItem.href) === activeId
    );

    if (child) return child.title;
  }

  return "";
}

function getActiveGroupTitle(activeId: ActiveSectionId | null, language: LanguageCode) {
  const text = sidebarText[language];

  if (activeId === null) return text.bannerSubtitle;
  if (isHomeConnectionSection(activeId)) return text.groups.home;
  if (isStudentAchievementSection(activeId)) return text.groups.student;
  if (isOperationalExcellenceSection(activeId)) return text.groups.operational;

  return text.groups.myOs;
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
      <div className="relative h-[56px] w-full transition duration-300 hover:scale-[1.02] sm:h-[66px] xl:h-[76px] 2xl:h-[84px]">
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

function MiniOsIcon({ activeId }: { activeId: string | null }) {
  const activeType =
    activeId === null
      ? null
      : isStudentAchievementSection(activeId)
        ? "student"
        : isOperationalExcellenceSection(activeId)
          ? "operation"
          : "home";

  const columns = [
    {
      id: "home",
      color: colorPrimary,
      active: activeType === "home",
    },
    {
      id: "student",
      color: colorSecondary,
      active: activeType === "student",
    },
    {
      id: "operation",
      color: colorPrimary,
      active: activeType === "operation",
    },
  ];

  return (
    <div className="mt-3 flex items-start gap-2">
      {columns.map((col, index) => (
        <div key={col.id} className="space-y-1">
          <span
            className="block h-1 rounded-full transition-all duration-500"
            style={{
              width: index === 1 ? 34 : 28,
              background: col.active
                ? col.color
                : "color-mix(in srgb, var(--color-primary) 16%, transparent)",
            }}
          />

          <div
            className="grid gap-[4px] rounded-lg border-2 p-[4px] transition duration-500"
            style={{
              borderColor: col.active
                ? col.color
                : "color-mix(in srgb, var(--color-primary) 16%, transparent)",
              background: col.active
                ? `color-mix(in srgb, ${col.color} 18%, transparent)`
                : colorWhite,
            }}
          >
            {Array.from({ length: index === 1 ? 8 : 6 }).map(
              (_, itemIndex) => (
                <span
                  key={itemIndex}
                  className="h-[10px] w-[10px] rounded-[3px] transition duration-500"
                  style={{
                    background: col.active
                      ? col.color
                      : "color-mix(in srgb, var(--color-primary) 16%, transparent)",
                  }}
                />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveStatusCard({
  activeId,
  currentMenu,
  language,
}: {
  activeId: ActiveSectionId | null;
  currentMenu: MenuGroup[];
  language: LanguageCode;
}) {
  const group = activeId === null ? null : getGroupById(activeId);
  const accentColor = getGroupColor(group, activeId === "my-connected-os");
  const activeTitle =
    activeId === null
      ? sidebarText[language].bannerTitle
      : getActiveTitle(activeId, currentMenu);
  const groupTitle = getActiveGroupTitle(activeId, language);
  const text = sidebarText[language];
  const progressScale =
    activeId === null
      ? 0
      : isHomeConnectionSection(activeId)
        ? 0.33
        : isStudentAchievementSection(activeId)
          ? 0.66
          : 1;

  return (
    <div
      className={`mt-3 overflow-hidden rounded-2xl border bg-[var(--color-white)] p-3 backdrop-blur-md sm:mt-4 sm:p-4 ${cardBorderClass} ${cardShadowClass}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_5px_color-mix(in_srgb,var(--color-primary)_7%,transparent)]"
          style={{ background: accentColor }}
        />

        <p className={`${sidebarSubtitleTextClass} text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]`}>
          {text.currentlyViewing}
        </p>
      </div>

      <h3
        className={`${sidebarTitleTextClass} mt-2 leading-[1.2] text-[var(--color-primary)]`}
      >
        {activeTitle}
      </h3>

      <p className="mt-1 text-[12px] font-medium leading-4 text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
        {groupTitle}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
        <div
          className="h-full w-full origin-left rounded-full transition-transform duration-500"
          style={{
            transform: `scaleX(${progressScale})`,
            background: "var(--color-action)",
          }}
        />
      </div>
    </div>
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
      <span className={[sidebarRowLabelClass, "font-medium tracking-[-0.01em]"].join(" ")}>
        <span className={sidebarRowIndexClass}>{index}</span>
        <span className="truncate">{child.title}</span>
      </span>
    </Link>
  );
}

function LanguageSection() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const isBangla = currentLanguage === "bn";
  const text = sidebarText[currentLanguage];

  return (
    <div
      className={`mt-4 rounded-2xl border bg-[var(--color-white)] p-3.5 ${cardBorderClass} ${cardShadowClass}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className={`${sidebarSubtitleTextClass} text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]`}>
            {text.languageMode}
          </p>

          <h3
            className={`${sidebarTitleTextClass} mt-1 text-[var(--color-primary)]`}
          >
            {text.interfaceTitle}
          </h3>
        </div>

        <span className="rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_40%,var(--color-white))] px-3 py-1 text-[12px] font-semibold leading-[1.2] tracking-[-0.01em] text-[var(--color-primary)]">
          {isBangla ? text.bnShort : text.enShort}
        </span>
      </div>

      {/* Exactly the Dashboard account-dropdown control: ONE single toggle,
          never a separate bespoke segmented switch. */}
      <DashboardLanguageToggle variant="full" />

      {/* Help Desk lives in the SAME section as the language control. */}
      <div className="mt-3 border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-3">
        <Link href="/help-desk" className={sidebarRowClass}>
          <span className={[sidebarRowLabelClass, "font-semibold"].join(" ")}>
            <FiHeadphones className={sidebarRowIconClass} />
            <span className="truncate">{text.helpDesk}</span>
          </span>
          <FiArrowRight className="shrink-0 text-[16px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
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

  const currentMenu = useMemo(
    () => getSidebarMenu(currentLanguage),
    [currentLanguage]
  );

  const [activeId, setActiveId] = useState<ActiveSectionId | null>(null);
  const [openGroup, setOpenGroup] = useState<OpenGroup>(null);
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

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: ActiveSectionId }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      if (allSectionIds.includes(id)) {
        setActiveId(id);
        setOpenGroup(getGroupById(id));
      }
    };

    window.addEventListener("connected-os-active-section", handleActiveSection);

    return () =>
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection
      );
  }, []);

  /* Main-Banner awareness ---------------------------------------------------
     While the hero (#intro) fills the viewport and no hub section is locked,
     all three dropdown groups stay closed and no child reads as selected — so
     a refresh or a reverse scroll back to the banner never leaves a stale open
     group. This reuses the existing scroll engine: it only ever *clears*
     state (the engine's connected-os-active-section event owns re-opening a
     group), and it stands down for a beat after a deliberate navigation so it
     can never fight a programmatic scroll. */
  useEffect(() => {
    const intro = document.getElementById("intro");
    if (!intro) return;

    let navGuardUntil = 0;
    const markNavigation = () => {
      navGuardUntil = performance.now() + 1200;
    };

    let frame = 0;
    const evaluate = () => {
      frame = 0;
      if (performance.now() < navGuardUntil) return;

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      // A hub section parked on screen owns the active state — never override it.
      const anySectionLocked = Array.from(
        document.querySelectorAll<HTMLElement>(".connected-scroll-section")
      ).some((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 2 && rect.bottom >= viewportHeight - 2;
      });
      if (anySectionLocked) return;

      const rect = intro.getBoundingClientRect();
      const bannerDominant =
        rect.top <= viewportHeight * 0.4 &&
        rect.bottom >= viewportHeight * 0.5;

      if (bannerDominant) {
        setActiveId(null);
        setOpenGroup(null);
      }
    };

    const scheduleEvaluation = () => {
      if (frame) return;
      frame = requestAnimationFrame(evaluate);
    };

    window.addEventListener("scroll", scheduleEvaluation, { passive: true });
    window.addEventListener("resize", scheduleEvaluation, { passive: true });
    window.addEventListener("connected-os-scroll-to-section", markNavigation);
    window.addEventListener("connected-os-sidebar-navigate", markNavigation);

    scheduleEvaluation();

    return () => {
      window.removeEventListener("scroll", scheduleEvaluation);
      window.removeEventListener("resize", scheduleEvaluation);
      window.removeEventListener(
        "connected-os-scroll-to-section",
        markNavigation
      );
      window.removeEventListener("connected-os-sidebar-navigate", markNavigation);
      if (frame) cancelAnimationFrame(frame);
    };
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
          className="sidebar-mobile-backdrop fixed inset-0 z-[85] bg-[var(--color-black)] opacity-35 backdrop-blur-[2px]"
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

            {/* Registration + Login, directly beneath the logo. */}
            <div className="flex flex-wrap items-center gap-2">
              <SidebarRegisterButton />
              <SidebarAuthButton />
            </div>
          </div>
          <LanguageSection />

          <div className={`mt-5 rounded-2xl border bg-[var(--color-white)] p-3.5 ${cardBorderClass} ${cardShadowClass}`}>
            {/* Dashboard-style inner section header: a rounded, icon-led row. */}
            <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-action-tint)] text-[var(--color-action)]">
                <FiCompass aria-hidden size={17} />
              </span>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
                  {text.menu}
                </p>
                <p className={`${sidebarTitleTextClass} truncate text-[var(--color-primary)]`}>
                  {text.theK12Os}
                </p>
              </div>
            </div>

            <MiniOsIcon activeId={activeId} />

            <ActiveStatusCard
              activeId={activeId}
              currentMenu={currentMenu}
              language={currentLanguage}
            />
          </div>

          <nav className="mt-5 flex flex-col gap-1.5 sm:mt-6">
            {currentMenu.map((item) => {
              const itemId = getIdFromHref(item.href);

              const group = item.group ?? null;
              const openState = group ? openGroup === group : false;

              if (item.children && group) {
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      aria-expanded={openState}
                      onClick={() =>
                        setOpenGroup((current) =>
                          current === group ? null : group
                        )
                      }
                      className={[
                        sidebarRowClass,
                        openState ? "is-open" : "",
                      ].join(" ")}
                    >
                      <span className={[sidebarRowLabelClass, "font-semibold"].join(" ")}>
                        {(() => {
                          const GroupIcon = GROUP_ICONS[group ?? ""] ?? FiGrid;
                          return <GroupIcon className={sidebarRowIconClass} />;
                        })()}
                        <span className="truncate">{item.title}</span>
                      </span>

                      <FiChevronDown
                        aria-hidden="true"
                        className={[
                          "shrink-0 text-[16px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          openState ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>

                    <div
                      className={[
                        "grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        openState
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-1.5 ml-3 space-y-1 border-l border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] pl-2.5">
                          {item.href === "#home-connections-panel" ? (
                            <SidebarChildLink
                              child={{
                                title: text.overview,
                                href: "#home-connections-panel",
                              }}
                              active={activeId === "home-connections-panel"}
                              index={1}
                            />
                          ) : null}

                          {item.children.map((child, childIndex) => {
                            const childId = getIdFromHref(child.href);
                            const active = activeId === childId;
                            const number =
                              item.href === "#home-connections-panel"
                                ? childIndex + 2
                                : childIndex + 1;

                            return (
                              <SidebarChildLink
                                key={child.href}
                                child={child}
                                active={active}
                                index={number}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const active = activeId === itemId;

              return (
                <SidebarLink
                  key={item.href}
                  title={item.title}
                  href={item.href}
                  active={active}
                  icon={GROUP_ICONS.myOs}
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenGroup(null);
                    handleSidebarNavigate(itemId);
                    setDrawerOpen(false);
                  }}
                />
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] pt-5">
            <Link
              href="#connect"
              className="flex h-11 items-center justify-center rounded-2xl border border-[var(--color-action)] bg-[var(--color-action)] text-[13px] font-semibold text-[var(--color-white)] shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_78%,transparent)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--color-action-hover)] sm:h-12"
            >
              {text.talkToExpert}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
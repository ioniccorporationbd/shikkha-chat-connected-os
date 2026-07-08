"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

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
const colorSecondaryLight = "var(--color-secondary)";
const colorSurface = "var(--color-white)";
const colorTextInverse = "var(--color-white)";

const sidebarText = {
  bn: {
    logoHome: "শিক্ষা চ্যাট হোম",
    languageMode: "ভাষা নির্বাচন",
    interfaceTitle: "বাংলা ইন্টারফেস",
    currentlyViewing: "বর্তমানে দেখছেন",
    theK12Os: "কে–টুয়েলভ অপারেটিং সিস্টেম",
    talkToExpert: "বিশেষজ্ঞের সাথে কথা বলুন",
    overview: "সারসংক্ষেপ",
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    toggleLanguage: "ভাষা পরিবর্তন করুন",
    bangla: "বাংলা",
    english: "ইংরেজি",
    bnShort: "বাংলা",
    enShort: "ইংরেজি",
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
    theK12Os: "The K–12 Operating System",
    talkToExpert: "Talk to an Expert",
    overview: "Overview",
    menu: "Menu",
    closeMenu: "Close menu",
    toggleLanguage: "Change language",
    bangla: "Bangla",
    english: "English",
    bnShort: "Bangla",
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

function getReadableGroupColor() {
  return colorPrimary;
}

function getActiveTitle(activeId: ActiveSectionId, currentMenu: MenuGroup[]) {
  for (const item of currentMenu) {
    if (getIdFromHref(item.href) === activeId) return item.title;

    const child = item.children?.find(
      (childItem) => getIdFromHref(childItem.href) === activeId
    );

    if (child) return child.title;
  }

  return "";
}

function getActiveGroupTitle(activeId: ActiveSectionId, language: LanguageCode) {
  const text = sidebarText[language];

  if (isHomeConnectionSection(activeId)) return text.groups.home;
  if (isStudentAchievementSection(activeId)) return text.groups.student;
  if (isOperationalExcellenceSection(activeId)) {
    return text.groups.operational;
  }

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
      <div className="relative h-[76px] w-full transition duration-500 hover:scale-[1.02]">
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

function MiniOsIcon({ activeId }: { activeId: string }) {
  const activeType = isStudentAchievementSection(activeId)
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
                : colorSurface,
            }}
          >
            {Array.from({ length: index === 1 ? 8 : 6 }).map((_, itemIndex) => (
              <span
                key={itemIndex}
                className="h-[10px] w-[10px] rounded-[3px] transition-all duration-500"
                style={{
                  background: col.active
                    ? col.color
                    : "color-mix(in srgb, var(--color-primary) 16%, transparent)",
                }}
              />
            ))}
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
  activeId: ActiveSectionId;
  currentMenu: MenuGroup[];
  language: LanguageCode;
}) {
  const group = getGroupById(activeId);
  const accentColor = getGroupColor(group, activeId === "my-connected-os");
  const readableColor = getReadableGroupColor();
  const activeTitle = getActiveTitle(activeId, currentMenu);
  const groupTitle = getActiveGroupTitle(activeId, language);
  const text = sidebarText[language];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] p-4 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_5px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
          style={{ background: accentColor }}
        />

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
          {text.currentlyViewing}
        </p>
      </div>

      <h3
        className="mt-2 text-[16px] font-bold leading-[1.18] tracking-[-0.035em]"
        style={{ color: readableColor }}
      >
        {activeTitle}
      </h3>

      <p className="mt-1 text-[12px] font-medium leading-5 text-[var(--color-primary)]">
        {groupTitle}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-secondary)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: isHomeConnectionSection(activeId)
              ? "33%"
              : isStudentAchievementSection(activeId)
                ? "66%"
                : "100%",
            background: accentColor,
          }}
        />
      </div>
    </div>
  );
}

function SidebarChildLink({
  child,
  active,
  color,
  index,
}: {
  child: MenuChild;
  active: boolean;
  color: string;
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
      className={[
        "group relative flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-[13.4px] font-semibold transition-all duration-300",
        "hover:translate-x-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
        active
          ? "border-[var(--color-primary)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
          : "",
      ].join(" ")}
      style={{
        background: active
          ? `color-mix(in srgb, ${color} 13%, transparent)`
          : undefined,
        color: colorPrimary,
      }}
    >
      {active ? (
        <span
          className="absolute -left-4 top-2 h-6 w-1 rounded-r-full"
          style={{ background: color }}
        />
      ) : null}

      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--color-primary)] text-[9px] font-bold"
        style={{
          background: active ? color : colorSecondaryLight,
          color: active ? colorTextInverse : colorPrimary,
        }}
      >
        {index}
      </span>

      <span className="leading-[1.2] tracking-[-0.015em]">{child.title}</span>
    </Link>
  );
}

function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const isBangla = currentLanguage === "bn";
  const text = sidebarText[currentLanguage];

  return (
    <div className="mt-4 rounded-[24px] border border-[var(--color-primary)] bg-[var(--color-white)] p-3.5 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            {text.languageMode}
          </p>

          <h3 className="mt-1 text-[15px] font-bold tracking-[-0.03em] text-[var(--color-primary)]">
            {text.interfaceTitle}
          </h3>
        </div>

        <span className="rounded-full border border-[var(--color-primary)] bg-[var(--color-secondary)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)]">
          {isBangla ? text.bnShort : text.enShort}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setLanguage(isBangla ? "en" : "bn")}
        className="group relative h-12 w-full overflow-hidden rounded-full border border-[var(--color-primary)] bg-[var(--color-white)] p-1 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_6%,transparent)] transition duration-300 hover:bg-[var(--color-secondary)]"
        aria-label={text.toggleLanguage}
      >
        <span
          className={[
            "absolute top-1 h-10 w-[calc(50%-4px)] rounded-full bg-[var(--color-primary)] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] transition-all duration-500 ease-out",
            isBangla ? "left-1" : "left-[calc(50%)]",
          ].join(" ")}
          aria-hidden="true"
        />

        <span className="relative z-10 grid h-full grid-cols-2 text-[13px] font-bold">
          <span
            className={[
              "grid place-items-center rounded-full transition duration-300",
              isBangla
                ? "text-[var(--color-white)]"
                : "text-[var(--color-primary)]",
            ].join(" ")}
          >
            {text.bangla}
          </span>

          <span
            className={[
              "grid place-items-center rounded-full transition duration-300",
              !isBangla
                ? "text-[var(--color-white)]"
                : "text-[var(--color-primary)]",
            ].join(" ")}
          >
            {text.english}
          </span>
        </span>
      </button>
    </div>
  );
}

function SidebarLink({
  title,
  href,
  active,
  color,
  onClick,
}: {
  title: string;
  href: string;
  active: boolean;
  color: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group relative block rounded-xl border border-transparent px-3 py-2.5 text-[13.8px] font-bold transition-all duration-300",
        "hover:translate-x-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
        active
          ? "border-[var(--color-primary)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
          : "",
      ].join(" ")}
      style={{
        color: colorPrimary,
        background: active
          ? `color-mix(in srgb, ${color} 13%, transparent)`
          : undefined,
      }}
    >
      {active ? (
        <span
          className="absolute -left-5 top-2 h-7 w-1 rounded-r-full"
          style={{ background: color }}
        />
      ) : null}

      <span>{title}</span>
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

  const [activeId, setActiveId] =
    useState<ActiveSectionId>("home-connections-panel");

  const [openGroup, setOpenGroup] = useState<OpenGroup>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleDrawerClose = () => setDrawerOpen(false);
    window.addEventListener("connected-os-sidebar-navigate", handleDrawerClose);

    return () => {
      window.removeEventListener(
        "connected-os-sidebar-navigate",
        handleDrawerClose
      );
    };
  }, []);

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: ActiveSectionId }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      if (allSectionIds.includes(id)) {
        setActiveId(id);

        const nextGroup = getGroupById(id);
        setOpenGroup(nextGroup);
      }
    };

    window.addEventListener("connected-os-active-section", handleActiveSection);

    return () => {
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection
      );
    };
  }, []);

  const homeGroupActive = useMemo(() => {
    return isHomeConnectionSection(activeId);
  }, [activeId]);

  const studentGroupActive = useMemo(() => {
    return isStudentAchievementSection(activeId);
  }, [activeId]);

  const operationalGroupActive = useMemo(() => {
    return isOperationalExcellenceSection(activeId);
  }, [activeId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="sidebar-open-button fixed left-4 top-4 z-[80] grid h-12 w-12 place-items-center rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)]"
        aria-label={text.menu}
      >
        <span className="block h-[2px] w-5 rounded-full bg-current shadow-[0_7px_0_current,0_-7px_0_current]" />
      </button>

      {drawerOpen ? (
        <button
          type="button"
          aria-label={text.closeMenu}
          onClick={() => setDrawerOpen(false)}
          className="sidebar-mobile-backdrop fixed inset-0 z-[85] bg-[var(--color-black)] opacity-35 backdrop-blur-[2px]"
        />
      ) : null}

      <aside
        className={[
          "connected-sidebar fixed left-0 top-0 z-[90] flex h-screen w-[320px] max-w-[calc(100vw-20px)] flex-col overflow-hidden border-r border-[var(--color-primary)] bg-[var(--color-white)] shadow-[12px_0_40px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] transition-transform duration-500 will-change-transform",
          drawerOpen ? "is-open" : "",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-[var(--color-secondary)] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-24 h-52 w-52 rounded-full bg-[var(--color-secondary)] opacity-80 blur-3xl" />
        <div className="pointer-events-none absolute left-5 top-0 h-full w-px bg-[var(--color-primary)]" />

        <div className="no-scrollbar relative flex h-full flex-col overflow-y-auto bg-[var(--color-white)] px-5 py-7">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="sidebar-close-button absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-primary)] bg-[var(--color-white)] text-[18px] text-[var(--color-primary)] shadow-[0_10px_24px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-white)]"
            aria-label={text.closeMenu}
          >
            ×
          </button>

          <Logo language={currentLanguage} />
          <LanguageSwitch />

          <div className="mt-6 rounded-3xl border border-[var(--color-primary)] bg-[var(--color-white)] p-4 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
            <div className="rounded-2xl border border-[var(--color-primary)] bg-[var(--color-white)] p-3 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_5%,transparent)]">
              <p className="text-[13px] font-bold tracking-[-0.02em] text-[var(--color-primary)]">
                {text.theK12Os}
              </p>

              <MiniOsIcon activeId={activeId} />
            </div>

            <ActiveStatusCard
              activeId={activeId}
              currentMenu={currentMenu}
              language={currentLanguage}
            />
          </div>

          <nav className="mt-6 space-y-1.5 text-[13px]">
            {currentMenu.map((item) => {
              const itemId = getIdFromHref(item.href);

              const activeGroup =
                item.children?.some(
                  (child) => getIdFromHref(child.href) === activeId
                ) ||
                itemId === activeId ||
                (item.href === "#home-connections-panel" && homeGroupActive) ||
                (item.href === "#student-achievement" && studentGroupActive) ||
                (item.href === "#operational-excellence" &&
                  operationalGroupActive);

              const group = item.group ?? null;
              const isMyConnected = item.href === "#my-connected-os";
              const color = getGroupColor(group, isMyConnected);
              const readableColor = getReadableGroupColor();
              const openState = group ? openGroup === group : false;

              if (item.children && group) {
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      aria-expanded={openState}
                      onClick={() => {
                        setOpenGroup((current) =>
                          current === group ? null : group
                        );
                      }}
                      className={[
                        "group relative flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-3 text-left text-[14.2px] font-bold tracking-[-0.02em] transition-all duration-300",
                        "hover:translate-x-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
                        activeGroup
                          ? "border-[var(--color-primary)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
                          : "",
                      ].join(" ")}
                      style={{
                        color: readableColor,
                        background: activeGroup
                          ? `color-mix(in srgb, ${color} 13%, transparent)`
                          : undefined,
                      }}
                    >
                      {activeGroup ? (
                        <span
                          className="absolute -left-5 top-2 h-7 w-1 rounded-r-full"
                          style={{ background: color }}
                        />
                      ) : null}

                      <span className="leading-[1.18]">{item.title}</span>

                      <span
                        className={[
                          "transition-transform duration-300",
                          openState ? "rotate-180" : "",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        ⌄
                      </span>
                    </button>

                    <div
                      className={[
                        "grid transition-all duration-500",
                        openState
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      ].join(" ")}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-1.5 space-y-1.5 rounded-2xl border border-[var(--color-primary)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-white)] py-1.5 pl-4 pr-1 shadow-[inset_8px_0_18px_color-mix(in_srgb,var(--color-primary)_5%,transparent)]">
                          {item.href === "#home-connections-panel" ? (
                            <SidebarChildLink
                              child={{
                                title: text.overview,
                                href: "#home-connections-panel",
                              }}
                              active={activeId === "home-connections-panel"}
                              color={color}
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
                                color={color}
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
                  color={color}
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

          <div className="mt-auto border-t border-[var(--color-primary)] bg-[var(--color-white)] pt-5">
            <Link
              href="#connect"
              className="flex h-12 items-center justify-center rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] text-[14px] font-black text-[var(--color-white)] shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]"
            >
              {text.talkToExpert}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
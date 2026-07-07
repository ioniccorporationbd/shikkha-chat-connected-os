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

const sidebarText = {
  bn: {
    languageMode: "ভাষা নির্বাচন",
    interfaceTitle: "বাংলা ইন্টারফেস",
    currentlyViewing: "বর্তমানে দেখছেন",
    theK12Os: "কে–১২ ওএস",
    talkToExpert: "এক্সপার্টের সাথে কথা বলুন",
    overview: "ওভারভিউ",
    menu: "মেনু",
    closeMenu: "মেনু বন্ধ করুন",
    groups: {
      home: "হোম কানেকশন",
      student: "শিক্ষার্থী অর্জন",
      operational: "অপারেশনাল এক্সিলেন্স",
      myOs: "★ আমার কানেক্টেড ওএস",
    },
    sections: {
      homeConnectionsPanel: "হোম কানেকশন ওভারভিউ",
      studentInformation: "শিক্ষার্থী তথ্য",
      sis: "এসআইএস",
      enrollment: "ভর্তি",
      specialPrograms: "বিশেষ প্রোগ্রাম",
      familyEngagement: "পরিবার সম্পৃক্ততা",
      communications: "যোগাযোগ",
      attendanceSupport: "উপস্থিতি সহায়তা",

      studentAchievement: "শিক্ষার্থী অর্জন",
      classroomSolutions: "ক্লাসরুম সল্যুশন",
      learningManagement: "লার্নিং ম্যানেজমেন্ট",
      assessment: "অ্যাসেসমেন্ট",
      curriculumInstruction: "কারিকুলাম ও ইনস্ট্রাকশন",
      studentIntervention: "শিক্ষার্থী ইন্টারভেনশন",
      mtss: "এমটিএসএস",
      behaviorSupport: "আচরণ সহায়তা",
      collegeCareerLifeReadiness: "কলেজ, ক্যারিয়ার ও লাইফ রেডিনেস",
      cclrNaviance: "সিসিএলআর ন্যাভিয়েন্স",

      operationalExcellence: "অপারেশনাল এক্সিলেন্স",
      resourcePlanning: "রিসোর্স প্ল্যানিং",
      financialStrategy: "ফাইন্যান্সিয়াল স্ট্র্যাটেজি",
      erpSystems: "ইআরপি সিস্টেম",
      predictiveEnrollment: "প্রেডিক্টিভ এনরোলমেন্ট",
      talentManagement: "ট্যালেন্ট ম্যানেজমেন্ট",
      recruitingHr: "রিক্রুটিং ও এইচআর",
      educatorSupport: "এডুকেটর সাপোর্ট",
    },
  },
  en: {
    languageMode: "Language Mode",
    interfaceTitle: "English Interface",
    currentlyViewing: "Currently viewing",
    theK12Os: "The K–12 OS",
    talkToExpert: "Talk to an Expert",
    overview: "Overview",
    menu: "Menu",
    closeMenu: "Close menu",
    groups: {
      home: "Home Connections",
      student: "Student Achievement",
      operational: "Operational Excellence",
      myOs: "★ My Connected OS",
    },
    sections: {
      homeConnectionsPanel: "Home Connections Overview",
      studentInformation: "Student Information",
      sis: "SIS",
      enrollment: "Enrollment",
      specialPrograms: "Special Programs",
      familyEngagement: "Family Engagement",
      communications: "Communications",
      attendanceSupport: "Attendance Support",

      studentAchievement: "Student Achievement",
      classroomSolutions: "Classroom Solutions",
      learningManagement: "Learning Management",
      assessment: "Assessment",
      curriculumInstruction: "Curriculum & Instruction",
      studentIntervention: "Student Intervention",
      mtss: "MTSS",
      behaviorSupport: "Behavior Support",
      collegeCareerLifeReadiness: "College, Career & Life Readiness",
      cclrNaviance: "CCLR Naviance",

      operationalExcellence: "Operational Excellence",
      resourcePlanning: "Resource Planning",
      financialStrategy: "Financial Strategy",
      erpSystems: "ERP Systems",
      predictiveEnrollment: "Predictive Enrollment",
      talentManagement: "Talent Management",
      recruitingHr: "Recruiting and HR",
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
          title:
            language === "bn"
              ? `${text.sections.learningManagement} (Schoology)`
              : "Learning Management (Schoology)",
          href: "#learning-management-schoology",
        },
        {
          title:
            language === "bn"
              ? `${text.sections.assessment} (Performance Matters)`
              : "Assessment (Performance Matters)",
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
          title:
            language === "bn"
              ? `${text.sections.financialStrategy} (Allovue)`
              : "Financial Strategy (Allovue)",
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
  if (group === "student") return "#EDE6B3";

  if (group === "home" || group === "operational" || isMyConnected) {
    return "#16423C";
  }

  return "#16423C";
}

function getReadableGroupColor(group: OpenGroup, isMyConnected = false) {
  if (group === "student") return "#16423C";
  if (group === "home" || group === "operational" || isMyConnected) {
    return "#16423C";
  }

  return "#16423C";
}

function getActiveTitle(activeId: ActiveSectionId, currentMenu: MenuGroup[]) {
  for (const item of currentMenu) {
    if (getIdFromHref(item.href) === activeId) return item.title;

    const child = item.children?.find(
      (childItem) => getIdFromHref(childItem.href) === activeId
    );

    if (child) return child.title;
  }

  return "Connected OS";
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

function Logo() {
  return (
    <Link href="#intro" className="block w-full" aria-label="Shikkha Chat home">
      <div className="relative h-[74px] w-full transition duration-500 hover:scale-[1.02]">
        <Image
          src="/images/logo.png"
          alt="Shikkha Chat"
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
      color: "#16423C",
      active: activeType === "home",
    },
    {
      id: "student",
      color: "#EDE6B3",
      active: activeType === "student",
    },
    {
      id: "operation",
      color: "#16423C",
      active: activeType === "operation",
    },
  ];

  return (
    <div className="mt-2 flex items-start gap-2">
      {columns.map((col, index) => (
        <div key={col.id} className="space-y-1">
          <span
            className="block h-1 rounded-full transition-all duration-500"
            style={{
              width: index === 1 ? 34 : 28,
              background: col.active ? col.color : "#d9dfcf",
            }}
          />

          <div
            className="grid gap-[4px] rounded-md border-2 p-[4px] transition duration-500"
            style={{
              borderColor: col.active ? col.color : "#d9dfcf",
              background: col.active ? `${col.color}18` : "#fbfcf7",
            }}
          >
            {Array.from({ length: index === 1 ? 8 : 6 }).map((_, itemIndex) => (
              <span
                key={itemIndex}
                className="h-[10px] w-[10px] rounded-[2px] transition-all duration-500"
                style={{
                  background: col.active ? col.color : "#d9dfcf",
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
  const readableColor = getReadableGroupColor(
    group,
    activeId === "my-connected-os"
  );

  const activeTitle = getActiveTitle(activeId, currentMenu);
  const groupTitle = getActiveGroupTitle(activeId, language);
  const text = sidebarText[language];

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--sc-border)] bg-white/86 p-3.5 shadow-[0_16px_34px_rgba(22,66,60,0.10)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_5px_rgba(22,66,60,0.06)]"
          style={{ background: accentColor }}
        />

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--sc-muted)]">
          {text.currentlyViewing}
        </p>
      </div>

      <h3
        className="mt-2 text-[16px] font-semibold leading-[1.2] tracking-[-0.03em]"
        style={{ color: readableColor }}
      >
        {activeTitle}
      </h3>

      <p className="mt-1 text-[12px] font-normal leading-5 text-[var(--sc-muted)]">
        {groupTitle}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--sc-secondary-light)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: isHomeConnectionSection(activeId)
              ? "33%"
              : isStudentAchievementSection(activeId)
                ? "66%"
                : "100%",
            background: `linear-gradient(90deg, ${accentColor}, ${readableColor})`,
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
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.4px] font-medium transition-all duration-300",
        "hover:translate-x-1 hover:bg-white/90",
        active
          ? "shadow-[0_12px_28px_rgba(22,66,60,0.12)]"
          : "text-[#263548]",
      ].join(" ")}
      style={{
        background: active
          ? `linear-gradient(90deg, ${color}28, ${color}10)`
          : "transparent",
        color: active ? "#16423C" : "#263548",
      }}
    >
      {active ? (
        <span
          className="absolute -left-4 top-2 h-6 w-1 rounded-r-full"
          style={{ background: color }}
        />
      ) : null}

      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[9px] font-semibold"
        style={{
          background: active ? color : "#e2e8f0",
          color: active ? "#ffffff" : "#64748b",
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
    <div className="mt-4 rounded-[22px] border border-[var(--sc-border)] bg-white/88 p-3.5 shadow-[0_16px_34px_rgba(22,66,60,0.10)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--sc-muted)]">
            {text.languageMode}
          </p>

          <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.03em] text-[var(--sc-primary)]">
            {text.interfaceTitle}
          </h3>
        </div>

        <span className="rounded-full bg-[var(--sc-secondary-light)] px-3 py-1 text-[11px] font-semibold text-[var(--sc-primary)]">
          {isBangla ? "BN" : "EN"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setLanguage(isBangla ? "en" : "bn")}
        className="group relative h-12 w-full overflow-hidden rounded-full border border-[var(--sc-border)] bg-[var(--sc-secondary-light)] p-1 shadow-inner transition duration-300 hover:bg-white"
        aria-label="Toggle language"
      >
        <span
          className={[
            "absolute top-1 h-10 w-[calc(50%-4px)] rounded-full bg-[var(--sc-primary)] shadow-[0_12px_24px_rgba(22,66,60,0.28)] transition-all duration-500 ease-out",
            isBangla ? "left-1" : "left-[calc(50%)]",
          ].join(" ")}
          aria-hidden="true"
        />

        <span className="relative z-10 grid h-full grid-cols-2 text-[13px] font-semibold">
          <span
            className={[
              "grid place-items-center rounded-full transition duration-300",
              isBangla ? "text-white" : "text-[var(--sc-primary)]",
            ].join(" ")}
          >
            বাংলা
          </span>

          <span
            className={[
              "grid place-items-center rounded-full transition duration-300",
              !isBangla ? "text-white" : "text-[var(--sc-primary)]",
            ].join(" ")}
          >
            English
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
        "group relative block rounded-xl px-3 py-2.5 text-[13.8px] font-semibold transition-all duration-300",
        "hover:translate-x-1 hover:bg-[var(--sc-secondary-light)]",
        active ? "shadow-[0_10px_24px_rgba(22,66,60,0.12)]" : "",
      ].join(" ")}
      style={{
        color,
        background: active ? `${color}14` : "transparent",
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
        className="sidebar-open-button fixed left-4 top-4 z-[80] grid h-12 w-12 place-items-center rounded-2xl border border-[var(--sc-border)] bg-white/92 text-[var(--sc-primary)] shadow-[0_14px_34px_rgba(22,66,60,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[var(--sc-secondary-light)]"
        aria-label={text.menu}
      >
        <span className="block h-[2px] w-5 rounded-full bg-current shadow-[0_7px_0_current,0_-7px_0_current]" />
      </button>

      {drawerOpen ? (
        <button
          type="button"
          aria-label={text.closeMenu}
          onClick={() => setDrawerOpen(false)}
          className="sidebar-mobile-backdrop fixed inset-0 z-[85] bg-[rgba(7,21,19,0.34)] backdrop-blur-[2px]"
        />
      ) : null}

      <aside
        className={[
          "connected-sidebar fixed left-0 top-0 z-[90] flex h-screen w-[320px] flex-col overflow-hidden border-r border-[var(--sc-border)] bg-[#fbfcf7] shadow-[12px_0_40px_rgba(22,66,60,0.12)] transition-transform duration-500",
          drawerOpen ? "is-open" : "",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(22,66,60,0.10),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(237,230,179,0.34),transparent_32%)]" />

        <div className="no-scrollbar relative flex h-full flex-col overflow-y-auto px-5 py-7">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="sidebar-close-button absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl border border-[var(--sc-border)] bg-white text-[18px] text-[var(--sc-primary)] shadow-sm"
            aria-label={text.closeMenu}
          >
            ×
          </button>

          <Logo />
          <LanguageSwitch />

          <div className="mt-6 rounded-2xl border border-[var(--sc-border)] bg-white/72 p-4 shadow-[0_14px_30px_rgba(22,66,60,0.06)]">
            <p className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--sc-primary)]">
              {text.theK12Os}
            </p>

            <MiniOsIcon activeId={activeId} />

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
              const readableColor = getReadableGroupColor(group, isMyConnected);

              const openState = group ? openGroup === group : false;

              if (item.children && group) {
                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenGroup((current) =>
                          current === group ? null : group
                        );
                      }}
                      className={[
                        "group relative flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[14.2px] font-semibold tracking-[-0.02em] transition-all duration-300",
                        "hover:translate-x-1 hover:bg-white/90",
                        activeGroup
                          ? "shadow-[0_12px_26px_rgba(22,66,60,0.10)]"
                          : "text-[#172033]",
                      ].join(" ")}
                      style={{
                        color: activeGroup ? readableColor : "#172033",
                        background: activeGroup
                          ? `linear-gradient(90deg, ${color}24, ${color}0d)`
                          : "transparent",
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
                        <div className="mt-1.5 space-y-1.5 rounded-2xl border-l border-[var(--sc-border)] bg-white/35 py-1.5 pl-4 pr-1">
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

          <div className="mt-auto pt-8">
            <Link
              href="#connect"
              className="flex h-12 items-center justify-center rounded-xl bg-[var(--sc-primary)] text-[14px] font-black text-white shadow-[0_14px_28px_rgba(22,66,60,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--sc-primary-dark)]"
            >
              {text.talkToExpert}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
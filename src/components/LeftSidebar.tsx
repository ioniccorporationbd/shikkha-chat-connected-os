"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

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

const menu: MenuGroup[] = [
  {
    title: "Home Connections",
    href: "#home-connections-panel",
    group: "home",
    children: [
      { title: "Student Information", href: "#student-information" },
      { title: "SIS", href: "#sis" },
      { title: "Enrollment", href: "#enrollment" },
      { title: "Special Programs", href: "#special-programs" },
      { title: "Family Engagement", href: "#family-engagement" },
      { title: "Communications", href: "#communications" },
      { title: "Attendance Support", href: "#attendance-support" },
    ],
  },
  {
    title: "Student Achievement",
    href: "#student-achievement",
    group: "student",
    children: [
      { title: "Student Achievement", href: "#student-achievement" },
      { title: "Classroom Solutions", href: "#classroom-solutions" },
      {
        title: "Learning Management (Schoology)",
        href: "#learning-management-schoology",
      },
      {
        title: "Assessment (Performance Matters)",
        href: "#assessment-performance-matters",
      },
      { title: "Curriculum & Instruction", href: "#curriculum-instruction" },
      { title: "Student Intervention", href: "#student-intervention" },
      { title: "MTSS", href: "#mtss" },
      { title: "Behavior Support", href: "#behavior-support" },
      {
        title: "College, Career & Life Readiness",
        href: "#college-career-life-readiness",
      },
      { title: "CCLR (Naviance)", href: "#cclr-naviance" },
    ],
  },
  {
    title: "Operational Excellence",
    href: "#operational-excellence",
    group: "operational",
    children: [
      { title: "Operational Excellence", href: "#operational-excellence" },
      { title: "Resource Planning", href: "#resource-planning" },
      {
        title: "Financial Strategy (Allovue)",
        href: "#financial-strategy-allovue",
      },
      { title: "ERP Systems", href: "#erp-systems" },
      { title: "Predictive Enrollment", href: "#predictive-enrollment" },
      { title: "Talent Management", href: "#talent-management" },
      { title: "Recruiting and HR", href: "#recruiting-and-hr" },
      { title: "Educator Support", href: "#educator-support" },
    ],
  },
  { title: "★ My Connected OS", href: "#my-connected-os" },
];

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
  if (group === "home") return "#ff7438";
  if (group === "student") return "#9CF048";
  if (group === "operational") return "#ECC6FE";
  if (isMyConnected) return "#0068ff";
  return "#0068ff";
}

function getReadableGroupColor(group: OpenGroup, isMyConnected = false) {
  if (group === "home") return "#af3611";
  if (group === "student") return "#236000";
  if (group === "operational") return "#5B1276";
  if (isMyConnected) return "#004fc4";
  return "#004fc4";
}

function getActiveTitle(activeId: ActiveSectionId) {
  for (const item of menu) {
    if (getIdFromHref(item.href) === activeId) return item.title;

    const child = item.children?.find(
      (childItem) => getIdFromHref(childItem.href) === activeId
    );

    if (child) return child.title;
  }

  return "Connected OS";
}

function getActiveGroupTitle(activeId: ActiveSectionId) {
  if (isHomeConnectionSection(activeId)) return "Home Connections";
  if (isStudentAchievementSection(activeId)) return "Student Achievement";
  if (isOperationalExcellenceSection(activeId)) return "Operational Excellence";
  return "My Connected OS";
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
      color: "#ff7438",
      active: activeType === "home",
    },
    {
      id: "student",
      color: "#9CF048",
      active: activeType === "student",
    },
    {
      id: "operation",
      color: "#ECC6FE",
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
              background: col.active ? col.color : "#c9d1da",
            }}
          />

          <div
            className="grid gap-[4px] rounded-md border-2 p-[4px] transition duration-500"
            style={{
              borderColor: col.active ? col.color : "#c9d1da",
              background: col.active ? `${col.color}18` : "#edf2f7",
            }}
          >
            {Array.from({ length: index === 1 ? 8 : 6 }).map((_, itemIndex) => (
              <span
                key={itemIndex}
                className="h-[10px] w-[10px] rounded-[2px] transition-all duration-500"
                style={{
                  background: col.active ? col.color : "#c9d1da",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveStatusCard({ activeId }: { activeId: ActiveSectionId }) {
  const group = getGroupById(activeId);
  const accentColor = getGroupColor(group, activeId === "my-connected-os");
  const readableColor = getReadableGroupColor(
    group,
    activeId === "my-connected-os"
  );
  const activeTitle = getActiveTitle(activeId);
  const groupTitle = getActiveGroupTitle(activeId);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/82 p-3.5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_5px_rgba(15,23,42,0.04)]"
          style={{ background: accentColor }}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Currently viewing
        </p>
      </div>

      <h3
        className="mt-2 text-[16px] font-semibold leading-[1.15] tracking-[-0.03em]"
        style={{ color: readableColor }}
      >
        {activeTitle}
      </h3>

      <p className="mt-1 text-[12px] font-normal leading-5 text-slate-600">
        {groupTitle}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
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
          ? "shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
          : "text-[#263548]",
      ].join(" ")}
      style={{
        background: active
          ? `linear-gradient(90deg, ${color}28, ${color}10)`
          : "transparent",
        color: active
          ? color === "#9CF048"
            ? "#236000"
            : color === "#ECC6FE"
              ? "#5B1276"
              : color === "#ff7438"
                ? "#af3611"
                : color
          : "#263548",
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
        "hover:translate-x-1 hover:bg-slate-100",
        active ? "shadow-[0_10px_24px_rgba(0,104,255,0.1)]" : "",
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
  const [activeId, setActiveId] =
    useState<ActiveSectionId>("home-connections-panel");

  const [openGroup, setOpenGroup] = useState<OpenGroup>("home");

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
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[320px] overflow-hidden border-r border-slate-200 bg-[#fbfdff] shadow-[12px_0_40px_rgba(15,23,42,0.07)] lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(0,104,255,0.07),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(255,116,56,0.07),transparent_32%)]" />

      <div className="no-scrollbar relative flex h-full flex-col overflow-y-auto px-5 py-7">
        <Logo />

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/72 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.055)]">
          <p className="text-[13px] font-semibold tracking-[-0.02em] text-[#001b70]">
            The K–12 OS
          </p>

          <MiniOsIcon activeId={activeId} />
          <ActiveStatusCard activeId={activeId} />
        </div>

        <nav className="mt-6 space-y-1.5 text-[13px]">
          {menu.map((item) => {
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
            const color = getGroupColor(group, item.title.includes("My"));
            const readableColor = getReadableGroupColor(
              group,
              item.title.includes("My")
            );

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
                        ? "shadow-[0_12px_26px_rgba(15,23,42,0.1)]"
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
                      <div className="mt-1.5 space-y-1.5 rounded-2xl border-l border-slate-200/80 bg-white/35 py-1.5 pl-4 pr-1">
                        {item.href === "#home-connections-panel" ? (
                          <SidebarChildLink
                            child={{
                              title: "Overview",
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
                }}
              />
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link
            href="#connect"
            className="flex h-12 items-center justify-center rounded-xl bg-[#0068ff] text-[14px] font-black text-white shadow-[0_14px_28px_rgba(0,104,255,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#005be0]"
          >
            Talk to an Expert
          </Link>
        </div>
      </div>
    </aside>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
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
  | "operational-excellence"
  | "my-connected-os";

type MenuChild = {
  title: string;
  href: string;
};

type MenuGroup = {
  title: string;
  href: string;
  children?: MenuChild[];
};

const menu: MenuGroup[] = [
  {
    title: "Home Connections",
    href: "#home-connections-panel",
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
  { title: "Student Achievement", href: "#student-achievement" },
  { title: "Operational Excellence", href: "#operational-excellence" },
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

const allSectionIds: ActiveSectionId[] = [
  ...homeConnectionSectionIds,
  "student-achievement",
  "operational-excellence",
  "my-connected-os",
];

function getIdFromHref(href: string) {
  return href.replace("#", "") as ActiveSectionId;
}

function isHomeConnectionSection(id: string) {
  return homeConnectionSectionIds.includes(id as ActiveSectionId);
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
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  dispatchActiveSection(id);
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
  const activeType = activeId.includes("student-achievement")
    ? "student"
    : activeId.includes("operational-excellence")
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
      color: "#00a86b",
      active: activeType === "student",
    },
    {
      id: "operation",
      color: "#8b5cf6",
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

function SidebarChildLink({
  child,
  active,
}: {
  child: MenuChild;
  active: boolean;
}) {
  const id = getIdFromHref(child.href);

  return (
    <Link
      href={child.href}
      onClick={(event) => {
        event.preventDefault();
        moveRightSidebarTo(id);
      }}
      className={[
        "relative block rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-all duration-300",
        "hover:translate-x-1 hover:bg-[#ff7438]/10",
        active
          ? "bg-[#ffd09a] font-black text-[#7a270b] shadow-[0_10px_22px_rgba(255,116,56,0.16)]"
          : "text-slate-700",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute -left-4 top-2 h-6 w-1 rounded-r-full bg-[#ff7438]" />
      ) : null}

      {child.title}
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
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "group relative block rounded-xl px-3 py-2.5 font-black transition-all duration-300",
        "hover:translate-x-1 hover:bg-slate-100",
        active ? "bg-[#eaf4ff] shadow-[0_10px_24px_rgba(0,104,255,0.08)]" : "",
      ].join(" ")}
      style={{ color }}
    >
      {active ? (
        <span className="absolute -left-5 top-2 h-7 w-1 rounded-r-full bg-[#0068ff]" />
      ) : null}

      <span>{title}</span>
    </Link>
  );
}

export default function LeftSidebar() {
  const [activeId, setActiveId] =
    useState<ActiveSectionId>("home-connections-panel");

  const [openHome, setOpenHome] = useState(true);

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: ActiveSectionId }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      if (allSectionIds.includes(id)) {
        setActiveId(id);

        if (isHomeConnectionSection(id)) {
          setOpenHome(true);
        }
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

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[292px] overflow-hidden border-r border-slate-200 bg-white shadow-[12px_0_40px_rgba(15,23,42,0.06)] lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(0,104,255,0.07),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(255,116,56,0.07),transparent_32%)]" />

      <div className="no-scrollbar relative flex h-full flex-col overflow-y-auto px-5 py-7">
        <Logo />

        <div className="mt-6">
          <p className="text-[13px] font-black tracking-[-0.02em] text-[#001b70]">
            The K–12 OS
          </p>

          <MiniOsIcon activeId={activeId} />
        </div>

        <nav className="mt-7 space-y-1.5 text-[13px]">
          {menu.map((item) => {
            const itemId = getIdFromHref(item.href);

            const activeGroup =
              item.children?.some(
                (child) => getIdFromHref(child.href) === activeId
              ) ||
              itemId === activeId ||
              (item.href === "#home-connections-panel" && homeGroupActive);

            const color = item.title.includes("Student")
              ? "#006642"
              : item.title.includes("Operational")
                ? "#5b21b6"
                : "#7a270b";

            if (item.children) {
              return (
                <div key={item.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenHome((current) => !current);
                    }}
                    className={[
                      "group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-black transition-all duration-300",
                      "hover:translate-x-1 hover:bg-[#ff7438]/10",
                      activeGroup
                        ? "bg-[#fff2e8] shadow-[0_12px_26px_rgba(255,116,56,0.1)]"
                        : "",
                    ].join(" ")}
                    style={{ color }}
                  >
                    {activeGroup ? (
                      <span className="absolute -left-5 top-2 h-7 w-1 rounded-r-full bg-[#ff7438]" />
                    ) : null}

                    <span>{item.title}</span>

                    <span
                      className={[
                        "transition-transform duration-300",
                        openHome ? "rotate-180" : "",
                      ].join(" ")}
                    >
                      ⌄
                    </span>
                  </button>

                  <div
                    className={[
                      "grid transition-all duration-500",
                      openHome
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-1 space-y-1.5 pl-4">
                        <SidebarChildLink
                          child={{
                            title: "Overview",
                            href: "#home-connections-panel",
                          }}
                          active={activeId === "home-connections-panel"}
                        />

                        {item.children.map((child) => {
                          const childId = getIdFromHref(child.href);
                          const active = activeId === childId;

                          return (
                            <SidebarChildLink
                              key={child.href}
                              child={child}
                              active={active}
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

                  if (isHomeConnectionSection(itemId)) {
                    moveRightSidebarTo(itemId);
                    return;
                  }

                  smoothPageScrollTo(itemId);
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
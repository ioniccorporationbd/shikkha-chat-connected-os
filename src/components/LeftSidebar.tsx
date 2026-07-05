"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type MenuGroup = {
  title: string;
  href: string;
  children?: { title: string; href: string }[];
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

const sectionIds = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

function moveRightSidebarTo(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", {
      detail: { id },
    })
  );
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

function MiniOsIcon({ active }: { active: string }) {
  const columns = [
    { id: "home", color: "#ff7438", active: active !== "student" && active !== "operation" },
    { id: "student", color: "#00a86b", active: active === "student" },
    { id: "operation", color: "#8b5cf6", active: active === "operation" },
  ];

  return (
    <div className="mt-2 flex items-start gap-2">
      {columns.map((col, idx) => (
        <div key={col.id} className="space-y-1">
          <span
            className="block h-1 rounded-full transition-all duration-500"
            style={{
              width: idx === 1 ? 34 : 28,
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
            {Array.from({ length: idx === 1 ? 8 : 6 }).map((_, i) => (
              <span
                key={i}
                className="h-[10px] w-[10px] rounded-[2px] transition-all duration-500"
                style={{ background: col.active ? col.color : "#c9d1da" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeftSidebar() {
  const [activeId, setActiveId] = useState("home-connections-panel");
  const [openHome, setOpenHome] = useState(true);

  useEffect(() => {
    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
          setOpenHome(true);
        }
      },
      { root: null, threshold: [0.2, 0.45, 0.7], rootMargin: "-28% 0px -52% 0px" }
    );

    const handleRightSectionActive = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;

      if (id && sectionIds.includes(id)) {
        setActiveId(id);
        setOpenHome(true);
      }
    };

    targets.forEach((target) => observer.observe(target));
    window.addEventListener("connected-os-active-section", handleRightSectionActive);

    return () => {
      observer.disconnect();
      window.removeEventListener("connected-os-active-section", handleRightSectionActive);
    };
  }, []);

  const isChildActive = (href: string) => href.replace("#", "") === activeId;

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[292px] overflow-hidden border-r border-slate-200 bg-white shadow-[12px_0_40px_rgba(15,23,42,0.06)] lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(0,104,255,0.07),transparent_30%),radial-gradient(circle_at_10%_70%,rgba(255,116,56,0.07),transparent_32%)]" />

      <div className="relative flex h-full flex-col overflow-y-auto px-5 py-7 no-scrollbar">
        <Logo />

        <div className="mt-6">
          <p className="text-[13px] font-black tracking-[-0.02em] text-[#001b70]">The K–12 OS</p>
          <MiniOsIcon active="home" />
        </div>

        <nav className="mt-7 space-y-1.5 text-[13px]">
          {menu.map((item) => {
            const activeGroup = item.children?.some((child) => isChildActive(child.href)) || isChildActive(item.href);
            const color = item.title.includes("Student") ? "#006642" : item.title.includes("Operational") ? "#5b21b6" : "#7a270b";

            if (item.children) {
              return (
                <div key={item.title}>
                  <button
                    type="button"
                    onClick={() => setOpenHome((current) => !current)}
                    className="group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-black transition-all duration-300 hover:translate-x-1 hover:bg-[#ff7438]/10"
                    style={{ color }}
                  >
                    <span>{item.title}</span>
                    <span className={`transition-transform duration-300 ${openHome ? "rotate-180" : ""}`}>⌄</span>
                    {activeGroup ? <span className="absolute -left-5 top-2 h-7 w-1 rounded-r-full bg-[#ff7438]" /> : null}
                  </button>

                  <div className={`grid transition-all duration-500 ${openHome ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="mt-1 space-y-1.5 pl-4">
                        {item.children.map((child) => {
                          const active = isChildActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={(event) => {
                                event.preventDefault();
                                moveRightSidebarTo(child.href.replace("#", ""));
                              }}
                              className={`relative block rounded-lg px-3 py-2 font-medium transition-all duration-300 hover:translate-x-1 hover:bg-[#ff7438]/10 ${active ? "bg-[#ffd09a] font-black text-[#7a270b]" : "text-slate-700"}`}
                            >
                              {active ? <span className="absolute -left-4 top-2 h-6 w-1 rounded-r-full bg-[#ff7438]" /> : null}
                              {child.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2.5 font-black transition-all duration-300 hover:translate-x-1 hover:bg-slate-100"
                style={{ color }}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <button className="mb-5 grid h-8 w-8 place-items-center rounded-full bg-slate-600 text-sm font-black text-white transition hover:scale-110 hover:bg-[#0068ff]" type="button" aria-label="Accessibility">
            ♿
          </button>
          <Link href="#connect" className="flex h-12 items-center justify-center rounded-xl bg-[#0068ff] text-[14px] font-black text-white shadow-[0_14px_28px_rgba(0,104,255,0.25)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#005be0]">
            Talk to an Expert
          </Link>
        </div>
      </div>
    </aside>
  );
}

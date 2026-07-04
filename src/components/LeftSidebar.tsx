"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type SidebarSectionKey = "home" | "student" | "operation" | "myos";

type SidebarChildGroup = {
  title: string;
  items: string[];
};

type SidebarItem = {
  key: SidebarSectionKey;
  label: string;
  href: string;
  color: string;
  lightColor: string;
  textColor: string;
  glowColor: string;
  groups?: SidebarChildGroup[];
};

const sidebarItems: SidebarItem[] = [
  {
    key: "home",
    label: "Home Connections",
    href: "#home-connections",
    color: "#ff6f3c",
    lightColor: "rgba(255,111,60,0.12)",
    textColor: "#8f2c08",
    glowColor: "rgba(255,111,60,0.28)",
    groups: [
      {
        title: "Student Information",
        items: ["SIS", "Enrollment", "Special Programs"],
      },
      {
        title: "Family Engagement",
        items: ["Communications", "Attendance Support"],
      },
    ],
  },
  {
    key: "student",
    label: "Student Achievement",
    href: "#student-achievement",
    color: "#00a86b",
    lightColor: "rgba(0,168,107,0.12)",
    textColor: "#006642",
    glowColor: "rgba(0,168,107,0.28)",
    groups: [
      {
        title: "Classroom Solutions",
        items: ["Learning Management", "Assessment", "Curriculum & Instruction"],
      },
      {
        title: "Student Intervention",
        items: ["MTSS", "Behavior Support"],
      },
      {
        title: "College, Career & Life Readiness",
        items: ["CCLR"],
      },
    ],
  },
  {
    key: "operation",
    label: "Operational Excellence",
    href: "#operational-excellence",
    color: "#8b5cf6",
    lightColor: "rgba(139,92,246,0.13)",
    textColor: "#5b21b6",
    glowColor: "rgba(139,92,246,0.3)",
    groups: [
      {
        title: "Resource Planning",
        items: ["Financial Strategy", "ERP Systems", "Predictive Enrollment"],
      },
      {
        title: "Talent Management",
        items: ["Recruiting & Human Resources", "Educator Support"],
      },
    ],
  },
  {
    key: "myos",
    label: "★ My Connected OS",
    href: "#my-connected-os",
    color: "#0068ff",
    lightColor: "rgba(0,104,255,0.12)",
    textColor: "#002b86",
    glowColor: "rgba(0,104,255,0.28)",
  },
];

function SidebarLogo() {
  return (
    <Link href="/" className="group block w-full">
      <div className="relative h-[72px] w-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-[1.02]">
        <Image
          src="/images/logo.png"
          alt="Shikkha Chat"
          fill
          priority
          sizes="260px"
          className="object-contain object-left"
        />
      </div>
    </Link>
  );
}

function ChevronIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <span
      className="relative h-4 w-4 shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <span
        className="absolute left-[3px] top-[7px] h-[2px] w-[6px] rotate-45 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span
        className="absolute right-[3px] top-[7px] h-[2px] w-[6px] -rotate-45 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

export default function LeftSidebar() {
  const [openSection, setOpenSection] = useState<SidebarSectionKey | null>(null);

  const handleToggle = (key: SidebarSectionKey) => {
    setOpenSection((current) => (current === key ? null : key));
  };

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[310px] overflow-hidden border-r border-slate-200/80 bg-white shadow-[14px_0_45px_rgba(15,23,42,0.07)] lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(0,104,255,0.06),transparent_28%),radial-gradient(circle_at_8%_48%,rgba(0,168,107,0.05),transparent_30%),radial-gradient(circle_at_95%_95%,rgba(139,92,246,0.05),transparent_28%)]" />

      <div className="relative flex h-full flex-col overflow-y-auto px-6 py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SidebarLogo />

        <nav className="mt-8 space-y-2.5">
          {sidebarItems.map((item) => {
            const isOpen = openSection === item.key;
            const hasDropdown = Boolean(item.groups?.length);

            return (
              <div key={item.key} className="relative">
                <span
                  className="absolute -left-6 top-2 h-9 w-[5px] rounded-r-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    backgroundColor: item.color,
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "scaleY(1)" : "scaleY(0.2)",
                    boxShadow: isOpen ? `0 8px 22px ${item.glowColor}` : "none",
                  }}
                />

                {hasDropdown ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]"
                    style={{
                      backgroundColor: isOpen ? item.lightColor : "transparent",
                    }}
                  >
                    <span
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/75 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                      aria-hidden="true"
                    />

                    <span
                      className="relative block whitespace-nowrap text-[13px] font-extrabold leading-5 tracking-[-0.01em] transition-all duration-700"
                      style={{
                        color: item.textColor,
                        transform: isOpen ? "translateX(3px)" : "translateX(0)",
                      }}
                    >
                      {item.label}
                    </span>

                    <ChevronIcon open={isOpen} color={item.textColor} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleToggle(item.key)}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]"
                    style={{
                      backgroundColor: isOpen ? item.lightColor : "transparent",
                    }}
                  >
                    <span
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/75 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                      aria-hidden="true"
                    />

                    <span
                      className="relative block whitespace-nowrap text-[13px] font-extrabold leading-5 tracking-[-0.01em] transition-all duration-700"
                      style={{ color: item.textColor }}
                    >
                      {item.label}
                    </span>
                  </Link>
                )}

                <div
                  className="grid transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    gridTemplateRows: isOpen && hasDropdown ? "1fr" : "0fr",
                    opacity: isOpen && hasDropdown ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    {item.groups ? (
                      <div className="space-y-4 pb-3 pl-5 pt-4">
                        {item.groups.map((group, groupIndex) => (
                          <div
                            key={group.title}
                            className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            style={{
                              transitionDelay: isOpen
                                ? `${groupIndex * 70}ms`
                                : "0ms",
                              transform: isOpen
                                ? "translateY(0)"
                                : "translateY(-8px)",
                              opacity: isOpen ? 1 : 0,
                            }}
                          >
                            <h3 className="whitespace-nowrap text-[13px] font-extrabold leading-5 tracking-[-0.02em] text-slate-950">
                              {group.title}
                            </h3>

                            <div className="mt-2.5 space-y-1.5">
                              {group.items.map((child, childIndex) => (
                                <Link
                                  key={child}
                                  href={item.href}
                                  className="group/child relative block rounded-xl py-1.5 pl-0 text-[12px] font-medium leading-5 text-slate-700 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-1 hover:bg-white/80 hover:text-[#0068ff]"
                                  style={{
                                    transitionDelay: isOpen
                                      ? `${groupIndex * 60 + childIndex * 30}ms`
                                      : "0ms",
                                  }}
                                >
                                  <span
                                    className="absolute left-0 top-1/2 h-[5px] w-[5px] -translate-y-1/2 scale-0 rounded-full opacity-0 transition-all duration-500 group-hover/child:scale-100 group-hover/child:opacity-100"
                                    style={{
                                      backgroundColor: item.color,
                                      boxShadow: `0 0 14px ${item.glowColor}`,
                                    }}
                                  />

                                  <span className="block whitespace-nowrap transition-all duration-500 group-hover/child:pl-3">
                                    {child}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <button
            type="button"
            aria-label="Accessibility"
            className="group mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-white transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 hover:bg-[#0068ff] hover:shadow-[0_14px_28px_rgba(0,104,255,0.3)]"
          >
            <span className="relative block h-5 w-5 transition-transform duration-700 group-hover:rotate-12">
              <span className="absolute left-1/2 top-0 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-white" />
              <span className="absolute left-1/2 top-[7px] h-[10px] w-[3px] -translate-x-1/2 rounded-full bg-white" />
              <span className="absolute left-[2px] top-[7px] h-[3px] w-[16px] rounded-full bg-white" />
              <span className="absolute left-[5px] top-[13px] h-[3px] w-[9px] rotate-[65deg] rounded-full bg-white" />
              <span className="absolute right-[5px] top-[13px] h-[3px] w-[9px] -rotate-[65deg] rounded-full bg-white" />
            </span>
          </button>

          <Link
            href="#demo"
            className="group relative flex h-[50px] w-full overflow-hidden rounded-2xl bg-[#0068ff] text-[14px] font-extrabold text-white shadow-[0_14px_30px_rgba(0,104,255,0.26)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#005be0] hover:shadow-[0_22px_45px_rgba(0,104,255,0.36)]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

            <span className="relative flex h-full w-full items-center justify-center whitespace-nowrap">
              Talk to an Expert
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
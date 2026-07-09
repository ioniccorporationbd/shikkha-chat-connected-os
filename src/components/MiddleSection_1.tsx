"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import HomeConnections from "@/components/MiddleSectionComponents_1/HomeConnections";
import StudentInformation from "@/components/MiddleSectionComponents_1/StudentInformation";
import SIS from "@/components/MiddleSectionComponents_1/SIS";
import Enrollment from "@/components/MiddleSectionComponents_1/Enrollment";
import SpecialPrograms from "@/components/MiddleSectionComponents_1/SpecialPrograms";
import FamilyEngagement from "@/components/MiddleSectionComponents_1/FamilyEngagement";
import Communications from "@/components/MiddleSectionComponents_1/Communications";
import AttendanceSupport from "@/components/MiddleSectionComponents_1/AttendanceSupport";

type ActiveSectionId =
  | "home-connections-panel"
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support";

const defaultActiveSection: ActiveSectionId = "home-connections-panel";

const sectionOrder: ActiveSectionId[] = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

const sectionTitles: Record<ActiveSectionId, string> = {
  "home-connections-panel": "Home Connections",
  "student-information": "Student Information",
  sis: "SIS",
  enrollment: "Enrollment",
  "special-programs": "Special Programs",
  "family-engagement": "Family Engagement",
  communications: "Communications",
  "attendance-support": "Attendance Support",
};

const sectionComponents: Record<ActiveSectionId, ReactNode> = {
  "home-connections-panel": <HomeConnections />,
  "student-information": <StudentInformation />,
  sis: <SIS />,
  enrollment: <Enrollment />,
  "special-programs": <SpecialPrograms />,
  "family-engagement": <FamilyEngagement />,
  communications: <Communications />,
  "attendance-support": <AttendanceSupport />,
};

function isValidSectionId(id: string): id is ActiveSectionId {
  return sectionOrder.includes(id as ActiveSectionId);
}

export default function MiddleSection() {
  const [activeSection, setActiveSection] =
    useState<ActiveSectionId>(defaultActiveSection);

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;

      if (!id || !isValidSectionId(id)) return;

      setActiveSection((current) => {
        if (current === id) return current;
        return id;
      });
    };

    window.addEventListener(
      "connected-os-active-section",
      handleActiveSection
    );

    window.dispatchEvent(
      new CustomEvent("connected-os-active-section", {
        detail: { id: defaultActiveSection },
      })
    );

    return () => {
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection
      );
    };
  }, []);

  const activeTitle = useMemo(() => {
    return sectionTitles[activeSection];
  }, [activeSection]);

  const ActiveComponent = sectionComponents[activeSection];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.08]" />

      <div className="pointer-events-none absolute left-[14%] top-[16%] h-[280px] w-[280px] rounded-full bg-[var(--color-secondary)] opacity-60 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[14%] right-[12%] h-[340px] w-[340px] rounded-full bg-[var(--color-secondary)] opacity-60 blur-[105px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-60 blur-[85px]" />

      <div className="pointer-events-none absolute left-8 top-8 z-30 hidden lg:block">
        <motion.div
          key={activeTitle}
          initial={{
            opacity: 0,
            y: -8,
            scale: 0.96,
            filter: "blur(6px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="rounded-full border border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-white)_72%,transparent)] px-5 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] backdrop-blur-md"
        >
          {activeTitle}
        </motion.div>
      </div>

      <div className="relative z-10 h-screen w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.965,
              filter: "blur(10px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              y: -24,
              scale: 0.975,
              filter: "blur(8px)",
            }}
            transition={{
              duration: 0.58,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {ActiveComponent}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
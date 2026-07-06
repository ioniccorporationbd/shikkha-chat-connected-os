"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import HomeConnections from "@/components/MiddleSectionComponents/HomeConnections";
import StudentInformation from "@/components/MiddleSectionComponents/StudentInformation";
import SIS from "@/components/MiddleSectionComponents/SIS";
import Enrollment from "@/components/MiddleSectionComponents/Enrollment";
import SpecialPrograms from "@/components/MiddleSectionComponents/SpecialPrograms";
import FamilyEngagement from "@/components/MiddleSectionComponents/FamilyEngagement";
import Communications from "@/components/MiddleSectionComponents/Communications";
import AttendanceSupport from "@/components/MiddleSectionComponents/AttendanceSupport";

type ActiveSectionId =
  | "home-connections-panel"
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support";

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

const sectionComponents: Record<ActiveSectionId, React.ReactNode> = {
  "home-connections-panel": <HomeConnections />,
  "student-information": <StudentInformation />,
  sis: <SIS />,
  enrollment: <Enrollment />,
  "special-programs": <SpecialPrograms />,
  "family-engagement": <FamilyEngagement />,
  communications: <Communications />,
  "attendance-support": <AttendanceSupport />,
};

export default function MiddleSection() {
  const [activeSection, setActiveSection] = useState<ActiveSectionId>(
    "home-connections-panel"
  );

  useEffect(() => {
    const handleActiveSection = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: ActiveSectionId }>;
      const id = customEvent.detail?.id;

      if (!id) return;

      if (id in sectionComponents) {
        setActiveSection(id);
      }
    };

    window.addEventListener(
      "connected-os-active-section",
      handleActiveSection
    );

    return () => {
      window.removeEventListener(
        "connected-os-active-section",
        handleActiveSection
      );
    };
  }, []);

  const activeTitle = useMemo(() => {
    return sectionTitles[activeSection] || "Home Connections";
  }, [activeSection]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#f7fbff]">
      {/* dotted background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />

      {/* soft glow */}
      <div className="pointer-events-none absolute left-[14%] top-[16%] h-[280px] w-[280px] rounded-full bg-[#ff7438]/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[14%] right-[12%] h-[340px] w-[340px] rounded-full bg-[#0068ff]/10 blur-[105px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-[85px]" />

      {/* section label */}
      <div className="pointer-events-none absolute left-8 top-8 z-20 hidden lg:block">
        <div className="rounded-full border border-[#ff7438]/20 bg-white/70 px-5 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-[#ff7438] shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-md">
          {activeTitle}
        </div>
      </div>

      {/* active component render area */}
      <div className="relative z-10 flex h-screen w-full items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{
              opacity: 0,
              y: 28,
              scale: 0.96,
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
              y: -22,
              scale: 0.97,
              filter: "blur(8px)",
            }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex h-full w-full items-center justify-center"
          >
            {sectionComponents[activeSection]}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import StudentAchievementOverview from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/StudentAchievementOverview";
import ClassroomSolutions from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/ClassroomSolutions";
import LearningManagementSchoology from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/LearningManagementSchoology";
import AssessmentPerformanceMatters from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/AssessmentPerformanceMatters";
import CurriculumInstruction from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/CurriculumInstruction";
import StudentIntervention from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/StudentIntervention";
import MTSS from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/MTSS";
import BehaviorSupport from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/BehaviorSupport";
import CollegeCareerLifeReadiness from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/CollegeCareerLifeReadiness";
import CCLRNaviance from "@/components/MiddleSectionComponents_2/StudentAchievementComponents/CCLRNaviance";

type ActiveSectionId =
  | "student-achievement"
  | "classroom-solutions"
  | "learning-management-schoology"
  | "assessment-performance-matters"
  | "curriculum-instruction"
  | "student-intervention"
  | "mtss"
  | "behavior-support"
  | "college-career-life-readiness"
  | "cclr-naviance";

const defaultActiveSection: ActiveSectionId = "student-achievement";

const sectionOrder: ActiveSectionId[] = [
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

const sectionTitles: Record<ActiveSectionId, string> = {
  "student-achievement": "Student Achievement",
  "classroom-solutions": "Classroom Solutions",
  "learning-management-schoology": "Learning Management",
  "assessment-performance-matters": "Assessment",
  "curriculum-instruction": "Curriculum & Instruction",
  "student-intervention": "Student Intervention",
  mtss: "MTSS",
  "behavior-support": "Behavior Support",
  "college-career-life-readiness": "College, Career & Life Readiness",
  "cclr-naviance": "CCLR Naviance",
};

const sectionComponents: Record<ActiveSectionId, ReactNode> = {
  "student-achievement": <StudentAchievementOverview />,
  "classroom-solutions": <ClassroomSolutions />,
  "learning-management-schoology": <LearningManagementSchoology />,
  "assessment-performance-matters": <AssessmentPerformanceMatters />,
  "curriculum-instruction": <CurriculumInstruction />,
  "student-intervention": <StudentIntervention />,
  mtss: <MTSS />,
  "behavior-support": <BehaviorSupport />,
  "college-career-life-readiness": <CollegeCareerLifeReadiness />,
  "cclr-naviance": <CCLRNaviance />,
};

function isValidSectionId(id: string): id is ActiveSectionId {
  return sectionOrder.includes(id as ActiveSectionId);
}

export default function MiddleSection_2() {
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
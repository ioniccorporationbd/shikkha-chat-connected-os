"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import OperationalExcellenceOverview from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/OperationalExcellenceOverview";
import ResourcePlanning from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/ResourcePlanning";
import FinancialStrategyAllovue from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/FinancialStrategyAllovue";
import ERPSystems from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/ERPSystems";
import PredictiveEnrollment from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/PredictiveEnrollment";
import TalentManagement from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/TalentManagement";
import RecruitingAndHR from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/RecruitingAndHR";
import EducatorSupport from "@/components/MiddleSectionComponents_3/OperationalExcellenceComponents/EducatorSupport";

type ActiveSectionId =
  | "operational-excellence"
  | "resource-planning"
  | "financial-strategy-allovue"
  | "erp-systems"
  | "predictive-enrollment"
  | "talent-management"
  | "recruiting-and-hr"
  | "educator-support";

const defaultActiveSection: ActiveSectionId = "operational-excellence";

const sectionOrder: ActiveSectionId[] = [
  "operational-excellence",
  "resource-planning",
  "financial-strategy-allovue",
  "erp-systems",
  "predictive-enrollment",
  "talent-management",
  "recruiting-and-hr",
  "educator-support",
];

const sectionTitles: Record<ActiveSectionId, string> = {
  "operational-excellence": "Operational Excellence",
  "resource-planning": "Resource Planning",
  "financial-strategy-allovue": "Financial Strategy",
  "erp-systems": "ERP Systems",
  "predictive-enrollment": "Predictive Enrollment",
  "talent-management": "Talent Management",
  "recruiting-and-hr": "Recruiting and HR",
  "educator-support": "Educator Support",
};

const sectionComponents: Record<ActiveSectionId, ReactNode> = {
  "operational-excellence": <OperationalExcellenceOverview />,
  "resource-planning": <ResourcePlanning />,
  "financial-strategy-allovue": <FinancialStrategyAllovue />,
  "erp-systems": <ERPSystems />,
  "predictive-enrollment": <PredictiveEnrollment />,
  "talent-management": <TalentManagement />,
  "recruiting-and-hr": <RecruitingAndHR />,
  "educator-support": <EducatorSupport />,
};

function isValidSectionId(id: string): id is ActiveSectionId {
  return sectionOrder.includes(id as ActiveSectionId);
}

export default function MiddleSection_3() {
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
"use client";

import type { ReactNode } from "react";

import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";

import OperationalExcellenceOverview from "@/components/hubs/operational-excellence/sections/OperationalExcellenceOverview";
import ResourcePlanning from "@/components/hubs/operational-excellence/sections/ResourcePlanning";
import FinancialStrategyAllovue from "@/components/hubs/operational-excellence/sections/FinancialStrategyAllovue";
import ERPSystems from "@/components/hubs/operational-excellence/sections/ERPSystems";
import PredictiveEnrollment from "@/components/hubs/operational-excellence/sections/PredictiveEnrollment";
import TalentManagement from "@/components/hubs/operational-excellence/sections/TalentManagement";
import RecruitingAndHR from "@/components/hubs/operational-excellence/sections/RecruitingAndHR";
import EducatorSupport from "@/components/hubs/operational-excellence/sections/EducatorSupport";

// Scene order MUST match the right rail (8 panels for this hub).
const scenes: HubScene[] = [
  { id: "operational-excellence", title: "Operational Excellence", node: <OperationalExcellenceOverview /> },
  { id: "resource-planning", title: "Resource Planning", node: <ResourcePlanning /> },
  { id: "financial-strategy-allovue", title: "Financial Strategy", node: <FinancialStrategyAllovue /> },
  { id: "erp-systems", title: "ERP Systems", node: <ERPSystems /> },
  { id: "predictive-enrollment", title: "Predictive Enrollment", node: <PredictiveEnrollment /> },
  { id: "talent-management", title: "Talent Management", node: <TalentManagement /> },
  { id: "recruiting-and-hr", title: "Recruiting and HR", node: <RecruitingAndHR /> },
  { id: "educator-support", title: "Educator Support", node: <EducatorSupport /> },
];

const defaultActiveSection = "operational-excellence";

export default function OperationalExcellenceHub(): ReactNode {
  return <HubSceneStage scenes={scenes} defaultActiveId={defaultActiveSection} />;
}

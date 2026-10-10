"use client";

import type { ReactNode } from "react";

import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";

import StudentAchievementOverview from "@/components/hubs/student-achievement/sections/StudentAchievementOverview";
import ClassroomSolutions from "@/components/hubs/student-achievement/sections/ClassroomSolutions";
import LearningManagementSchoology from "@/components/hubs/student-achievement/sections/LearningManagementSchoology";
import AssessmentPerformanceMatters from "@/components/hubs/student-achievement/sections/AssessmentPerformanceMatters";
import CurriculumInstruction from "@/components/hubs/student-achievement/sections/CurriculumInstruction";
import StudentIntervention from "@/components/hubs/student-achievement/sections/StudentIntervention";
import MTSS from "@/components/hubs/student-achievement/sections/MTSS";
import BehaviorSupport from "@/components/hubs/student-achievement/sections/BehaviorSupport";
import CollegeCareerLifeReadiness from "@/components/hubs/student-achievement/sections/CollegeCareerLifeReadiness";
import CCLRNaviance from "@/components/hubs/student-achievement/sections/CCLRNaviance";

// Scene order MUST match the right rail (10 panels for this hub).
const scenes: HubScene[] = [
  { id: "student-achievement", title: "Student Achievement", node: <StudentAchievementOverview /> },
  { id: "classroom-solutions", title: "Classroom Solutions", node: <ClassroomSolutions /> },
  { id: "learning-management-schoology", title: "Learning Management", node: <LearningManagementSchoology /> },
  { id: "assessment-performance-matters", title: "Assessment", node: <AssessmentPerformanceMatters /> },
  { id: "curriculum-instruction", title: "Curriculum & Instruction", node: <CurriculumInstruction /> },
  { id: "student-intervention", title: "Student Intervention", node: <StudentIntervention /> },
  { id: "mtss", title: "MTSS", node: <MTSS /> },
  { id: "behavior-support", title: "Behavior Support", node: <BehaviorSupport /> },
  { id: "college-career-life-readiness", title: "College, Career & Life Readiness", node: <CollegeCareerLifeReadiness /> },
  { id: "cclr-naviance", title: "CCLR Naviance", node: <CCLRNaviance /> },
];

const defaultActiveSection = "student-achievement";

export default function StudentAchievementHub(): ReactNode {
  return <HubSceneStage scenes={scenes} defaultActiveId={defaultActiveSection} />;
}

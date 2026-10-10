"use client";

import type { ReactNode } from "react";

import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";

import HomeConnections from "@/components/hubs/home-connections/sections/HomeConnectionsOverview";
import StudentInformation from "@/components/hubs/home-connections/sections/StudentInformation";
import SIS from "@/components/hubs/home-connections/sections/StudentInformationSystem";
import Enrollment from "@/components/hubs/home-connections/sections/Enrollment";
import SpecialPrograms from "@/components/hubs/home-connections/sections/SpecialPrograms";
import FamilyEngagement from "@/components/hubs/home-connections/sections/FamilyEngagement";
import Communications from "@/components/hubs/home-connections/sections/Communications";
import AttendanceSupport from "@/components/hubs/home-connections/sections/AttendanceSupport";

// Scene order MUST match the right rail: sceneIds are read from the rail's
// [id] elements in document order (8 panels for this hub).
const scenes: HubScene[] = [
  { id: "home-connections-panel", title: "Home Connections", node: <HomeConnections /> },
  { id: "student-information", title: "Student Information", node: <StudentInformation /> },
  { id: "sis", title: "SIS", node: <SIS /> },
  { id: "enrollment", title: "Enrollment", node: <Enrollment /> },
  { id: "special-programs", title: "Special Programs", node: <SpecialPrograms /> },
  { id: "family-engagement", title: "Family Engagement", node: <FamilyEngagement /> },
  { id: "communications", title: "Communications", node: <Communications /> },
  { id: "attendance-support", title: "Attendance Support", node: <AttendanceSupport /> },
];

const defaultActiveSection = "home-connections-panel";

// Home Connections is the first hub on the page; it emits its default active
// id on mount (unchanged behaviour) so the left rail opens the HC group.
export default function HomeConnectionsHub(): ReactNode {
  return (
    <HubSceneStage
      scenes={scenes}
      defaultActiveId={defaultActiveSection}
      emitDefaultOnMount
    />
  );
}

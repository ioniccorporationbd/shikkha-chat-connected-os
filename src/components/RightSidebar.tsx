"use client";

import { useEffect, useRef } from "react";

import HomeComponents from "@/components/RightSidebarComponents/Home_Components";
import StudentInformation from "@/components/RightSidebarComponents/StudentInformation";
import SIS from "@/components/RightSidebarComponents/SIS";
import Enrollment from "@/components/RightSidebarComponents/Enrollment";
import SpecialPrograms from "@/components/RightSidebarComponents/SpecialPrograms";
import FamilyEngagement from "@/components/RightSidebarComponents/FamilyEngagement";
import Communications from "@/components/RightSidebarComponents/Communications";
import AttendanceSupport from "@/components/RightSidebarComponents/AttendanceSupport";

const rightSections = [
  {
    id: "home-connections-panel",
    component: <HomeComponents />,
  },
  {
    id: "student-information",
    component: <StudentInformation />,
  },
  {
    id: "sis",
    component: <SIS />,
  },
  {
    id: "enrollment",
    component: <Enrollment />,
  },
  {
    id: "special-programs",
    component: <SpecialPrograms />,
  },
  {
    id: "family-engagement",
    component: <FamilyEngagement />,
  },
  {
    id: "communications",
    component: <Communications />,
  },
  {
    id: "attendance-support",
    component: <AttendanceSupport />,
  },
];

function dispatchActiveSection(id: string) {
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", {
      detail: { id },
    })
  );
}

export default function RightSidebar() {
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const sectionElements = rightSections
      .map((section) => sidebar.querySelector<HTMLElement>(`#${section.id}`))
      .filter(Boolean) as HTMLElement[];

    const updateActiveSection = () => {
      const sidebarCenter = sidebar.scrollTop + sidebar.clientHeight / 2;

      let activeId = rightSections[0].id;
      let closestDistance = Number.POSITIVE_INFINITY;

      sectionElements.forEach((section) => {
        const sectionCenter = section.offsetTop + section.offsetHeight / 2;
        const distance = Math.abs(sidebarCenter - sectionCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          activeId = section.id;
        }
      });

      dispatchActiveSection(activeId);
    };

    updateActiveSection();

    sidebar.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    return () => {
      sidebar.removeEventListener("scroll", updateActiveSection);
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="min-h-full bg-white"
      data-right-sidebar="true"
    >
      {rightSections.map((section) => (
        <div
          key={section.id}
          id={`${section.id}-wrapper`}
          className="relative min-h-screen"
        >
          {section.component}
        </div>
      ))}
    </div>
  );
}
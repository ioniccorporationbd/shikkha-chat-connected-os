"use client";

import OrbitProductPanel from "@/components/MiddleSectionShared/OrbitProductPanel";
import { FaRegCircleQuestion, FaRegStar, FaUsers } from "react-icons/fa6";
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";

const products = [
    { id: "student-achievement", title: "Student Achievement", subtitle: "Unified Progress", icon: <MdOutlineAutoAwesome />, highlight: true },
    { id: "classroom-solutions", title: "Classroom Solutions", subtitle: "Teaching Tools", icon: <MdOutlineGridView />, highlight: false },
    { id: "learning-management-schoology", title: "Learning Management", subtitle: "Schoology", icon: <MdOutlinePsychology />, highlight: false },
    { id: "assessment-performance-matters", title: "Assessment", subtitle: "Performance Matters", icon: <MdOutlineAnalytics />, highlight: false },
    { id: "curriculum-instruction", title: "Curriculum & Instruction", subtitle: "Instruction", icon: <MdOutlineMenuBook />, highlight: false },
    { id: "student-intervention", title: "Student Intervention", subtitle: "Support Plans", icon: <FaRegCircleQuestion />, highlight: false },
    { id: "mtss", title: "MTSS", subtitle: "Multi-Tier Support", icon: <MdOutlineHub />, highlight: false },
    { id: "behavior-support", title: "Behavior Support", subtitle: "Wellbeing", icon: <MdOutlineFavoriteBorder />, highlight: false },
    { id: "college-career-life-readiness", title: "College, Career & Life Readiness", subtitle: "Future Ready", icon: <FaRegStar />, highlight: false },
    { id: "cclr-naviance", title: "CCLR Naviance", subtitle: "Naviance", icon: <FaUsers />, highlight: false },
];

export default function StudentAchievementOverview() {
  return (
    <OrbitProductPanel
      title="Student Achievement"
      activeId="student-achievement"
      products={products}
      themeColor="#9CF048"
      darkColor="#236000"
      glowColor="rgba(156,240,72,0.22)"
    />
  );
}

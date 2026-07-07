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
    { id: "operational-excellence", title: "Operational Excellence", subtitle: "Operations Hub", icon: <MdOutlineHub />, highlight: true },
    { id: "resource-planning", title: "Resource Planning", subtitle: "Planning", icon: <MdOutlineGridView />, highlight: false },
    { id: "financial-strategy-allovue", title: "Financial Strategy", subtitle: "Allovue", icon: <MdOutlineAnalytics />, highlight: false },
    { id: "erp-systems", title: "ERP Systems", subtitle: "Core ERP", icon: <MdOutlineAutoAwesome />, highlight: false },
    { id: "predictive-enrollment", title: "Predictive Enrollment", subtitle: "Forecasting", icon: <FaUsers />, highlight: false },
    { id: "talent-management", title: "Talent Management", subtitle: "People", icon: <MdOutlinePsychology />, highlight: false },
    { id: "recruiting-and-hr", title: "Recruiting and HR", subtitle: "Hiring", icon: <FaRegStar />, highlight: false },
    { id: "educator-support", title: "Educator Support", subtitle: "Staff Success", icon: <FaRegCircleQuestion />, highlight: false },
];

export default function PredictiveEnrollment() {
  return (
    <OrbitProductPanel
      title="Predictive Enrollment"
      activeId="predictive-enrollment"
      products={products}
      themeColor="#ECC6FE"
      darkColor="#5B1276"
      glowColor="rgba(236,198,254,0.28)"
    />
  );
}

import OperationalExcellenceOverview from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/OperationalExcellenceOverview";
import ResourcePlanning from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/ResourcePlanning";
import FinancialStrategyAllovue from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/FinancialStrategyAllovue";
import ERPSystems from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/ERPSystems";
import PredictiveEnrollment from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/PredictiveEnrollment";
import TalentManagement from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/TalentManagement";
import RecruitingAndHR from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/RecruitingAndHR";
import EducatorSupport from "@/components/RightSidebarComponents_3/OperationalExcellenceComponents/EducatorSupport";

export default function RightSidebar_3() {
  return (
    <div className="min-h-full bg-white">
      {/* 1 */}
      <OperationalExcellenceOverview />

      {/* 2 */}
      <ResourcePlanning />

      {/* 3 */}
      <FinancialStrategyAllovue />

      {/* 4 */}
      <ERPSystems />

      {/* 5 */}
      <PredictiveEnrollment />

      {/* 6 */}
      <TalentManagement />

      {/* 7 */}
      <RecruitingAndHR />

      {/* 8 */}
      <EducatorSupport />
    </div>
  );
}
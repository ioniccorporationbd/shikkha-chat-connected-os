import OperationalExcellenceOverview from "@/components/hubs/operational-excellence/panels/OperationalExcellenceOverviewPanel";
import ResourcePlanning from "@/components/hubs/operational-excellence/panels/ResourcePlanningPanel";
import FinancialStrategyAllovue from "@/components/hubs/operational-excellence/panels/FinancialStrategyAllovuePanel";
import ERPSystems from "@/components/hubs/operational-excellence/panels/ERPSystemsPanel";
import PredictiveEnrollment from "@/components/hubs/operational-excellence/panels/PredictiveEnrollmentPanel";
import TalentManagement from "@/components/hubs/operational-excellence/panels/TalentManagementPanel";
import RecruitingAndHR from "@/components/hubs/operational-excellence/panels/RecruitingAndHRPanel";
import EducatorSupport from "@/components/hubs/operational-excellence/panels/EducatorSupportPanel";

export default function OperationalExcellenceSidePanels() {
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
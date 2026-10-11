import OperationalExcellenceOverview from "@/components/hubs/operational-excellence/panels/OperationalExcellenceOverviewPanel";
import ResourcePlanning from "@/components/hubs/operational-excellence/panels/ResourcePlanningPanel";
import FinancialStrategyAllovue from "@/components/hubs/operational-excellence/panels/FinancialStrategyAllovuePanel";
import ERPSystems from "@/components/hubs/operational-excellence/panels/ERPSystemsPanel";
import PredictiveEnrollment from "@/components/hubs/operational-excellence/panels/PredictiveEnrollmentPanel";
import TalentManagement from "@/components/hubs/operational-excellence/panels/TalentManagementPanel";
import RecruitingAndHR from "@/components/hubs/operational-excellence/panels/RecruitingAndHRPanel";
import EducatorSupport from "@/components/hubs/operational-excellence/panels/EducatorSupportPanel";

/*
 * Each section's key-point panel is wrapped in a `.right-panel-slot` so the
 * pinned desktop stage can crossfade the rail to the active section without any
 * auto-scroll (see HomeConnectionsSidePanels for the full note). Every other
 * layout keeps the plain stacked panels.
 */
export default function OperationalExcellenceSidePanels() {
  return (
    <div className="min-h-full">
      <div className="right-panel-slot">
        <OperationalExcellenceOverview />
      </div>

      <div className="right-panel-slot">
        <ResourcePlanning />
      </div>

      <div className="right-panel-slot">
        <FinancialStrategyAllovue />
      </div>

      <div className="right-panel-slot">
        <ERPSystems />
      </div>

      <div className="right-panel-slot">
        <PredictiveEnrollment />
      </div>

      <div className="right-panel-slot">
        <TalentManagement />
      </div>

      <div className="right-panel-slot">
        <RecruitingAndHR />
      </div>

      <div className="right-panel-slot">
        <EducatorSupport />
      </div>
    </div>
  );
}

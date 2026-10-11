import StudentAchievementOverview from "@/components/hubs/student-achievement/panels/StudentAchievementOverviewPanel";
import ClassroomSolutions from "@/components/hubs/student-achievement/panels/ClassroomSolutionsPanel";
import LearningManagementSchoology from "@/components/hubs/student-achievement/panels/LearningManagementSchoologyPanel";
import AssessmentPerformanceMatters from "@/components/hubs/student-achievement/panels/AssessmentPerformanceMattersPanel";
import CurriculumInstruction from "@/components/hubs/student-achievement/panels/CurriculumInstructionPanel";
import StudentIntervention from "@/components/hubs/student-achievement/panels/StudentInterventionPanel";
import MTSS from "@/components/hubs/student-achievement/panels/MTSSPanel";
import BehaviorSupport from "@/components/hubs/student-achievement/panels/BehaviorSupportPanel";
import CollegeCareerLifeReadiness from "@/components/hubs/student-achievement/panels/CollegeCareerLifeReadinessPanel";
import CCLRNaviance from "@/components/hubs/student-achievement/panels/CCLRNaviancePanel";

/*
 * Each section's key-point panel is wrapped in a `.right-panel-slot` so the
 * pinned desktop stage can crossfade the rail to the active section without any
 * auto-scroll (see HomeConnectionsSidePanels for the full note). Every other
 * layout keeps the plain stacked panels.
 */
export default function StudentAchievementSidePanels() {
  return (
    <div className="min-h-full">
      <div className="right-panel-slot">
        <StudentAchievementOverview />
      </div>

      <div className="right-panel-slot">
        <ClassroomSolutions />
      </div>

      <div className="right-panel-slot">
        <LearningManagementSchoology />
      </div>

      <div className="right-panel-slot">
        <AssessmentPerformanceMatters />
      </div>

      <div className="right-panel-slot">
        <CurriculumInstruction />
      </div>

      <div className="right-panel-slot">
        <StudentIntervention />
      </div>

      <div className="right-panel-slot">
        <MTSS />
      </div>

      <div className="right-panel-slot">
        <BehaviorSupport />
      </div>

      <div className="right-panel-slot">
        <CollegeCareerLifeReadiness />
      </div>

      <div className="right-panel-slot">
        <CCLRNaviance />
      </div>
    </div>
  );
}

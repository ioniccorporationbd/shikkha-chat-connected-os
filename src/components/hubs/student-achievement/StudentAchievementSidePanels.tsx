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

export default function StudentAchievementSidePanels() {
  return (
    <div className="min-h-full bg-white">
      {/* 1 */}
      <StudentAchievementOverview />

      {/* 2 */}
      <ClassroomSolutions />

      {/* 3 */}
      <LearningManagementSchoology />

      {/* 4 */}
      <AssessmentPerformanceMatters />

      {/* 5 */}
      <CurriculumInstruction />

      {/* 6 */}
      <StudentIntervention />

      {/* 7 */}
      <MTSS />

      {/* 8 */}
      <BehaviorSupport />

      {/* 9 */}
      <CollegeCareerLifeReadiness />

      {/* 10 */}
      <CCLRNaviance />
    </div>
  );
}
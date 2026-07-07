import StudentAchievementOverview from "@/components/RightSidebarComponents_2/StudentAchievementComponents/StudentAchievementOverview";
import ClassroomSolutions from "@/components/RightSidebarComponents_2/StudentAchievementComponents/ClassroomSolutions";
import LearningManagementSchoology from "@/components/RightSidebarComponents_2/StudentAchievementComponents/LearningManagementSchoology";
import AssessmentPerformanceMatters from "@/components/RightSidebarComponents_2/StudentAchievementComponents/AssessmentPerformanceMatters";
import CurriculumInstruction from "@/components/RightSidebarComponents_2/StudentAchievementComponents/CurriculumInstruction";
import StudentIntervention from "@/components/RightSidebarComponents_2/StudentAchievementComponents/StudentIntervention";
import MTSS from "@/components/RightSidebarComponents_2/StudentAchievementComponents/MTSS";
import BehaviorSupport from "@/components/RightSidebarComponents_2/StudentAchievementComponents/BehaviorSupport";
import CollegeCareerLifeReadiness from "@/components/RightSidebarComponents_2/StudentAchievementComponents/CollegeCareerLifeReadiness";
import CCLRNaviance from "@/components/RightSidebarComponents_2/StudentAchievementComponents/CCLRNaviance";

export default function RightSidebar_2() {
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
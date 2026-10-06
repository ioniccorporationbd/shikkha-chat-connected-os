import HomeComponents from "@/components/hubs/home-connections/panels/HomeConnectionsOverviewPanel";
import StudentInformation from "@/components/hubs/home-connections/panels/StudentInformationPanel";
import SIS from "@/components/hubs/home-connections/panels/StudentInformationSystemPanel";
import Enrollment from "@/components/hubs/home-connections/panels/EnrollmentPanel";
import SpecialPrograms from "@/components/hubs/home-connections/panels/SpecialProgramsPanel";
import FamilyEngagement from "@/components/hubs/home-connections/panels/FamilyEngagementPanel";
import Communications from "@/components/hubs/home-connections/panels/CommunicationsPanel";
import AttendanceSupport from "@/components/hubs/home-connections/panels/AttendanceSupportPanel";

export default function HomeConnectionsSidePanels() {
  return (
    <div className="min-h-full bg-white">
      {/* 1 */}
      <HomeComponents />

      {/* 2 */}
      <StudentInformation />

      {/* 3 */}
      <SIS />

      {/* 4 */}
      <Enrollment />

      {/* 5 */}
      <SpecialPrograms />

      {/* 6 */}
      <FamilyEngagement />

      {/* 7 */}
      <Communications />

      {/* 8 */}
      <AttendanceSupport />
    </div>
  );
}
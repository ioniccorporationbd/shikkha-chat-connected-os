import HomeComponents from "@/components/RightSidebarComponents_1/Home_Components";
import StudentInformation from "@/components/RightSidebarComponents_1/StudentInformation";
import SIS from "@/components/RightSidebarComponents_1/SIS";
import Enrollment from "@/components/RightSidebarComponents_1/Enrollment";
import SpecialPrograms from "@/components/RightSidebarComponents_1/SpecialPrograms";
import FamilyEngagement from "@/components/RightSidebarComponents_1/FamilyEngagement";
import Communications from "@/components/RightSidebarComponents_1/Communications";
import AttendanceSupport from "@/components/RightSidebarComponents_1/AttendanceSupport";

export default function RightSidebar() {
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
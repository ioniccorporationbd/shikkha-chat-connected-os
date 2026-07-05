import HomeComponents from "@/components/RightSidebarComponents/Home_Components";
import StudentInformation from "@/components/RightSidebarComponents/StudentInformation";
import SIS from "@/components/RightSidebarComponents/SIS";
import Enrollment from "@/components/RightSidebarComponents/Enrollment";
import SpecialPrograms from "@/components/RightSidebarComponents/SpecialPrograms";
import FamilyEngagement from "@/components/RightSidebarComponents/FamilyEngagement";
import Communications from "@/components/RightSidebarComponents/Communications";
import AttendanceSupport from "@/components/RightSidebarComponents/AttendanceSupport";

export default function RightSidebar() {
  return (
    <div className="min-h-full bg-white">
      <HomeComponents />
      <StudentInformation />
      <SIS />
      <Enrollment />
      <SpecialPrograms />
      <FamilyEngagement />
      <Communications />
      <AttendanceSupport />
    </div>
  );
}
import HomeComponents from "@/components/hubs/home-connections/panels/HomeConnectionsOverviewPanel";
import StudentInformation from "@/components/hubs/home-connections/panels/StudentInformationPanel";
import SIS from "@/components/hubs/home-connections/panels/StudentInformationSystemPanel";
import Enrollment from "@/components/hubs/home-connections/panels/EnrollmentPanel";
import SpecialPrograms from "@/components/hubs/home-connections/panels/SpecialProgramsPanel";
import FamilyEngagement from "@/components/hubs/home-connections/panels/FamilyEngagementPanel";
import Communications from "@/components/hubs/home-connections/panels/CommunicationsPanel";
import AttendanceSupport from "@/components/hubs/home-connections/panels/AttendanceSupportPanel";

/*
 * Each section's key-point panel is wrapped in a `.right-panel-slot`.
 * On the pinned desktop stage these slots are stacked in place and crossfade to
 * the active section (driven by `--scene-focus`), so the right side stays put
 * and simply changes to the current section's key points as you scroll — with
 * no auto-scroll and no snapping. In every other layout (stacked / mobile /
 * reduced-motion) the wrapper is a plain block, so the panels stack exactly as
 * before.
 */
export default function HomeConnectionsSidePanels() {
  return (
    <div className="min-h-full">
      <div className="right-panel-slot">
        <HomeComponents />
      </div>

      <div className="right-panel-slot">
        <StudentInformation />
      </div>

      <div className="right-panel-slot">
        <SIS />
      </div>

      <div className="right-panel-slot">
        <Enrollment />
      </div>

      <div className="right-panel-slot">
        <SpecialPrograms />
      </div>

      <div className="right-panel-slot">
        <FamilyEngagement />
      </div>

      <div className="right-panel-slot">
        <Communications />
      </div>

      <div className="right-panel-slot">
        <AttendanceSupport />
      </div>
    </div>
  );
}

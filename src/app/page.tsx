import Banner from "@/components/Banner";
import ConnectVideoBanner from "@/components/HomeConnectionsVideoBanner";
import MiddleSection_1 from "@/components/MiddleSection_1";
import MiddleSection_2 from "@/components/MiddleSection_2";
import MiddleSection_3 from "@/components/MiddleSection_3";
import OperationalExcellenceVideoBanner from "@/components/OperationalExcellenceVideoBanner";
import RightSidebar_1 from "@/components/RightSidebar_1";
import RightSidebar_2 from "@/components/RightSidebar_2";
import RightSidebar_3 from "@/components/RightSidebar_3";
import ScrollLockedContentSection from "@/components/ScrollLockedContentSection";
import StudentAchievementVideoBanner from "@/components/StudentAchievementVideoBanner";

export default function Page() {
  return (
    <>
      <Banner />

      <ConnectVideoBanner />

      <ScrollLockedContentSection
        sectionId="home-connections-content"
        middle={<MiddleSection_1 />}
        right={<RightSidebar_1 />}
      />

      <StudentAchievementVideoBanner />

      <ScrollLockedContentSection
        sectionId="student-achievement-content"
        middle={<MiddleSection_2 />}
        right={<RightSidebar_2 />}
      />

      <OperationalExcellenceVideoBanner />

      <ScrollLockedContentSection
        sectionId="operational-excellence-content"
        middle={<MiddleSection_3 />}
        right={<RightSidebar_3 />}
      />
    </>
  );
}

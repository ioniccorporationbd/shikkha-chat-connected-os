import LandingHeroBanner from "@/components/home/LandingHeroBanner";
import HomeConnectionsVideoBanner from "@/components/home/HomeConnectionsVideoBanner";
import HomeConnectionsHub from "@/components/hubs/home-connections/HomeConnectionsHub";
import StudentAchievementHub from "@/components/hubs/student-achievement/StudentAchievementHub";
import OperationalExcellenceHub from "@/components/hubs/operational-excellence/OperationalExcellenceHub";
import OperationalExcellenceVideoBanner from "@/components/home/OperationalExcellenceVideoBanner";
import ProductRouterSection from "@/components/home/ProductRouterSection";
import HomeConnectionsSidePanels from "@/components/hubs/home-connections/HomeConnectionsSidePanels";
import StudentAchievementSidePanels from "@/components/hubs/student-achievement/StudentAchievementSidePanels";
import OperationalExcellenceSidePanels from "@/components/hubs/operational-excellence/OperationalExcellenceSidePanels";
import ScrollLockedContentSection from "@/components/layout/ScrollLockedContentSection";
import StudentAchievementVideoBanner from "@/components/home/StudentAchievementVideoBanner";

export default function Page() {
  return (
    <>
      <LandingHeroBanner />

      <HomeConnectionsVideoBanner />

      <ScrollLockedContentSection
        sectionId="home-connections-content"
        middle={<HomeConnectionsHub />}
        right={<HomeConnectionsSidePanels />}
      />

      <StudentAchievementVideoBanner />

      <ScrollLockedContentSection
        sectionId="student-achievement-content"
        middle={<StudentAchievementHub />}
        right={<StudentAchievementSidePanels />}
      />

      <OperationalExcellenceVideoBanner />

      <ScrollLockedContentSection
        sectionId="operational-excellence-content"
        middle={<OperationalExcellenceHub />}
        right={<OperationalExcellenceSidePanels />}
      />
      <ProductRouterSection/>
    </>
  );
}

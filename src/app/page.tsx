import Banner from "@/components/Banner";
import ConnectVideoBanner from "@/components/HomeConnectionsVideoBanner";
import MiddleSection from "@/components/MiddleSection";
import RightSidebar from "@/components/RightSidebar";
import StudentAchievementVideoBanner from "@/components/RightSidebarComponents/StudentAchievementVideoBanner";
import ScrollLockedContentSection from "@/components/ScrollLockedContentSection";


export default function Page() {
  return (
    <>
      <Banner />

      <ConnectVideoBanner />

      <ScrollLockedContentSection
        middle={<MiddleSection />}
        right={<RightSidebar />}
      />   
      <StudentAchievementVideoBanner/>
     </>
  );
}
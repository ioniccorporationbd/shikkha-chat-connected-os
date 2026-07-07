import Banner from "@/components/Banner";
import ConnectVideoBanner from "@/components/HomeConnectionsVideoBanner";
import MiddleSection_1 from "@/components/MiddleSection_1";
import RightSidebar_1 from "@/components/RightSidebar_1";
// import StudentAchievementVideoBanner from "@/components/RightSidebarComponents/StudentAchievementVideoBanner";
import ScrollLockedContentSection from "@/components/ScrollLockedContentSection";


export default function Page() {
  return (
    <>
      <Banner />

      <ConnectVideoBanner />

      <ScrollLockedContentSection
        middle={<MiddleSection_1 />}
        right={<RightSidebar_1 />}
      />   
      {/* <StudentAchievementVideoBanner/> */}
     </>
  );
}
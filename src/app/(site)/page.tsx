import Hero from "@/components/marketing/sections/Hero";
import TrustStrip from "@/components/marketing/sections/TrustStrip";
import ProblemSection from "@/components/marketing/sections/ProblemSection";
import SolutionSection from "@/components/marketing/sections/SolutionSection";
import FeatureSection from "@/components/marketing/sections/FeatureSection";
import RoleSection from "@/components/marketing/sections/RoleSection";
import InstitutionSection from "@/components/marketing/sections/InstitutionSection";
import CapabilitiesSection from "@/components/marketing/sections/CapabilitiesSection";
import HowItWorksSection from "@/components/marketing/sections/HowItWorksSection";
import WhyShikkhaChatSection from "@/components/marketing/sections/WhyShikkhaChatSection";
import TechnologySection from "@/components/marketing/sections/TechnologySection";
import DashboardShowcaseIntro from "@/components/marketing/sections/DashboardShowcaseIntro";
import IonicSection from "@/components/marketing/sections/IonicSection";
import FaqSection from "@/components/marketing/sections/FaqSection";
import FinalCtaSection from "@/components/marketing/sections/FinalCtaSection";
import SiteFooter from "@/components/marketing/sections/SiteFooter";

import HomeConnectionsVideoBanner from "@/components/home/HomeConnectionsVideoBanner";
import HomeConnectionsHub from "@/components/hubs/home-connections/HomeConnectionsHub";
import HomeConnectionsSidePanels from "@/components/hubs/home-connections/HomeConnectionsSidePanels";
import StudentAchievementVideoBanner from "@/components/home/StudentAchievementVideoBanner";
import StudentAchievementHub from "@/components/hubs/student-achievement/StudentAchievementHub";
import StudentAchievementSidePanels from "@/components/hubs/student-achievement/StudentAchievementSidePanels";
import OperationalExcellenceVideoBanner from "@/components/home/OperationalExcellenceVideoBanner";
import OperationalExcellenceHub from "@/components/hubs/operational-excellence/OperationalExcellenceHub";
import OperationalExcellenceSidePanels from "@/components/hubs/operational-excellence/OperationalExcellenceSidePanels";
import ProductRouterSection from "@/components/home/ProductRouterSection";
import ScrollLockedContentSection from "@/components/layout/ScrollLockedContentSection";

/**
 * Shikkha Chat — main marketing homepage.
 *
 * A single marketing funnel (Header → Hero → Trust → Problem → Solution →
 * Features → Roles → Institutions → Capabilities → How → Why → Technology →
 * Dashboard Showcase → Why IONIC → FAQ → CTA → Footer). The connected-OS
 * hub visuals are kept as the Dashboard Showcase region so the existing
 * sidebar anchors continue to resolve.
 */
export default function Page() {
  return (
    <div className="mk-root" data-no-translate="true">
      {/* 1. Hero */}
      <Hero />

      {/* 2. Trust strip */}
      <TrustStrip />

      {/* 3. Problem */}
      <ProblemSection />

      {/* 4. Solution */}
      <SolutionSection />

      {/* 5. Core features */}
      <FeatureSection />

      {/* 6. Role-based platform */}
      <RoleSection />

      {/* 7. Institution types */}
      <InstitutionSection />

      {/* 8. Operational modules / current vs future */}
      <CapabilitiesSection />

      {/* 9. How it works */}
      <HowItWorksSection />

      {/* 10. Why Shikkha Chat */}
      <WhyShikkhaChatSection />

      {/* 11. ERP / technology foundation */}
      <TechnologySection />

      {/* 12. Dashboard showcase (connected-OS visuals) */}
      <DashboardShowcaseIntro />
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
      <ProductRouterSection />

      {/* 13. Why IONIC Corporation */}
      <IonicSection />

      {/* 14. FAQ */}
      <FaqSection />

      {/* 15. Final CTA */}
      <FinalCtaSection />

      {/* 16. Footer */}
      <SiteFooter />
    </div>
  );
}

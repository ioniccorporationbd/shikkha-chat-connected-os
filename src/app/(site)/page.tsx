import CatalogMainSections from "@/components/home/CatalogMainSections";
import LandingHeroBanner from "@/components/home/LandingHeroBanner";
import ProductRouterSection from "@/components/home/ProductRouterSection";
import SiteFooter from "@/components/home/SiteFooter";

export default function Page() {
  return (
    <>
      <LandingHeroBanner />

      {/* One video-bannered main section per Shikkha Chat Apps catalog
          category (15 dropdowns), each holding one sub-section per feature
          link. The three legacy hub sections are superseded by this. */}
      <CatalogMainSections />

      <ProductRouterSection />

      <SiteFooter />
    </>
  );
}

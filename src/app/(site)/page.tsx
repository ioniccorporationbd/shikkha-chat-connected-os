import CatalogMainSections from "@/components/home/CatalogMainSections";
import LandingHeroBanner from "@/components/home/LandingHeroBanner";
import ProductRouterSection from "@/components/home/ProductRouterSection";
import CatalogScrollFocus from "@/components/showcase/CatalogScrollFocus";

export default function Page() {
  return (
    <>
      <LandingHeroBanner />

      {/* Section focus engine: keeps the rail relaxed over the hero, opens
          only the dropdown of the video banner in view (no child selected)
          and lets the content sections light up their own child links. */}
      <CatalogScrollFocus />

      {/* One video-bannered main section per Shikkha Chat Apps catalog
          category (15 dropdowns), each holding one sub-section per feature
          link. The three legacy hub sections are superseded by this. */}
      <CatalogMainSections />

      {/* Site navigation + site links + copyright/back-to-top footer bar.
          Replaces the old bulky SiteFooter. */}
      <ProductRouterSection />
    </>
  );
}

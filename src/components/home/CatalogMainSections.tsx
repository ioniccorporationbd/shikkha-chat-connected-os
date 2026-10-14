import ScrollLockedContentSection from "@/components/layout/ScrollLockedContentSection";
import VideoBanner from "@/components/home/VideoBanner";
import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";
import CatalogFeaturePanel from "@/components/showcase/catalog/CatalogFeaturePanel";
import CatalogFeatureScene from "@/components/showcase/catalog/CatalogFeatureScene";
import { buildCatalogBannerContent } from "@/components/showcase/catalog/catalogBanners";
import {
  catalogFeaturePanelId,
  catalogSectionId,
} from "@/components/showcase/catalog/sceneGroups";
import { FEATURE_SHOWCASE } from "@/lib/feature-showcase";

/*
 * -------------------------------------------------------------------------
 * CATALOG MAIN SECTIONS
 *
 * The Connected OS homepage body: ONE main section per Shikkha Chat Apps
 * catalog category (15 sidebar dropdowns → 15 video-bannered main sections),
 * and inside each main section ONE sub-section per feature link.
 *
 *   • Every main section is introduced by a video banner and carries its own
 *     scroll-synchronised middle stage + right data rail.
 *   • Every feature gets a middle scene (its card grid, reveal animation) AND
 *     a matching right-rail panel, paired by the shared `catalog-panel-<cat>--<feat>`
 *     element id the scroll-sync engine matches on.
 *
 * This REPLACES the previous three fixed hub sections; the middle + right rails
 * reuse the exact same Connected OS visual language and reveal contract.
 * -------------------------------------------------------------------------
 */
export default function CatalogMainSections() {
  // Orbit start angle per main section. The 8 rotations fan out across the
  // sections that hold enough sibling cards to actually orbit the hub, so no
  // two neighbours read identically; a lone feature just fills the hub.
  let layoutCursor = 0;
  const variantBySection = FEATURE_SHOWCASE.map((category) =>
    category.features.length - 1 >= 1 ? layoutCursor++ % 8 : 0,
  );

  return (
    <>
      {FEATURE_SHOWCASE.map((category, index) => {
        const scenes: HubScene[] = category.features.map((feature) => ({
          id: catalogFeaturePanelId(category.id, feature.id),
          title: feature.title.bn,
          node: (
            <CatalogFeatureScene
              category={category}
              feature={feature}
              variant={variantBySection[index]}
            />
          ),
        }));

        return (
          <div key={category.id} data-catalog-main-section={category.id}>
            <VideoBanner
              id={catalogSectionId(category.id)}
              content={buildCatalogBannerContent(category, index)}
              hold={0}
            />

            <ScrollLockedContentSection
              sectionId={`${catalogSectionId(category.id)}-content`}
              middle={
                <HubSceneStage
                  scenes={scenes}
                  defaultActiveId={scenes[0].id}
                  emitDefaultOnMount={index === 0}
                />
              }
              right={
                <div className="min-h-full">
                  {category.features.map((feature) => (
                    <div key={feature.id} className="right-panel-slot">
                      <CatalogFeaturePanel
                        category={category}
                        feature={feature}
                      />
                    </div>
                  ))}
                </div>
              }
            />
          </div>
        );
      })}
    </>
  );
}

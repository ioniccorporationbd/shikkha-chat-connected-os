import ScrollLockedContentSection from "@/components/layout/ScrollLockedContentSection";
import VideoBanner from "@/components/home/VideoBanner";
import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";
import CatalogFeaturePanel from "@/components/showcase/catalog/CatalogFeaturePanel";
import CatalogFeatureScene from "@/components/showcase/catalog/CatalogFeatureScene";
import RoleAccessPanel from "@/components/showcase/catalog/RoleAccessPanel";
import RoleAccessScene from "@/components/showcase/catalog/RoleAccessScene";
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
 * catalog category (16 sidebar dropdowns → 16 video-bannered main sections;
 * the 16th, "Role-based Dashboards", carries the eight dashboard roles with
 * their real routes/menus/workflows in the right rail),
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
  return (
    <>
      {FEATURE_SHOWCASE.map((category, index) => {
        const scenes: HubScene[] = category.features.map((feature, featureIndex) => ({
          id: catalogFeaturePanelId(category.id, feature.id),
          // Bilingual: the floating stage label must follow the language toggle.
          title: feature.title,
          node:
            category.id === "role-access" ? (
              <RoleAccessScene
                category={category}
                feature={feature}
                index={index}
                featureIndex={featureIndex}
              />
            ) : (
              <CatalogFeatureScene
                category={category}
                feature={feature}
                index={index}
                featureIndex={featureIndex}
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
                      {category.id === "role-access" ? (
                        <RoleAccessPanel category={category} feature={feature} />
                      ) : (
                        <CatalogFeaturePanel
                          category={category}
                          feature={feature}
                        />
                      )}
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

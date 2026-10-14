import CatalogPanel from "@/components/showcase/catalog/CatalogPanel";
import { CATALOG_GROUPS } from "@/components/showcase/catalog/sceneGroups";

/*
 * Segment 2 of 3 — one `.right-panel-slot` per catalog category (6-10). The
 * slot ids (`catalog-panel-<id>`) pair with StudentAchievementHub's scenes.
 */
const group = CATALOG_GROUPS[1];

export default function StudentAchievementSidePanels() {
  return (
    <div className="min-h-full">
      {group.map((category) => (
        <div key={category.id} className="right-panel-slot">
          <CatalogPanel category={category} />
        </div>
      ))}
    </div>
  );
}

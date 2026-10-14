import CatalogPanel from "@/components/showcase/catalog/CatalogPanel";
import { CATALOG_GROUPS } from "@/components/showcase/catalog/sceneGroups";

/*
 * Segment 1 of 3 — one `.right-panel-slot` per Shikkha Chat Apps catalog
 * category (categories 1-5). The slot ids (`catalog-panel-<id>`) are what the
 * scroll-sync engine matches against HomeConnectionsHub's scenes.
 */
const group = CATALOG_GROUPS[0];

export default function HomeConnectionsSidePanels() {
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

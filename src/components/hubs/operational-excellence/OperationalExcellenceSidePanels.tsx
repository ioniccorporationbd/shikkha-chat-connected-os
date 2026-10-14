import CatalogPanel from "@/components/showcase/catalog/CatalogPanel";
import { CATALOG_GROUPS } from "@/components/showcase/catalog/sceneGroups";

/*
 * Segment 3 of 3 — one `.right-panel-slot` per catalog category (11-15). The
 * slot ids (`catalog-panel-<id>`) pair with OperationalExcellenceHub's scenes.
 */
const group = CATALOG_GROUPS[2];

export default function OperationalExcellenceSidePanels() {
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

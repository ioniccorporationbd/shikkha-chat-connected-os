"use client";

import type { ReactNode } from "react";

import HubSceneStage, {
  type HubScene,
} from "@/components/hubs/shared/HubSceneStage";
import CatalogScene from "@/components/showcase/catalog/CatalogScene";
import {
  CATALOG_GROUPS,
  catalogPanelId,
} from "@/components/showcase/catalog/sceneGroups";

/*
 * Segment 1 of 3 — the middle + right rails are now filled from the Shikkha
 * Chat Apps catalog (categories 1-5). Scene order MUST stay in lock-step with
 * the right rail (HomeConnectionsSidePanels): the scroll-sync engine pairs a
 * scene to its rail panel by the shared `catalog-panel-<id>` element id.
 *
 * The middle stage emits its default active id on mount (unchanged behaviour).
 */
const group = CATALOG_GROUPS[0];

const scenes: HubScene[] = group.map((category) => ({
  id: catalogPanelId(category.id),
  title: category.title.bn,
  node: <CatalogScene category={category} />,
}));

const defaultActiveSection = scenes[0].id;

export default function HomeConnectionsHub(): ReactNode {
  return (
    <HubSceneStage
      scenes={scenes}
      defaultActiveId={defaultActiveSection}
      emitDefaultOnMount
    />
  );
}

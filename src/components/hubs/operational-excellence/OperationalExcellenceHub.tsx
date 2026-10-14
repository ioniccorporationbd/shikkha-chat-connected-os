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
 * Segment 3 of 3 — the middle + right rails are filled from the Shikkha Chat
 * Apps catalog (categories 11-15). Scene order MUST stay in lock-step with the
 * right rail (OperationalExcellenceSidePanels).
 */
const group = CATALOG_GROUPS[2];

const scenes: HubScene[] = group.map((category) => ({
  id: catalogPanelId(category.id),
  title: category.title.bn,
  node: <CatalogScene category={category} />,
}));

const defaultActiveSection = scenes[0].id;

export default function OperationalExcellenceHub(): ReactNode {
  return <HubSceneStage scenes={scenes} defaultActiveId={defaultActiveSection} />;
}

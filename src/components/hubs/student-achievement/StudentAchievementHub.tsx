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
 * Segment 2 of 3 — the middle + right rails are filled from the Shikkha Chat
 * Apps catalog (categories 6-10). Scene order MUST stay in lock-step with the
 * right rail (StudentAchievementSidePanels).
 */
const group = CATALOG_GROUPS[1];

const scenes: HubScene[] = group.map((category) => ({
  id: catalogPanelId(category.id),
  title: category.title.bn,
  node: <CatalogScene category={category} />,
}));

const defaultActiveSection = scenes[0].id;

export default function StudentAchievementHub(): ReactNode {
  return <HubSceneStage scenes={scenes} defaultActiveId={defaultActiveSection} />;
}

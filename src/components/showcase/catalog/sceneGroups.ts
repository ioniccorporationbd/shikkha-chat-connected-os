import { FEATURE_SHOWCASE, type ShowcaseCategory } from "@/lib/feature-showcase";

/**
 * Catalog-driven middle + right rails (Shikkha Connected OS homepage).
 *
 * The homepage keeps its three scroll segments (Home Connections / Student
 * Achievement / Operational Excellence) and their video banners; this module
 * only supplies the DATA each segment renders. The 15 catalog categories are
 * split 5 / 5 / 5 across the three segments.
 *
 * The middle stage and the right rail are paired by a shared element id, so
 * `catalogPanelId()` is the single place that id is built.
 */
export const CATALOG_PANEL_PREFIX = "catalog-panel-";

export function catalogPanelId(categoryId: string): string {
  return `${CATALOG_PANEL_PREFIX}${categoryId}`;
}

export const CATALOG_GROUPS: readonly (readonly ShowcaseCategory[])[] = [
  FEATURE_SHOWCASE.slice(0, 5),
  FEATURE_SHOWCASE.slice(5, 10),
  FEATURE_SHOWCASE.slice(10, 15),
];

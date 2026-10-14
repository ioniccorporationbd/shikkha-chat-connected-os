import { FEATURE_SHOWCASE, type ShowcaseCategory } from "@/lib/feature-showcase";

/**
 * Catalog-driven middle + right rails (Shikkha Connected OS homepage).
 *
 * The homepage now renders ONE main section per Shikkha Chat Apps catalog
 * category (15 sidebar dropdowns → 15 video-bannered main sections), and ONE
 * sub-section per feature inside each one. The middle stage and the right rail
 * are paired by a shared element id, so the builders below are the single
 * source of truth for every id.
 */
export const CATALOG_PANEL_PREFIX = "catalog-panel-";
export const CATALOG_SECTION_PREFIX = "catalog-section-";

/** Element id of a catalog category's MAIN section (its banner + content). */
export function catalogSectionId(categoryId: string): string {
  return `${CATALOG_SECTION_PREFIX}${categoryId}`;
}

/** Element id of a category's OVERVIEW panel/scene (legacy hub compatibility). */
export function catalogPanelId(categoryId: string): string {
  return `${CATALOG_PANEL_PREFIX}${categoryId}`;
}

/** Shared id of a FEATURE's middle scene and its right-rail panel. */
export function catalogFeaturePanelId(
  categoryId: string,
  featureId: string,
): string {
  return `${CATALOG_PANEL_PREFIX}${categoryId}--${featureId}`;
}

/**
 * Parse a feature panel id back into its category + feature. Returns null for
 * the legacy category-overview ids (`catalog-panel-<categoryId>`) and for any
 * non-catalog id. The `--` separator is unambiguous because catalog ids are
 * kebab-case and never contain a double dash.
 */
export function parseCatalogFeaturePanelId(
  id: string,
): { categoryId: string; featureId: string } | null {
  if (!id.startsWith(CATALOG_PANEL_PREFIX)) return null;
  const rest = id.slice(CATALOG_PANEL_PREFIX.length);
  const sep = rest.indexOf("--");
  if (sep < 0) return null;
  return { categoryId: rest.slice(0, sep), featureId: rest.slice(sep + 2) };
}

/** The full ordered catalog — 15 categories, in source order. */
export const CATALOG_CATEGORIES: readonly ShowcaseCategory[] = FEATURE_SHOWCASE;

/** Legacy 5/5/5 split (kept so the previous hub modules still compile). */
export const CATALOG_GROUPS: readonly (readonly ShowcaseCategory[])[] = [
  FEATURE_SHOWCASE.slice(0, 5),
  FEATURE_SHOWCASE.slice(5, 10),
  FEATURE_SHOWCASE.slice(10, 15),
];

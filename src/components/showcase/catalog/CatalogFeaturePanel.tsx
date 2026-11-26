"use client";

import SectionPanel from "@/components/hubs/shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  type ShowcaseCategory,
  type ShowcaseFeature,
} from "@/lib/feature-showcase";
import { CATALOG_SECTION_DETAILS } from "@/lib/catalog-section-details";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

/*
 * -------------------------------------------------------------------------
 * CATALOG FEATURE RIGHT-RAIL PANEL
 *
 * One right-side panel per FEATURE (per sidebar link), in the SAME card design
 * language as the rest of the homepage rail (SectionPanel `variant="dashboard"`).
 *
 * Each panel carries the feature's own content: title, description, the
 * section's supporting paragraph and its capabilities. The section-metadata
 * box that used to sit at the bottom of the card (source route / who can use /
 * status / section audience / position) is REMOVED; in its place the card ends
 * with the shared "Request a Demo" button, which opens the existing
 * DemoRequestModal. Nothing else about the card changed.
 * -------------------------------------------------------------------------
 */
export default function CatalogFeaturePanel({
  category,
  feature,
}: {
  category: ShowcaseCategory;
  feature: ShowcaseFeature;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";

  // Section enrichment (part f): real, source-sourced data for this section.
  const detail = CATALOG_SECTION_DETAILS[category.id];

  return (
    <SectionPanel
      id={catalogFeaturePanelId(category.id, feature.id)}
      variant="dashboard"
      pill={category.title[lang]}
      title={feature.title[lang]}
      description={feature.description[lang]}
      icon={SHOWCASE_ICONS[feature.icon]}
      showButtons={false}
      supporting={detail ? detail.supporting[lang] : undefined}
      capabilities={
        detail ? detail.capabilities.map((capability) => capability[lang]) : []
      }
      demoRequest
    />
  );
}

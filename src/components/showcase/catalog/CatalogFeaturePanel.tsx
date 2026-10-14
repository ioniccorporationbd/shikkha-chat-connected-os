"use client";

import SectionPanel from "@/components/hubs/shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  SHOWCASE_TEXT,
  showcaseAccessLabel,
  showcaseStatusLabel,
  type ShowcaseCategory,
  type ShowcaseFeature,
} from "@/lib/feature-showcase";
import { CATALOG_SECTION_DETAILS } from "@/lib/catalog-section-details";

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId, CATALOG_CATEGORIES } from "./sceneGroups";

/*
 * -------------------------------------------------------------------------
 * CATALOG FEATURE RIGHT-RAIL PANEL
 *
 * One right-side panel per FEATURE (per sidebar link), in the SAME card design
 * language as the rest of the homepage rail (SectionPanel `variant="dashboard"`).
 * Each panel carries the feature's data: its title + description, the source
 * route, who it is for, and its availability status — the "section-wise related
 * data" the rail is filled with.
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
  // Every card in the section renders the section's own supporting paragraph,
  // its real capabilities, its audience and its position in the catalog — so
  // the rail now carries several times more information than the previous
  // title + description + 3 meta rows.
  const detail = CATALOG_SECTION_DETAILS[category.id];
  const totalCategories = CATALOG_CATEGORIES.length;
  const sectionIndex = CATALOG_CATEGORIES.findIndex((c) => c.id === category.id);
  const totalFeatures = category.features.length;
  const featureIndex = category.features.findIndex((f) => f.id === feature.id);
  const positionWord =
    lang === "en"
      ? { section: "Section", feature: "Feature" }
      : { section: "বিভাগ", feature: "বৈশিষ্ট্য" };
  const positionValue = `${positionWord.section} ${sectionIndex + 1}/${totalCategories} · ${positionWord.feature} ${featureIndex + 1}/${totalFeatures}`;

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
      rows={[
        {
          title: category.title[lang],
          meta: [
            {
              label: SHOWCASE_TEXT.sourceRoute[lang],
              value: feature.route,
            },
            {
              label: SHOWCASE_TEXT.whoCanUse[lang],
              value: showcaseAccessLabel(feature.access, lang),
            },
            {
              label: SHOWCASE_TEXT.statusLabel[lang],
              value: showcaseStatusLabel(feature, lang),
            },
            {
              label: SHOWCASE_TEXT.sectionAudience[lang],
              value: detail ? detail.audience[lang] : "",
            },
            {
              label: SHOWCASE_TEXT.sectionPosition[lang],
              value: positionValue,
            },
          ],
        },
      ]}
    />
  );
}

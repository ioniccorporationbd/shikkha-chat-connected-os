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

import { SHOWCASE_ICONS } from "./icons";
import { catalogFeaturePanelId } from "./sceneGroups";

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

  return (
    <SectionPanel
      id={catalogFeaturePanelId(category.id, feature.id)}
      variant="dashboard"
      pill={category.title[lang]}
      title={feature.title[lang]}
      description={feature.description[lang]}
      icon={SHOWCASE_ICONS[feature.icon]}
      showButtons={false}
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
          ],
        },
      ]}
    />
  );
}

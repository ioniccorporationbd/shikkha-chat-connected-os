"use client";

import SectionPanel from "@/components/hubs/shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  SHOWCASE_TEXT,
  showcaseAccessLabel,
  showcaseStatusLabel,
  type ShowcaseCategory,
} from "@/lib/feature-showcase";

import { SHOWCASE_ICONS } from "./icons";
import { catalogPanelId } from "./sceneGroups";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBnDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}

/*
 * -------------------------------------------------------------------------
 * CATALOG RIGHT-RAIL PANEL
 *
 * One right-side panel per Shikkha Chat Apps catalog category, in the SAME
 * card design language as the rest of the homepage rail (SectionPanel
 * `variant="dashboard"`). Each panel carries the category's data:
 *   • the category name (title) + feature count (badge),
 *   • a short summary,
 *   • a row per feature with its description + source route + audience + status.
 * -------------------------------------------------------------------------
 */
export default function CatalogPanel({
  category,
}: {
  category: ShowcaseCategory;
}) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";

  const count = category.features.length;
  const countLabel =
    lang === "bn" ? `${toBnDigits(count)}টি বৈশিষ্ট্য` : `${count} features`;

  const description =
    lang === "bn"
      ? `এই বিভাগে Shikkha Chat Apps-এর ${toBnDigits(count)}টি বৈশিষ্ট্য রয়েছে। প্রতিটি বৈশিষ্ট্যের সোর্স রুট, ব্যবহারকারী ও স্ট্যাটাস নিচে দেওয়া হলো।`
      : `This section lists the ${count} features of the Shikkha Chat Apps platform. Each feature's source route, audience and status are shown below.`;

  const rows = category.features.map((feature) => ({
    title: feature.title[lang],
    description: feature.description[lang],
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
  }));

  return (
    <SectionPanel
      id={catalogPanelId(category.id)}
      variant="dashboard"
      pill={countLabel}
      title={category.title[lang]}
      description={description}
      icon={SHOWCASE_ICONS[category.icon]}
      showButtons={false}
      rows={rows}
    />
  );
}

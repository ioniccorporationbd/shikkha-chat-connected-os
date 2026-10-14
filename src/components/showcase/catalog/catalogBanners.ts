import type { VideoBannerContent } from "@/components/home/VideoBanner";
import type { ShowcaseCategory } from "@/lib/feature-showcase";
import { CATALOG_SECTION_DETAILS } from "@/lib/catalog-section-details";

/**
 * Banner content for a catalog MAIN section.
 *
 * Part (g): every one of the 15 catalog sections now opens onto its OWN
 * meaningful video banner — a clip chosen to match what the section is about —
 * instead of the previous three brand chapter videos cycled by index. The
 * homepage keeps its existing banner design, layout, reveal and play/pause
 * controls; only the per-section clip (and its glow tint) changes.
 *
 * Clips are free-to-use stock footage served from the Mixkit CDN, matching the
 * site's existing remote-video pattern. Kept as plain data so any section's
 * clip can be swapped in one place.
 */
const CATALOG_SECTION_VIDEOS: Record<string, string> = {
  "school-management": "https://assets.mixkit.co/videos/4547/4547-720.mp4",
  "ai-pathshala": "https://assets.mixkit.co/videos/23539/23539-720.mp4",
  "teacher-tools": "https://assets.mixkit.co/videos/4623/4623-720.mp4",
  "parent-portal": "https://assets.mixkit.co/videos/4542/4542-720.mp4",
  "content-safety": "https://assets.mixkit.co/videos/23673/23673-720.mp4",
  monitoring: "https://assets.mixkit.co/videos/22835/22835-720.mp4",
  "site-home": "https://assets.mixkit.co/videos/4519/4519-720.mp4",
  "site-about": "https://assets.mixkit.co/videos/21595/21595-720.mp4",
  "site-academic": "https://assets.mixkit.co/videos/21587/21587-720.mp4",
  "site-information": "https://assets.mixkit.co/videos/41192/41192-720.mp4",
  "site-admission": "https://assets.mixkit.co/videos/12820/12820-720.mp4",
  "site-media": "https://assets.mixkit.co/videos/1512/1512-720.mp4",
  "site-employment": "https://assets.mixkit.co/videos/30012/30012-720.mp4",
  "site-contact": "https://assets.mixkit.co/videos/233/233-720.mp4",
  "site-freedom": "https://assets.mixkit.co/videos/23138/23138-720.mp4",
};

const DEFAULT_SECTION_VIDEO = "https://assets.mixkit.co/videos/4547/4547-720.mp4";

/** Glow tints cycled across the sections (visual only; keeps the banner alive). */
const GLOW_THEMES = [
  {
    leftGlow: "bg-gradient-to-r from-[var(--sc-primary)]/20",
    rightGlow: "bg-gradient-to-l from-[var(--sc-secondary)]/24",
  },
  {
    leftGlow: "bg-gradient-to-r from-[var(--sc-secondary)]/28",
    rightGlow: "bg-gradient-to-l from-[var(--color-primary)]/18",
  },
  {
    leftGlow: "bg-gradient-to-r from-[var(--sc-secondary)]/28",
    rightGlow: "bg-gradient-to-l from-[var(--sc-primary)]/22",
  },
] as const;

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function toBn(value: number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}

export function buildCatalogBannerContent(
  category: ShowcaseCategory,
  index: number,
): VideoBannerContent {
  const glow = GLOW_THEMES[index % GLOW_THEMES.length];
  const videoSrc = CATALOG_SECTION_VIDEOS[category.id] ?? DEFAULT_SECTION_VIDEO;
  const detail = CATALOG_SECTION_DETAILS[category.id];
  const count = category.features.length;
  const ordinal = index + 1;

  return {
    videoSrc,
    leftGlow: glow.leftGlow,
    rightGlow: glow.rightGlow,
    index: {
      bn: toBn(ordinal).padStart(2, "০"),
      en: String(ordinal).padStart(2, "0"),
    },
    text: {
      bn: {
        pill: category.title.bn,
        title: `Shikkha Chat Apps — ${category.title.bn}`,
        description: detail
          ? `এই বিভাগে ${toBn(count)}টি বৈশিষ্ট্য · কাদের জন্য: ${detail.audience.bn}।`
          : `এই বিভাগে ${toBn(count)}টি বৈশিষ্ট্য রয়েছে। প্রতিটি বৈশিষ্ট্যের জন্য নিচে আলাদা সেকশন দেওয়া হলো।`,
        playVideo: "ভিডিও চালু করুন",
        pauseVideo: "ভিডিও বিরতি দিন",
        scroll: "স্ক্রল করুন",
      },
      en: {
        pill: category.title.en,
        title: `Shikkha Chat Apps — ${category.title.en}`,
        description: detail
          ? `This category has ${count} features · who it's for: ${detail.audience.en}.`
          : `This category contains ${count} features. Each feature is given its own section below.`,
        playVideo: "Play video",
        pauseVideo: "Pause video",
        scroll: "Scroll",
      },
    },
  };
}

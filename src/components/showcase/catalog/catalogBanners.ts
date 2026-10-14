import type { VideoBannerContent } from "@/components/home/VideoBanner";
import type { ShowcaseCategory } from "@/lib/feature-showcase";

/**
 * Banner content for a catalog MAIN section.
 *
 * The homepage keeps its three brand chapter videos (Home Connections / Student
 * Achievement / Operational Excellence) and cycles them across the 15 catalog
 * main sections, so every sidebar dropdown opens onto a video-bannered section
 * in the site's existing visual language. Copy is derived from the category.
 */
const VIDEO_THEMES = [
  {
    videoSrc:
      "https://www.powerschool.com/wp-content/uploads/2026/04/tour-home-connections-hero.mp4",
    leftGlow: "bg-gradient-to-r from-[var(--sc-primary)]/20",
    rightGlow: "bg-gradient-to-l from-[var(--sc-secondary)]/24",
  },
  {
    videoSrc:
      "https://www.powerschool.com/wp-content/uploads/2026/03/tour-student-achievement-hero.mp4",
    leftGlow: "bg-gradient-to-r from-[var(--sc-secondary)]/28",
    rightGlow: "bg-gradient-to-l from-[var(--color-primary)]/18",
  },
  {
    videoSrc:
      "https://www.powerschool.com/wp-content/uploads/2026/03/tour-operational-excellence-hero.mp4",
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
  const theme = VIDEO_THEMES[index % VIDEO_THEMES.length];
  const count = category.features.length;
  const ordinal = index + 1;

  return {
    videoSrc: theme.videoSrc,
    leftGlow: theme.leftGlow,
    rightGlow: theme.rightGlow,
    index: {
      bn: toBn(ordinal).padStart(2, "০"),
      en: String(ordinal).padStart(2, "0"),
    },
    text: {
      bn: {
        pill: category.title.bn,
        title: `Shikkha Chat Apps — ${category.title.bn}`,
        description: `এই বিভাগে ${toBn(count)}টি বৈশিষ্ট্য রয়েছে। প্রতিটি বৈশিষ্ট্যের জন্য নিচে আলাদা সেকশন দেওয়া হলো।`,
        playVideo: "ভিডিও চালু করুন",
        pauseVideo: "ভিডিও বিরতি দিন",
        scroll: "স্ক্রল করুন",
      },
      en: {
        pill: category.title.en,
        title: `Shikkha Chat Apps — ${category.title.en}`,
        description: `This category contains ${count} features. Each feature is given its own section below.`,
        playVideo: "Play video",
        pauseVideo: "Pause video",
        scroll: "Scroll",
      },
    },
  };
}

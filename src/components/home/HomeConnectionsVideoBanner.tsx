import VideoBanner, {
  type VideoBannerContent,
} from "@/components/home/VideoBanner";

const content: VideoBannerContent = {
  videoSrc:
    "https://www.powerschool.com/wp-content/uploads/2026/04/tour-home-connections-hero.mp4",
  leftGlow: "bg-gradient-to-r from-[var(--sc-primary)]/20",
  rightGlow: "bg-gradient-to-l from-[var(--sc-secondary)]/24",
  index: { bn: "০১", en: "01" },
  text: {
    bn: {
      pill: "হোম কানেকশন",
      title:
        "প্রতিটি পরিবারের কাছে পৌঁছানো এবং শিক্ষার্থীদের সংযুক্ত রাখার আরও শক্তিশালী উপায়",
      description:
        "পারিবারিক যোগাযোগ, শিক্ষার্থীর হালনাগাদ তথ্য, উপস্থিতি সহায়তা এবং বিদ্যালয়ের সম্পৃক্ততাকে একটি সমন্বিত অভিজ্ঞতায় নিয়ে আসুন।",
      playVideo: "ভিডিও চালু করুন",
      pauseVideo: "ভিডিও বিরতি দিন",
      scroll: "স্ক্রল করুন",
    },
    en: {
      pill: "Home Connections",
      title: "More power to reach every family and keep students connected",
      description:
        "Bring family communication, student updates, attendance support, and school engagement into one connected experience.",
      playVideo: "Play video",
      pauseVideo: "Pause video",
      scroll: "Scroll",
    },
  },
};

export default function HomeConnectionsVideoBanner() {
  return <VideoBanner id="connect" content={content} hold={1.0} />;
}

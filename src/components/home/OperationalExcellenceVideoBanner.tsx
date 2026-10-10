import VideoBanner, {
  type VideoBannerContent,
} from "@/components/home/VideoBanner";

const content: VideoBannerContent = {
  videoSrc:
    "https://www.powerschool.com/wp-content/uploads/2026/03/tour-operational-excellence-hero.mp4",
  leftGlow: "bg-gradient-to-r from-[var(--sc-secondary)]/28",
  rightGlow: "bg-gradient-to-l from-[var(--sc-primary)]/22",
  index: { bn: "০৩", en: "03" },
  text: {
    bn: {
      pill: "কার্যক্রমের উৎকর্ষতা",
      title: "আরও বুদ্ধিমত্তার সঙ্গে বিদ্যালয়ের কার্যক্রম পরিচালনা করুন",
      description:
        "সম্পদ পরিকল্পনা, অর্থ ব্যবস্থাপনা, ইআরপি, ভর্তি পূর্বাভাস, জনবল ব্যবস্থাপনা, মানবসম্পদ এবং শিক্ষক সহায়তাকে একটি সমন্বিত কার্যক্রম ব্যবস্থায় যুক্ত করুন।",
      playVideo: "ভিডিও চালু করুন",
      pauseVideo: "ভিডিও বিরতি দিন",
      scroll: "স্ক্রল করুন",
    },
    en: {
      pill: "Operational Excellence",
      title: "More power to run smarter school operations",
      description:
        "Connect resource planning, finance, ERP, enrollment forecasting, talent management, HR, and educator support into one operational excellence experience.",
      playVideo: "Play video",
      pauseVideo: "Pause video",
      scroll: "Scroll",
    },
  },
};

export default function OperationalExcellenceVideoBanner() {
  return (
    <VideoBanner id="operational-excellence-video" content={content} hold={0.9} />
  );
}

import VideoBanner, {
  type VideoBannerContent,
} from "@/components/home/VideoBanner";

const content: VideoBannerContent = {
  videoSrc:
    "https://www.powerschool.com/wp-content/uploads/2026/03/tour-student-achievement-hero.mp4",
  leftGlow: "bg-gradient-to-r from-[var(--sc-secondary)]/28",
  rightGlow: "bg-gradient-to-l from-[var(--color-primary)]/18",
  index: { bn: "০২", en: "02" },
  text: {
    bn: {
      pill: "শিক্ষার্থীর অর্জন",
      title:
        "অগ্রগতি বুঝতে এবং প্রতিটি শিক্ষার্থীকে সহায়তা করতে আরও শক্তিশালী ব্যবস্থা",
      description:
        "শ্রেণিকক্ষের শিক্ষা, মূল্যায়ন, প্রয়োজনভিত্তিক সহায়তা, আচরণগত সহযোগিতা এবং ভবিষ্যৎ প্রস্তুতি পরিকল্পনাকে একটি সমন্বিত শিক্ষার্থী অর্জন ব্যবস্থায় যুক্ত করুন।",
      playVideo: "ভিডিও চালু করুন",
      pauseVideo: "ভিডিও বিরতি দিন",
      scroll: "স্ক্রল করুন",
    },
    en: {
      pill: "Student Achievement",
      title: "More power to understand progress and support every learner",
      description:
        "Connect classroom learning, assessment, interventions, behavior support, and readiness planning in one student achievement experience.",
      playVideo: "Play video",
      pauseVideo: "Pause video",
      scroll: "Scroll",
    },
  },
};

export default function StudentAchievementVideoBanner() {
  return <VideoBanner id="student-achievement-video" content={content} />;
}

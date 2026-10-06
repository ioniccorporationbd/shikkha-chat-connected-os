"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaPause, FaPlay } from "react-icons/fa6";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const bannerText = {
  bn: {
    pill: "শিক্ষার্থীর অর্জন",
    title:
      "অগ্রগতি বুঝতে এবং প্রতিটি শিক্ষার্থীকে সহায়তা করতে আরও শক্তিশালী ব্যবস্থা",
    description:
      "শ্রেণিকক্ষের শিক্ষা, মূল্যায়ন, প্রয়োজনভিত্তিক সহায়তা, আচরণগত সহযোগিতা এবং ভবিষ্যৎ প্রস্তুতি পরিকল্পনাকে একটি সমন্বিত শিক্ষার্থী অর্জন ব্যবস্থায় যুক্ত করুন।",
    playVideo: "ভিডিও চালু করুন",
    pauseVideo: "ভিডিও বিরতি দিন",
  },

  en: {
    pill: "Student Achievement",
    title:
      "More power to understand progress and support every learner",
    description:
      "Connect classroom learning, assessment, interventions, behavior support, and readiness planning in one student achievement experience.",
    playVideo: "Play video",
    pauseVideo: "Pause video",
  },
} as const;

export default function StudentAchievementVideoBanner() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = bannerText[currentLanguage];

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.44, 0.64],
    [0, -110, -350, -720],
  );

  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.5, 0.66],
    [1, 1, 0.95, 0],
  );

  const textScale = useTransform(
    scrollYProgress,
    [0, 0.36, 0.66],
    [1, 0.96, 0.88],
  );

  const videoScale = useTransform(
    scrollYProgress,
    [0, 1],
    [1.025, 1.075],
  );

  const toggleVideo = async () => {
    if (!videoRef.current) return;

    try {
      if (videoRef.current.paused) {
        await videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Video playback failed:", error);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="student-achievement-video"
      lang={currentLanguage}
      className="relative overflow-visible bg-white"
    >

      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.video
            ref={videoRef}
            style={{ scale: videoScale }}
            className="h-full w-full object-cover brightness-[1.04]"
            src="https://www.powerschool.com/wp-content/uploads/2026/03/tour-student-achievement-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-white/[0.03]" />

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[var(--sc-secondary)]/28 via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-[var(--color-primary)]/18 via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[170px] bg-gradient-to-b from-white/18 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[200px] bg-gradient-to-t from-white/14 to-transparent" />

        <button
          type="button"
          onClick={toggleVideo}
          aria-label={
            isPaused ? text.playVideo : text.pauseVideo
          }
          title={
            isPaused ? text.playVideo : text.pauseVideo
          }
          className="absolute right-5 top-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/60 bg-white/20 text-white shadow-[0_16px_38px_rgba(0,0,0,0.14)] backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white hover:text-[var(--sc-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:right-10 lg:top-8"
        >
          {isPaused ? (
            <FaPlay
              className="text-[22px]"
              aria-hidden="true"
            />
          ) : (
            <FaPause
              className="text-[22px]"
              aria-hidden="true"
            />
          )}
        </button>

        <div className="absolute inset-0 z-30 flex h-[100svh] items-center justify-center px-6">
          <motion.div
            style={{
              y: textY,
              opacity: textOpacity,
              scale: textScale,
            }}
            className="text-start-animation mx-auto max-w-[900px] text-center lg:text-left"
          >
            <span className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/25 px-5 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md md:text-[13px]">
              {text.pill}
            </span>

            <h2 className="text-balance text-[26px] font-black leading-[1.08] tracking-[-0.02em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:text-[32px] md:text-[42px] lg:text-[52px]">
              {text.title}
            </h2>

            <p className="mt-6 max-w-[760px] text-[15px] font-medium leading-[1.7] text-white/90 drop-shadow-[0_8px_22px_rgba(0,0,0,0.2)] md:text-[17px] lg:text-[18px]">
              {text.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
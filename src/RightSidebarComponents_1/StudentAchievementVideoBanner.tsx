"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaPause, FaPlay } from "react-icons/fa6";
import { useLanguage } from "@/lib/language";

const bannerText = {
  bn: {
    pill: "হোম কানেকশন",
    title: "প্রতিটি পরিবারে পৌঁছানো এবং শিক্ষার্থীদের সংযুক্ত রাখার আরও শক্তিশালী উপায়",
    description:
      "পরিবার যোগাযোগ, শিক্ষার্থী আপডেট, উপস্থিতি সহায়তা এবং স্কুল সম্পৃক্ততাকে একটি সংযুক্ত অভিজ্ঞতায় নিয়ে আসুন।",
    play: "ভিডিও চালান",
    pause: "ভিডিও বিরতি দিন",
  },
  en: {
    pill: "Home Connections",
    title: "More power to reach every family and keep students connected",
    description:
      "Bring family communication, student updates, attendance support, and school engagement into one connected experience.",
    play: "Play video",
    pause: "Pause video",
  },
} as const;

export default function StudentAchievementVideoBanner() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = bannerText[currentLanguage];

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 0.2, 0.44, 0.64], [0, -110, -350, -720]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.12, 0.5, 0.66], [1, 1, 0.95, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.36, 0.66], [1, 0.96, 0.88]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.025, 1.075]);

  const toggleVideo = () => {
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  return (
    <section ref={sectionRef} id="connect" className="relative overflow-visible bg-[var(--color-white)]">
      <style jsx>{`
        @keyframes textStart {
          0% { opacity: 0; transform: scale(.82) translateY(34px); filter: blur(10px); }
          60% { opacity: 1; transform: scale(1.05) translateY(-8px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        .text-start-animation { animation: textStart 720ms cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="sticky top-0 h-screen overflow-hidden">
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

        <div className="pointer-events-none absolute inset-0 z-10 bg-[color-mix(in_srgb,var(--color-white)_3%,transparent)]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--color-primary)_16%,transparent),transparent)]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_left,color-mix(in_srgb,var(--color-secondary)_18%,transparent),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[170px] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-white)_18%,transparent),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[200px] bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-white)_14%,transparent),transparent)]" />

        <button
          type="button"
          onClick={toggleVideo}
          aria-label={isPaused ? text.play : text.pause}
          className="absolute right-6 top-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_20%,transparent)] text-[var(--color-white)] shadow-[0_16px_38px_color-mix(in_srgb,var(--color-black)_12%,transparent)] backdrop-blur-md transition-all duration-500 hover:scale-110 hover:bg-[var(--color-white)] hover:text-[var(--color-primary)] lg:right-12 lg:top-9"
        >
          {isPaused ? <FaPlay className="" /> : <FaPause className="" />}
        </button>

        <div className="absolute inset-0 z-30 flex h-screen items-center justify-center px-6">
          <motion.div
            style={{ y: textY, opacity: textOpacity, scale: textScale }}
            className="text-start-animation mx-auto max-w-[780px] text-center lg:text-left"
          >
            <div className="video-banner-pill-text mb-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_55%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_25%,transparent)] px-7 font-black leading-[1.3] text-[var(--color-white)] backdrop-blur-md">
              {text.pill}
            </div>
            <h2 className="video-banner-title-text font-black leading-[1.18] tracking-[-0.03em] text-[var(--color-white)] drop-shadow-[0_8px_26px_color-mix(in_srgb,var(--color-black)_24%,transparent)]">
              {text.title}
            </h2>
            <p className="video-banner-description-text mt-5 max-w-[620px] font-medium leading-[1.65] text-[color-mix(in_srgb,var(--color-white)_92%,transparent)] drop-shadow-[0_8px_22px_color-mix(in_srgb,var(--color-black)_18%,transparent)]">
              {text.description}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

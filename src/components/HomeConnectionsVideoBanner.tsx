"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaPause, FaPlay } from "react-icons/fa6";

export default function HomeConnectionsVideoBanner() {
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
    <section ref={sectionRef} id="connect" className="relative  overflow-visible bg-white">
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
            className="h-full w-full object-cover brightness-[1.04] "
            src="https://www.powerschool.com/wp-content/uploads/2026/04/tour-home-connections-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-white/[0.03]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0068ff]/16 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-[#ff7a3d]/14 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[170px] bg-gradient-to-b from-white/18 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[200px] bg-gradient-to-t from-white/14 to-transparent" />

        <button
          type="button"
          onClick={toggleVideo}
          aria-label={isPaused ? "Play video" : "Pause video"}
          className="absolute right-6 top-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-[0_16px_38px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-500 hover:scale-110 hover:bg-white hover:text-[#0068ff] lg:right-12 lg:top-9"
        >
          {isPaused ? <FaPlay className="text-[13px]" /> : <FaPause className="text-[13px]" />}
        </button>

        <div className="absolute inset-0 z-30 flex h-screen items-center justify-center px-6">
          <motion.div
            style={{ y: textY, opacity: textOpacity, scale: textScale }}
            className="text-start-animation mx-auto max-w-[780px] text-center lg:text-left"
          >
            <div className="mb-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/55 bg-white/25 px-7 text-[13px] font-black text-white backdrop-blur-md md:text-[14px]">
              Home Connections
            </div>
            <h2 className="text-[32px] font-black leading-[1.06] tracking-[-0.05em] text-white drop-shadow-[0_8px_26px_rgba(0,0,0,0.24)] md:text-[50px] lg:text-[58px]">
              More power to reach every family and keep students connected
            </h2>
            <p className="mt-5 max-w-[620px] text-[14px] font-medium leading-7 text-white/92 drop-shadow-[0_8px_22px_rgba(0,0,0,0.18)] md:text-[16px]">
              Bring family communication, student updates, attendance support, and school engagement into one connected experience.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaPause, FaPlay } from "react-icons/fa6";

export default function ConnectVideoBanner() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(
    scrollYProgress,
    [0, 0.18, 0.38, 0.58, 0.68],
    [0, -120, -330, -620, -900]
  );

  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.12, 0.5, 0.66],
    [1, 1, 0.95, 0]
  );

  const textScale = useTransform(
    scrollYProgress,
    [0, 0.35, 0.66],
    [1, 0.96, 0.86]
  );

  const videoScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.1]);

  const handleVideoToggle = () => {
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
    <section
      ref={sectionRef}
      id="connect"
      className="relative h-[210vh] overflow-visible bg-white"
    >
      <style jsx>{`
        @keyframes textStart {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(34px);
            filter: blur(10px);
          }

          60% {
            opacity: 1;
            transform: scale(1.06) translateY(-8px);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes videoSoftGlow {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.08);
          }
        }

        @keyframes buttonPulse {
          0%,
          100% {
            box-shadow: 0 18px 42px rgba(255, 255, 255, 0.18);
          }

          50% {
            box-shadow: 0 26px 62px rgba(255, 255, 255, 0.28);
          }
        }

        .text-start-animation {
          animation: textStart 720ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .video-glow {
          animation: videoSoftGlow 7s ease-in-out infinite;
        }

        .video-control-pulse {
          animation: buttonPulse 3s ease-in-out infinite;
        }
      `}</style>

      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Layer 1: Full Video Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.video
            ref={videoRef}
            style={{ scale: videoScale }}
            className="h-full w-full object-cover brightness-[1.04]"
            src="https://www.powerschool.com/wp-content/uploads/2026/04/tour-home-connections-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        {/* Layer 2: Soft premium overlays */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-white/[0.03]" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-[#0068ff]/18 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-[#ff7a3d]/16 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[180px] bg-gradient-to-b from-white/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[220px] bg-gradient-to-t from-white/18 to-transparent" />

        <div className="video-glow pointer-events-none absolute left-[8%] top-[18%] z-10 h-[260px] w-[260px] rounded-full bg-[#0068ff]/16 blur-[100px]" />
        <div className="video-glow pointer-events-none absolute bottom-[12%] right-[8%] z-10 h-[300px] w-[300px] rounded-full bg-[#ff7a3d]/14 blur-[110px]" />

        <div className="pointer-events-none absolute inset-4 z-10 rounded-[36px] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />

        {/* Video Control */}
        <button
          type="button"
          onClick={handleVideoToggle}
          aria-label={isPaused ? "Play video" : "Pause video"}
          className="video-control-pulse absolute right-7 top-7 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-[0_16px_38px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-500 hover:scale-110 hover:bg-white hover:text-[#0068ff] lg:right-14 lg:top-10"
        >
          {isPaused ? (
            <FaPlay className="text-[14px]" />
          ) : (
            <FaPause className="text-[14px]" />
          )}
        </button>

        {/* Layer 3: Text Layer */}
        <div className="absolute inset-0 z-30 flex h-screen items-center justify-center px-6">
          <motion.div
            style={{
              y: textY,
              opacity: textOpacity,
              scale: textScale,
            }}
            className="text-start-animation mx-auto max-w-[820px] text-center lg:text-left"
          >
            <div className="mb-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/55 bg-white/25 px-7 text-[14px] font-extrabold text-white backdrop-blur-md md:text-[15px]">
              Home Connections
            </div>

            <h2 className="text-[34px] font-black leading-[1.06] tracking-[-0.05em] text-white drop-shadow-[0_8px_26px_rgba(0,0,0,0.24)] md:text-[54px] lg:text-[64px]">
              More power to reach every family and keep students connected
            </h2>

            <p className="mt-6 max-w-[660px] text-[15px] font-medium leading-7 text-white/92 drop-shadow-[0_8px_22px_rgba(0,0,0,0.18)] md:text-[18px]">
              Bring family communication, student updates, attendance support,
              and school engagement into one connected experience.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
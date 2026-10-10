"use client";

import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { FaChevronDown, FaPause, FaPlay } from "react-icons/fa6";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

export type VideoBannerText = {
  pill: string;
  title: string;
  description: string;
  playVideo: string;
  pauseVideo: string;
  /** Scroll cue label (the "চিহ্ন" that invites the visitor to scroll). */
  scroll: string;
};

export type VideoBannerContent = {
  videoSrc: string;
  /** Full gradient class incl. direction, e.g. "bg-gradient-to-r from-[var(--sc-primary)]/20". */
  leftGlow: string;
  rightGlow: string;
  index: Record<LanguageCode, string>;
  text: Record<LanguageCode, VideoBannerText>;
};

type Props = {
  id: string;
  content: VideoBannerContent;
  /**
   * Extra pinned travel for the sticky video stage, expressed in viewport
   * heights. The section height becomes (1 + hold) × 100svh, so the video stays
   * pinned for `hold` viewports of native scroll while its copy finishes
   * animating — reproducing the reference's sticky "hold" before release.
   * Distinct per banner (the reference does not use one identical pin time).
   */
  hold?: number;
};

/**
 * Full-bleed, scroll-driven video "chapter" banner used three times on the
 * homepage (Home Connections / Student Achievement / Operational Excellence).
 *
 * Layers, back to front: the looping muted video (slow parallax zoom + a fade
 * on exit), brand-tinted gradient washes, a soft scrim for legibility, the
 * section mark (glass index medallion, bottom-left), the play/pause control
 * (top-right), the floating text block, and a scroll indicator at the bottom.
 *
 * STICKY HOLD: the section reserves (1 + hold) viewports of scroll; its inner
 * stage is `position: sticky; top:0; height:100svh`, so it pins to the viewport
 * while the tall section scrolls past, then releases naturally into the next
 * section — no blank gap, no sudden jump, and fully reversible.
 *
 * The text does a slow, layered upward drift as the visitor scrolls — the pill,
 * title and description each float up at a slightly different pace for depth —
 * and the block fades out by the time the pin releases. All motion is disabled
 * under `prefers-reduced-motion`.
 */
export default function VideoBanner({ id, content, hold = 0.8 }: Props) {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode = language === "en" ? "en" : "bn";
  const text = content.text[currentLanguage];
  const index = content.index[currentLanguage];

  const reduce = useReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPaused, setIsPaused] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Fraction of total progress during which the stage is actually pinned.
  // progress 0 → section top at viewport top; progress 1 → section bottom at
  // viewport top. The sticky child unpins at progress = hold / (1 + hold), so
  // the copy animation is mapped to complete right at that release point.
  const pinned = hold > 0 ? hold / (1 + hold) : 0.999;

  // Slow, layered upward drift: each line floats up at its own pace, finishing
  // exactly as the pin releases.
  const pillY = useTransform(
    scrollYProgress,
    [0, pinned * 0.55, pinned, 1],
    [0, -52, -96, -96],
  );
  const titleY = useTransform(
    scrollYProgress,
    [0, pinned * 0.55, pinned, 1],
    [0, -110, -210, -210],
  );
  const descY = useTransform(
    scrollYProgress,
    [0, pinned * 0.55, pinned, 1],
    [0, -150, -300, -300],
  );

  // Hold the copy readable, then let it melt away as the pin releases.
  const blockOpacity = useTransform(
    scrollYProgress,
    [0, pinned * 0.6, pinned * 0.85, pinned, 1],
    [1, 1, 0.55, 0, 0],
  );
  const blockScale = useTransform(
    scrollYProgress,
    [0, pinned * 0.6, pinned, 1],
    [1, 0.99, 0.94, 0.94],
  );

  // Video keeps a slow parallax zoom through the hold, then fades a touch as the
  // next section takes over.
  const videoScale = useTransform(
    scrollYProgress,
    [0, pinned, 1],
    [1.03, 1.075, 1.1],
  );
  const videoOpacity = useTransform(
    scrollYProgress,
    [0, pinned, 1],
    [1, 1, 0.9],
  );

  const pillStyle = reduce ? undefined : { y: pillY };
  const titleStyle = reduce ? undefined : { y: titleY };
  const descStyle = reduce ? undefined : { y: descY };
  const blockStyle = reduce
    ? undefined
    : { opacity: blockOpacity, scale: blockScale };
  const videoStyle = reduce
    ? undefined
    : { scale: videoScale, opacity: videoOpacity };

  const toggleVideo = async () => {
    const video = videoRef.current;

    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPaused(false);
      } else {
        video.pause();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Unable to control video playback:", error);
    }
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      lang={currentLanguage}
      className="relative overflow-visible bg-white"
      style={hold > 0 ? { height: `calc(100svh + ${hold * 100}svh)` } : undefined}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--color-primary)]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.video
            ref={videoRef}
            style={videoStyle}
            className="h-full w-full object-cover brightness-[1.04]"
            src={content.videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-white/[0.03]" />

        <div
          className={`pointer-events-none absolute inset-0 z-10 ${content.leftGlow} via-transparent to-transparent`}
        />

        <div
          className={`pointer-events-none absolute inset-0 z-10 ${content.rightGlow} via-transparent to-transparent`}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[170px] bg-gradient-to-b from-white/18 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[200px] bg-gradient-to-t from-white/14 to-transparent" />

        {/* Soft radial scrim so the floating copy keeps its contrast over any frame. */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(80%_62%_at_50%_50%,rgba(0,0,0,0.36),transparent_76%)]" />

        {/* Section mark (চিহ্ন): glass index medallion, bottom-left (clear of the site header). */}
        <div className="absolute bottom-7 left-5 z-40 lg:bottom-9 lg:left-10">
          <span
            lang="en"
            className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/20 text-[15px] font-black tabular-nums text-white shadow-[0_16px_38px_rgba(0,0,0,0.20)] backdrop-blur-md"
          >
            {index}
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-action)] ring-2 ring-white/70"
            />
          </span>
        </div>

        <button
          type="button"
          onClick={toggleVideo}
          aria-label={isPaused ? text.playVideo : text.pauseVideo}
          title={isPaused ? text.playVideo : text.pauseVideo}
          className="absolute right-5 top-5 z-40 flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/60 bg-white/20 text-white shadow-[0_16px_38px_rgba(0,0,0,0.14)] backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white hover:text-[var(--sc-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:right-10 lg:top-8"
        >
          {isPaused ? (
            <FaPlay className="text-[22px]" aria-hidden="true" />
          ) : (
            <FaPause className="text-[22px]" aria-hidden="true" />
          )}
        </button>

        <div className="absolute inset-0 z-30 flex h-[100svh] items-center justify-center px-6">
          <motion.div
            style={blockStyle}
            className="text-start-animation mx-auto flex max-w-[900px] flex-col items-center text-center lg:items-start lg:text-left"
          >
            <motion.span
              style={pillStyle}
              className="mb-6 inline-flex items-center justify-center gap-2.5 rounded-full border border-white/60 bg-white/25 px-5 py-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md md:text-[13px]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-action)]"
              />
              {text.pill}
            </motion.span>

            <motion.h2
              style={titleStyle}
              className="text-balance text-[26px] font-black leading-[1.08] tracking-[-0.02em] text-white drop-shadow-[0_3px_22px_rgba(0,0,0,0.5)] sm:text-[32px] md:text-[42px] lg:text-[52px]"
            >
              {text.title}
            </motion.h2>

            <motion.p
              style={descStyle}
              className="mt-6 max-w-[760px] text-[15px] font-medium leading-[1.7] text-white/95 drop-shadow-[0_3px_16px_rgba(0,0,0,0.5)] md:text-[17px] lg:text-[18px]"
            >
              {text.description}
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator (চিহ্ন): label + gently bobbing chevron, bottom-center. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-7 z-40 flex flex-col items-center gap-2.5 text-white/85">
          <span className="text-[10px] font-bold uppercase tracking-[0.30em] drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]">
            {text.scroll}
          </span>
          <motion.span
            aria-hidden="true"
            animate={reduce ? undefined : { y: [0, 7, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/12 backdrop-blur-sm"
          >
            <FaChevronDown className="text-[12px]" />
          </motion.span>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiShare2,
  FiGrid,
  FiDollarSign,
  FiShield,
  FiDatabase,
  FiZap,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getChapter, type SegmentId } from "../segmentData";

const EASE = [0.22, 1, 0.36, 1] as const;

const chapterIcons: Record<SegmentId, IconType> = {
  "home-connections-panel": FiAlertTriangle,
  "student-information": FiShare2,
  sis: FiGrid,
  enrollment: FiDollarSign,
  "special-programs": FiShield,
  "family-engagement": FiDatabase,
  communications: FiZap,
  "attendance-support": FiArrowRight,
};

/**
 * A right-rail / mobile marketing card for one chapter of the segment.
 *
 * The root <section id> is the anchor the scroll engine collects, and on mobile
 * (where the middle pane is hidden) these panels are the actual page content —
 * so each one is written to stand alone as a complete, premium marketing block.
 */
export default function SegmentPanel({ id, chapterId }: { id: string; chapterId: SegmentId }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const reduce = !!useReducedMotion();
  const duration = reduce ? 0 : 0.7;
  const chapter = getChapter(chapterId);
  const Icon = chapterIcons[chapterId];

  const reveal = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.4 },
    transition: { duration, delay, ease: EASE },
  });

  return (
    <section
      id={id}
      lang={lang}
      className="right-panel-section relative min-h-screen w-full overflow-hidden bg-[var(--color-white)] px-5 py-5 text-[var(--color-primary)] sm:px-6 md:px-8 lg:px-9 lg:py-7"
    >
      <div className="flex min-h-[calc(100vh-112px)] w-full flex-col justify-start pb-10 pt-3">
        <motion.div className="mb-5 flex items-center gap-3" {...reveal(0)}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] text-[var(--color-primary)] shadow-[0_14px_26px_-16px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
            <Icon size={18} />
          </span>
          <span className="product-pill-text inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] px-3.5 py-1.5 font-bold uppercase text-[var(--color-primary)]">
            {chapter.eyebrow[lang]}
          </span>
        </motion.div>

        <motion.h2 className="section-main-title max-w-[520px] font-extrabold tracking-[-0.03em] text-[var(--color-primary)]" {...reveal(0.06)}>
          {chapter.title[lang]}
        </motion.h2>

        <motion.p
          className="section-description mt-4 max-w-[520px] font-medium text-[color-mix(in_srgb,var(--color-black)_76%,var(--color-primary))]"
          {...reveal(0.1)}
        >
          {chapter.body[lang]}
        </motion.p>

        {chapter.cards ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {chapter.cards[lang].map((card, index) => {
              const CardIcon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_13%,var(--color-white))] p-4"
                  {...reveal(0.12 + index * 0.05)}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[var(--color-primary)]">
                    <CardIcon size={16} />
                  </span>
                  <h3 className="mt-3 text-[15px] font-bold leading-[1.3] tracking-[-0.01em] text-[var(--color-primary)]">{card.title}</h3>
                  <p className="mt-1.5 text-[13px] font-medium leading-[1.6] text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">{card.body}</p>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {chapter.roles ? (
          <div className="mt-8 flex flex-col gap-3">
            {chapter.roles[lang].map((role, index) => {
              const RoleIcon = role.icon;
              return (
                <motion.div
                  key={role.name}
                  className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_13%,var(--color-white))] p-4"
                  {...reveal(0.12 + index * 0.06)}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] text-[var(--color-primary)]">
                    <RoleIcon size={16} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold tracking-[-0.01em] text-[var(--color-primary)]">{role.name}</h3>
                    <p className="mt-1 text-[13px] font-medium leading-[1.6] text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">{role.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {chapter.layers ? (
          <div className="mt-8 flex flex-col gap-2">
            {chapter.layers[lang].map((layer, index) => (
              <motion.div
                key={layer.label}
                className="flex items-center justify-between rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_13%,var(--color-white))] px-4 py-3"
                style={{ marginLeft: `${index * 12}px` }}
                {...reveal(0.12 + index * 0.06)}
              >
                <p className="text-[14px] font-bold tracking-[-0.01em] text-[var(--color-primary)]">{layer.label}</p>
                <p className="text-right text-[12px] font-medium text-[color-mix(in_srgb,var(--color-black)_64%,var(--color-primary))]">{layer.note}</p>
              </motion.div>
            ))}
          </div>
        ) : null}

        {chapter.bullets ? (
          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {chapter.bullets[lang].map((bullet, index) => (
              <motion.div
                key={bullet}
                className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--color-primary)]"
                {...reveal(0.12 + index * 0.05)}
              >
                <FiCheck className="shrink-0 text-[var(--color-secondary-strong)]" size={16} />
                {bullet}
              </motion.div>
            ))}
          </div>
        ) : null}

        {chapter.cta ? (
          <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" {...reveal(0.16)}>
            <a
              href="#connect"
              className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-[14.5px] font-bold text-[var(--color-white)] shadow-[0_22px_46px_-22px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition duration-300 hover:-translate-y-1"
            >
              {chapter.cta[lang].primary}
              <FiArrowRight />
            </a>
            <a
              href="#my-connected-os"
              className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-white)] px-5 text-[14.5px] font-bold text-[var(--color-primary)] transition duration-300 hover:-translate-y-1"
            >
              {chapter.cta[lang].secondary}
            </a>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

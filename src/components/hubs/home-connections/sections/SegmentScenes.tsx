"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { getChapter, type SegmentId } from "../segmentData";
import { FiAlertTriangle, FiShare2, FiZap, FiSliders, FiMapPin, FiCheck, FiArrowRight } from "react-icons/fi";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Desktop middle-pane storytelling scene. The Hub swaps one scene per active
 * anchor; each scene shares one calm, premium visual language so the whole
 * segment reads as a single Shikkha Chat narrative rather than a grab-bag of
 * diagrams. Mount animations (not scroll observers) are used because the Hub
 * remounts the scene on every section change.
 */
export default function SegmentScene({ chapterId }: { chapterId: SegmentId }) {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bn";
  const reduce = !!useReducedMotion();
  const chapter = getChapter(chapterId);

  const reveal = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 22, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: reduce ? 0 : 0.62, delay: reduce ? 0 : delay, ease: EASE },
  });

  return (
    <div className="w-full max-w-[920px] px-6 sm:px-10 xl:px-14">
      <motion.h2
        {...reveal(0)}
        className="max-w-[640px] text-[26px] font-black leading-[1.16] tracking-[-0.03em] text-[var(--color-primary)] sm:text-[32px] xl:text-[40px]"
      >
        {chapter.title[lang]}
      </motion.h2>

      <motion.p
        {...reveal(0.07)}
        className="mt-4 max-w-[600px] text-[15px] font-medium leading-[1.72] text-[color-mix(in_srgb,var(--color-black)_74%,var(--color-primary))] sm:text-[16.5px]"
      >
        {chapter.body[lang]}
      </motion.p>

      <div className="mt-9">
        {chapter.id === "home-connections-panel" ? <ProblemVisual lang={lang} reduce={reduce} /> : null}
        {chapter.id === "student-information" ? <OrbitVisual lang={lang} reduce={reduce} /> : null}
        {chapter.id === "sis" || chapter.id === "enrollment" ? <CardsVisual chapterId={chapter.id} lang={lang} reduce={reduce} /> : null}
        {chapter.id === "special-programs" ? <RolesVisual lang={lang} reduce={reduce} /> : null}
        {chapter.id === "family-engagement" ? <LayersVisual lang={lang} reduce={reduce} /> : null}
        {chapter.id === "communications" ? <BenefitsVisual lang={lang} reduce={reduce} /> : null}
        {chapter.id === "attendance-support" ? <CtaVisual lang={lang} reduce={reduce} /> : null}
      </div>
    </div>
  );
}

type Lang = "bn" | "en";

/* ---------------------------------------------------------------- visuals */

function ProblemVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const cards = getChapter("home-connections-panel").cards?.[lang] ?? [];
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] xl:flex">
        <FiAlertTriangle className="text-[28px] text-[var(--color-secondary-strong)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[620px]">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.16 + index * 0.08, ease: EASE }}
              className="relative rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_82%,var(--color-secondary))] p-4 shadow-[0_18px_44px_-34px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] text-[var(--color-primary)]">
                <Icon size={16} />
              </span>
              <h3 className="mt-3 text-[15px] font-bold tracking-[-0.01em] text-[var(--color-primary)]">{card.title}</h3>
              <p className="mt-1 text-[13px] font-medium leading-[1.6] text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">{card.body}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function OrbitVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const chapter = getChapter("student-information");
  const list = chapter.nodes ?? [];
  const centerLabel = lang === "en" ? "Shikkha Chat" : "শিক্ষা চ্যাট";
  const count = list.length;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      <div className="pointer-events-none absolute inset-[16%] rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]" />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
        className="absolute left-1/2 top-1/2 z-10 flex h-[112px] w-[112px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-[26px] bg-[var(--color-primary)] text-center text-[var(--color-white)] shadow-[0_30px_60px_-26px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]"
      >
        <FiShare2 className="text-[22px] text-[var(--color-secondary)]" />
        <span className="px-3 text-[13px] font-black leading-[1.2]">{centerLabel}</span>
      </motion.div>

      {list.map((node, index) => {
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
        const radius = 42;
        const left = 50 + radius * Math.cos(angle);
        const top = 50 + radius * Math.sin(angle);
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.2 + index * 0.06, ease: EASE }}
            style={{ left: `${left}%`, top: `${top}%` }}
            className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)] px-3 py-2 shadow-[0_14px_30px_-18px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] text-[var(--color-primary)]">
              <Icon size={13} />
            </span>
            <span className="text-[12px] font-bold tracking-[-0.01em] text-[var(--color-primary)]">{node.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CardsVisual({ chapterId, lang, reduce }: { chapterId: SegmentId; lang: Lang; reduce: boolean }) {
  const cards = getChapter(chapterId).cards?.[lang] ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={reduce ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.55, delay: reduce ? 0 : 0.16 + index * 0.09, ease: EASE }}
            className="flex flex-col rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_86%,var(--color-secondary))] p-5 shadow-[0_22px_50px_-36px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] text-[var(--color-primary)] shadow-[0_14px_26px_-16px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              <Icon size={18} />
            </span>
            <h3 className="mt-4 text-[15px] font-bold leading-[1.3] tracking-[-0.01em] text-[var(--color-primary)]">{card.title}</h3>
            <p className="mt-2 text-[13px] font-medium leading-[1.62] text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]">{card.body}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function RolesVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const roles = getChapter("special-programs").roles?.[lang] ?? [];
  const [selected, setSelected] = useState(0);
  const active = roles[selected];

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        {roles.map((role, index) => {
          const Icon = role.icon;
          const isActive = index === selected;
          return (
            <button
              key={role.name}
              type="button"
              onClick={() => setSelected(index)}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition duration-300",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_20px_44px_-24px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_80%,var(--color-secondary))] text-[var(--color-primary)] hover:border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]",
              ].join(" ")}
            >
              <span className={["grid h-8 w-8 shrink-0 place-items-center rounded-xl", isActive ? "bg-[color-mix(in_srgb,var(--color-white)_18%,transparent)]" : "bg-[color-mix(in_srgb,var(--color-secondary)_24%,var(--color-white))]"].join(" ")}>
                <Icon size={15} />
              </span>
              <span className="text-[14px] font-bold leading-[1.2]">{role.name}</span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={selected}
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
        className="flex min-h-[160px] flex-col justify-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-6"
      >
        <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--color-secondary-strong)]">{active?.name}</span>
        <p className="mt-3 text-[16px] font-semibold leading-[1.6] tracking-[-0.01em] text-[var(--color-primary)]">{active?.body}</p>
      </motion.div>
    </div>
  );
}

function LayersVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const chapter = getChapter("family-engagement");
  const layers = chapter.layers?.[lang] ?? [];
  const bullets = chapter.bullets?.[lang] ?? [];
  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
      <div className="flex flex-col gap-2">
        {layers.map((layer, index) => (
            <motion.div
              key={layer.label}
              initial={reduce ? false : { opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.14 + index * 0.08, ease: EASE }}
              style={{ marginLeft: `${index * 16}px` }}
              className="flex items-center justify-between rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-4 py-3"
            >
              <div>
                <p className="text-[14px] font-bold tracking-[-0.01em] text-[var(--color-primary)]">{layer.label}</p>
                <p className="text-[12px] font-medium text-[color-mix(in_srgb,var(--color-black)_64%,var(--color-primary))]">{layer.note}</p>
              </div>
            </motion.div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {bullets.map((bullet, index) => (
          <motion.div
            key={bullet}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.24 + index * 0.05, ease: EASE }}
            className="flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]"
          >
            <FiCheck className="shrink-0 text-[var(--color-secondary-strong)]" size={15} />
            {bullet}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BenefitsVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const bullets = getChapter("communications").bullets?.[lang] ?? [];
  const icons = [FiZap, FiSliders, FiMapPin, FiCheck, FiCheck, FiCheck];
  return (
    <div className="grid gap-3 sm:grid-cols-3 xl:max-w-[640px]">
      {bullets.map((bullet, index) => {
        const Icon = icons[index] ?? FiCheck;
        return (
          <motion.div
            key={bullet}
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.14 + index * 0.07, ease: EASE }}
            className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_84%,var(--color-secondary))] px-4 py-3.5"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] text-[var(--color-primary)]">
              <Icon size={15} />
            </span>
            <span className="text-[13.5px] font-bold leading-[1.35] tracking-[-0.01em] text-[var(--color-primary)]">{bullet}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CtaVisual({ lang, reduce }: { lang: Lang; reduce: boolean }) {
  const cta = getChapter("attendance-support").cta?.[lang];
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : 0.16, ease: EASE }}
      className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center"
    >
      <a
        href="#connect"
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-[15px] font-bold text-[var(--color-white)] shadow-[0_22px_46px_-22px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition duration-300 hover:-translate-y-1"
      >
        {cta?.primary}
        <FiArrowRight />
      </a>
      <a
        href="#my-connected-os"
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-white)] px-6 text-[15px] font-bold text-[var(--color-primary)] transition duration-300 hover:-translate-y-1"
      >
        {cta?.secondary}
      </a>
    </motion.div>
  );
}

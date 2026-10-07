"use client";

import type { IconType } from "react-icons";
import { LuCheck } from "react-icons/lu";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Stat = {
  value: string;
  label: string;
};

type SectionPanelProps = {
  id: string;
  pill: string;
  pillStyle?: "solid" | "outline";
  title: string;
  description: string;
  /** Additional supporting paragraph that adds depth without a wall of text. */
  supporting?: string;
  /** Short list of key capabilities / operational benefits (2-4 items). */
  capabilities?: readonly string[];
  /** Semantic icon for the card, from the shared react-icons/lu family. */
  icon?: IconType;
  stats?: readonly Stat[];
  quote?: string;
  author?: string;
  role?: string;
  showButtons?: boolean;
  productDetailsText?: string;
  saveProductText?: string;
  activeProductText?: string;
};

const panelText = {
  bn: {
    productDetails: "বিস্তারিত দেখুন",
    saveProduct: "সংরক্ষণ",
  },
  en: {
    productDetails: "View details",
    saveProduct: "Save",
  },
} as const;

export default function SectionPanel({
  id,
  pill,
  title,
  description,
  supporting,
  capabilities = [],
  icon: Icon,
  stats = [],
  quote,
  author,
  role,
  showButtons = true,
  productDetailsText,
  saveProductText,
}: SectionPanelProps) {
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = panelText[currentLanguage];

  const detailsLabel = productDetailsText ?? text.productDetails;
  const saveLabel = saveProductText ?? text.saveProduct;

  const enter = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 24 };
  const enterTransition = {
    duration: reduceMotion ? 0 : 0.72,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const listVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.055, delayChildren: 0.04 },
    },
  };
  const itemVariants = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <motion.aside
      id={id}
      lang={currentLanguage}
      className="right-panel-section relative min-h-0 w-full overflow-hidden bg-transparent px-5 py-5 text-[var(--color-primary)] sm:px-6 md:px-8 lg:px-9 lg:py-7 xl:min-h-screen"
      initial={enter}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={enterTransition}
    >
      <div className="flex w-full flex-col justify-start pb-10 pt-3 xl:min-h-[calc(100vh-112px)] xl:justify-center">
        {/* Header — sits directly on the single unified rail surface,
            separated by a hairline instead of its own filled box. */}
        <div className="border-b border-[var(--color-border-soft)] pb-6">
          <motion.div
            className="mb-5 flex items-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              aria-hidden
              className="interface-icon-text grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_18%,var(--color-white))] text-[var(--color-secondary-strong)]"
              whileHover={reduceMotion ? undefined : { rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 340, damping: 18 }}
            >
              {Icon ? <Icon className="h-[22px] w-[22px]" /> : <span aria-hidden>✦</span>}
            </motion.span>

            <span className="product-pill-text inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] px-3.5 py-1.5 uppercase text-[var(--color-primary)]">
              {pill}
            </span>
          </motion.div>

          <motion.h2
            className="section-main-title max-w-[560px] font-extrabold tracking-[-0.03em] text-[var(--color-primary)]"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h2>

          <motion.p
            className="section-description mt-4 max-w-[560px] font-medium text-[color-mix(in_srgb,var(--color-black)_78%,var(--color-primary))]"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
          >
            {description}
          </motion.p>

          {supporting ? (
            <motion.p
              className="section-description mt-3 max-w-[560px] font-medium text-[color-mix(in_srgb,var(--color-black)_70%,var(--color-primary))]"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {supporting}
            </motion.p>
          ) : null}
        </div>

        {/* Key capabilities — short, scannable, one consistent check marker. */}
        {capabilities.length ? (
          <motion.ul
            className="mt-7 grid max-w-[560px] gap-3"
            variants={listVariants}
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {capabilities.map((cap) => (
              <motion.li key={cap} className="flex items-start gap-3" variants={itemVariants}>
                <span
                  aria-hidden
                  className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_22%,var(--color-white))] text-[var(--color-secondary-strong)]"
                >
                  <LuCheck className="h-3.5 w-3.5" />
                </span>
                <span className="capability-text font-semibold text-[color-mix(in_srgb,var(--color-black)_80%,var(--color-primary))]">
                  {cap}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        ) : null}

        {/* Actions — the primary action uses the established Shikkha red;
            the secondary control stays neutral on purpose. */}
        {showButtons ? (
          <motion.div
            className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.a
              href="#"
              className="action-text inline-flex h-[46px] items-center justify-center gap-2.5 rounded-xl bg-[var(--color-action)] px-5 font-bold text-[var(--color-white)] shadow-[0_12px_28px_-14px_color-mix(in_srgb,var(--color-action)_60%,transparent)] transition-colors hover:bg-[var(--color-action-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              {detailsLabel}
              <span aria-hidden>→</span>
            </motion.a>

            <motion.button
              type="button"
              className="action-text inline-flex h-[46px] items-center justify-center gap-2.5 rounded-xl border border-[var(--color-border-strong)] bg-transparent px-5 font-bold text-[var(--color-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <span aria-hidden>☆</span>
              {saveLabel}
            </motion.button>
          </motion.div>
        ) : null}

        {/* Stats — minimal bordered blocks on the unified surface, no fill. */}
        {stats.length ? (
          <motion.div
            className="mt-8 grid max-w-[560px] gap-4 sm:grid-cols-2"
            variants={listVariants}
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat) => (
              <motion.div
                key={`${stat.value}-${stat.label}`}
                className="right-stat-card rounded-2xl border border-[var(--color-border-soft)] bg-transparent p-4"
                variants={itemVariants}
              >
                <h3 className="stat-value-text font-black tracking-[-0.03em] text-[var(--color-primary)]">
                  {stat.value}
                </h3>
                <p className="stat-label-text mt-2 font-bold text-[var(--color-black)]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* Supporting statement — a light, structured quote block. */}
        {quote ? (
          <motion.div
            className="right-quote-card mt-8 max-w-[560px] rounded-2xl border border-[var(--color-border-soft)] border-l-2 border-l-[var(--color-secondary-strong)] bg-[color-mix(in_srgb,var(--color-secondary)_9%,transparent)] p-5 pl-6 sm:p-6 sm:pl-7"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="quote-text font-bold tracking-[-0.02em] text-[var(--color-black)]">
              “{quote}”
            </p>
            {author ? (
              <p className="author-name-text mt-4 font-bold text-[var(--color-primary)]">
                {author}
              </p>
            ) : null}
            {role ? (
              <p className="author-role-text mt-1 font-semibold text-[color-mix(in_srgb,var(--color-black)_60%,var(--color-primary))]">
                {role}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </motion.aside>
  );
}

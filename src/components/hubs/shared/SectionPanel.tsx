"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Stat = { value: string; label: string };

type SectionPanelProps = {
  id: string;
  pill: string;
  pillStyle?: "solid" | "outline";
  title: string;
  description: string;
  stats?: readonly Stat[];
  quote?: string;
  author?: string;
  role?: string;
  showButtons?: boolean;
  /**
   * Overrides some panels pass through. They are optional and kept for API
   * compatibility — the copy falls back to `panelText` when they are absent.
   */
  productDetailsText?: string;
  saveProductText?: string;
  activeProductText?: string;
};

const panelText = {
  bn: {
    productDetails: "পণ্যের বিস্তারিত",
    saveProduct: "পণ্য সংরক্ষণ করুন",
  },
  en: {
    productDetails: "Product Details",
    saveProduct: "Save Product",
  },
} as const;

/**
 * A right-hand detail card.
 *
 * Text-first and content-driven: each card opens with a clean header — a small
 * icon plus the product eyebrow — sitting above its headline and short
 * description. Action buttons, key stats and a short supporting statement
 * (a quote with its author) follow when the panel supplies them.
 *
 * The former large image / logo media block was removed so each card
 * communicates through its own copy rather than artwork, and no empty
 * placeholder is left behind.
 *
 * Height is natural on mobile/tablet and locked to one viewport on desktop
 * (>=1280px) so the right rail keeps the pinned-scroll alignment the home
 * section relies on.
 */
export default function SectionPanel({
  id,
  pill,
  title,
  description,
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
  const duration = reduceMotion ? 0 : 0.72;

  const detailsLabel = productDetailsText ?? text.productDetails;
  const saveLabel = saveProductText ?? text.saveProduct;

  return (
    <motion.aside
      id={id}
      lang={currentLanguage}
      className="right-panel-section relative min-h-0 w-full overflow-hidden bg-[var(--color-white)] px-5 py-5 text-[var(--color-primary)] sm:px-6 md:px-8 lg:px-9 lg:py-7 xl:min-h-screen"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full flex-col justify-start pb-10 pt-3 xl:min-h-[calc(100vh-112px)]">
        <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_5%,var(--color-white))] p-5 shadow-[0_18px_46px_-34px_color-mix(in_srgb,var(--color-primary)_26%,transparent)] transition duration-500 hover:shadow-[0_30px_70px_-30px_color-mix(in_srgb,var(--color-primary)_38%,transparent)] sm:p-6">
        <motion.div
          className="mb-5 flex items-center gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            aria-hidden
            className="interface-icon-text grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-secondary),color-mix(in_srgb,var(--color-secondary-strong)_72%,var(--color-secondary)))] font-black text-[var(--color-primary)] shadow-[0_14px_26px_-16px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
            whileHover={reduceMotion ? undefined : { rotate: 8, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 340, damping: 18 }}
          >
            ✦
          </motion.span>

          <span className="product-pill-text inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] px-3.5 py-1.5 font-bold uppercase text-[var(--color-primary)]">
            {pill}
          </span>
        </motion.div>

        <motion.h2
          className="section-main-title max-w-[520px] font-extrabold tracking-[-0.03em] text-[var(--color-primary)]"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h2>

        <motion.p
          className="section-description mt-4 max-w-[520px] font-medium text-[color-mix(in_srgb,var(--color-black)_76%,var(--color-primary))]"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          {description}
        </motion.p>
        </div>

        {showButtons ? (
          <motion.div
            className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.a
              href="#"
              className="action-text inline-flex h-[48px] items-center justify-center gap-3 rounded-xl border border-[var(--color-primary)] bg-[var(--color-white)] px-5 font-bold text-[var(--color-primary)] shadow-[0_10px_28px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
              whileHover={reduceMotion ? undefined : { y: -3, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <span>→</span>
              {detailsLabel}
            </motion.a>

            <motion.button
              type="button"
              className="action-text inline-flex items-center gap-3 font-bold text-[var(--color-primary)]"
              whileHover={reduceMotion ? undefined : { x: 5 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <span>☆</span>
              {saveLabel}
            </motion.button>
          </motion.div>
        ) : null}

        {stats.length ? (
          <motion.div
            className="mt-9 grid gap-5 sm:grid-cols-2"
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
            }}
          >
            {stats.map((stat) => (
              <motion.div
                key={`${stat.value}-${stat.label}`}
                className="right-stat-card rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-4"
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="stat-value-text font-black tracking-[-0.03em] text-[var(--color-primary)]">
                  {stat.value}
                </h3>
                <p className="stat-label-text mt-2 max-w-[450px] font-bold text-[var(--color-black)]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {quote ? (
          <motion.div
            className="right-quote-card mt-8 overflow-hidden rounded-[20px] bg-[var(--color-secondary)] p-5 sm:p-6"
            initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={reduceMotion ? undefined : { y: -4 }}
            transition={{ duration, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              className="quote-text font-bold tracking-[-0.02em] text-[var(--color-black)]"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.18 }}
            >
              “{quote}”
            </motion.p>

            {author ? (
              <motion.div
                className="mt-6"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.22 }}
              >
                <h3 className="author-name-text font-extrabold text-[var(--color-black)]">{author}</h3>
                {role ? (
                  <p className="author-role-text mt-1 font-bold text-[color-mix(in_srgb,var(--color-black)_74%,var(--color-primary))]">
                    {role}
                  </p>
                ) : null}
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </motion.aside>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/language";

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
  image?: string;
  logo?: string;
  showButtons?: boolean;
};

const panelText = {
  bn: {
    activeProduct: "সক্রিয় পণ্য",
    productDetails: "পণ্যের বিস্তারিত",
    saveProduct: "পণ্য সংরক্ষণ করুন",
    schoolLeader: "স্কুল নেতৃত্ব",
    schoolLogo: "স্কুল লোগো",
  },
  en: {
    activeProduct: "Active Product",
    productDetails: "Product Details",
    saveProduct: "Save Product",
    schoolLeader: "School leader",
    schoolLogo: "School Logo",
  },
} as const;

export default function SectionPanel({
  id,
  pill,
  pillStyle = "outline",
  title,
  description,
  stats = [],
  quote,
  author,
  role,
  image,
  logo,
  showButtons = true,
}: SectionPanelProps) {
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = panelText[currentLanguage];
  const isSolid = pillStyle === "solid";
  const duration = reduceMotion ? 0 : 0.72;

  return (
    <motion.aside
      id={id}
      lang={currentLanguage}
      className="right-panel-section relative min-h-screen w-full overflow-hidden bg-[var(--color-white)] px-5 py-5 text-[var(--color-primary)] sm:px-6 md:px-8 lg:px-9 lg:py-7"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="sticky top-4 z-30 pb-4 pt-1 sm:top-5"
        initial={reduceMotion ? false : { opacity: 0, y: -18, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="right-product-shell rounded-[24px] bg-[var(--color-white)] p-1.5">
          <motion.div
            className={[
              "right-product-card group relative flex min-h-[62px] w-full items-center gap-3 overflow-hidden rounded-[20px] border px-4 py-3 sm:min-h-[66px] sm:px-5",
              isSolid
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
                : "border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_86%,transparent)] text-[var(--color-primary)] backdrop-blur-xl",
            ].join(" ")}
            whileHover={reduceMotion ? undefined : { y: -3, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <motion.span
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--color-secondary)] opacity-20 blur-2xl"
              animate={reduceMotion ? undefined : { x: [0, -8, 0], y: [0, 8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-[var(--color-white)] opacity-10 blur-2xl" />

            <motion.span
              className="interface-icon-text relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--color-white)_70%,transparent)] bg-[var(--color-secondary)] font-black text-[var(--color-primary)] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-black)_16%,transparent)]"
              whileHover={reduceMotion ? undefined : { rotate: 10, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 360, damping: 18 }}
            >
              ✦
            </motion.span>

            <span className="relative z-10 min-w-0 flex-1">
              <span className="active-product-text block font-bold uppercase tracking-[0.08em] text-[var(--color-secondary)]">
                {text.activeProduct}
              </span>
              <span
                className={[
                  "product-pill-text mt-0.5 block truncate font-bold tracking-[0.02em]",
                  isSolid ? "text-[var(--color-white)]" : "text-[var(--color-primary)]",
                ].join(" ")}
              >
                {pill}
              </span>
            </span>

            <motion.span
              className="interface-icon-text relative z-10 hidden h-8 min-w-8 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_75%,transparent)] bg-[var(--color-white)] px-3 font-black text-[var(--color-primary)] sm:grid"
              whileHover={reduceMotion ? undefined : { x: 4 }}
            >
              →
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex min-h-[calc(100vh-112px)] flex-col justify-center pb-10 pt-9">
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
              {text.productDetails}
            </motion.a>

            <motion.button
              type="button"
              className="action-text inline-flex items-center gap-3 font-bold text-[var(--color-primary)]"
              whileHover={reduceMotion ? undefined : { x: 5 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <span>☆</span>
              {text.saveProduct}
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

            <div className="right-quote-media relative mt-6 flex min-h-[130px] items-center justify-center overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1.15px,transparent_1.15px)] [background-size:17px_17px] opacity-30" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent,color-mix(in_srgb,var(--color-white)_18%,transparent),transparent)]" />

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                {image ? (
                  <motion.img
                    src={image}
                    alt={author || text.schoolLeader}
                    className="h-[78px] w-[78px] rounded-2xl object-cover grayscale shadow-[0_12px_28px_color-mix(in_srgb,var(--color-black)_15%,transparent)]"
                    whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: -1.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  />
                ) : null}

                <motion.div
                  className="brand-logo-text flex min-h-[84px] w-[140px] items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-white)_42%,transparent)] px-4 text-center font-black uppercase text-[var(--color-primary)] backdrop-blur-sm"
                  whileHover={reduceMotion ? undefined : { scale: 1.035, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {logo || text.schoolLogo}
                </motion.div>
              </div>
            </div>

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

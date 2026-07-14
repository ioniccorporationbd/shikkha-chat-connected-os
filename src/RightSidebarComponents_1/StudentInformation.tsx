
"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    activeProduct: "সক্রিয় পণ্য",
    pill: "শিক্ষার্থীর তথ্য ব্যবস্থাপনা",
    title: "শিক্ষকদের মূল্যবান সময় ফিরিয়ে দিন",
    description:
      "শিক্ষার্থীদের তথ্য বিভিন্ন ব্যবস্থায় ছড়িয়ে থাকলে শিক্ষক ও কর্মীরা শিক্ষার্থীদের প্রতি মনোযোগ দেওয়ার পরিবর্তে রেকর্ড সংশোধনে মূল্যবান সময় ব্যয় করেন। শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, ভর্তি কার্যক্রম এবং বিশেষ কর্মসূচি ব্যবস্থাপনাকে একটি সমন্বিত ব্যবস্থায় যুক্ত করে। এর ফলে বিদ্যালয় আত্মবিশ্বাসের সঙ্গে কার্যক্রম পরিচালনা করতে পারে এবং প্রতিটি শিক্ষার্থীর প্রয়োজন অনুযায়ী সহায়তা নিশ্চিত করতে পারে।",
    statValue: "১০–২০ ঘণ্টা",
    statLabel: "প্রতি সপ্তাহে শিক্ষকদের প্রশাসনিক কাজের সময় সাশ্রয়",
    quote:
      "শিক্ষা চ্যাট আমাদের শিক্ষকদের হাতে করা মূল্যায়ন ও পুনরাবৃত্তিমূলক কাজের সময় কমিয়ে দিচ্ছে। আমরা চাই শিক্ষকরা পাঠদান, শিক্ষার্থীদের সহায়তা এবং তাদের অগ্রগতি মূল্যায়নে আরও বেশি মনোযোগ দিন।",
    author: "বার্ট ব্যানফিল্ড",
    role: "সাবেক বিদ্যালয় প্রধান, এপিক চার্টার স্কুলস, ওকলাহোমা",
    logo: "এপিক চার্টার স্কুলস",
    imageAlt: "বিদ্যালয়ের সাবেক প্রধান বার্ট ব্যানফিল্ড",
    arrowLabel: "পরবর্তী অংশ",
  },

  en: {
    activeProduct: "Active Product",
    pill: "Student Information Management",
    title: "Give educators their valuable time back",
    description:
      "When student data is scattered across multiple systems, teachers and staff spend valuable time correcting records instead of focusing on learners. Shikkha Chat brings student information, enrollment operations, and special program management into one connected system. This helps schools operate confidently and provide support based on every student’s needs.",
    statValue: "10–20 Hours",
    statLabel: "Administrative work time saved by teachers every week",
    quote:
      "Shikkha Chat is reducing the time our teachers spend on manual grading and repetitive work. We want educators to focus more on teaching, supporting learners, and measuring student progress.",
    author: "Bart Banfield",
    role: "Former School Leader, Epic Charter Schools, Oklahoma",
    logo: "Epic Charter Schools",
    imageAlt: "Former school leader Bart Banfield",
    arrowLabel: "Next section",
  },
} as const;

const sectionClass =
  "relative min-h-screen w-full bg-[var(--color-white)] px-[20px] py-[20px] text-[var(--color-primary)] sm:px-[24px] md:px-[32px] lg:px-[36px] lg:py-[28px]";

const stickyWrapperClass =
  "sticky top-[16px] z-30 pb-[16px] pt-[4px] sm:top-[20px]";

const stickyOuterCardClass =
  "rounded-[24px] bg-[var(--color-white)] p-[6px] shadow-[0_18px_46px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]";

const stickyInnerCardClass =
  "group relative flex min-h-[58px] w-full items-center gap-[12px] overflow-hidden rounded-[20px] border border-[var(--color-primary)] bg-[var(--color-primary)] px-[16px] py-[12px] text-[var(--color-white)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-white)_12%,transparent)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_22px_52px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] sm:min-h-[62px] sm:px-[20px]";

const topGlowClass =
  "pointer-events-none absolute -right-[40px] -top-[40px] h-[112px] w-[112px] rounded-full bg-[var(--color-secondary)] opacity-20 blur-[24px]";

const bottomGlowClass =
  "pointer-events-none absolute -bottom-[48px] left-[40px] h-[96px] w-[96px] rounded-full bg-[var(--color-white)] opacity-10 blur-[24px]";

const iconClass =
  "relative z-10 grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[16px] border border-[var(--color-white)] bg-[var(--color-secondary)] font-black text-[var(--color-primary)] shadow-[0_12px_24px_color-mix(in_srgb,var(--color-black)_18%,transparent)] transition duration-300 group-hover:scale-105";

/* Global CSS: 16px */
const activeProductClass =
  "active-product-text block font-black uppercase tracking-[0.7px] text-[var(--color-secondary)]";

/* Global CSS: 20px */
const pillClass =
  "product-pill-text mt-[2px] block truncate font-black tracking-[-0.2px] text-[var(--color-white)]";

const arrowClass =
  "relative z-10 hidden h-[32px] min-w-[32px] place-items-center rounded-full border border-[var(--color-white)] bg-[var(--color-white)] px-[12px] font-black text-[var(--color-primary)] sm:grid";

const contentWrapperClass =
  "flex min-h-[calc(100vh-112px)] flex-col justify-center pb-[40px] pt-[36px]";

/* Global CSS: 20px */
const titleClass =
  "section-main-title max-w-[620px] font-black tracking-[-0.6px] text-[var(--color-primary)]";

/* Global CSS: 16px */
const descriptionClass =
  "section-description mt-[20px] max-w-[620px] font-medium text-[color-mix(in_srgb,var(--color-black)_76%,var(--color-primary))]";

const statWrapperClass =
  "mt-[36px] space-y-[28px]";

/* Global CSS: 20px */
const statValueClass =
  "stat-value-text font-black tracking-[-0.45px] text-[var(--color-primary)]";

/* Global CSS: 16px */
const statLabelClass =
  "stat-label-text mt-[12px] max-w-[620px] font-bold text-[var(--color-primary)]";

const quoteCardClass =
  "mt-[32px] overflow-hidden rounded-[18px] bg-[var(--color-secondary)] p-[20px] shadow-[0_18px_45px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] sm:p-[24px]";

/* Global CSS: 18px */
const quoteTextClass =
  "quote-text font-bold tracking-[-0.2px] text-[var(--color-black)]";

const mediaBoxClass =
  "relative mt-[24px] flex min-h-[130px] items-center justify-center overflow-hidden rounded-[16px]";

const dottedBgClass =
  "absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1.25px,transparent_1.25px)] [background-size:17px_17px] opacity-30";

const mediaInnerClass =
  "relative z-10 flex flex-wrap items-center justify-center gap-[24px] sm:gap-[32px]";

const imageClass =
  "h-[78px] w-[78px] rounded-[16px] object-cover grayscale shadow-[0_12px_28px_color-mix(in_srgb,var(--color-black)_15%,transparent)]";

/* Global CSS: 18px */
const logoClass =
  "brand-logo-text flex h-[84px] w-[140px] items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--color-white)_42%,transparent)] px-[16px] text-center font-black uppercase text-[var(--color-primary)]";

const authorBoxClass =
  "mt-[24px]";

/* Global CSS: 10px */
const authorClass =
  "author-name-text font-black tracking-[0.2px] text-[var(--color-black)]";

/* Global CSS: 12px */
const roleClass =
  "author-role-text mt-[8px] font-bold text-[color-mix(in_srgb,var(--color-black)_76%,var(--color-primary))]";

export default function StudentInformation() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = sectionText[currentLanguage];

  return (
    <aside
      id="student-information"
      className={sectionClass}
      lang={currentLanguage}
    >
      <div className={stickyWrapperClass}>
        <div className={stickyOuterCardClass}>
          <div className={stickyInnerCardClass}>
            <span className={topGlowClass} aria-hidden="true" />
            <span className={bottomGlowClass} aria-hidden="true" />

            <span className={iconClass} aria-hidden="true">
              ✦
            </span>

            <span className="relative z-10 min-w-0 flex-1">
              <span className={activeProductClass}>
                {text.activeProduct}
              </span>

              <span className={pillClass}>
                {text.pill}
              </span>
            </span>

            <span
              className={arrowClass}
              aria-label={text.arrowLabel}
              title={text.arrowLabel}
            >
              →
            </span>
          </div>
        </div>
      </div>

      <div className={contentWrapperClass}>
        <h2 className={titleClass}>
          {text.title}
        </h2>

        <p className={descriptionClass}>
          {text.description}
        </p>

        <div className={statWrapperClass}>
          <div>
            <h3 className={statValueClass}>
              {text.statValue}
            </h3>

            <p className={statLabelClass}>
              {text.statLabel}
            </p>
          </div>
        </div>

        <div className={quoteCardClass}>
          <blockquote className={quoteTextClass}>
            “{text.quote}”
          </blockquote>

          <div className={mediaBoxClass}>
            <div
              className={dottedBgClass}
              aria-hidden="true"
            />

            <div className={mediaInnerClass}>
              <Image
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80"
                alt={text.imageAlt}
                width={78}
                height={78}
                className={imageClass}
              />

              <div
                className={logoClass}
                aria-label={text.logo}
              >
                {text.logo}
              </div>
            </div>
          </div>

          <div className={authorBoxClass}>
            <h3 className={authorClass}>
              {text.author}
            </h3>

            <p className={roleClass}>
              {text.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

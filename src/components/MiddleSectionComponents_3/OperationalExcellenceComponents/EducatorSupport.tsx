"use client";

import { type ReactNode, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlinePsychology,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";


type LanguageCode = "bn" | "en";

const sectionTranslations: Record<string, string> = {
  "Operational Excellence": "অপারেশনাল উৎকর্ষতা",
  "Operations Hub": "অপারেশন হাব",
  "Resource Planning": "রিসোর্স পরিকল্পনা",
  "Planning": "পরিকল্পনা",
  "Financial Strategy": "আর্থিক কৌশল",
  "Allovue": "আর্থিক ব্যবস্থাপনা",
  "ERP Systems": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা",
  "Core ERP": "মূল এন্টারপ্রাইজ রিসোর্স পরিকল্পনা",
  "Predictive Enrollment": "পূর্বাভাসভিত্তিক ভর্তি ব্যবস্থাপনা",
  "Forecasting": "পূর্বাভাস",
  "Talent Management": "প্রতিভা ব্যবস্থাপনা",
  "People": "মানুষ",
  "Recruiting and HR": "নিয়োগ ও মানবসম্পদ",
  "Hiring": "নিয়োগ",
  "Educator Support": "শিক্ষক সহায়তা",
  "Staff Success": "স্টাফ সাফল্য",
  "Hiring Workflow": "নিয়োগ কার্যধারা",
  "Planning Hub": "পরিকল্পনা হাব",
  "Finance Strategy": "আর্থিক কৌশল",
  "Finance Planning": "আর্থিক পরিকল্পনা",
  "Enrollment Forecasting": "ভর্তি পূর্বাভাস",
  "People Operations": "মানবসম্পদ পরিচালনা",
  "Talent Planning": "প্রতিভা পরিকল্পনা",
  "Connected Operations": "সংযুক্ত অপারেশন",
  "Connected Capability": "সংযুক্ত সক্ষমতা",
  "ERP Core": "মূল এন্টারপ্রাইজ ব্যবস্থা",
  "Close detail": "বিস্তারিত বন্ধ করুন",
  "Open Section": "সেকশন খুলুন",
  "Resource Planning helps school leaders align budgets, staffing, programs, and operational priorities with better visibility.": "রিসোর্স পরিকল্পনা স্কুল নেতৃত্বকে বাজেট, জনবল, কার্যক্রম এবং অপারেশনাল অগ্রাধিকার আরও পরিষ্কারভাবে মিলিয়ে নিতে সাহায্য করে।",
  "Resource Planning helps leaders align people, budgets, programs, and priorities with better visibility.": "রিসোর্স পরিকল্পনা নেতৃত্বকে মানুষ, বাজেট, কার্যক্রম এবং অগ্রাধিকার আরও পরিষ্কারভাবে মিলিয়ে নিতে সাহায্য করে।",
  "Resource Planning aligns people, programs, budgets, and priorities into a clearer planning process.": "রিসোর্স পরিকল্পনা মানুষ, কার্যক্রম, বাজেট এবং অগ্রাধিকারকে আরও পরিষ্কার পরিকল্পনা প্রক্রিয়ায় যুক্ত করে।",
  "Financial Strategy connects budgets, spending visibility, finance planning, and operational priorities.": "আর্থিক কৌশল বাজেট, ব্যয়ের দৃশ্যমানতা, আর্থিক পরিকল্পনা এবং অপারেশনাল অগ্রাধিকারকে সংযুক্ত করে।",
  "Financial Strategy connects budgets, spending visibility, and finance planning with operational priorities.": "আর্থিক কৌশল বাজেট, ব্যয়ের দৃশ্যমানতা এবং আর্থিক পরিকল্পনাকে অপারেশনাল অগ্রাধিকারের সাথে যুক্ত করে।",
  "ERP Systems connect finance, HR, purchasing, payroll, operations, and administrative workflows into one central business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অর্থ, মানবসম্পদ, ক্রয়, পেরোল, অপারেশন এবং প্রশাসনিক কাজকে একটি কেন্দ্রীয় ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "ERP Systems connect finance, HR, purchasing, operations, and administrative workflows into one central business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অর্থ, মানবসম্পদ, ক্রয়, অপারেশন এবং প্রশাসনিক কাজকে একটি কেন্দ্রীয় ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "ERP Systems connect operations, finance, purchasing, payroll, HR, and administration through one trusted business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অপারেশন, অর্থ, ক্রয়, পেরোল, মানবসম্পদ এবং প্রশাসনকে একটি নির্ভরযোগ্য ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "Operational Excellence brings school business systems together so leaders can plan, manage, and act with confidence.": "অপারেশনাল উৎকর্ষতা স্কুলের ব্যবসায়িক ব্যবস্থাগুলোকে একত্র করে, যাতে নেতৃত্ব আত্মবিশ্বাসের সাথে পরিকল্পনা, ব্যবস্থাপনা এবং সিদ্ধান্ত নিতে পারে।",
  "Operational Excellence brings every operational system together so leaders can plan, manage, and act with confidence.": "অপারেশনাল উৎকর্ষতা প্রতিটি অপারেশনাল ব্যবস্থাকে একত্র করে, যাতে নেতৃত্ব আত্মবিশ্বাসের সাথে পরিকল্পনা, ব্যবস্থাপনা এবং সিদ্ধান্ত নিতে পারে।",
  "Talent Management supports staff growth, role planning, performance, and people-centered operational decisions.": "প্রতিভা ব্যবস্থাপনা স্টাফের বৃদ্ধি, ভূমিকা পরিকল্পনা, পারফরম্যান্স এবং মানুষকেন্দ্রিক অপারেশনাল সিদ্ধান্তকে সহায়তা করে।",
  "Talent Management supports staff development, role planning, performance, and people-centered operational decisions.": "প্রতিভা ব্যবস্থাপনা স্টাফ উন্নয়ন, ভূমিকা পরিকল্পনা, পারফরম্যান্স এবং মানুষকেন্দ্রিক অপারেশনাল সিদ্ধান্তকে সহায়তা করে।",
  "Talent Management supports employee growth, staff planning, role visibility, and people-centered school operations.": "প্রতিভা ব্যবস্থাপনা কর্মী উন্নয়ন, স্টাফ পরিকল্পনা, ভূমিকার দৃশ্যমানতা এবং মানুষকেন্দ্রিক স্কুল অপারেশনকে সহায়তা করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, applicant tracking, and human resource workflows with school operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড, আবেদনকারী ট্র্যাকিং এবং মানবসম্পদ কার্যধারাকে স্কুল অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, and HR workflows with school operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড এবং মানবসম্পদ কার্যধারাকে স্কুল অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, and HR workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, staff records, onboarding, and human resources workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, স্টাফ রেকর্ড, অনবোর্ডিং এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, staff records, onboarding, and HR workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, স্টাফ রেকর্ড, অনবোর্ডিং এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Educator Support helps leaders support teacher growth, staff development, coaching, and instructional success.": "শিক্ষক সহায়তা নেতৃত্বকে শিক্ষক উন্নয়ন, স্টাফ বিকাশ, কোচিং এবং পাঠদান সাফল্য সহায়তা করতে সাহায্য করে।"
};

function useSectionText() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;

  return (text?: string) => {
    if (!text) return "";
    if (currentLanguage === "en") return text;
    return sectionTranslations[text] ?? text;
  };
}


type CardItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
  floating?: boolean;
  color?: string;
  label?: string;
  description?: string;
  positionClass?: string;
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const themeColor = "var(--color-secondary)";
const darkColor = "var(--color-primary)";
const glowColor = "color-mix(in_srgb,var(--color-primary)_18%,transparent)";
const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const centerCards: CardItem[] = [
  {
    id: "recruiting-and-hr",
    title: "Recruiting and HR",
    subtitle: "Hiring",
    icon: <FaRegStar />,
    color: darkColor,
    label: "Hiring Workflow",
    description:
      "Recruiting and HR connects hiring, onboarding, staff records, applicant tracking, and human resources workflows with school operations.",
  },
  {
    id: "educator-support",
    title: "Educator Support",
    subtitle: "Staff Success",
    icon: <FaRegCircleQuestion />,
    active: true,
    color: darkColor,
    label: "Main Staff Success",
    description:
      "Educator Support helps schools provide staff assistance, support visibility, professional help, workflow guidance, and connected resources so educators can stay focused on student success.",
  },
];

const floatingCards: CardItem[] = [
  {
    id: "operational-excellence",
    title: "Operational Excellence",
    subtitle: "Operations Hub",
    icon: <MdOutlineHub />,
    floating: true,
    color: darkColor,
    positionClass: "left-[4%] top-[13%]",
    label: "Operations Hub",
    description:
      "Operational Excellence brings school business systems together so leaders can plan, manage, and act with confidence.",
  },
  {
    id: "resource-planning",
    title: "Resource Planning",
    subtitle: "Planning",
    icon: <MdOutlineGridView />,
    floating: true,
    color: darkColor,
    positionClass: "left-[23%] top-[5%]",
    label: "Planning Hub",
    description:
      "Resource Planning helps leaders align people, budgets, programs, and priorities with better visibility.",
  },
  {
    id: "financial-strategy-allovue",
    title: "Financial Strategy",
    subtitle: "Allovue",
    icon: <MdOutlineAnalytics />,
    floating: true,
    color: darkColor,
    positionClass: "right-[14%] top-[3%]",
    label: "Finance Strategy",
    description:
      "Financial Strategy connects budgets, spending visibility, finance planning, and operational priorities.",
  },
  {
    id: "erp-systems",
    title: "ERP Systems",
    subtitle: "Core ERP",
    icon: <MdOutlineAutoAwesome />,
    floating: true,
    color: darkColor,
    positionClass: "right-[6%] top-[18%]",
    label: "Core ERP",
    description:
      "ERP Systems connect finance, HR, purchasing, payroll, operations, and administrative workflows into one central platform.",
  },
  {
    id: "predictive-enrollment",
    title: "Predictive Enrollment",
    subtitle: "Forecasting",
    icon: <FaUsers />,
    floating: true,
    color: darkColor,
    positionClass: "right-[3%] top-[36%]",
    label: "Enrollment Forecasting",
    description:
      "Predictive Enrollment helps schools forecast student movement, enrollment demand, staffing needs, and future planning pressure.",
  },
  {
    id: "talent-management",
    title: "Talent Management",
    subtitle: "People",
    icon: <MdOutlinePsychology />,
    floating: true,
    color: darkColor,
    positionClass: "left-[1.5%] top-[58%]",
    label: "People Operations",
    description:
      "Talent Management supports staff growth, role planning, performance, and people-centered operational decisions.",
  },
  {
    id: "recruiting-and-hr",
    title: "Recruiting and HR",
    subtitle: "Hiring",
    icon: <FaRegStar />,
    floating: true,
    color: darkColor,
    positionClass: "left-[3%] bottom-[14%]",
    label: "Hiring",
    description:
      "Recruiting and HR connects hiring, onboarding, staff records, and HR workflows with school operations.",
  },
];

const allCards = [...centerCards, ...floatingCards];

const connectorPaths: Record<string, ConnectorPath> = {
  "operational-excellence": {
    d: "M500 360 L430 360 Q410 360 410 340 L410 170 Q410 150 390 150 L126 150",
    color: darkColor,
    glowColor,
  },
  "resource-planning": {
    d: "M500 360 L455 360 Q435 360 435 340 L435 112 Q435 92 415 92 L304 92",
    color: darkColor,
    glowColor,
  },
  "financial-strategy-allovue": {
    d: "M500 360 L600 360 Q620 360 620 340 L620 108 Q620 88 640 88 L810 88",
    color: darkColor,
    glowColor,
  },
  "erp-systems": {
    d: "M500 360 L640 360 Q660 360 660 340 L660 188 Q660 168 680 168 L900 168",
    color: darkColor,
    glowColor,
  },
  "predictive-enrollment": {
    d: "M500 360 L720 360 Q740 360 740 340 L740 332 Q740 315 758 315 L918 315",
    color: darkColor,
    glowColor,
  },
  "talent-management": {
    d: "M500 360 L390 360 Q370 360 370 380 L370 515 Q370 535 350 535 L92 535",
    color: darkColor,
    glowColor,
  },
  "recruiting-and-hr": {
    d: "M500 360 L410 360 Q390 360 390 380 L390 610 Q390 630 370 630 L106 630",
    color: darkColor,
    glowColor,
  },
  "educator-support": {
    d: "M500 360 L500 360",
    color: themeColor,
    glowColor,
  },
};

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      ease: premiumEase,
      staggerChildren: 0.075,
      delayChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.88,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.55,
      ease: premiumEase,
    },
  },
};

function scrollRightSidebarTo(id: string) {
  const validRightSections = [
    "operational-excellence",
    "resource-planning",
    "financial-strategy-allovue",
    "erp-systems",
    "predictive-enrollment",
    "talent-management",
    "recruiting-and-hr",
    "educator-support",
  ];

  if (!validRightSections.includes(id)) return;

  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", {
      detail: { id },
    })
  );

  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", {
      detail: { id },
    })
  );
}

function formatTitle(title: string) {
  const words = title.trim().split(/\s+/);

  if (words.length === 1) return title;

  if (words.length === 2) {
    return (
      <>
        {words[0]}
        <br />
        {words[1]}
      </>
    );
  }

  return (
    <>
      {words.slice(0, -1).join(" ")}
      <br />
      {words[words.length - 1]}
    </>
  );
}

function MiniCard({
  item,
  selected,
  onSelect,
}: {
  item: CardItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isEducator = item.id === "educator-support";

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => {
        onSelect();
        scrollRightSidebarTo(item.id);
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -7,
              scale: 1.055,
              rotateX: 2,
              transition: {
                duration: 0.28,
                ease: premiumEase,
              },
            }
      }
      whileTap={{ scale: 0.94 }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)] focus-visible:ring-offset-2",
        selected
          ? "border-[3px] border-[var(--color-secondary)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-secondary)_100%)] shadow-[0_22px_52px_color-mix(in_srgb,var(--color-primary)_26%,transparent),0_0_0_5px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
          : "border border-[var(--color-secondary)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-secondary)_100%)] shadow-[0_12px_30px_color-mix(in_srgb,var(--color-black)_6%,transparent)]",
        "hover:shadow-[0_24px_58px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-white)_68%,transparent),transparent_52%,color-mix(in_srgb,var(--color-primary)_5%,transparent))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-[color-mix(in_srgb,var(--color-white)_40%,transparent)] blur-[1px]"
        initial={{ x: "-25%" }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                x: "335%",
                transition: {
                  duration: 0.8,
                  ease: premiumEase,
                },
              }
        }
      />

      {selected ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--color-secondary)]/70"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0.25, 0.78, 0.25],
                  scale: [1, 1.035, 1],
                }
          }
          transition={{
            duration: 2.1,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      ) : null}

      <FaRegStar
        className="absolute right-[8px] top-[8px] z-10 text-[12px] transition-all duration-500 group-hover:rotate-12"
        style={{ color: darkColor }}
      />

      {item.icon ? (
        <div
          className="relative z-10 mb-[8px] text-[27px] leading-none transition-transform duration-500 group-hover:scale-110"
          style={{ color: item.color ?? darkColor }}
        >
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center text-[var(--color-black)] tracking-[-0.04em]",
          isEducator ? "font-black" : "font-normal",
          isSingleWord
            ? "text-[13.5px] leading-none"
            : "text-[11px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(t(item.title))}
      </div>
    </motion.button>
  );
}

function ActiveEducatorCard({
  item,
  onSelect,
}: {
  item: CardItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => {
        onSelect();
        scrollRightSidebarTo(item.id);
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              scale: 1.035,
              rotateX: 2,
              transition: {
                duration: 0.28,
                ease: premiumEase,
              },
            }
      }
      whileTap={{ scale: 0.94 }}
      className={[
        "group relative h-[158px] w-[158px] overflow-hidden rounded-[22px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "border-[3px] border-[var(--color-secondary)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-secondary)_100%)]",
        "shadow-[0_26px_70px_color-mix(in_srgb,var(--color-primary)_26%,transparent),0_0_0_6px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
        "transition-shadow duration-500 hover:shadow-[0_32px_84px_color-mix(in_srgb,var(--color-primary)_22%,transparent),0_0_0_7px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-white)_70%,transparent),transparent_52%,color-mix(in_srgb,var(--color-primary)_6%,transparent))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-[color-mix(in_srgb,var(--color-white)_45%,transparent)] blur-[1px]"
        initial={{ x: "-25%" }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                x: "335%",
                transition: {
                  duration: 0.8,
                  ease: premiumEase,
                },
              }
        }
      />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[var(--color-secondary)]/75"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.25, 0.78, 0.25],
                scale: [1, 1.035, 1],
              }
        }
        transition={{
          duration: 2.1,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <FaRegStar
        className="absolute right-[10px] top-[10px] z-10 text-[13px] transition-all duration-500 group-hover:rotate-12"
        style={{ color: darkColor }}
      />

      <div
        className="relative z-10 mb-4 text-[42px] leading-none transition-all duration-500 group-hover:scale-110"
        style={{ color: darkColor }}
      >
        {item.icon}
      </div>

      <h3 className="relative z-10 max-w-[125px] text-[15px] font-black leading-[1.05] tracking-[-0.04em] text-[var(--color-black)]">
        {formatTitle(t(item.title))}
      </h3>
    </motion.button>
  );
}

function FloatingCard({
  item,
  active,
  onClick,
  index,
}: {
  item: CardItem;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              scale: 1.055,
              rotateX: 2,
              transition: {
                duration: 0.3,
                ease: premiumEase,
              },
            }
      }
      whileTap={{ scale: 0.94 }}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              y: [0, -4, 0],
            }
      }
      transition={{
        duration: 4 + index * 0.18,
        ease: "easeInOut",
        repeat: Infinity,
        delay: index * 0.08,
      }}
      className={[
        "group absolute z-20 h-[96px] w-[96px] overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)] focus-visible:ring-offset-2",
        item.positionClass ?? "",
        active
          ? "border-[3px] border-[var(--color-secondary)] bg-[var(--color-white)] shadow-[0_24px_60px_color-mix(in_srgb,var(--color-primary)_26%,transparent),0_0_0_5px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]"
          : "border border-[var(--color-secondary)] bg-[color-mix(in_srgb,var(--color-white)_82%,transparent)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-black)_7%,transparent)]",
        "hover:bg-[var(--color-white)] hover:shadow-[0_24px_58px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-white)_72%,transparent),transparent_52%,color-mix(in_srgb,var(--color-primary)_5%,transparent))]" />

      {active ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--color-secondary)]/75"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0.3, 0.85, 0.3],
                  scale: [1, 1.04, 1],
                }
          }
          transition={{
            duration: 2.1,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      ) : null}

      <FaRegStar
        className="absolute right-[8px] top-[8px] z-10 text-[12px]"
        style={{ color: active ? darkColor : "var(--color-primary)" }}
      />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none transition-transform duration-500 group-hover:scale-110"
        style={{ color: active ? darkColor : item.color ?? darkColor }}
      >
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-normal leading-[1.05] tracking-[-0.04em] text-[var(--color-black)]">
        {formatTitle(t(item.title))}
      </div>
    </motion.button>
  );
}

function DetailPanel({
  item,
  onClose,
}: {
  item: CardItem;
  onClose: () => void;
}) {
  const t = useSectionText();
  const isEducator = item.id === "educator-support";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -36,
        y: 18,
        scale: 0.96,
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      }}
      exit={{
        opacity: 0,
        x: -28,
        y: 18,
        scale: 0.96,
        filter: "blur(8px)",
      }}
      transition={{
        duration: 0.42,
        ease: premiumEase,
      }}
      className={[
        "absolute bottom-[28px] left-[32px] z-40",
        "w-[470px] overflow-hidden rounded-[24px]",
        "border border-[var(--color-secondary)] bg-[var(--color-white)] px-6 py-6",
        "shadow-[0_26px_80px_color-mix(in_srgb,var(--color-black)_16%,transparent)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:bg-[var(--color-black)] hover:text-[var(--color-white)]"
        aria-label={t("Close detail")}
      >
        <FaXmark />
      </button>

      <div className="flex items-start gap-4 pr-10">
        <div
          className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[18px] border border-[var(--color-secondary)] bg-[var(--color-white)]"
          style={{ color: item.color ?? darkColor }}
        >
          <div className="text-[31px] leading-none">{item.icon}</div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--color-primary)]">
            {item.label ?? "Connected Capability"}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[var(--color-black)]",
              isEducator ? "font-black" : "font-normal",
            ].join(" ")}
          >
            {t(item.title)}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[var(--color-primary)]">
              {t(item.subtitle)}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[var(--color-primary)]">
        {t(item.description)}
      </p>

      <div className="mt-5 h-px w-full bg-[var(--color-secondary)]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className="mt-5 rounded-full px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-[var(--color-white)] transition hover:translate-y-[-1px]"
        style={{ background: darkColor }}
      >
        {t("Open Section")}
      </button>
    </motion.div>
  );
}

function ConnectorLine({ selectedId }: { selectedId: string }) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();
  const path = connectorPaths[selectedId];

  if (!path) return null;

  if (selectedId === "educator-support") {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 z-[25]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1000 720"
          preserveAspectRatio="none"
        >
          <motion.circle
            cx="500"
            cy="360"
            r="56"
            fill="none"
            stroke={themeColor}
            strokeWidth="4"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: [0.25, 0.85, 0.25],
                    scale: [0.86, 1.14, 0.86],
                  }
            }
            transition={{
              duration: 1.8,
              ease: "easeInOut",
              repeat: shouldReduceMotion ? 0 : Infinity,
            }}
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.24,
        ease: premiumEase,
      }}
      className="pointer-events-none absolute inset-0 z-[25]"
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1000 720"
        preserveAspectRatio="none"
      >
        <motion.path
          d={path.d}
          fill="none"
          stroke={path.glowColor}
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          exit={{ pathLength: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.55,
            ease: premiumEase,
          }}
        />

        <motion.path
          d={path.d}
          fill="none"
          stroke="color-mix(in srgb, var(--color-white) 90%, transparent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          exit={{ pathLength: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.6,
            ease: premiumEase,
          }}
        />

        <motion.path
          d={path.d}
          fill="none"
          stroke={path.color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          exit={{ pathLength: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.68,
            ease: premiumEase,
          }}
        />
      </svg>
    </motion.div>
  );
}

export default function EducatorSupport() {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-secondary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-white)_72%,transparent)] blur-[88px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.05, 1],
                opacity: [0.65, 1, 0.65],
              }
        }
        transition={{
          duration: 5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[52%] top-[48%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[92px]"
        style={{ background: glowColor }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.35, 0.75, 0.35],
              }
        }
        transition={{
          duration: 4.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative h-full w-full"
      >
        {floatingCards.map((item, index) => (
          <FloatingCard
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            active={selectedId === item.id}
            onClick={() => setSelectedCard(item)}
          />
        ))}

        <AnimatePresence mode="wait">
          {selectedId ? (
            <ConnectorLine key={selectedId} selectedId={selectedId} />
          ) : null}
        </AnimatePresence>

        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 top-[-64px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => setSelectedCard(floatingCards[0])}
                className={[
                  "h-[40px] min-w-[300px] rounded-full px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] shadow-[0_16px_34px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                  "transition duration-300 hover:scale-[1.025]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
                style={{
                  color: darkColor,
                  background:
                    "linear-gradient(145deg,var(--color-white) 0%,var(--color-secondary) 100%)",
                }}
              >
                {t("Operational Excellence")}
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[26px] border-[3px] border-[var(--color-secondary)]/95",
                "bg-[color-mix(in_srgb,var(--color-white)_20%,transparent)] p-[18px]",
                "shadow-[0_28px_80px_color-mix(in_srgb,var(--color-black)_9%,transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-white)_26%,transparent),transparent_35%,color-mix(in_srgb,var(--color-primary)_10%,transparent))]" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard
                  item={centerCards[0]}
                  selected={selectedId === centerCards[0].id}
                  onSelect={() => setSelectedCard(centerCards[0])}
                />

                <ActiveEducatorCard
                  item={centerCards[1]}
                  selected={selectedId === centerCards[1].id}
                  onSelect={() => setSelectedCard(centerCards[1])}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedCard ? (
            <DetailPanel
              item={
                allCards.find((card) => card.id === selectedCard.id) ??
                selectedCard
              }
              onClose={() => setSelectedCard(null)}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
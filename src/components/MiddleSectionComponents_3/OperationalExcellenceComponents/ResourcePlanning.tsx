"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaUsers,
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


type ProductCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
};

const rightImage = "/images/student-information-family.png";

const themeColor = "var(--color-secondary)";
const darkColor = "var(--color-primary)";
const glowColor = "color-mix(in_srgb,var(--color-primary)_18%,transparent)";

const products: ProductCard[] = [
  {
    id: "operational-excellence",
    title: "Operational Excellence",
    subtitle: "Operations Hub",
    icon: <MdOutlineHub />,
  },
  {
    id: "resource-planning",
    title: "Resource Planning",
    subtitle: "Planning",
    icon: <MdOutlineGridView />,
    highlight: true,
  },
  {
    id: "financial-strategy-allovue",
    title: "Financial Strategy",
    subtitle: "Allovue",
    icon: <MdOutlineAnalytics />,
  },
  {
    id: "erp-systems",
    title: "ERP Systems",
    subtitle: "Core ERP",
    icon: <MdOutlineAutoAwesome />,
  },
  {
    id: "predictive-enrollment",
    title: "Predictive Enrollment",
    subtitle: "Forecasting",
    icon: <FaUsers />,
  },
  {
    id: "talent-management",
    title: "Talent Management",
    subtitle: "People",
    icon: <MdOutlinePsychology />,
  },
  {
    id: "recruiting-and-hr",
    title: "Recruiting and HR",
    subtitle: "Hiring",
    icon: <FaRegStar />,
  },
  {
    id: "educator-support",
    title: "Educator Support",
    subtitle: "Staff Success",
    icon: <FaRegCircleQuestion />,
  },
];

const premiumEase = [0.22, 1, 0.36, 1] as const;

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.86,
    rotateX: 10,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: premiumEase,
    },
  },
};

const diagramInnerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.9,
    rotateX: 8,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: premiumEase,
      staggerChildren: 0.075,
      delayChildren: 0.18,
    },
  },
};

const floatingTransition: Transition = {
  duration: 4.5,
  ease: "easeInOut",
  repeat: Infinity,
  repeatType: "mirror",
};

function scrollRightSidebarTo(id: string) {
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

function ProductTile({ item, index }: { item: ProductCard; index: number }) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "resource-planning";

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              scale: 1.055,
              rotateX: 2,
              rotateY: index % 2 === 0 ? -2 : 2,
              transition: {
                duration: 0.32,
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
        isActive
          ? "bg-[linear-gradient(145deg,var(--color-secondary)_0%,var(--color-secondary)_52%,var(--color-white)_100%)]"
          : "bg-[linear-gradient(145deg,var(--color-white)_0%,var(--color-white)_55%,var(--color-secondary)_100%)]",
        isActive
          ? "border-[3px] border-[var(--color-secondary)]"
          : "border border-[var(--color-secondary)] bg-[color-mix(in_srgb,var(--color-white)_55%,transparent)]",
        isActive
          ? "shadow-[0_22px_50px_color-mix(in_srgb,var(--color-primary)_26%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_76%,transparent)]"
          : "shadow-[0_12px_30px_color-mix(in_srgb,var(--color-black)_6%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_75%,transparent)]",
        "hover:shadow-[0_24px_58px_color-mix(in_srgb,var(--color-primary)_18%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_80%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_60%,transparent)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_20%_15%,color-mix(in_srgb,var(--color-white)_90%,transparent),transparent_34%),linear-gradient(145deg,color-mix(in_srgb,var(--color-white)_48%,transparent),transparent_48%,color-mix(in_srgb,var(--color-primary)_5%,transparent))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[65%] top-0 h-full w-[58%] skew-x-[-18deg] bg-[color-mix(in_srgb,var(--color-white)_45%,transparent)] blur-[1px]"
        initial={{ x: "-30%" }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                x: "330%",
                transition: {
                  duration: 0.85,
                  ease: premiumEase,
                },
              }
        }
      />

      {isActive ? (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-[18px] border-[2px] border-[var(--color-primary)]/30" />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--color-secondary)]/70"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.25, 0.78, 0.25],
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{
              duration: 2.2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </>
      ) : null}

      <FaRegStar
        className="absolute right-[8px] top-[8px] z-10 text-[12.5px] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110"
        style={{ color: isActive ? darkColor : "var(--color-primary)" }}
      />

      {item.icon ? (
        <div
          className="relative z-10 mb-[7px] text-[25px] leading-none drop-shadow-sm transition-all duration-500 group-hover:scale-115"
          style={{ color: isActive ? darkColor : "var(--color-primary)" }}
        >
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center font-normal tracking-[-0.035em]",
          "transition-colors duration-500",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.5px] leading-[1.08]",
        ].join(" ")}
        style={{ color: isActive ? "var(--color-black)" : "var(--color-black)" }}
      >
        {formatTitle(t(item.title))}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-[var(--color-primary)]/90">
          {t(item.subtitle)}
        </p>
      ) : null}
    </motion.button>
  );
}

function FloatingDot({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={[
        "pointer-events-none absolute rounded-full",
        "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-white)_95%,transparent),color-mix(in_srgb,var(--color-primary)_22%,transparent))]",
        "shadow-[0_12px_30px_color-mix(in_srgb,var(--color-black)_8%,transparent)]",
        className,
      ].join(" ")}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              y: [-10, 10],
              x: [-4, 4],
              opacity: [0.55, 1, 0.55],
            }
      }
      transition={{
        ...floatingTransition,
        delay,
      }}
    />
  );
}

export default function ResourcePlanning() {
  const t = useSectionText();
  const shouldReduceMotion = useReducedMotion();
  const [isSeparated, setIsSeparated] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  useEffect(() => {
    const separateTimer = window.setTimeout(() => {
      setIsSeparated(true);
    }, 720);

    const jumpTimer = window.setTimeout(() => {
      setImageSettled(true);
    }, 1680);

    return () => {
      window.clearTimeout(separateTimer);
      window.clearTimeout(jumpTimer);
    };
  }, []);

  return (
    <section className="relative h-full w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-secondary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[38%] top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-white)_75%,transparent)] blur-[78px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.06, 1],
                opacity: [0.7, 1, 0.7],
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
        className="pointer-events-none absolute right-[17%] top-[52%] h-[330px] w-[330px] -translate-y-1/2 rounded-full blur-[95px]"
        style={{ background: glowColor }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.45, 0.85, 0.45],
              }
        }
        transition={{
          duration: 4.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <div className="pointer-events-none absolute left-[8%] top-[12%] h-[250px] w-[250px] rounded-full bg-[var(--color-secondary)]/20 blur-[85px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[24%] h-[260px] w-[260px] rounded-full bg-[var(--color-secondary)]/30 blur-[92px]" />

      <FloatingDot className="left-[21%] top-[18%] h-[13px] w-[13px]" delay={0.1} />
      <FloatingDot className="left-[64%] top-[15%] h-[9px] w-[9px]" delay={0.8} />
      <FloatingDot className="bottom-[22%] left-[16%] h-[10px] w-[10px]" delay={1.2} />
      <FloatingDot className="bottom-[16%] right-[18%] h-[14px] w-[14px]" delay={0.4} />

      <div className="relative z-10 h-full w-full">
        <motion.div
          initial={{
            x: "-50%",
            y: "-50%",
            scale: 1,
          }}
          animate={{
            x: isSeparated ? "calc(-50% - 200px)" : "-50%",
            y: "-50%",
            scale: isSeparated ? 0.985 : 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 1.08,
            ease: premiumEase,
          }}
          className="absolute left-1/2 top-1/2 z-20"
        >
          <motion.div
            variants={diagramInnerVariants}
            initial="hidden"
            animate="visible"
            className="relative shrink-0"
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[436px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-[color-mix(in_srgb,var(--color-white)_35%,transparent)] blur-[34px]"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: [0.45, 0.8, 0.45],
                      scale: [1, 1.035, 1],
                    }
              }
              transition={{
                duration: 3.6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />

            <motion.button
              type="button"
              onClick={() => scrollRightSidebarTo("operational-excellence")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.035,
                    }
              }
              whileTap={{ scale: 0.96 }}
              className={[
                "absolute left-1/2 top-[-54px] z-20 -translate-x-1/2",
                "h-[38px] min-w-[228px] rounded-full",
                "bg-[linear-gradient(145deg,var(--color-white)_0%,var(--color-secondary)_100%)]",
                "px-[24px] text-[13px] font-black leading-[38px]",
                "whitespace-nowrap shadow-[0_16px_34px_color-mix(in_srgb,var(--color-primary)_12%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_85%,transparent)]",
                "transition-shadow duration-500 hover:shadow-[0_22px_44px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
              ].join(" ")}
              style={{ color: darkColor }}
            >
              {t("Operational Excellence")}

              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-full h-[22px] w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[var(--color-secondary)]"
              >
                <motion.span
                  className="absolute left-0 top-0 h-[40%] w-full rounded-full"
                  style={{ background: themeColor }}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: ["-120%", "260%"],
                        }
                  }
                  transition={{
                    duration: 1.8,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </motion.span>
            </motion.button>

            <div
              className={[
                "relative h-[430px] w-[224px]",
                "rounded-[26px] border-[3px] border-[var(--color-secondary)]/90",
                "bg-[color-mix(in_srgb,var(--color-white)_24%,transparent)] p-[8px]",
                "shadow-[0_28px_80px_color-mix(in_srgb,var(--color-black)_9%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-white)_78%,transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0 rounded-[23px] bg-[linear-gradient(150deg,color-mix(in_srgb,var(--color-white)_48%,transparent),transparent_48%,color-mix(in_srgb,var(--color-primary)_8%,transparent))]" />

              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[-3px] rounded-[29px] border border-[color-mix(in_srgb,var(--color-white)_70%,transparent)]"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: [0.35, 0.85, 0.35],
                      }
                }
                transition={{
                  duration: 2.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />

              <div className="relative z-10 grid grid-cols-2 gap-[8px]">
                {products.map((product, index) => (
                  <ProductTile key={product.id} item={product} index={index} />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            x: "-50%",
            y: "-50%",
            scale: 0.7,
            rotate: -2,
            filter: "blur(16px)",
          }}
          animate={{
            opacity: isSeparated ? 1 : 0,
            x: isSeparated ? "calc(-50% + 220px)" : "-50%",
            y: imageSettled
              ? ["-50%", "calc(-50% - 20px)", "calc(-50% + 8px)", "-50%"]
              : "-50%",
            scale: imageSettled ? [1, 1.065, 0.982, 1] : isSeparated ? 1 : 0.7,
            rotate: imageSettled ? [0, 1.4, -0.8, 0] : isSeparated ? 0 : -2,
            filter: isSeparated ? "blur(0px)" : "blur(16px)",
          }}
          transition={{
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.36,
              ease: "easeOut",
            },
            x: {
              duration: shouldReduceMotion ? 0 : 1.1,
              ease: premiumEase,
            },
            y: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.86,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.1,
                  ease: premiumEase,
                },
            scale: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.86,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.1,
                  ease: premiumEase,
                },
            rotate: {
              duration: shouldReduceMotion ? 0 : 0.86,
              ease: premiumEase,
            },
            filter: {
              duration: shouldReduceMotion ? 0 : 0.68,
              ease: premiumEase,
            },
          }}
          className="absolute left-1/2 top-1/2 z-10 hidden h-[430px] w-[310px] shrink-0 md:block"
        >
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[24px] left-1/2 h-[42px] w-[210px] -translate-x-1/2 rounded-full bg-[var(--color-black)]/18 blur-[18px]"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: imageSettled ? [1, 0.92, 1] : 1,
                    opacity: imageSettled ? [0.55, 0.34, 0.55] : 0.45,
                  }
            }
            transition={{
              duration: 2.8,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />

          <motion.div
            className="relative h-full w-full"
            animate={
              shouldReduceMotion || !imageSettled
                ? undefined
                : {
                    y: [-4, 5, -4],
                  }
            }
            transition={{
              duration: 4.2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <Image
              src={rightImage}
              alt="Resource Planning"
              fill
              priority
              sizes="310px"
              className="object-contain object-bottom drop-shadow-[0_28px_34px_color-mix(in_srgb,var(--color-black)_18%,transparent)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
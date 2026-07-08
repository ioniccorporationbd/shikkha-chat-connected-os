"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useLanguage } from "@/lib/language";
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
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";

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
const glowColor = "color-mix(in srgb, var(--color-primary) 18%, transparent)";

type LanguageCode = "bn" | "en";

type LocalizedCardText = {
  title: string;
  subtitle?: string;
  label?: string;
  description?: string;
};

const interfaceText: Record<LanguageCode, { studentAchievement: string; openSection: string; closeDetail: string; connectedCapability: string; imageAlt: string }> = {
  bn: {
    studentAchievement: "শিক্ষার্থী অর্জন",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    connectedCapability: "সংযুক্ত সক্ষমতা",
    imageAlt: "শিক্ষার্থী অর্জন চিত্র",
  },
  en: {
    studentAchievement: "Student Achievement",
    openSection: "Open Section",
    closeDetail: "Close detail",
    connectedCapability: "Connected Capability",
    imageAlt: "Student Achievement illustration",
  },
};

const localizedCardText: Record<LanguageCode, Record<string, LocalizedCardText>> = {
  bn: {
    "student-achievement": {
      title: "শিক্ষার্থী অর্জন",
      subtitle: "একীভূত অগ্রগতি",
      label: "অর্জন ভিউ",
      description:
        "শিক্ষার্থী অর্জন শিক্ষক ও নেতৃত্বকে অগ্রগতি, শেখার ফলাফল, সহায়তার প্রয়োজন এবং ভবিষ্যৎ প্রস্তুতি এক জায়গায় বুঝতে সাহায্য করে।",
    },
    "classroom-solutions": {
      title: "শ্রেণিকক্ষ সমাধান",
      subtitle: "শিক্ষণ টুলস",
      label: "শিক্ষণ টুলস",
      description:
        "শ্রেণিকক্ষ সমাধান দৈনন্দিন পাঠদান, ক্লাসরুম সংগঠন, শেখার কার্যক্রম এবং শিক্ষার্থীর কাজকে আরও সহজ ও পরিষ্কার করে।",
    },
    "learning-management-schoology": {
      title: "লার্নিং ব্যবস্থাপনা",
      subtitle: "শেখার প্ল্যাটফর্ম",
      label: "লার্নিং ডেটা",
      description:
        "লার্নিং ব্যবস্থাপনা অ্যাসাইনমেন্ট, রিসোর্স, ডিজিটাল শেখার কার্যক্রম এবং শিক্ষার্থী সম্পৃক্ততাকে অর্জন ডেটার সাথে যুক্ত করে।",
    },
    "assessment-performance-matters": {
      title: "মূল্যায়ন",
      subtitle: "পারফরম্যান্স বিশ্লেষণ",
      label: "মূল্যায়ন ডেটা",
      description:
        "মূল্যায়ন শিক্ষককে দক্ষতা বোঝা, অগ্রগতি মাপা, পারফরম্যান্স ডেটা দেখা এবং আরও ভালো পাঠদান সিদ্ধান্ত নিতে সাহায্য করে।",
    },
    "curriculum-instruction": {
      title: "কারিকুলাম ও পাঠদান",
      subtitle: "পাঠদান পরিকল্পনা",
      label: "পাঠদান পরিকল্পনা",
      description:
        "কারিকুলাম ও পাঠদান মানদণ্ড, পাঠ পরিকল্পনা, শিক্ষণ রিসোর্স এবং ক্লাসরুম ডেলিভারিকে একটি পরিষ্কার কাজের ধারায় যুক্ত করে।",
    },
    "student-intervention": {
      title: "শিক্ষার্থী সহায়তা",
      subtitle: "সহায়তা পরিকল্পনা",
      label: "সহায়তা পরিকল্পনা",
      description:
        "শিক্ষার্থী সহায়তা শেখার ঘাটতি চিহ্নিত করা, লক্ষ্যভিত্তিক পরিকল্পনা তৈরি করা এবং অগ্রগতি নিয়মিত ট্র্যাক করতে সাহায্য করে।",
    },
    mtss: {
      title: "বহুস্তরীয় সহায়তা ব্যবস্থা",
      subtitle: "স্তরভিত্তিক সহায়তা",
      label: "বহুস্তরীয় সিস্টেম",
      description:
        "বহুস্তরীয় সহায়তা ব্যবস্থা একাডেমিক, আচরণ, উপস্থিতি এবং সুস্থতা সহায়তাকে একসাথে এনে দ্রুত সিদ্ধান্ত নিতে সাহায্য করে।",
    },
    "behavior-support": {
      title: "আচরণগত সহায়তা",
      subtitle: "সুস্থতা",
      label: "সুস্থতা ইনসাইট",
      description:
        "আচরণগত সহায়তা আচরণের ধরণ, সুস্থতার সংকেত এবং সহায়তা কার্যক্রম বুঝে আরও নিরাপদ ও ইতিবাচক শেখার পরিবেশ তৈরি করে।",
    },
    "college-career-life-readiness": {
      title: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
      subtitle: "ভবিষ্যৎ প্রস্তুতি",
      label: "ভবিষ্যৎ প্রস্তুতি",
      description:
        "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি শিক্ষার্থীর লক্ষ্য, পথ নির্বাচন, প্রস্তুতি এবং ভবিষ্যৎ সাফল্যের পরিকল্পনা পরিষ্কার করে।",
    },
    "cclr-naviance": {
      title: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
      subtitle: "পরিকল্পনা নির্দেশনা",
      label: "ভবিষ্যৎ পরিকল্পনা",
      description:
        "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা শিক্ষার্থীর পথ অনুসন্ধান, লক্ষ্য পরিকল্পনা, প্রস্তুতি ট্র্যাকিং এবং ভবিষ্যৎ সিদ্ধান্তকে সহজ করে।",
    },
  },
  en: {
    "student-achievement": {
      title: "Student Achievement",
      subtitle: "Unified Progress",
      label: "Achievement View",
      description:
        "Student Achievement gives educators and leaders one clear view of progress, learning performance, support needs, and future readiness.",
    },
    "classroom-solutions": {
      title: "Classroom Solutions",
      subtitle: "Teaching Tools",
      label: "Teaching Tools",
      description:
        "Classroom Solutions supports daily teaching, classroom organization, learning activity, and stronger instructional workflows.",
    },
    "learning-management-schoology": {
      title: "Learning Management",
      subtitle: "Learning Platform",
      label: "Learning Data",
      description:
        "Learning Management connects assignments, resources, digital learning activity, and student engagement with achievement data.",
    },
    "assessment-performance-matters": {
      title: "Assessment",
      subtitle: "Performance Analytics",
      label: "Assessment Data",
      description:
        "Assessment helps educators understand mastery, measure growth, review performance data, and make better instructional decisions.",
    },
    "curriculum-instruction": {
      title: "Curriculum and Instruction",
      subtitle: "Instruction Planning",
      label: "Instruction Planning",
      description:
        "Curriculum and Instruction connects standards, lesson planning, teaching resources, and classroom delivery into one clear flow.",
    },
    "student-intervention": {
      title: "Student Intervention",
      subtitle: "Support Plans",
      label: "Support Planning",
      description:
        "Student Intervention helps schools identify learning gaps, create targeted support plans, and track student progress clearly.",
    },
    mtss: {
      title: "Multi-Tier Support",
      subtitle: "Tiered Support",
      label: "Multi-Tier System",
      description:
        "Multi-Tier Support connects academic, behavior, attendance, and wellbeing support so teams can respond earlier with better visibility.",
    },
    "behavior-support": {
      title: "Behavior Support",
      subtitle: "Wellbeing",
      label: "Wellbeing Insight",
      description:
        "Behavior Support helps schools understand behavior patterns, wellbeing signals, and support actions for a safer learning environment.",
    },
    "college-career-life-readiness": {
      title: "College, Career and Life Readiness",
      subtitle: "Future Ready",
      label: "Future Readiness",
      description:
        "College, Career and Life Readiness helps students plan goals, explore pathways, and prepare for future success.",
    },
    "cclr-naviance": {
      title: "Career and Life Readiness Guidance",
      subtitle: "Planning Guidance",
      label: "Future Planning",
      description:
        "Career and Life Readiness Guidance supports pathway exploration, goal planning, readiness tracking, and future decisions.",
    },
  },
};

function localizeCard<T extends { id: string; title: string; subtitle?: string; label?: string; description?: string }>(
  card: T,
  language: LanguageCode
): T {
  const localized = localizedCardText[language][card.id];
  if (!localized) return card;

  return {
    ...card,
    title: localized.title,
    subtitle: localized.subtitle ?? card.subtitle,
    label: localized.label ?? card.label,
    description: localized.description ?? card.description,
  };
}


const products: ProductCard[] = [
  {
    id: "student-achievement",
    title: "Student Achievement",
    subtitle: "Unified Progress",
    icon: <MdOutlineAutoAwesome />,
  },
  {
    id: "classroom-solutions",
    title: "Classroom Solutions",
    subtitle: "Teaching Tools",
    icon: <MdOutlineGridView />,
    highlight: true,
  },
  {
    id: "learning-management-schoology",
    title: "Learning Management",
    subtitle: "Schoology",
    icon: <MdOutlinePsychology />,
  },
  {
    id: "assessment-performance-matters",
    title: "Assessment",
    subtitle: "Performance Matters",
    icon: <MdOutlineAnalytics />,
  },
  {
    id: "curriculum-instruction",
    title: "Curriculum & Instruction",
    subtitle: "Instruction",
    icon: <MdOutlineMenuBook />,
  },
  {
    id: "student-intervention",
    title: "Student Intervention",
    subtitle: "Support Plans",
    icon: <FaRegCircleQuestion />,
  },
  {
    id: "mtss",
    title: "MTSS",
    subtitle: "Multi-Tier Support",
    icon: <MdOutlineHub />,
  },
  {
    id: "behavior-support",
    title: "Behavior Support",
    subtitle: "Wellbeing",
    icon: <MdOutlineFavoriteBorder />,
  },
  {
    id: "college-career-life-readiness",
    title: "College Career Life Readiness",
    subtitle: "Future Ready",
    icon: <FaRegStar />,
  },
  {
    id: "cclr-naviance",
    title: "CCLR Naviance",
    subtitle: "Naviance",
    icon: <FaUsers />,
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
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "classroom-solutions";

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
      whileTap={{
        scale: 0.94,
      }}
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
          ? "shadow-[0_22px_50px_color-mix(in srgb, var(--color-secondary) 32%, transparent),inset_0_1px_0_color-mix(in srgb, var(--color-white) 76%, transparent)]"
          : "shadow-[0_12px_30px_color-mix(in srgb, var(--color-black) 6%, transparent),inset_0_1px_0_color-mix(in srgb, var(--color-white) 75%, transparent)]",
        "hover:shadow-[0_24px_58px_color-mix(in srgb, var(--color-primary) 18%, transparent),inset_0_1px_0_color-mix(in srgb, var(--color-white) 80%, transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_50%,transparent)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_20%_15%,color-mix(in srgb, var(--color-white) 90%, transparent),transparent_34%),linear-gradient(145deg,color-mix(in srgb, var(--color-white) 48%, transparent),color-mix(in srgb, var(--color-white) 0%, transparent)_48%,color-mix(in srgb, var(--color-primary) 5%, transparent))]" />

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
          <span className="pointer-events-none absolute inset-0 rounded-[18px] border-[2px] border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]" />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[color-mix(in_srgb,var(--color-secondary)_55%,transparent)]"
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
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-[color-mix(in_srgb,var(--color-primary)_90%,transparent)]">
          {item.subtitle}
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={[
        "pointer-events-none absolute rounded-full",
        "bg-[linear-gradient(145deg,color-mix(in srgb, var(--color-white) 95%, transparent),color-mix(in srgb, var(--color-secondary) 24%, transparent))]",
        "shadow-[0_12px_30px_color-mix(in srgb, var(--color-black) 8%, transparent)]",
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

export default function ClassroomSolutions() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const localizedProducts = useMemo(
    () => products.map((product) => localizeCard(product, currentLanguage)),
    [currentLanguage]
  );

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

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

      <div className="pointer-events-none absolute left-[8%] top-[12%] h-[250px] w-[250px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] blur-[85px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[24%] h-[260px] w-[260px] rounded-full bg-[color-mix(in_srgb,var(--color-secondary)_25%,transparent)] blur-[92px]" />

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
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-[color-mix(in_srgb,var(--color-white)_35%,transparent)] blur-[34px]"
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
              onClick={() => scrollRightSidebarTo("student-achievement")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.035,
                    }
              }
              whileTap={{
                scale: 0.96,
              }}
              className={[
                "absolute left-1/2 top-[-54px] z-20 -translate-x-1/2",
                "h-[38px] min-w-[218px] rounded-full",
                "bg-[linear-gradient(145deg,var(--color-secondary)_0%,var(--color-secondary)_100%)]",
                "px-[24px] text-[13px] font-black leading-[38px]",
                "whitespace-nowrap shadow-[0_16px_34px_color-mix(in srgb, var(--color-primary) 12%, transparent),inset_0_1px_0_color-mix(in srgb, var(--color-white) 85%, transparent)]",
                "transition-shadow duration-500 hover:shadow-[0_22px_44px_color-mix(in srgb, var(--color-primary) 16%, transparent)]",
              ].join(" ")}
              style={{ color: darkColor }}
            >
              {interfaceText[currentLanguage].studentAchievement}

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
                "relative h-[536px] w-[224px]",
                "rounded-[26px] border-[3px] border-[color-mix(in_srgb,var(--color-secondary)_90%,transparent)]",
                "bg-[color-mix(in_srgb,var(--color-white)_24%,transparent)] p-[8px]",
                "shadow-[0_28px_80px_color-mix(in srgb, var(--color-black) 9%, transparent),inset_0_1px_0_color-mix(in srgb, var(--color-white) 78%, transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0 rounded-[23px] bg-[linear-gradient(150deg,color-mix(in srgb, var(--color-white) 48%, transparent),transparent_48%,color-mix(in srgb, var(--color-secondary) 8%, transparent))]" />

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
                {localizedProducts.map((product, index) => (
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
            className="absolute bottom-[24px] left-1/2 h-[42px] w-[210px] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-black)_18%,transparent)] blur-[18px]"
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
              alt={interfaceText[currentLanguage].imageAlt}
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

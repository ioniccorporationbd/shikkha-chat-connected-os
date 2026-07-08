"use client";

import { useMemo, type ReactNode, useState } from "react";
import { useLanguage } from "@/lib/language";
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
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";

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

const premiumEase = [0.22, 1, 0.36, 1] as const;

const centerCards: CardItem[] = [
  {
    id: "mtss",
    title: "MTSS",
    subtitle: "Multi-Tier Support",
    icon: <MdOutlineHub />,
    color: darkColor,
    label: "Multi-Tier Support",
    description:
      "MTSS connects academic, behavior, attendance, and wellbeing support into one coordinated system for stronger student outcomes.",
  },
  {
    id: "behavior-support",
    title: "Behavior Support",
    subtitle: "Wellbeing",
    icon: <MdOutlineFavoriteBorder />,
    active: true,
    color: darkColor,
    label: "Main Wellbeing Support",
    description:
      "Behavior Support helps schools understand behavior patterns, track wellbeing signals, coordinate support actions, and create a safer, more positive learning environment for every student.",
  },
];

const floatingCards: CardItem[] = [
  {
    id: "student-achievement",
    title: "Student Achievement",
    subtitle: "Unified Progress",
    icon: <MdOutlineAutoAwesome />,
    floating: true,
    color: darkColor,
    positionClass: "left-[4%] top-[13%]",
    label: "Achievement View",
    description:
      "Student Achievement gives educators one connected view of student progress, learning performance, support needs, and readiness.",
  },
  {
    id: "classroom-solutions",
    title: "Classroom Solutions",
    subtitle: "Teaching Tools",
    icon: <MdOutlineGridView />,
    floating: true,
    color: darkColor,
    positionClass: "left-[23%] top-[5%]",
    label: "Teaching Tools",
    description:
      "Classroom Solutions supports daily teaching, classroom organization, learning activity, and stronger instructional workflows.",
  },
  {
    id: "learning-management-schoology",
    title: "Learning Management",
    subtitle: "Schoology",
    icon: <MdOutlinePsychology />,
    floating: true,
    color: darkColor,
    positionClass: "right-[14%] top-[3%]",
    label: "Learning Platform",
    description:
      "Learning Management connects assignments, classroom resources, digital learning activity, and student engagement.",
  },
  {
    id: "assessment-performance-matters",
    title: "Assessment",
    subtitle: "Performance Matters",
    icon: <MdOutlineAnalytics />,
    floating: true,
    color: darkColor,
    positionClass: "right-[6%] top-[18%]",
    label: "Assessment Data",
    description:
      "Assessment helps educators understand mastery, measure progress, and use performance data to guide student support.",
  },
  {
    id: "curriculum-instruction",
    title: "Curriculum & Instruction",
    subtitle: "Instruction",
    icon: <MdOutlineMenuBook />,
    floating: true,
    color: darkColor,
    positionClass: "right-[3%] top-[36%]",
    label: "Instruction Planning",
    description:
      "Curriculum & Instruction connects standards, lesson planning, classroom resources, and teaching decisions.",
  },
  {
    id: "student-intervention",
    title: "Student Intervention",
    subtitle: "Support Plans",
    icon: <FaRegCircleQuestion />,
    floating: true,
    color: darkColor,
    positionClass: "left-[1.5%] top-[58%]",
    label: "Support Planning",
    description:
      "Student Intervention helps schools identify learning gaps, create support plans, and track student progress.",
  },
  {
    id: "college-career-life-readiness",
    title: "College Career Life Readiness",
    subtitle: "Future Ready",
    icon: <FaRegStar />,
    floating: true,
    color: darkColor,
    positionClass: "left-[3%] bottom-[14%]",
    label: "Future Readiness",
    description:
      "College, Career & Life Readiness helps students connect academic progress with goals, planning, and future pathways.",
  },
  {
    id: "cclr-naviance",
    title: "CCLR Naviance",
    subtitle: "Naviance",
    icon: <FaUsers />,
    floating: true,
    color: darkColor,
    positionClass: "right-[6%] bottom-[16%]",
    label: "Naviance Planning",
    description:
      "CCLR Naviance supports pathway exploration, readiness tracking, goal planning, and future success preparation.",
  },
];

const allCards = [...centerCards, ...floatingCards];

const connectorPaths: Record<string, ConnectorPath> = {
  "student-achievement": {
    d: "M500 360 L430 360 Q410 360 410 340 L410 170 Q410 150 390 150 L126 150",
    color: darkColor,
    glowColor,
  },
  "classroom-solutions": {
    d: "M500 360 L455 360 Q435 360 435 340 L435 112 Q435 92 415 92 L304 92",
    color: darkColor,
    glowColor,
  },
  "learning-management-schoology": {
    d: "M500 360 L600 360 Q620 360 620 340 L620 108 Q620 88 640 88 L810 88",
    color: darkColor,
    glowColor,
  },
  "assessment-performance-matters": {
    d: "M500 360 L640 360 Q660 360 660 340 L660 188 Q660 168 680 168 L900 168",
    color: darkColor,
    glowColor,
  },
  "curriculum-instruction": {
    d: "M500 360 L720 360 Q740 360 740 340 L740 332 Q740 315 758 315 L918 315",
    color: darkColor,
    glowColor,
  },
  "student-intervention": {
    d: "M500 360 L390 360 Q370 360 370 380 L370 515 Q370 535 350 535 L92 535",
    color: darkColor,
    glowColor,
  },
  "college-career-life-readiness": {
    d: "M500 360 L410 360 Q390 360 390 380 L390 610 Q390 630 370 630 L106 630",
    color: darkColor,
    glowColor,
  },
  "cclr-naviance": {
    d: "M500 360 L640 360 Q660 360 660 380 L660 615 Q660 635 680 635 L900 635",
    color: darkColor,
    glowColor,
  },
  mtss: {
    d: "M500 360 L458 360 Q444 360 444 346 L444 300 Q444 286 430 286 L390 286",
    color: darkColor,
    glowColor,
  },
  "behavior-support": {
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
    "student-achievement",
    "classroom-solutions",
    "learning-management-schoology",
    "assessment-performance-matters",
    "curriculum-instruction",
    "student-intervention",
    "mtss",
    "behavior-support",
    "college-career-life-readiness",
    "cclr-naviance",
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
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isBehavior = item.id === "behavior-support";

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
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_40%,transparent)] focus-visible:ring-offset-2",
        selected
          ? "border-[3px] border-[var(--color-secondary)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-secondary)_100%)] shadow-[0_22px_52px_color-mix(in srgb, var(--color-secondary) 28%, transparent),0_0_0_5px_color-mix(in srgb, var(--color-secondary) 10%, transparent)]"
          : "border border-[var(--color-secondary)] bg-[linear-gradient(180deg,var(--color-white)_0%,var(--color-secondary)_100%)] shadow-[0_12px_30px_color-mix(in srgb, var(--color-black) 6%, transparent)]",
        "hover:shadow-[0_24px_58px_color-mix(in srgb, var(--color-primary) 14%, transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,color-mix(in srgb, var(--color-white) 66%, transparent),color-mix(in srgb, var(--color-white) 0%, transparent)_52%,color-mix(in srgb, var(--color-primary) 4%, transparent))]" />

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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[color-mix(in_srgb,var(--color-secondary)_65%,transparent)]"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0.25, 0.75, 0.25],
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
          isBehavior ? "font-black" : "font-normal",
          isSingleWord
            ? "text-[13.5px] leading-none"
            : "text-[11px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

function ActiveBehaviorCard({
  item,
  selected,
  onSelect,
}: {
  item: CardItem;
  selected: boolean;
  onSelect: () => void;
}) {
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
        "shadow-[0_26px_70px_color-mix(in srgb, var(--color-secondary) 28%, transparent),0_0_0_6px_color-mix(in srgb, var(--color-secondary) 10%, transparent)]",
        "transition-shadow duration-500 hover:shadow-[0_32px_84px_color-mix(in srgb, var(--color-primary) 22%, transparent),0_0_0_7px_color-mix(in srgb, var(--color-secondary) 14%, transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_40%,transparent)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,color-mix(in srgb, var(--color-white) 68%, transparent),color-mix(in srgb, var(--color-white) 0%, transparent)_52%,color-mix(in srgb, var(--color-primary) 4%, transparent))]" />

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
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[color-mix(in_srgb,var(--color-secondary)_65%,transparent)]"
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

      <h3 className="relative z-10 max-w-[120px] text-[15px] font-black leading-[1.05] tracking-[-0.04em] text-[var(--color-black)]">
        {formatTitle(item.title)}
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
        "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_40%,transparent)] focus-visible:ring-offset-2",
        item.positionClass ?? "",
        active
          ? "border-[3px] border-[var(--color-secondary)] bg-[var(--color-white)] shadow-[0_24px_60px_color-mix(in srgb, var(--color-secondary) 28%, transparent),0_0_0_5px_color-mix(in srgb, var(--color-secondary) 10%, transparent)]"
          : "border border-[var(--color-secondary)] bg-[color-mix(in_srgb,var(--color-white)_82%,transparent)] shadow-[0_14px_34px_color-mix(in srgb, var(--color-black) 6%, transparent)]",
        "hover:bg-[var(--color-white)] hover:shadow-[0_24px_58px_color-mix(in srgb, var(--color-primary) 14%, transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,color-mix(in srgb, var(--color-white) 70%, transparent),color-mix(in srgb, var(--color-white) 0%, transparent)_52%,color-mix(in srgb, var(--color-primary) 4%, transparent))]" />

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

      {active ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[color-mix(in_srgb,var(--color-secondary)_65%,transparent)]"
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
        className="absolute right-[8px] top-[8px] z-10 text-[12px] transition-all duration-500 group-hover:rotate-12"
        style={{ color: active ? darkColor : "var(--color-black)" }}
      />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none transition-transform duration-500 group-hover:scale-110"
        style={{ color: active ? darkColor : item.color ?? darkColor }}
      >
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-normal leading-[1.05] tracking-[-0.04em] text-[var(--color-black)]">
        {formatTitle(item.title)}
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
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;

  const isBehavior = item.id === "behavior-support";

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
        "shadow-[0_26px_80px_color-mix(in srgb, var(--color-black) 16%, transparent)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[var(--color-secondary)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-white)]"
        aria-label={interfaceText[currentLanguage].closeDetail}
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
            {item.label ?? interfaceText[currentLanguage].connectedCapability}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[var(--color-primary)]",
              isBehavior ? "font-black" : "font-normal",
            ].join(" ")}
          >
            {item.title}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[var(--color-primary)]">
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[var(--color-primary)]">
        {item.description}
      </p>

      <div className="mt-5 h-px w-full bg-[var(--color-secondary)]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className="mt-5 rounded-full px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-[var(--color-white)] transition hover:translate-y-[-1px]"
        style={{ background: darkColor }}
      >
        Open Section
      </button>
    </motion.div>
  );
}

function ConnectorLine({ selectedId }: { selectedId: string }) {
  const shouldReduceMotion = useReducedMotion();
  const path = connectorPaths[selectedId];

  if (!path) return null;

  if (selectedId === "behavior-support") {
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
          stroke="color-mix(in srgb, var(--color-white) 88%, transparent)"
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

export default function BehaviorSupport() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const localizedCenterCards = useMemo(
    () => centerCards.map((card) => localizeCard(card, currentLanguage)),
    [currentLanguage]
  );
  const localizedFloatingCards = useMemo(
    () => floatingCards.map((card) => localizeCard(card, currentLanguage)),
    [currentLanguage]
  );
  const localizedAllCards = useMemo(
    () => [...localizedCenterCards, ...localizedFloatingCards],
    [localizedCenterCards, localizedFloatingCards]
  );

  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

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
        {localizedFloatingCards.map((item, index) => (
          <FloatingCard
            key={item.id}
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
                onClick={() => setSelectedCard(localizedFloatingCards[0])}
                className={[
                  "h-[40px] min-w-[300px] rounded-full px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] shadow-[0_16px_34px_color-mix(in srgb, var(--color-primary) 16%, transparent)]",
                  "transition duration-300 hover:scale-[1.025]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
                style={{
                  color: darkColor,
                  background:
                    "linear-gradient(145deg,var(--color-secondary) 0%,var(--color-secondary) 100%)",
                }}
              >
                {interfaceText[currentLanguage].studentAchievement}
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[26px] border-[3px] border-[color-mix(in_srgb,var(--color-secondary)_95%,transparent)]",
                "bg-[color-mix(in_srgb,var(--color-white)_20%,transparent)] p-[18px]",
                "shadow-[0_28px_80px_color-mix(in srgb, var(--color-black) 9%, transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,color-mix(in srgb, var(--color-white) 24%, transparent),transparent_35%,color-mix(in srgb, var(--color-secondary) 9%, transparent))]" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard
                  item={localizedCenterCards[0]}
                  selected={selectedId === localizedCenterCards[0].id}
                  onSelect={() => setSelectedCard(localizedCenterCards[0])}
                />

                <ActiveBehaviorCard
                  item={localizedCenterCards[1]}
                  selected={selectedId === localizedCenterCards[1].id}
                  onSelect={() => setSelectedCard(localizedCenterCards[1])}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedCard ? (
            <DetailPanel
              item={
                localizedAllCards.find((card) => card.id === selectedCard.id) ??
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

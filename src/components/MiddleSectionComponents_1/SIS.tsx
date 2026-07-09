"use client";

import { useMemo, useState, type ReactNode } from "react";
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
  MdAddCircleOutline,
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";
type CardKind = "core" | "floating";

type CardId =
  | "enrollment"
  | "sis"
  | "special-programs"
  | "communications"
  | "contextual-ai"
  | "learning-management"
  | "attendance-support"
  | "assessment"
  | "consistent-experience"
  | "behavior-support"
  | "connected-intelligence"
  | "analytics-insights"
  | "curriculum-instruction";

type DetailCard = {
  id: CardId;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  kind: CardKind;
  positionClass?: string;
  active?: boolean;
  label: string;
  description: string;
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const brandColor = "var(--color-primary)";
const brandGlow = "color-mix(in srgb, var(--color-primary) 14%, transparent)";
const brandGlowStrong =
  "color-mix(in srgb, var(--color-primary) 18%, transparent)";

const sectionText = {
  bn: {
    topTitle: "শিক্ষার্থী তথ্য ব্যবস্থা",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    fallbackLabel: "সংযুক্ত সক্ষমতা",
    tapHint: "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",
    cards: {
      enrollment: {
        title: "ভর্তি ব্যবস্থাপনা",
        label: "শিক্ষার্থী তথ্য ব্যবস্থার ভিতরে",
        description:
          "শিক্ষার্থী ভর্তি, ভর্তি রেকর্ড, পরিবারের তথ্য, ক্লাস প্লেসমেন্ট এবং স্কুলের সংযুক্ত কাজগুলো একটি কেন্দ্রীয় তথ্য ব্যবস্থায় পরিচালনা করুন।",
      },
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        label: "কেন্দ্রীয় ব্যবস্থা",
        description:
          "শিক্ষার্থী তথ্য ব্যবস্থা হলো শিক্ষার্থী তথ্য, ভর্তি, যোগাযোগ, উপস্থিতি, বিশ্লেষণ এবং দৈনন্দিন স্কুল পরিচালনার কেন্দ্রীয় ব্যবস্থা।",
      },
      "special-programs": {
        title: "বিশেষ কার্যক্রম",
        label: "শিক্ষার্থী তথ্য ব্যবস্থার ভিতরে",
        description:
          "শিক্ষার্থী সহায়তা, বিশেষ কার্যক্রম, সহায়তা কার্যধারা এবং সেবা তথ্য সংযুক্ত শিক্ষার্থী রেকর্ডের সাথে ট্র্যাক করুন।",
      },
      communications: {
        title: "যোগাযোগ ব্যবস্থা",
        subtitle: "স্কুল বার্তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "শিক্ষার্থী ডেটার সাথে মেসেজিং যুক্ত করুন, যাতে প্রতিটি পরিবার আপডেট সঠিক, সময়মতো এবং স্টাফদের জন্য সহজ হয়।",
      },
      "contextual-ai": {
        title: "প্রাসঙ্গিক কৃত্রিম বুদ্ধিমত্তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "শিক্ষার্থী তথ্য ব্যবস্থার ডেটার সাথে কৃত্রিম বুদ্ধিমত্তা ব্যবহার করে ইনসাইট তৈরি করুন, ডেটা অনুরোধ সহজ করুন এবং টিমকে স্কুল তথ্য দ্রুত বুঝতে সাহায্য করুন।",
      },
      "learning-management": {
        title: "লার্নিং ব্যবস্থাপনা",
        subtitle: "লার্নিং স্যুট",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "ক্লাসরুম শেখার কার্যক্রমকে শিক্ষার্থী তথ্যের সাথে যুক্ত করুন, যাতে শিক্ষকরা একটি সংযুক্ত অভিজ্ঞতায় অগ্রগতি বুঝতে পারেন।",
      },
      "attendance-support": {
        title: "উপস্থিতি সহায়তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "উপস্থিতির প্যাটার্ন আগে শনাক্ত করুন এবং দ্রুত সংযুক্ত পরিবার যোগাযোগের মাধ্যমে স্কুলকে প্রতিক্রিয়া জানাতে সাহায্য করুন।",
      },
      assessment: {
        title: "মূল্যায়ন",
        subtitle: "পারফরম্যান্স ইনসাইটস",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "মূল্যায়ন ডেটাকে শিক্ষার্থী তথ্য ব্যবস্থার কাছাকাছি আনুন, যাতে টিম শেখার পারফরম্যান্স এবং শিক্ষার্থীর প্রয়োজন দ্রুত বুঝতে পারে।",
      },
      "consistent-experience": {
        title: "একীভূত অভিজ্ঞতা",
        subtitle: "সংযুক্ত হাব",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "পরিবার, শিক্ষার্থী এবং স্টাফদের স্কুল টুল ও দৈনন্দিন কাজের মধ্যে একটি একীভূত সংযুক্ত অভিজ্ঞতা দিন।",
      },
      "behavior-support": {
        title: "আচরণ সহায়তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "সংযুক্ত শিক্ষার্থী তথ্য এবং পরিষ্কার টিম ভিজিবিলিটির মাধ্যমে ইতিবাচক আচরণ সহায়তার কাজগুলো শক্তিশালী করুন।",
      },
      "connected-intelligence": {
        title: "সংযুক্ত বুদ্ধিমত্তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "সংযুক্ত সিস্টেমের ইনসাইট এক জায়গায় আনুন, যাতে নেতৃত্ব দল নির্ভরযোগ্য শিক্ষার্থী ডেটা দিয়ে ভালো সিদ্ধান্ত নিতে পারে।",
      },
      "analytics-insights": {
        title: "বিশ্লেষণ ও ইনসাইটস",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "অপারেশনাল ও শিক্ষার্থী ডেটাকে পরিষ্কার ড্যাশবোর্ড, ট্রেন্ড এবং কার্যকর ইনসাইটে রূপান্তর করুন।",
      },
      "curriculum-instruction": {
        title: "কারিকুলাম ও পাঠদান",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "কারিকুলাম, পাঠদান এবং শিক্ষার্থী পারফরম্যান্স ডেটা যুক্ত করে শক্তিশালী শিক্ষাদান সিদ্ধান্তে সহায়তা করুন।",
      },
    },
  },
  en: {
    topTitle: "Student Information System",
    openSection: "Open Section",
    closeDetail: "Close detail",
    fallbackLabel: "Connected Capability",
    tapHint: "Click any card to view details",
    cards: {
      enrollment: {
        title: "Enrollment Management",
        label: "Inside Student Information System",
        description:
          "Manage student admission, enrollment records, family data, class placement, and connected school workflows from one central information system.",
      },
      sis: {
        title: "Student Information System",
        label: "Central System",
        description:
          "The student information system is the center of student information, enrollment, communication, attendance, analytics, and daily school operations.",
      },
      "special-programs": {
        title: "Special Programs",
        label: "Inside Student Information System",
        description:
          "Track student support, special programs, intervention workflows, and service information with connected student records.",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
        label: "Connected Add-on",
        description:
          "Connect messages with student data so every family update is accurate, timely, and easier for staff to deliver.",
      },
      "contextual-ai": {
        title: "Contextual AI",
        label: "Connected Add-on",
        description:
          "Use AI with student information system data to generate insights, simplify data requests, and help teams understand school information faster.",
      },
      "learning-management": {
        title: "Learning Management",
        subtitle: "Learning Suite",
        label: "Connected Add-on",
        description:
          "Connect classroom learning activity with student information so educators understand progress in one connected experience.",
      },
      "attendance-support": {
        title: "Attendance Support",
        label: "Connected Add-on",
        description:
          "Detect attendance patterns earlier and help schools respond with fast, connected family outreach.",
      },
      assessment: {
        title: "Assessment",
        subtitle: "Performance Insights",
        label: "Connected Add-on",
        description:
          "Bring assessment data closer to the student information system so teams can understand learning performance and student needs faster.",
      },
      "consistent-experience": {
        title: "Consistent Experience",
        subtitle: "Connected Hub",
        label: "Connected Add-on",
        description:
          "Give families, students, and staff a consistent connected experience across school tools and daily workflows.",
      },
      "behavior-support": {
        title: "Behavior Support",
        label: "Connected Add-on",
        description:
          "Support positive behavior workflows with connected student information and clearer team visibility.",
      },
      "connected-intelligence": {
        title: "Connected Intelligence",
        label: "Connected Add-on",
        description:
          "Unify insights from connected systems so leaders can make better decisions with trusted student data.",
      },
      "analytics-insights": {
        title: "Analytics and Insights",
        label: "Connected Add-on",
        description:
          "Transform operational and student data into clear dashboards, trends, and actionable insights.",
      },
      "curriculum-instruction": {
        title: "Curriculum and Instruction",
        label: "Connected Add-on",
        description:
          "Connect curriculum, instruction, and student performance data to support stronger teaching decisions.",
      },
    },
  },
} as const;

const coreBase = [
  {
    id: "enrollment" as const,
    icon: <MdAddCircleOutline />,
    kind: "core" as const,
  },
  {
    id: "sis" as const,
    icon: <FaUsers />,
    kind: "core" as const,
    active: true,
  },
  {
    id: "special-programs" as const,
    icon: <FaRegStar />,
    kind: "core" as const,
  },
];

const floatingBase = [
  {
    id: "communications" as const,
    icon: <MdOutlineHub />,
    kind: "floating" as const,
    positionClass: "left-[4%] top-[13%]",
  },
  {
    id: "contextual-ai" as const,
    icon: <MdOutlineAutoAwesome />,
    kind: "floating" as const,
    positionClass: "left-[23%] top-[5%]",
  },
  {
    id: "learning-management" as const,
    icon: <MdOutlinePsychology />,
    kind: "floating" as const,
    positionClass: "right-[14%] top-[3%]",
  },
  {
    id: "attendance-support" as const,
    icon: <FaRegCircleQuestion />,
    kind: "floating" as const,
    positionClass: "right-[6%] top-[18%]",
  },
  {
    id: "assessment" as const,
    icon: <FaRegStar />,
    kind: "floating" as const,
    positionClass: "right-[3%] top-[36%]",
  },
  {
    id: "consistent-experience" as const,
    icon: <MdOutlineGridView />,
    kind: "floating" as const,
    positionClass: "left-[1.5%] top-[58%]",
  },
  {
    id: "behavior-support" as const,
    icon: <MdOutlineFavoriteBorder />,
    kind: "floating" as const,
    positionClass: "left-[3%] bottom-[14%]",
  },
  {
    id: "connected-intelligence" as const,
    icon: <MdOutlineHub />,
    kind: "floating" as const,
    positionClass: "left-[15%] bottom-[5%]",
  },
  {
    id: "analytics-insights" as const,
    icon: <MdOutlineAnalytics />,
    kind: "floating" as const,
    positionClass: "right-[6%] bottom-[16%]",
  },
  {
    id: "curriculum-instruction" as const,
    icon: <MdOutlineMenuBook />,
    kind: "floating" as const,
    positionClass: "right-[23%] bottom-[5%]",
  },
];

const connectorPaths: Record<CardId, ConnectorPath> = {
  communications: {
    d: "M500 360 L430 360 Q410 360 410 340 L410 170 Q410 150 390 150 L126 150",
    color: brandColor,
    glowColor: brandGlow,
  },
  "contextual-ai": {
    d: "M500 360 L455 360 Q435 360 435 340 L435 112 Q435 92 415 92 L304 92",
    color: brandColor,
    glowColor: brandGlow,
  },
  "learning-management": {
    d: "M500 360 L600 360 Q620 360 620 340 L620 108 Q620 88 640 88 L810 88",
    color: brandColor,
    glowColor: brandGlow,
  },
  "attendance-support": {
    d: "M500 360 L640 360 Q660 360 660 340 L660 188 Q660 168 680 168 L900 168",
    color: brandColor,
    glowColor: brandGlow,
  },
  assessment: {
    d: "M500 360 L720 360 Q740 360 740 340 L740 332 Q740 315 758 315 L918 315",
    color: brandColor,
    glowColor: brandGlow,
  },
  "consistent-experience": {
    d: "M500 360 L390 360 Q370 360 370 380 L370 515 Q370 535 350 535 L92 535",
    color: brandColor,
    glowColor: brandGlow,
  },
  "behavior-support": {
    d: "M500 360 L410 360 Q390 360 390 380 L390 610 Q390 630 370 630 L106 630",
    color: brandColor,
    glowColor: brandGlow,
  },
  "connected-intelligence": {
    d: "M500 360 L455 360 Q435 360 435 380 L435 655 Q435 675 415 675 L245 675",
    color: brandColor,
    glowColor: brandGlow,
  },
  "analytics-insights": {
    d: "M500 360 L640 360 Q660 360 660 380 L660 615 Q660 635 680 635 L900 635",
    color: brandColor,
    glowColor: brandGlow,
  },
  "curriculum-instruction": {
    d: "M500 360 L600 360 Q620 360 620 380 L620 655 Q620 675 640 675 L760 675",
    color: brandColor,
    glowColor: brandGlow,
  },
  enrollment: {
    d: "M500 360 L458 360 Q444 360 444 346 L444 300 Q444 286 430 286 L390 286",
    color: brandColor,
    glowColor: brandGlow,
  },
  "special-programs": {
    d: "M500 360 L458 360 Q444 360 444 374 L444 424 Q444 438 430 438 L390 438",
    color: brandColor,
    glowColor: brandGlow,
  },
  sis: {
    d: "M500 360 L500 360",
    color: brandColor,
    glowColor: brandGlowStrong,
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
      staggerChildren: 0.055,
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
    "student-information",
    "sis",
    "enrollment",
    "special-programs",
    "family-engagement",
    "communications",
    "attendance-support",
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

function CoreTile({
  item,
  selected,
  onSelect,
}: {
  item: DetailCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isSis = item.id === "sis";
  const active = selected || item.active;

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
        "group relative h-24 w-24 overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color,transform] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        active
          ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_22px_55px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
          : "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        "hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:shadow-[0_26px_64px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-35" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-[var(--color-white)] opacity-40 blur-[1px]"
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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-[8px] text-[27px] leading-none text-current transition-transform duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <div
        className={[
          "relative z-10 flex min-h-[32px] max-w-[86px] items-center justify-center",
          "text-center tracking-[-0.04em] text-current",
          isSis ? "font-black" : "font-semibold",
          isSingleWord ? "text-[13.5px] leading-none" : "text-[11px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

function FloatingTile({
  item,
  active,
  onClick,
  index,
}: {
  item: DetailCard;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -9,
              scale: 1.06,
              rotateX: 2,
              rotateY: index % 2 === 0 ? -2 : 2,
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
        "transition-[box-shadow,border-color,background-color,transform] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        active
          ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_24px_60px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
          : "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        "hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:shadow-[0_26px_64px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
        item.positionClass ?? "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-35" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-[var(--color-white)] opacity-45 blur-[1px]"
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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-[7px] text-[26px] leading-none text-current transition-transform duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <div
        className={[
          "relative z-10 flex max-w-[86px] items-center justify-center text-center",
          "font-semibold tracking-[-0.04em] text-current",
          isSingleWord ? "text-[10.5px] leading-none" : "text-[9.5px] leading-[1.05]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[2px] max-w-[82px] truncate whitespace-nowrap text-[7px] font-normal leading-none text-current opacity-75">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
  );
}

function DetailPanel({
  item,
  onClose,
  openSectionText,
  closeText,
  fallbackLabel,
}: {
  item: DetailCard;
  onClose: () => void;
  openSectionText: string;
  closeText: string;
  fallbackLabel: string;
}) {
  const isSis = item.id === "sis";

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
        "border border-[var(--color-primary)] bg-[var(--color-white)]",
        "px-6 py-6 text-[var(--color-primary)]",
        "shadow-[0_26px_80px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className={[
          "absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full",
          "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)]",
          "transition hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)]",
        ].join(" ")}
        aria-label={closeText}
      >
        <FaXmark />
      </button>

      <div className="flex items-start gap-4 pr-10">
        <div
          className={[
            "grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[18px]",
            "border border-[var(--color-primary)] bg-[var(--color-secondary-light)] text-[var(--color-primary)]",
          ].join(" ")}
        >
          <div className="text-[31px] leading-none">{item.icon}</div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--color-text-gray)]">
            {item.label ?? fallbackLabel}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[var(--color-primary)]",
              isSis ? "font-black" : "font-semibold",
            ].join(" ")}
          >
            {item.title}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[var(--color-text-gray)]">
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[var(--color-text-gray)]">
        {item.description}
      </p>

      <div className="mt-5 h-px w-full bg-[var(--color-border-soft)]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className={[
          "mt-5 rounded-full bg-[var(--color-primary)] px-5 py-3",
          "text-[12px] font-normal uppercase tracking-[0.08em] text-[var(--color-text-inverse)]",
          "transition hover:translate-y-[-1px] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
        ].join(" ")}
      >
        {openSectionText}
      </button>
    </motion.div>
  );
}

function ConnectorLine({ selectedId }: { selectedId: CardId }) {
  const shouldReduceMotion = useReducedMotion();
  const path = connectorPaths[selectedId];

  if (!path) return null;

  if (selectedId === "sis") {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 z-25"
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
            r="35"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : {
                    opacity: [0.28, 0.9, 0.28],
                    scale: [0.86, 1.16, 0.86],
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
      className="pointer-events-none absolute inset-0 z-25"
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
          stroke="var(--color-white)"
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

        <motion.path
          d={path.d}
          fill="none"
          stroke="var(--color-white)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={
            shouldReduceMotion
              ? { pathLength: 1 }
              : {
                  pathLength: [0, 1, 1],
                  opacity: [0, 0.9, 0],
                }
          }
          transition={{
            duration: shouldReduceMotion ? 0 : 1.25,
            ease: premiumEase,
          }}
        />
      </svg>
    </motion.div>
  );
}

function MobileTabletView({
  cards,
  selectedId,
  onSelect,
  tapHint,
}: {
  cards: DetailCard[];
  selectedId?: CardId;
  onSelect: (card: DetailCard) => void;
  tapHint: string;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-[720px] w-full max-w-4xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] backdrop-blur-xl">
        <p className="mb-5 text-center text-[13px] font-normal tracking-[-0.02em] text-[var(--color-text-gray)]">
          {tapHint}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const active = selectedId === card.id || card.active;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  onSelect(card);
                  scrollRightSidebarTo(card.id);
                }}
                className={[
                  "group rounded-[22px] border p-4 text-left transition duration-300",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_18px_44px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
                    : "border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
                  "hover:-translate-y-1 hover:shadow-[0_24px_54px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]",
                      active
                        ? "bg-[var(--color-secondary)] text-[var(--color-primary)]"
                        : "bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
                    ].join(" ")}
                  >
                    {card.icon}
                  </div>

                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-current opacity-70">
                      {card.label}
                    </p>

                    <h3 className="mt-1 text-[18px] font-semibold leading-[1.08] tracking-[-0.045em] text-current">
                      {card.title}
                    </h3>

                    {card.subtitle ? (
                      <p className="mt-1 text-[12px] font-normal text-current opacity-75">
                        {card.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SIS() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [selectedCapability, setSelectedCapability] =
    useState<DetailCard | null>(null);

  const coreCards = useMemo<DetailCard[]>(() => {
    return coreBase.map((card) => ({
      ...card,
      title: text.cards[card.id].title,
      subtitle:
        "subtitle" in text.cards[card.id] ? text.cards[card.id].subtitle : undefined,
      label: text.cards[card.id].label,
      description: text.cards[card.id].description,
    }));
  }, [text]);

  const floatingCards = useMemo<DetailCard[]>(() => {
    return floatingBase.map((card) => ({
      ...card,
      title: text.cards[card.id].title,
      subtitle:
        "subtitle" in text.cards[card.id] ? text.cards[card.id].subtitle : undefined,
      label: text.cards[card.id].label,
      description: text.cards[card.id].description,
    }));
  }, [text]);

  const allCards = useMemo<DetailCard[]>(
    () => [...coreCards, ...floatingCards],
    [coreCards, floatingCards]
  );

  const selectedId = selectedCapability?.id;

  return (
    <section className="relative h-full min-h-[720px] w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-border-soft)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-70 blur-[88px]"
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

      <MobileTabletView
        cards={allCards}
        selectedId={selectedId}
        onSelect={setSelectedCapability}
        tapHint={text.tapHint}
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative hidden h-full w-full lg:block"
      >
        {floatingCards.map((item, index) => (
          <FloatingTile
            key={item.id}
            item={item}
            index={index}
            active={selectedId === item.id}
            onClick={() => setSelectedCapability(item)}
          />
        ))}

        <AnimatePresence mode="wait">
          {selectedId ? (
            <ConnectorLine key={selectedId} selectedId={selectedId} />
          ) : null}
        </AnimatePresence>

        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 top-[-66px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => setSelectedCapability(coreCards[1])}
                className={[
                  "h-[42px] min-w-[320px] rounded-full",
                  "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] px-[44px]",
                  "text-center text-[13px] font-semibold uppercase tracking-[0.13em]",
                  "leading-[36px] text-[var(--color-text-inverse)]",
                  "shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]",
                  "transition duration-300 hover:scale-[1.025] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
              >
                {text.topTitle}
              </button>
            </div>

            <div
              className={[
                "relative h-[290px] w-[340px]",
                "rounded-[26px] border-[3px] border-[var(--color-primary)]",
                "bg-[var(--color-white)] p-[14px]",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0.5 rounded-[22px] bg-[linear-gradient(180deg,var(--color-white),transparent_35%,var(--color-secondary-light))] opacity-35" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] gap-3.5">
                <div className="flex flex-col justify-center gap-2.5">
                  <CoreTile
                    item={coreCards[0]}
                    selected={selectedId === coreCards[0].id}
                    onSelect={() => setSelectedCapability(coreCards[0])}
                  />

                  <CoreTile
                    item={coreCards[2]}
                    selected={selectedId === coreCards[2].id}
                    onSelect={() => setSelectedCapability(coreCards[2])}
                  />
                </div>

                <div className="flex items-center justify-center">
                  <div className="scale-[1.55]">
                    <CoreTile
                      item={coreCards[1]}
                      selected={selectedId === coreCards[1].id}
                      onSelect={() => setSelectedCapability(coreCards[1])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedCapability ? (
            <DetailPanel
              item={
                allCards.find((card) => card.id === selectedCapability.id) ??
                selectedCapability
              }
              onClose={() => setSelectedCapability(null)}
              openSectionText={text.openSection}
              closeText={text.closeDetail}
              fallbackLabel={text.fallbackLabel}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { FaRegStar, FaUsers, FaXmark } from "react-icons/fa6";
import {
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlinePsychology,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

type CardId =
  | "sis"
  | "special-programs"
  | "learning-management"
  | "consistent-experience"
  | "contextual-ai"
  | "student-information";

type CardItem = {
  id: CardId;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
  floating?: boolean;
  positionClass?: string;
  label?: string;
  description?: string;
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
    sectionTitle: "বিশেষ কার্যক্রম",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    fallbackLabel: "সংযুক্ত সক্ষমতা",
    tapHint: "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",
    cards: {
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        label: "সংযুক্ত ব্যবস্থা",
        description:
          "শিক্ষার্থী তথ্য ব্যবস্থা শিক্ষার্থীর রেকর্ড, কার্যক্রম, একাডেমিক ডেটা এবং স্কুলের কাজের ধারাকে একটি কেন্দ্রীয় তথ্য ব্যবস্থায় যুক্ত করে।",
      },
      "special-programs": {
        title: "বিশেষ কার্যক্রম",
        label: "প্রধান কার্যক্রম এলাকা",
        description:
          "বিশেষ কার্যক্রম স্কুলকে শিক্ষার্থী সহায়তা, বিশেষ সেবা, সহায়তা কার্যধারা এবং সংযুক্ত কার্যক্রম তথ্য পরিচালনা করতে সাহায্য করে।",
      },
      "learning-management": {
        title: "লার্নিং ব্যবস্থাপনা",
        subtitle: "লার্নিং স্যুট",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "ক্লাসরুম শেখার কার্যক্রমকে শিক্ষার্থী কার্যক্রমের সাথে যুক্ত করুন, যাতে শিক্ষকরা সহায়তার প্রয়োজন এবং অগ্রগতি পরিষ্কারভাবে বুঝতে পারেন।",
      },
      "consistent-experience": {
        title: "একীভূত অভিজ্ঞতা",
        subtitle: "পরিবার হাব",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "পরিবার, শিক্ষার্থী এবং স্টাফদের শিক্ষার্থী সহায়তা, কার্যক্রম আপডেট এবং দৈনন্দিন কাজের মধ্যে একটি একীভূত অভিজ্ঞতা দিন।",
      },
      "contextual-ai": {
        title: "প্রাসঙ্গিক কৃত্রিম বুদ্ধিমত্তা",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "সংযুক্ত শিক্ষার্থী ডেটার সাথে কৃত্রিম বুদ্ধিমত্তা ব্যবহার করে ইনসাইট, কার্যক্রম প্রয়োজন, সহায়তার ট্রেন্ড এবং পরিষ্কার স্কুল সিদ্ধান্ত তুলে ধরুন।",
      },
      "student-information": {
        title: "শিক্ষার্থীর তথ্য",
        label: "শিক্ষার্থী সেকশন",
        description:
          "শিক্ষার্থীর তথ্য শিক্ষার্থী তথ্য ব্যবস্থা, ভর্তি, বিশেষ কার্যক্রম এবং সংশ্লিষ্ট শিক্ষার্থী কাজের ধারাকে একটি সংযুক্ত প্ল্যাটফর্মে যুক্ত করে।",
      },
    },
  },
  en: {
    sectionTitle: "Special Programs",
    openSection: "Open Section",
    closeDetail: "Close detail",
    fallbackLabel: "Connected Capability",
    tapHint: "Click any card to view details",
    cards: {
      sis: {
        title: "Student Information System",
        label: "Connected System",
        description:
          "The student information system connects student records, programs, academic data, and school workflows in one central information system.",
      },
      "special-programs": {
        title: "Special Programs",
        label: "Main Program Area",
        description:
          "Special Programs helps schools manage student support, special services, intervention workflows, and connected program information.",
      },
      "learning-management": {
        title: "Learning Management",
        subtitle: "Learning Suite",
        label: "Connected Add-on",
        description:
          "Connect classroom learning activity with student programs so educators understand support needs and progress clearly.",
      },
      "consistent-experience": {
        title: "Consistent Experience",
        subtitle: "Family Hub",
        label: "Connected Add-on",
        description:
          "Give families, students, and staff a consistent experience across student support, program updates, and daily workflows.",
      },
      "contextual-ai": {
        title: "Contextual AI",
        label: "Connected Add-on",
        description:
          "Use AI with connected student data to surface insights, program needs, support trends, and clearer school decisions.",
      },
      "student-information": {
        title: "Student Information",
        label: "Student Section",
        description:
          "Student Information connects the student information system, enrollment, special programs, and related student workflows in one connected platform.",
      },
    },
  },
} as const;

const centerBase = [
  {
    id: "sis" as const,
    icon: <FaUsers />,
  },
  {
    id: "special-programs" as const,
    icon: <FaRegStar />,
    active: true,
  },
];

const floatingBase = [
  {
    id: "learning-management" as const,
    subtitle: true,
    icon: <MdOutlinePsychology />,
    positionClass: "right-[5%] top-[14%]",
  },
  {
    id: "consistent-experience" as const,
    subtitle: true,
    icon: <MdOutlineGridView />,
    positionClass: "right-[5%] bottom-[14%]",
  },
  {
    id: "contextual-ai" as const,
    icon: <MdOutlineAutoAwesome />,
    positionClass: "left-[13%] bottom-[8%]",
  },
];

const connectorPaths: Record<CardId, ConnectorPath> = {
  sis: {
    d: "M500 360 L455 360 Q440 360 440 345 L440 335 Q440 320 425 320 L390 320",
    color: brandColor,
    glowColor: brandGlow,
  },
  "special-programs": {
    d: "M500 360 L500 360",
    color: brandColor,
    glowColor: brandGlowStrong,
  },
  "learning-management": {
    d: "M500 360 L610 360 Q630 360 630 340 L630 175 Q630 155 650 155 L900 155",
    color: brandColor,
    glowColor: brandGlow,
  },
  "consistent-experience": {
    d: "M500 360 L610 360 Q630 360 630 380 L630 550 Q630 570 650 570 L900 570",
    color: brandColor,
    glowColor: brandGlow,
  },
  "contextual-ai": {
    d: "M500 360 L440 360 Q420 360 420 380 L420 625 Q420 645 400 645 L245 645",
    color: brandColor,
    glowColor: brandGlow,
  },
  "student-information": {
    d: "M500 360 L500 360",
    color: brandColor,
    glowColor: brandGlow,
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
    "home-connections-panel",
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
  const isSpecialPrograms = item.id === "special-programs";

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
        "transition-[box-shadow,border-color,background-color,transform] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        selected
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

      {selected ? (
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

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[27px] leading-none text-current transition-transform duration-500 group-hover:scale-110">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center tracking-[-0.04em] text-current",
          isSpecialPrograms ? "font-black" : "font-semibold",
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

function ActiveSpecialProgramsCard({
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
        "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]",
        "shadow-[0_26px_70px_color-mix(in_srgb,var(--color-primary)_24%,transparent),0_0_0_6px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        "transition-all duration-500 hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:shadow-[0_32px_84px_color-mix(in_srgb,var(--color-primary)_26%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-35" />

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

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-[10px] top-[10px] z-10 text-[13px] text-current opacity-85 transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-4 text-[48px] leading-none text-current transition-all duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <h3 className="relative z-10 max-w-[132px] text-[14px] font-black leading-[1.05] tracking-[-0.04em] text-current">
        {item.title}
      </h3>

      {item.subtitle ? (
        <p className="relative z-10 mt-2 text-[11px] font-normal leading-none text-current opacity-75">
          {item.subtitle}
        </p>
      ) : null}
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

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-semibold leading-[1.05] tracking-[-0.04em] text-current">
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
  item: CardItem;
  onClose: () => void;
  openSectionText: string;
  closeText: string;
  fallbackLabel: string;
}) {
  const isSpecialPrograms = item.id === "special-programs";

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
        "border border-[var(--color-primary)] bg-[var(--color-white)] px-6 py-6 text-[var(--color-primary)]",
        "shadow-[0_26px_80px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)]"
        aria-label={closeText}
      >
        <FaXmark />
      </button>

      <div className="flex items-start gap-4 pr-10">
        <div className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[18px] border border-[var(--color-primary)] bg-[var(--color-secondary-light)] text-[var(--color-primary)]">
          <div className="text-[31px] leading-none">{item.icon}</div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--color-text-gray)]">
            {item.label ?? fallbackLabel}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[var(--color-primary)]",
              isSpecialPrograms ? "font-black" : "font-semibold",
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
        className="mt-5 rounded-full bg-[var(--color-primary)] px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-[var(--color-text-inverse)] transition hover:translate-y-[-1px] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]"
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

  if (selectedId === "special-programs") {
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
            stroke="var(--color-primary)"
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
      </svg>
    </motion.div>
  );
}

function MobileTabletView({
  cards,
  selectedCard,
  setSelectedCard,
  hint,
}: {
  cards: CardItem[];
  selectedCard: CardItem | null;
  setSelectedCard: (card: CardItem) => void;
  hint: string;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-[680px] w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] backdrop-blur-xl">
        <p className="mb-5 text-center text-[13px] font-normal tracking-[-0.02em] text-[var(--color-text-gray)]">
          {hint}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const active = selectedCard?.id === card.id || card.active;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setSelectedCard(card);
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

                <p className="mt-3 text-[13.5px] font-normal leading-6 text-current opacity-75">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SpecialPrograms() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const centerCards = useMemo<CardItem[]>(
    () =>
      centerBase.map((card) => ({
        ...card,
        title: text.cards[card.id].title,
        subtitle:
          "subtitle" in text.cards[card.id]
            ? text.cards[card.id].subtitle
            : undefined,
        label: text.cards[card.id].label,
        description: text.cards[card.id].description,
      })),
    [text]
  );

  const floatingCards = useMemo<CardItem[]>(
    () =>
      floatingBase.map((card) => ({
        ...card,
        title: text.cards[card.id].title,
        subtitle:
          "subtitle" in text.cards[card.id]
            ? text.cards[card.id].subtitle
            : undefined,
        label: text.cards[card.id].label,
        description: text.cards[card.id].description,
      })),
    [text]
  );

  const parentCard = useMemo<CardItem>(
    () => ({
      id: "student-information",
      title: text.cards["student-information"].title,
      icon: <FaUsers />,
      label: text.cards["student-information"].label,
      description: text.cards["student-information"].description,
    }),
    [text]
  );

  const allCards = useMemo<CardItem[]>(
    () => [...centerCards, ...floatingCards, parentCard],
    [centerCards, floatingCards, parentCard]
  );

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full min-h-[680px] w-full overflow-hidden bg-[var(--color-white)]">
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

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[52%] top-[48%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-secondary)] blur-[92px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.24, 0.52, 0.24],
              }
        }
        transition={{
          duration: 4.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <MobileTabletView
        cards={allCards}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        hint={text.tapHint}
      />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative hidden h-full w-full lg:block"
      >
        {floatingCards.map((item, index) => (
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
            <ConnectorLine key={selectedId} selectedId={selectedId as CardId} />
          ) : null}
        </AnimatePresence>

        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 top-[-66px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCard(parentCard);
                  scrollRightSidebarTo("student-information");
                }}
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
                {text.sectionTitle}
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[26px] border-[3px] border-[var(--color-primary)]",
                "bg-[var(--color-white)] p-[18px]",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,var(--color-white),transparent_35%,var(--color-secondary-light))] opacity-35" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard
                  item={centerCards[0]}
                  selected={selectedId === centerCards[0].id}
                  onSelect={() => setSelectedCard(centerCards[0])}
                />

                <ActiveSpecialProgramsCard
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
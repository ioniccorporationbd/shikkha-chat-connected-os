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
  MdAddCircleOutline,
  MdOutlineHub,
  MdOutlineSchool,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

type CardId =
  | "sis"
  | "enrollment"
  | "connected-intelligence"
  | "student-information";

type CardItem = {
  id: CardId;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
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
    sectionTitle: "ভর্তি ব্যবস্থাপনা",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    tapHint: "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",
    cards: {
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        subtitle: "শিক্ষার্থী ব্যবস্থাপনা",
        label: "সংযুক্ত ব্যবস্থা",
        description:
          "শিক্ষার্থী তথ্য ব্যবস্থা শিক্ষার্থীর রেকর্ড, একাডেমিক তথ্য, ক্লাস ডেটা, উপস্থিতি এবং সংযুক্ত কাজের ধারাকে একটি কেন্দ্রীয় জায়গায় রাখে।",
      },
      enrollment: {
        title: "ভর্তি ব্যবস্থাপনা",
        subtitle: "প্রধান ভর্তি এলাকা",
        label: "প্রধান ভর্তি",
        description:
          "ভর্তি ব্যবস্থা স্কুলকে শিক্ষার্থী ভর্তি, পরিবারের তথ্য, ক্লাস প্লেসমেন্ট এবং সম্পূর্ণ শিক্ষার্থী অনবোর্ডিং যাত্রা পরিচালনা করতে সাহায্য করে।",
      },
      "connected-intelligence": {
        title: "সংযুক্ত বুদ্ধিমত্তা",
        subtitle: "ডেটা বিশ্লেষণ",
        label: "সংযুক্ত অতিরিক্ত সুবিধা",
        description:
          "সংযুক্ত বুদ্ধিমত্তা স্কুলের ডেটা একসাথে এনে ভর্তি ট্রেন্ড, শিক্ষার্থীর মুভমেন্ট এবং অপারেশনাল ইনসাইট দ্রুত বুঝতে সাহায্য করে।",
      },
      "student-information": {
        title: "শিক্ষার্থীর তথ্য",
        subtitle: "প্রোফাইল সেকশন",
        label: "শিক্ষার্থী সেকশন",
        description:
          "শিক্ষার্থীর তথ্য ভর্তি প্রক্রিয়াকে বিস্তৃত শিক্ষার্থী প্রোফাইলের সাথে যুক্ত করে, যাতে স্কুল সিস্টেমে রেকর্ড পরিচালনা করা সহজ হয়।",
      },
    },
  },
  en: {
    sectionTitle: "Enrollment Management",
    openSection: "Open Section",
    closeDetail: "Close detail",
    tapHint: "Click any card to view details",
    cards: {
      sis: {
        title: "Student Information System",
        subtitle: "Student Management",
        label: "Connected System",
        description:
          "The student information system keeps student records, academic information, class data, attendance, and connected workflows in one central place.",
      },
      enrollment: {
        title: "Enrollment Management",
        subtitle: "Main Enrollment Area",
        label: "Main Enrollment",
        description:
          "Enrollment helps schools manage student admission, family information, class placement, and the complete student onboarding journey.",
      },
      "connected-intelligence": {
        title: "Connected Intelligence",
        subtitle: "Data Insight",
        label: "Connected Add-on",
        description:
          "Connected Intelligence brings school data together so teams can understand enrollment trends, student movement, and operational insights faster.",
      },
      "student-information": {
        title: "Student Information",
        subtitle: "Profile Section",
        label: "Student Section",
        description:
          "Student Information connects enrollment with the wider student profile, making records easier to manage across the school system.",
      },
    },
  },
} as const;

const connectorPaths: Record<CardId, ConnectorPath> = {
  sis: {
    d: "M500 360 L455 360 Q440 360 440 345 L440 335 Q440 320 425 320 L390 320",
    color: brandColor,
    glowColor: brandGlow,
  },
  enrollment: {
    d: "M500 360 L500 360",
    color: brandColor,
    glowColor: brandGlowStrong,
  },
  "connected-intelligence": {
    d: "M500 360 L610 360 Q630 360 630 340 L630 325 Q630 305 650 305 L900 305",
    color: brandColor,
    glowColor: brandGlow,
  },
  "student-information": {
    d: "M500 360 L455 360 Q435 360 435 340 L435 270 Q435 250 455 250 L500 250",
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
        selected
          ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_22px_55px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
          : "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        "hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:shadow-[0_26px_64px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-35" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-[var(--color-white)] opacity-40 blur-[1px]"
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
          className="pointer-events-none absolute -inset-0.5 rounded-3xl border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-2 top-2 z-10 text-[12px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12" />

      {item.icon ? (
        <div className="relative z-10 mb-2 text-[27px] leading-none text-current transition-transform duration-500 group-hover:scale-110">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-7.5 max-w-21.5 items-center justify-center",
          "text-center font-semibold tracking-[-0.04em] text-current",
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

function ActiveEnrollmentCard({
  item,
  onSelect,
}: {
  item: CardItem;
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
        "group relative h-39.5 w-39.5 overflow-hidden rounded-[22px]",
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
        className="pointer-events-none absolute -left-14 top-0 h-full w-12 skew-x-[-18deg] bg-[var(--color-white)] opacity-45 blur-[1px]"
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
        className="pointer-events-none absolute -inset-0.5 rounded-3xl border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-2 top-2 z-10 text-[13px] text-current opacity-85 transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-4 text-[42px] leading-none text-current transition-all duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <h3 className="relative z-10 max-w-32.5 text-[15px] font-semibold leading-[1.08] tracking-[-0.04em] text-current">
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
        "group absolute z-20 h-24 w-24 overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color,transform] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        item.id === "connected-intelligence"
          ? "right-[3%] top-[31%]"
          : "left-1/2 top-[15%] -translate-x-1/2",
        active
          ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_24px_60px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
          : "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
        "hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] hover:shadow-[0_26px_64px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-35" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-14 top-0 h-full w-12   skew-x-[-18deg] bg-[var(--color-white)] opacity-45 blur-[1px]"
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
          className="pointer-events-none absolute -inset-0.5 rounded-[20px] border border-[var(--color-secondary)]"
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

      <FaRegStar className="absolute right-2 top-2 z-10 text-[12px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-1.75 text-[26px] leading-none text-current transition-transform duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-21 items-center justify-center text-center text-[9.5px] font-semibold leading-[1.05] tracking-[-0.04em] text-current">
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

function DetailPanel({
  item,
  onClose,
  openSectionText,
  closeText,
}: {
  item: CardItem;
  onClose: () => void;
  openSectionText: string;
  closeText: string;
}) {
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
            {item.label}
          </p>

          <h3 className="mt-2 text-[30px] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--color-primary)]">
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

  if (selectedId === "enrollment") {
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
    <div className="relative z-10 mx-auto flex min-h-160 w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border-[3px] border-(--color-primary)text-(--color-text-gray) p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] backdrop-blur-xl">
        <p className="mb-5 text-center text-[13px] font-normal tracking-[-0.02em] text-(--color-text-gray)">
          {hint}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const active = selectedCard?.id === card.id;

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

export default function Enrollment() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const centerCards = useMemo<CardItem[]>(
    () => [
      {
        id: "sis",
        title: text.cards.sis.title,
        subtitle: text.cards.sis.subtitle,
        icon: <FaUsers />,
        label: text.cards.sis.label,
        description: text.cards.sis.description,
      },
      {
        id: "enrollment",
        title: text.cards.enrollment.title,
        subtitle: text.cards.enrollment.subtitle,
        icon: <MdAddCircleOutline />,
        label: text.cards.enrollment.label,
        description: text.cards.enrollment.description,
      },
    ],
    [text]
  );

  const floatingCards = useMemo<CardItem[]>(
    () => [
      {
        id: "connected-intelligence",
        title: text.cards["connected-intelligence"].title,
        subtitle: text.cards["connected-intelligence"].subtitle,
        icon: <MdOutlineHub />,
        label: text.cards["connected-intelligence"].label,
        description: text.cards["connected-intelligence"].description,
      },
      {
        id: "student-information",
        title: text.cards["student-information"].title,
        subtitle: text.cards["student-information"].subtitle,
        icon: <MdOutlineSchool />,
        label: text.cards["student-information"].label,
        description: text.cards["student-information"].description,
      },
    ],
    [text]
  );

  const allCards = useMemo<CardItem[]>(
    () => [...centerCards, ...floatingCards],
    [centerCards, floatingCards]
  );

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full min-h-160 w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-border-soft)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-140 w-140 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-70 blur-[88px]"
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
        className="pointer-events-none absolute left-[52%] top-[48%] h-65 w-65 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-secondary)] blur-[92px]"
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
            <ConnectorLine key={selectedId} selectedId={selectedId} />
          ) : null}
        </AnimatePresence>

        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 -top-16.5 z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCard(centerCards[1]);
                  scrollRightSidebarTo("enrollment");
                }}
                className={[
                  "h-10.5 min-w-[320px] rounded-full",
                  "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] px-11",
                  "text-center text-[13px] font-semibold uppercase tracking-[0.13em]",
                  "leading-9 text-[var(--color-text-inverse)]",
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
                "relative h-62.5 w-85",
                "rounded-[26px] border-[3px] border-[var(--color-primary)]",
                "bg-[var(--color-white)] p-4.5",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                "backdrop-blur-xs",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0.5 rounded-[22px] bg-[linear-gradient(180deg,var(--color-white),transparent_35%,var(--color-secondary-light))] opacity-35" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-12">
                <MiniCard
                  item={centerCards[0]}
                  selected={selectedId === centerCards[0].id}
                  onSelect={() => setSelectedCard(centerCards[0])}
                />

                <ActiveEnrollmentCard
                  item={centerCards[1]}
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
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
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
import { MdAddCircleOutline, MdOutlineHub } from "react-icons/md";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

type ProductId =
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support";

type ProductCard = {
  id: ProductId;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  featured?: boolean;
  outline?: boolean;
  muted?: boolean;
  label?: string;
  description: string;
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const rightImage = "/images/family-engagement-people.png";
const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const brandColor = "var(--color-primary)";
const brandGlow = "color-mix(in srgb, var(--color-primary) 14%, transparent)";
const brandGlowStrong =
  "color-mix(in srgb, var(--color-primary) 18%, transparent)";

const sectionText = {
  bn: {
    groupTitle: "পরিবারের সম্পৃক্ততা",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    tapHint: "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",
    imageAlt: "পরিবারের সম্পৃক্ততা চিত্র",
    cards: {
      "student-information": {
        title: "শিক্ষার্থীর তথ্য",
        subtitle: "শিক্ষার্থী প্রোফাইল",
        label: "শিক্ষার্থী প্রোফাইল",
        description:
          "শিক্ষার্থীর তথ্য শিক্ষার্থীর রেকর্ড, পরিবারের বিস্তারিত, একাডেমিক ডেটা এবং স্কুলের সংযুক্ত কাজগুলোকে একটি জায়গায় সুন্দরভাবে সাজিয়ে রাখে।",
      },
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        subtitle: "মূল ব্যবস্থা",
        label: "মূল ব্যবস্থা",
        description:
          "শিক্ষার্থী তথ্য ব্যবস্থা একটি কেন্দ্রীয় শিক্ষার্থী তথ্য ব্যবস্থা, যেখানে স্কুলের ডেটা, ভর্তি, উপস্থিতি এবং সংযুক্ত রেকর্ড পরিচালনা করা হয়।",
      },
      enrollment: {
        title: "ভর্তি ব্যবস্থাপনা",
        subtitle: "ভর্তি প্রক্রিয়া",
        label: "ভর্তি প্রক্রিয়া",
        description:
          "ভর্তি ব্যবস্থা স্কুলকে শিক্ষার্থী ভর্তি, অনবোর্ডিং, পরিবারের তথ্য এবং ক্লাস প্লেসমেন্ট সহজভাবে পরিচালনা করতে সাহায্য করে।",
      },
      "special-programs": {
        title: "বিশেষ কার্যক্রম",
        subtitle: "সহায়তা কার্যক্রম",
        label: "শিক্ষার্থী সহায়তা",
        description:
          "বিশেষ কার্যক্রম শিক্ষার্থী সহায়তা, সহায়তা কার্যধারা এবং কার্যক্রম ডেটাকে পুরো স্কুল ব্যবস্থার সাথে যুক্ত করে।",
      },
      "family-engagement": {
        title: "পরিবারের সম্পৃক্ততা",
        subtitle: "প্রধান পরিবার এলাকা",
        label: "প্রধান পরিবার এলাকা",
        description:
          "পরিবারের সম্পৃক্ততা স্কুল, শিক্ষার্থী এবং পরিবারের যোগাযোগকে একসাথে যুক্ত করে, যাতে অভিভাবকরা শেখার যাত্রায় সবসময় অবগত ও সম্পৃক্ত থাকেন।",
      },
      communications: {
        title: "যোগাযোগ ব্যবস্থা",
        subtitle: "স্কুল বার্তা",
        label: "স্কুল যোগাযোগ",
        description:
          "যোগাযোগ ব্যবস্থা শিক্ষার্থী ও স্কুল ডেটা ব্যবহার করে পরিবারকে সংযুক্ত, সঠিক এবং সময়মতো আপডেট পাঠাতে সাহায্য করে।",
      },
      "attendance-support": {
        title: "উপস্থিতি সহায়তা",
        subtitle: "দ্রুত সাড়া",
        label: "উপস্থিতি সাড়া",
        description:
          "উপস্থিতি সহায়তা উপস্থিতির প্যাটার্ন শনাক্ত করে এবং দ্রুত শিক্ষার্থী সহায়তার জন্য স্কুল ও পরিবারকে সংযুক্ত করে।",
      },
    },
  },
  en: {
    groupTitle: "Family Engagement",
    openSection: "Open Section",
    closeDetail: "Close detail",
    tapHint: "Click any card to view details",
    imageAlt: "Family Engagement",
    cards: {
      "student-information": {
        title: "Student Information",
        subtitle: "Student Profile",
        label: "Student Profile",
        description:
          "Student Information keeps student records, family details, academic data, and connected school workflows organized in one place.",
      },
      sis: {
        title: "Student Information System",
        subtitle: "Core System",
        label: "Core System",
        description:
          "The student information system works as the central place where school data, enrollment, attendance, and connected records are managed.",
      },
      enrollment: {
        title: "Enrollment Management",
        subtitle: "Admission Workflow",
        label: "Admission Workflow",
        description:
          "Enrollment helps schools manage student admission, onboarding, family information, and class placement smoothly.",
      },
      "special-programs": {
        title: "Special Programs",
        subtitle: "Support Programs",
        label: "Student Support",
        description:
          "Special Programs connects support services, intervention workflows, and student program data with the wider school system.",
      },
      "family-engagement": {
        title: "Family Engagement",
        subtitle: "Main Family Area",
        label: "Main Family Area",
        description:
          "Family Engagement connects school, student, and family communication so guardians stay informed and involved in the learning journey.",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
        label: "School Communication",
        description:
          "Communications helps schools send connected, accurate, and timely updates to families using student and school data.",
      },
      "attendance-support": {
        title: "Attendance Support",
        subtitle: "Quick Response",
        label: "Attendance Response",
        description:
          "Attendance Support helps identify attendance patterns and connect schools with families for faster student support.",
      },
    },
  },
} as const;

const productBase = [
  {
    id: "student-information" as const,
    muted: true,
  },
  {
    id: "sis" as const,
    icon: <FaUsers />,
    muted: true,
  },
  {
    id: "enrollment" as const,
    icon: <MdAddCircleOutline />,
    muted: true,
  },
  {
    id: "special-programs" as const,
    icon: <FaRegStar />,
    muted: true,
  },
  {
    id: "family-engagement" as const,
    featured: true,
  },
  {
    id: "communications" as const,
    icon: <MdOutlineHub />,
    outline: true,
  },
  {
    id: "attendance-support" as const,
    icon: <FaRegCircleQuestion />,
    outline: true,
  },
];

const connectorPaths: Record<ProductId, ConnectorPath> = {
  "student-information": {
    d: "M500 360 L456 360 Q442 360 442 346 L442 238 Q442 224 428 224 L390 224",
    color: brandColor,
    glowColor: brandGlow,
  },
  sis: {
    d: "M500 360 L458 360 Q444 360 444 346 L444 238 Q444 224 430 224 L500 224",
    color: brandColor,
    glowColor: brandGlow,
  },
  enrollment: {
    d: "M500 360 L456 360 Q442 360 442 346 L442 330 Q442 316 428 316 L390 316",
    color: brandColor,
    glowColor: brandGlow,
  },
  "special-programs": {
    d: "M500 360 L458 360 Q444 360 444 346 L444 330 Q444 316 430 316 L500 316",
    color: brandColor,
    glowColor: brandGlow,
  },
  "family-engagement": {
    d: "M500 360 L500 360",
    color: brandColor,
    glowColor: brandGlowStrong,
  },
  communications: {
    d: "M500 360 L458 360 Q444 360 444 374 L444 424 Q444 438 430 438 L500 438",
    color: brandColor,
    glowColor: brandGlow,
  },
  "attendance-support": {
    d: "M500 360 L456 360 Q442 360 442 374 L442 424 Q442 438 428 438 L390 438",
    color: brandColor,
    glowColor: brandGlow,
  },
};

const wrapperVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      ease: premiumEase,
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.9,
    filter: "blur(7px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.52,
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

function ProductTile({
  item,
  selected,
  onSelect,
}: {
  item: ProductCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "family-engagement";
  const active = selected || isActive;

  return (
    <motion.button
      variants={cardVariants}
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
        active
          ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-[0_22px_55px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
          : item.outline
            ? "border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
            : item.muted
              ? "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_12px_30px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
              : "border border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)] shadow-[0_12px_30px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12" />

      {item.icon ? (
        <div className="relative z-10 mb-[7px] text-[25px] leading-none text-current transition-all duration-500 group-hover:scale-110">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center tracking-[-0.035em] text-current",
          isActive ? "font-semibold" : "font-normal",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.2px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[3px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-current opacity-75">
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
}: {
  item: ProductCard;
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
          <div className="text-[31px] leading-none">
            {item.icon ?? <FaUsers />}
          </div>
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

function ConnectorLine({ selectedId }: { selectedId: ProductId }) {
  const shouldReduceMotion = useReducedMotion();
  const path = connectorPaths[selectedId];

  if (!path) return null;

  if (selectedId === "family-engagement") {
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
            r="40"
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
  products,
  selectedCard,
  setSelectedCard,
  hint,
}: {
  products: ProductCard[];
  selectedCard: ProductCard | null;
  setSelectedCard: (product: ProductCard) => void;
  hint: string;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-[660px] w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border-[3px] border-[var(--color-primary)] bg-[var(--color-white)] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] backdrop-blur-xl">
        <p className="mb-5 text-center text-[13px] font-normal tracking-[-0.02em] text-[var(--color-text-gray)]">
          {hint}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const active =
              selectedCard?.id === product.id ||
              product.id === "family-engagement";

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSelectedCard(product);
                  scrollRightSidebarTo(product.id);
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
                    {product.icon ?? <FaUsers />}
                  </div>

                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-current opacity-70">
                      {product.label}
                    </p>

                    <h3 className="mt-1 text-[18px] font-semibold leading-[1.08] tracking-[-0.045em] text-current">
                      {product.title}
                    </h3>

                    {product.subtitle ? (
                      <p className="mt-1 text-[12px] font-normal text-current opacity-75">
                        {product.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 text-[13.5px] font-normal leading-6 text-current opacity-75">
                  {product.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FamilyEngagement() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<ProductCard | null>(null);
  const [isSeparated, setIsSeparated] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  const selectedId = selectedCard?.id;

  const products = useMemo<ProductCard[]>(() => {
    return productBase.map((product) => ({
      ...product,
      title: text.cards[product.id].title,
      subtitle: text.cards[product.id].subtitle,
      label: text.cards[product.id].label,
      description: text.cards[product.id].description,
    }));
  }, [text]);

  useEffect(() => {
    const separateTimer = window.setTimeout(() => {
      setIsSeparated(true);
    }, 650);

    const jumpTimer = window.setTimeout(() => {
      setImageSettled(true);
    }, 1550);

    return () => {
      window.clearTimeout(separateTimer);
      window.clearTimeout(jumpTimer);
    };
  }, []);

  return (
    <section className="relative h-full min-h-[660px] w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-border-soft)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[40%] top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-70 blur-[88px]"
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
        className="pointer-events-none absolute right-[20%] top-[52%] h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-[var(--color-secondary)] blur-[92px]"
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
        products={products}
        selectedCard={selectedCard}
        setSelectedCard={setSelectedCard}
        hint={text.tapHint}
      />

      <div className="relative z-10 hidden h-full w-full lg:block">
        <AnimatePresence mode="wait">
          {selectedId ? (
            <ConnectorLine key={selectedId} selectedId={selectedId} />
          ) : null}
        </AnimatePresence>

        <motion.div
          initial={{
            x: "-50%",
            y: "-50%",
            scale: 1,
          }}
          animate={{
            x: isSeparated ? "calc(-50% - 210px)" : "-50%",
            y: "-50%",
            scale: isSeparated ? 0.985 : 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 1.05,
            ease: premiumEase,
          }}
          className="absolute left-1/2 top-1/2 z-30"
        >
          <motion.div
            variants={wrapperVariants}
            initial="hidden"
            animate="visible"
            className="relative shrink-0 translate-y-[4px]"
          >
            <motion.button
              type="button"
              onClick={() => scrollRightSidebarTo("home-connections-panel")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -3,
                      scale: 1.025,
                    }
              }
              whileTap={{
                scale: 0.96,
              }}
              className={[
                "absolute left-1/2 top-[-56px] z-20 -translate-x-1/2",
                "h-[42px] min-w-[240px] rounded-full",
                "border-[3px] border-[var(--color-primary)] bg-[var(--color-primary)] px-[30px]",
                "text-[14px] font-semibold leading-[36px] text-[var(--color-text-inverse)]",
                "whitespace-nowrap shadow-[0_20px_54px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]",
                "transition-all duration-300 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
              ].join(" ")}
            >
              {text.groupTitle}

              <span className="absolute left-1/2 top-full h-[21px] w-[3px] -translate-x-1/2 rounded-full bg-[var(--color-primary)]" />
            </motion.button>

            <div
              className={[
                "relative h-[430px] w-[224px]",
                "rounded-[26px] border-[3px] border-[var(--color-primary)]",
                "bg-[var(--color-white)] p-[8px]",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,var(--color-white),transparent_35%,var(--color-secondary-light))] opacity-35" />

              <div className="relative z-10 grid grid-cols-2 gap-[8px]">
                {products.map((product) => (
                  <ProductTile
                    key={product.id}
                    item={product}
                    selected={selectedId === product.id}
                    onSelect={() => setSelectedCard(product)}
                  />
                ))}

                <div className="h-[96px] w-[96px]" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            x: "-50%",
            y: "-50%",
            scale: 0.74,
            rotate: -2,
            filter: "blur(16px)",
          }}
          animate={{
            opacity: isSeparated ? 1 : 0,
            x: isSeparated ? "calc(-50% + 205px)" : "-50%",
            y: imageSettled
              ? ["-50%", "calc(-50% - 18px)", "calc(-50% + 7px)", "-50%"]
              : "-50%",
            scale: imageSettled
              ? [1, 1.055, 0.985, 1]
              : isSeparated
                ? 1
                : 0.74,
            rotate: imageSettled ? [0, 1.2, -0.7, 0] : isSeparated ? 0 : -2,
            filter: isSeparated ? "blur(0px)" : "blur(16px)",
          }}
          transition={{
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.35,
              ease: "easeOut",
            },
            x: {
              duration: shouldReduceMotion ? 0 : 1.08,
              ease: premiumEase,
            },
            y: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.78,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.08,
                  ease: premiumEase,
                },
            scale: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.78,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.08,
                  ease: premiumEase,
                },
            rotate: {
              duration: shouldReduceMotion ? 0 : 0.78,
              ease: premiumEase,
            },
            filter: {
              duration: shouldReduceMotion ? 0 : 0.65,
              ease: premiumEase,
            },
          }}
          className="absolute left-1/2 top-1/2 z-20 hidden h-[430px] w-[330px] shrink-0 md:block"
        >
          <div className="absolute bottom-[24px] left-1/2 h-[42px] w-[220px] -translate-x-1/2 rounded-full bg-[var(--color-primary)] opacity-20 blur-[18px]" />

          <Image
            src={rightImage}
            alt={text.imageAlt}
            fill
            priority
            sizes="330px"
            className="object-contain object-bottom"
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedCard ? (
          <DetailPanel
            item={selectedCard}
            onClose={() => setSelectedCard(null)}
            openSectionText={text.openSection}
            closeText={text.closeDetail}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
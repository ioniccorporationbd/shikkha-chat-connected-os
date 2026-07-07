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

const themeColor = "#9CF048";
const darkColor = "#236000";
const glowColor = "rgba(156,240,72,0.22)";
const premiumEase = [0.22, 1, 0.36, 1] as const;

const centerCards: CardItem[] = [
  {
    id: "college-career-life-readiness",
    title: "College Career Life Readiness",
    subtitle: "Future Ready",
    icon: <FaRegStar />,
    color: darkColor,
    label: "Future Readiness",
    description:
      "College, Career & Life Readiness helps students connect academic progress with future goals, pathway planning, and life-ready preparation.",
  },
  {
    id: "cclr-naviance",
    title: "CCLR Naviance",
    subtitle: "Naviance",
    icon: <FaUsers />,
    active: true,
    color: darkColor,
    label: "Main Naviance Planning",
    description:
      "CCLR Naviance supports student pathway exploration, college and career planning, readiness tracking, goal setting, and future success preparation through a connected guidance experience.",
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
    id: "mtss",
    title: "MTSS",
    subtitle: "Multi-Tier Support",
    icon: <MdOutlineHub />,
    floating: true,
    color: darkColor,
    positionClass: "left-[3%] bottom-[14%]",
    label: "Multi-Tier Support",
    description:
      "MTSS connects academic, behavior, attendance, and wellbeing support into one coordinated support system.",
  },
  {
    id: "behavior-support",
    title: "Behavior Support",
    subtitle: "Wellbeing",
    icon: <MdOutlineFavoriteBorder />,
    floating: true,
    color: darkColor,
    positionClass: "right-[6%] bottom-[16%]",
    label: "Wellbeing",
    description:
      "Behavior Support helps schools understand behavior patterns, wellbeing signals, and connected support actions.",
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
  mtss: {
    d: "M500 360 L410 360 Q390 360 390 380 L390 610 Q390 630 370 630 L106 630",
    color: darkColor,
    glowColor,
  },
  "behavior-support": {
    d: "M500 360 L640 360 Q660 360 660 380 L660 615 Q660 635 680 635 L900 635",
    color: darkColor,
    glowColor,
  },
  "college-career-life-readiness": {
    d: "M500 360 L458 360 Q444 360 444 346 L444 300 Q444 286 430 286 L390 286",
    color: darkColor,
    glowColor,
  },
  "cclr-naviance": {
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
  const isNaviance = item.id === "cclr-naviance";

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
        "focus-visible:ring-2 focus-visible:ring-[#9CF048]/40 focus-visible:ring-offset-2",
        selected
          ? "border-[3px] border-[#9CF048] bg-[linear-gradient(180deg,#fbfff5_0%,#e3ffc9_100%)] shadow-[0_22px_52px_rgba(156,240,72,0.28),0_0_0_5px_rgba(156,240,72,0.1)]"
          : "border border-[#d8e2ee] bg-[linear-gradient(180deg,#ffffff_0%,#f4ffe9_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        "hover:shadow-[0_24px_58px_rgba(35,96,0,0.14)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.66),rgba(255,255,255,0)_52%,rgba(35,96,0,0.045))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-white/40 blur-[1px]"
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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#9CF048]/65"
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
          "text-center text-black tracking-[-0.04em]",
          isNaviance ? "font-black" : "font-normal",
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

function ActiveNavianceCard({
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
        "border-[3px] border-[#9CF048] bg-[linear-gradient(180deg,#fbfff5_0%,#e3ffc9_100%)]",
        "shadow-[0_26px_70px_rgba(156,240,72,0.28),0_0_0_6px_rgba(156,240,72,0.1)]",
        "transition-shadow duration-500 hover:shadow-[0_32px_84px_rgba(35,96,0,0.22),0_0_0_7px_rgba(156,240,72,0.14)]",
        "focus-visible:ring-2 focus-visible:ring-[#9CF048]/40 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,rgba(255,255,255,0.68),rgba(255,255,255,0)_52%,rgba(35,96,0,0.045))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-white/45 blur-[1px]"
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
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[#9CF048]/65"
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

      <h3 className="relative z-10 max-w-[120px] text-[16px] font-black leading-[1.05] tracking-[-0.04em] text-black">
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
        "focus-visible:ring-2 focus-visible:ring-[#9CF048]/40 focus-visible:ring-offset-2",
        item.positionClass ?? "",
        active
          ? "border-[3px] border-[#9CF048] bg-white shadow-[0_24px_60px_rgba(156,240,72,0.28),0_0_0_5px_rgba(156,240,72,0.1)]"
          : "border border-[#d8e2ee] bg-white/82 shadow-[0_14px_34px_rgba(15,23,42,0.065)]",
        "hover:bg-white hover:shadow-[0_24px_58px_rgba(35,96,0,0.14)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(255,255,255,0)_52%,rgba(35,96,0,0.04))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-white/45 blur-[1px]"
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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#9CF048]/65"
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
        style={{ color: active ? darkColor : "#1f2937" }}
      />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none transition-transform duration-500 group-hover:scale-110"
        style={{ color: active ? darkColor : item.color ?? darkColor }}
      >
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-normal leading-[1.05] tracking-[-0.04em] text-black">
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
  const isNaviance = item.id === "cclr-naviance";

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
        "border border-[#d8e2ee] bg-white px-6 py-6",
        "shadow-[0_26px_80px_rgba(15,23,42,0.16)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-[#202833] hover:text-white"
        aria-label="Close detail"
      >
        <FaXmark />
      </button>

      <div className="flex items-start gap-4 pr-10">
        <div
          className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[18px] border border-[#d8e2ee] bg-[#f7fbff]"
          style={{ color: item.color ?? darkColor }}
        >
          <div className="text-[31px] leading-none">{item.icon}</div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[#64748b]">
            {item.label ?? "Connected Capability"}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[#202833]",
              isNaviance ? "font-black" : "font-normal",
            ].join(" ")}
          >
            {item.title}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[#236000]">
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[#475569]">
        {item.description}
      </p>

      <div className="mt-5 h-px w-full bg-[#e2e8f0]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className="mt-5 rounded-full px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-white transition hover:translate-y-[-1px]"
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

  if (selectedId === "cclr-naviance") {
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
          stroke="rgba(255,255,255,0.88)"
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

export default function CCLRNaviance() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/72 blur-[88px]"
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
                onClick={() => setSelectedCard(floatingCards[0])}
                className={[
                  "h-[40px] min-w-[300px] rounded-full px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] shadow-[0_16px_34px_rgba(35,96,0,0.16)]",
                  "transition duration-300 hover:scale-[1.025]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
                style={{
                  color: darkColor,
                  background:
                    "linear-gradient(145deg,#f4ffe9 0%,#dfffbd 100%)",
                }}
              >
                Student Achievement
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[26px] border-[3px] border-[#d8e8c8]/95",
                "bg-white/20 p-[18px]",
                "shadow-[0_28px_80px_rgba(15,23,42,0.09)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_35%,rgba(156,240,72,0.09))]" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard
                  item={centerCards[0]}
                  selected={selectedId === centerCards[0].id}
                  onSelect={() => setSelectedCard(centerCards[0])}
                />

                <ActiveNavianceCard
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
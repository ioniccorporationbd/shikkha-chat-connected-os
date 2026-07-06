"use client";

import { type ReactNode, useState } from "react";
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
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const premiumEase = [0.22, 1, 0.36, 1] as const;

const centerCards: CardItem[] = [
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
    color: "#8b2d10",
    label: "Connected System",
    description:
      "SIS keeps student records, academic information, class data, attendance, and connected workflows in one central place.",
  },
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
    active: true,
    color: "#8b2d10",
    label: "Main Enrollment",
    description:
      "Enrollment helps schools manage student admission, family information, class placement, and the complete student onboarding journey.",
  },
];

const floatingCards: CardItem[] = [
  {
    id: "connected-intelligence",
    title: "Connected Intelligence",
    icon: <MdOutlineHub />,
    floating: true,
    color: "#001b70",
    label: "Connected Add-on",
    description:
      "Connected Intelligence brings school data together so teams can understand enrollment trends, student movement, and operational insights faster.",
  },
  {
    id: "student-information",
    title: "Student Information",
    icon: <MdOutlineSchool />,
    floating: true,
    color: "#006642",
    label: "Parent Section",
    description:
      "Student Information connects enrollment with the wider student profile, making records easier to manage across the school system.",
  },
];

const allCards = [...centerCards, ...floatingCards];

const connectorPaths: Record<string, ConnectorPath> = {
  sis: {
    d: "M500 360 L455 360 Q440 360 440 345 L440 335 Q440 320 425 320 L390 320",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  enrollment: {
    d: "M500 360 L500 360",
    color: "#ff7438",
    glowColor: "rgba(255,116,56,0.16)",
  },
  "connected-intelligence": {
    d: "M500 360 L610 360 Q630 360 630 340 L630 325 Q630 305 650 305 L900 305",
    color: "#001b70",
    glowColor: "rgba(0,27,112,0.13)",
  },
  "student-information": {
    d: "M500 360 L455 360 Q435 360 435 340 L435 270 Q435 250 455 250 L500 250",
    color: "#006642",
    glowColor: "rgba(0,102,66,0.13)",
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

  if (words.length === 1) {
    return title;
  }

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
  const isEnrollment = item.id === "enrollment";

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
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/40 focus-visible:ring-offset-2",
        selected
          ? "border-[3px] border-[#ff7438] bg-[linear-gradient(180deg,#f8fbff_0%,#dcecfb_100%)] shadow-[0_22px_52px_rgba(255,116,56,0.24),0_0_0_5px_rgba(255,116,56,0.08)]"
          : "border border-[#d8e2ee] bg-[linear-gradient(180deg,#f9fcff_0%,#e8f4ff_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        "hover:shadow-[0_24px_58px_rgba(15,23,42,0.13)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.62),rgba(255,255,255,0)_52%,rgba(15,23,42,0.035))]" />

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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#ff7438]/45"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div
          className="relative z-10 mb-[8px] text-[27px] leading-none transition-transform duration-500 group-hover:scale-110"
          style={{ color: item.color ?? "#8b2d10" }}
        >
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center text-black tracking-[-0.04em]",
          isEnrollment ? "font-black" : "font-normal",
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
        "border-[3px] border-[#ff7438] bg-[linear-gradient(180deg,#f8fbff_0%,#dcecfb_100%)]",
        "shadow-[0_26px_70px_rgba(255,116,56,0.24),0_0_0_6px_rgba(255,116,56,0.08)]",
        "transition-shadow duration-500 hover:shadow-[0_32px_84px_rgba(255,116,56,0.3),0_0_0_7px_rgba(255,116,56,0.1)]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/40 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,rgba(255,255,255,0.64),rgba(255,255,255,0)_52%,rgba(15,23,42,0.04))]" />

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
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[#ff7438]/45"
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

      <FaRegStar className="absolute right-[10px] top-[10px] z-10 text-[13px] text-black transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      <div className="relative z-10 mb-4 text-[42px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
        {item.icon}
      </div>

      <h3 className="relative z-10 text-[15px] font-black leading-none tracking-[-0.04em] text-black">
        {item.title}
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
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/40 focus-visible:ring-offset-2",
        item.id === "connected-intelligence"
          ? "right-[3%] top-[31%]"
          : "left-1/2 top-[15%] -translate-x-1/2",
        active
          ? "border-[3px] border-[#ff7438] bg-white shadow-[0_24px_60px_rgba(255,116,56,0.24),0_0_0_5px_rgba(255,116,56,0.08)]"
          : "border border-[#d8e2ee] bg-white/82 shadow-[0_14px_34px_rgba(15,23,42,0.065)]",
        "hover:bg-white hover:shadow-[0_24px_58px_rgba(15,23,42,0.14)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(255,255,255,0)_52%,rgba(15,23,42,0.035))]" />

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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#ff7438]/45"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#1f2937] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none transition-transform duration-500 group-hover:scale-110"
        style={{ color: active ? "#ff7438" : item.color ?? "#001b70" }}
      >
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-normal leading-[1.05] tracking-[-0.04em] text-[#001b70]">
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
  const isEnrollment = item.id === "enrollment";

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
          style={{ color: item.color ?? "#8b2d10" }}
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
              isEnrollment ? "font-black" : "font-normal",
            ].join(" ")}
          >
            {item.title}
          </h3>
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[#475569]">
        {item.description}
      </p>

      <div className="mt-5 h-px w-full bg-[#e2e8f0]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className="mt-5 rounded-full bg-[#202833] px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-white transition hover:translate-y-[-1px] hover:bg-[#0f172a]"
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

  if (selectedId === "enrollment") {
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
            stroke="#ff7438"
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

export default function Enrollment() {
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
        className="pointer-events-none absolute left-[52%] top-[48%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7438]/8 blur-[92px]"
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
                onClick={() => setSelectedCard(floatingCards[1])}
                className={[
                  "h-[40px] min-w-[300px] rounded-full bg-[#ffd09a] px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] text-[#8b2d10]",
                  "shadow-[0_16px_34px_rgba(255,116,56,0.18)]",
                  "transition duration-300 hover:scale-[1.025] hover:bg-[#ffc783]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
              >
                Student Information
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[26px] border-[3px] border-[#cfd8e3]/95",
                "bg-white/20 p-[18px]",
                "shadow-[0_28px_80px_rgba(15,23,42,0.09)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_35%,rgba(0,104,255,0.04))]" />

              <div className="relative z-10 grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard
                  item={centerCards[0]}
                  selected={selectedId === centerCards[0].id}
                  onSelect={() => setSelectedCard(centerCards[0])}
                />

                <ActiveEnrollmentCard
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
"use client";

import { useEffect, useState, type ReactNode } from "react";
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

type ProductCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  orange?: boolean;
  outline?: boolean;
  muted?: boolean;
  color?: string;
  label?: string;
  description?: string;
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const rightImage = "/images/family-engagement-people.png";
const premiumEase = [0.22, 1, 0.36, 1] as const;

const products: ProductCard[] = [
  {
    id: "student-information",
    title: "STUDENT INFORMATION",
    muted: true,
    color: "#8b2d10",
    label: "Student Profile",
    description:
      "Student Information keeps student records, family details, academic data, and connected school workflows organized in one place.",
  },
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
    muted: true,
    color: "#8b2d10",
    label: "Core System",
    description:
      "SIS works as the central student information system where school data, enrollment, attendance, and connected records are managed.",
  },
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
    muted: true,
    color: "#8b2d10",
    label: "Admission Workflow",
    description:
      "Enrollment helps schools manage student admission, onboarding, family information, and class placement smoothly.",
  },
  {
    id: "special-programs",
    title: "Special Programs",
    icon: <FaRegStar />,
    muted: true,
    color: "#8b2d10",
    label: "Student Support",
    description:
      "Special Programs connects support services, intervention workflows, and student program data with the wider school system.",
  },
  {
    id: "family-engagement",
    title: "FAMILY ENGAGEMENT",
    orange: true,
    color: "#ff7438",
    label: "Main Family Area",
    description:
      "Family Engagement connects school, student, and family communication so guardians stay informed and involved in the learning journey.",
  },
  {
    id: "communications",
    title: "Communications",
    subtitle: "School Messenger",
    icon: <MdOutlineHub />,
    outline: true,
    color: "#8b2d10",
    label: "School Communication",
    description:
      "Communications helps schools send connected, accurate, and timely updates to families using student and school data.",
  },
  {
    id: "attendance-support",
    title: "Attendance Support",
    icon: <FaRegCircleQuestion />,
    outline: true,
    color: "#8b2d10",
    label: "Attendance Response",
    description:
      "Attendance Support helps identify attendance patterns and connect schools with families for faster student support.",
  },
];

const connectorPaths: Record<string, ConnectorPath> = {
  "student-information": {
    d: "M500 360 L456 360 Q442 360 442 346 L442 238 Q442 224 428 224 L390 224",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  sis: {
    d: "M500 360 L458 360 Q444 360 444 346 L444 238 Q444 224 430 224 L500 224",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  enrollment: {
    d: "M500 360 L456 360 Q442 360 442 346 L442 330 Q442 316 428 316 L390 316",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  "special-programs": {
    d: "M500 360 L458 360 Q444 360 444 346 L444 330 Q444 316 430 316 L500 316",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  "family-engagement": {
    d: "M500 360 L500 360",
    color: "#ff7438",
    glowColor: "rgba(255,116,56,0.16)",
  },
  communications: {
    d: "M500 360 L458 360 Q444 360 444 374 L444 424 Q444 438 430 438 L500 438",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  "attendance-support": {
    d: "M500 360 L456 360 Q442 360 442 374 L442 424 Q442 438 428 438 L390 438",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
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
      whileTap={{
        scale: 0.94,
      }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        selected || isActive
          ? "border-[3px] border-[#ff7438] bg-[linear-gradient(180deg,#fff8f0_0%,#ffd09a_100%)] shadow-[0_22px_52px_rgba(255,116,56,0.24),0_0_0_5px_rgba(255,116,56,0.08)]"
          : item.outline
            ? "border-[3px] border-[#ff7438] bg-[linear-gradient(180deg,#f8fbff_0%,#e8f4ff_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            : item.muted
              ? "border border-[#d8e2ee] bg-white/62 shadow-[0_12px_30px_rgba(15,23,42,0.055)]"
              : "border border-[#d8e2ee] bg-white/82 shadow-[0_12px_30px_rgba(15,23,42,0.06)]",
        "hover:shadow-[0_24px_58px_rgba(15,23,42,0.13)]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/40 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.64),rgba(255,255,255,0)_52%,rgba(15,23,42,0.035))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-white/42 blur-[1px]"
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

      {selected || isActive ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#ff7438]/45"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div
          className={[
            "relative z-10 mb-[7px] text-[25px] leading-none transition-all duration-500 group-hover:scale-110",
            item.muted ? "text-[#607084]" : "text-[#8b2d10]",
          ].join(" ")}
        >
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center tracking-[-0.035em]",
          isActive ? "font-black text-black" : "font-normal text-[#1f2937]",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.2px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[3px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-[#243241]/90">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
  );
}

function DetailPanel({
  item,
  onClose,
}: {
  item: ProductCard;
  onClose: () => void;
}) {
  const isFamily = item.id === "family-engagement";

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
          <div className="text-[31px] leading-none">
            {item.icon ?? <FaUsers />}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[#64748b]">
            {item.label ?? "Connected Capability"}
          </p>

          <h3
            className={[
              "mt-2 text-[30px] leading-[0.95] tracking-[-0.055em] text-[#202833]",
              isFamily ? "font-black" : "font-normal",
            ].join(" ")}
          >
            {item.title}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[#0068ff]">
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

export default function FamilyEngagement() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<ProductCard | null>(null);
  const [isSeparated, setIsSeparated] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  const selectedId = selectedCard?.id;

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
    <section className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[40%] top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/72 blur-[88px]"
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
        className="pointer-events-none absolute right-[20%] top-[52%] h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-[#ff7438]/8 blur-[92px]"
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

      <div className="relative z-10 h-full w-full">
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
                "absolute left-1/2 top-[-54px] z-20 -translate-x-1/2",
                "h-[38px] min-w-[224px] rounded-full bg-[#d7e1ec]",
                "px-[28px] text-[14px] font-normal leading-[38px] text-black",
                "whitespace-nowrap shadow-[0_14px_34px_rgba(15,23,42,0.1)]",
                "transition hover:bg-[#cfd8e3]",
              ].join(" ")}
            >
              Home Connections

              <span className="absolute left-1/2 top-full h-[21px] w-[3px] -translate-x-1/2 rounded-full bg-[#cfd8e3]" />
            </motion.button>

            <div
              className={[
                "relative h-[430px] w-[224px]",
                "rounded-[26px] border-[3px] border-[#cfd8e3]/95",
                "bg-white/20 p-[8px]",
                "shadow-[0_28px_80px_rgba(15,23,42,0.09)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_35%,rgba(0,104,255,0.04))]" />

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
          <div className="absolute bottom-[24px] left-1/2 h-[42px] w-[220px] -translate-x-1/2 rounded-full bg-[#0f172a]/16 blur-[18px]" />

          <Image
            src={rightImage}
            alt="Family Engagement"
            fill
            priority
            sizes="330px"
            className="object-contain object-bottom drop-shadow-[0_24px_28px_rgba(15,23,42,0.14)]"
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedCard ? (
          <DetailPanel
            item={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
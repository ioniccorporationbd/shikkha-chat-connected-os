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
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlineHub,
} from "react-icons/md";

type CardItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  positionClass?: string;
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

const floatingCards: CardItem[] = [
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
    positionClass: "left-[4%] top-[12%]",
    color: "#8b2d10",
    label: "Connected System",
    description:
      "SIS connects student records, family data, school workflows, and communication information in one central place.",
  },
  {
    id: "consistent-experience",
    title: "Consistent Experience",
    subtitle: "Family Hub",
    icon: <MdOutlineGridView />,
    positionClass: "right-[5%] top-[14%]",
    color: "#001b70",
    label: "Family Experience",
    description:
      "Consistent Experience gives families, students, and staff a connected communication experience across daily school tools.",
  },
  {
    id: "contextual-ai",
    title: "Contextual AI",
    icon: <MdOutlineAutoAwesome />,
    positionClass: "right-[22%] bottom-[8%]",
    color: "#001b70",
    label: "AI Intelligence",
    description:
      "Contextual AI helps schools understand communication data, family needs, and connected student information faster.",
  },
];

const mainCard: CardItem = {
  id: "communications",
  title: "Communications",
  subtitle: "School Messenger",
  icon: <MdOutlineHub />,
  color: "#8b2d10",
  label: "Main Communication Area",
  description:
    "Communications helps schools send accurate, timely, and connected updates to families using trusted student and school data.",
};

const familyCard: CardItem = {
  id: "family-engagement",
  title: "Family Engagement",
  icon: <MdOutlineGridView />,
  color: "#8b2d10",
  label: "Parent Section",
  description:
    "Family Engagement connects communication, attendance, student information, and family support in one connected platform.",
};

const allCards = [mainCard, familyCard, ...floatingCards];

const connectorPaths: Record<string, ConnectorPath> = {
  sis: {
    d: "M500 360 L420 360 Q400 360 400 340 L400 125 Q400 105 380 105 L125 105",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
  },
  "consistent-experience": {
    d: "M500 360 L610 360 Q630 360 630 340 L630 145 Q630 125 650 125 L900 125",
    color: "#001b70",
    glowColor: "rgba(0,27,112,0.13)",
  },
  "contextual-ai": {
    d: "M500 360 L600 360 Q620 360 620 380 L620 640 Q620 660 640 660 L760 660",
    color: "#001b70",
    glowColor: "rgba(0,27,112,0.13)",
  },
  communications: {
    d: "M500 360 L500 360",
    color: "#ff7438",
    glowColor: "rgba(255,116,56,0.16)",
  },
  "family-engagement": {
    d: "M500 360 L500 360 Q500 340 500 320 L500 285",
    color: "#8b2d10",
    glowColor: "rgba(139,45,16,0.14)",
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
              y: -8,
              scale: 1.055,
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
        "transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/40 focus-visible:ring-offset-2",
        active
          ? "border-[3px] border-[#ff7438] bg-white shadow-[0_24px_60px_rgba(255,116,56,0.24),0_0_0_5px_rgba(255,116,56,0.08)]"
          : "border border-[#d8e2ee] bg-white/82 shadow-[0_14px_34px_rgba(15,23,42,0.065)]",
        "hover:bg-white hover:shadow-[0_24px_58px_rgba(15,23,42,0.14)]",
        item.positionClass ?? "",
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

      <div
        className={[
          "relative z-10 flex max-w-[84px] items-center justify-center text-center",
          "font-normal tracking-[-0.04em] text-[#001b70]",
          isSingleWord
            ? "text-[10.5px] leading-none"
            : "text-[9.5px] leading-[1.05]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[2px] max-w-[82px] truncate whitespace-nowrap text-[7px] font-normal leading-none text-[#334155]">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
  );
}

function ActiveCommunicationsCard({
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

      <div className="relative z-10 mb-4 text-[48px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
        {item.icon}
      </div>

      <h3 className="relative z-10 text-[15px] font-black leading-none tracking-[-0.04em] text-black">
        Communications
      </h3>

      <p className="relative z-10 mt-2 text-[11px] font-normal leading-none text-[#243241]">
        School Messenger
      </p>
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
  const isCommunications = item.id === "communications";

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
              isCommunications ? "font-black" : "font-normal",
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

  if (selectedId === "communications") {
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

export default function Communications() {
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
                onClick={() => {
                  setSelectedCard(familyCard);
                  scrollRightSidebarTo("family-engagement");
                }}
                className={[
                  "h-[40px] min-w-[300px] rounded-full bg-[#ffd09a] px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] text-[#8b2d10]",
                  "shadow-[0_16px_34px_rgba(255,116,56,0.18)]",
                  "transition duration-300 hover:scale-[1.025] hover:bg-[#ffc783]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
              >
                Family Engagement
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[230px]",
                "rounded-[26px] border-[3px] border-[#cfd8e3]/95",
                "bg-white/20 p-[18px]",
                "shadow-[0_28px_80px_rgba(15,23,42,0.09)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_35%,rgba(0,104,255,0.04))]" />

              <div className="relative z-10 flex h-full items-center justify-center">
                <ActiveCommunicationsCard
                  item={mainCard}
                  selected={selectedId === mainCard.id}
                  onSelect={() => setSelectedCard(mainCard)}
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
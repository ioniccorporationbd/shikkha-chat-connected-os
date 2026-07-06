"use client";

import { type ReactNode } from "react";
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
import { MdAddCircleOutline, MdOutlineHub } from "react-icons/md";

type ProductCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  orange?: boolean;
};

const products: ProductCard[] = [
  {
    id: "student-information",
    title: "STUDENT INFORMATION",
    orange: true,
  },
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
  },
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
  },
  {
    id: "special-programs",
    title: "Special Programs",
    icon: <FaRegStar />,
  },
  {
    id: "family-engagement",
    title: "FAMILY ENGAGEMENT",
    orange: true,
  },
  {
    id: "communications",
    title: "Communications",
    subtitle: "School Messenger",
    icon: <MdOutlineHub />,
  },
  {
    id: "attendance-support",
    title: "Attendance Support",
    icon: <FaRegCircleQuestion />,
  },
];

const premiumEase = [0.22, 1, 0.36, 1] as const;

const wrapperVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 28,
    rotateX: 8,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: premiumEase,
      staggerChildren: 0.075,
      delayChildren: 0.16,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.84,
    rotateX: 10,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.58,
      ease: premiumEase,
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

function formatCardTitle(title: string) {
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
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,116,56,0.22))]",
        "shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
        className,
      ].join(" ")}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              y: [-10, 10],
              x: [-4, 4],
              opacity: [0.5, 1, 0.5],
            }
      }
      transition={{
        ...floatingTransition,
        delay,
      }}
    />
  );
}

function ProductTile({ item, index }: { item: ProductCard; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isLongTitle = item.title.length > 16;

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      aria-label={`Go to ${item.title}`}
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
      whileTap={{
        scale: 0.94,
      }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[18px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/45 focus-visible:ring-offset-2",
        item.orange
          ? "bg-[linear-gradient(145deg,#ffd6aa_0%,#ffc27a_52%,#fff1df_100%)]"
          : "bg-[linear-gradient(145deg,#ffffff_0%,#f1f8ff_54%,#e5f2ff_100%)]",
        "shadow-[0_12px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.75)]",
        "hover:shadow-[0_24px_58px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.82)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.85),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.45),rgba(255,255,255,0)_48%,rgba(15,23,42,0.04))]" />

      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,116,56,0.52)_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-[0.12]" />

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
                  duration: 0.82,
                  ease: premiumEase,
                },
              }
        }
      />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[25px] leading-none text-[#8b2d10] drop-shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[34px] max-w-[88px] items-center justify-center",
          "text-center font-normal text-black tracking-[-0.035em]",
          "transition-colors duration-500 group-hover:text-[#111827]",
          isSingleWord
            ? "text-[14px] leading-none"
            : isLongTitle
              ? "text-[10.8px] leading-[1.1]"
              : "text-[11.8px] leading-[1.1]",
        ].join(" ")}
      >
        {formatCardTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.6px] font-normal leading-none text-[#243241]/90">
          {item.subtitle}
        </p>
      ) : null}

      <span className="absolute bottom-[7px] left-1/2 z-10 h-[3px] w-0 -translate-x-1/2 rounded-full bg-[#ff7438] transition-all duration-500 group-hover:w-[28px]" />
    </motion.button>
  );
}

export default function HomeConnections() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.62]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-[78px]"
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
        className="pointer-events-none absolute left-[52%] top-[48%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7438]/10 blur-[92px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.13, 1],
                opacity: [0.45, 0.85, 0.45],
              }
        }
        transition={{
          duration: 4.4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <div className="pointer-events-none absolute left-[15%] top-[14%] h-[230px] w-[230px] rounded-full bg-[#7bb7ff]/10 blur-[82px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[18%] h-[270px] w-[270px] rounded-full bg-[#ffd09a]/25 blur-[92px]" />

      <FloatingDot className="left-[25%] top-[18%] h-[13px] w-[13px]" delay={0.1} />
      <FloatingDot className="right-[25%] top-[18%] h-[9px] w-[9px]" delay={0.8} />
      <FloatingDot className="bottom-[23%] left-[24%] h-[10px] w-[10px]" delay={1.2} />
      <FloatingDot className="bottom-[18%] right-[28%] h-[14px] w-[14px]" delay={0.4} />

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <motion.div
          variants={wrapperVariants}
          initial="hidden"
          animate="visible"
          className="relative translate-y-[5px] [transform-style:preserve-3d]"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-white/35 blur-[34px]"
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
            onClick={() => scrollRightSidebarTo("home-connections-panel")}
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
              "h-[38px] min-w-[224px] rounded-full",
              "bg-[linear-gradient(145deg,#ff8a52_0%,#ff7438_55%,#ffb184_100%)]",
              "px-[30px] text-[14px] font-black leading-[38px] text-black",
              "whitespace-nowrap",
              "shadow-[0_18px_40px_rgba(255,116,56,0.32),inset_0_1px_0_rgba(255,255,255,0.45)]",
              "transition-shadow duration-500 hover:shadow-[0_24px_52px_rgba(255,116,56,0.42)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7438]/45 focus-visible:ring-offset-2",
            ].join(" ")}
          >
            Home Connections

            <motion.span
              aria-hidden="true"
              className="absolute left-1/2 top-full h-[21px] w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[#ff7438]"
            >
              <motion.span
                className="absolute left-0 top-0 h-[40%] w-full rounded-full bg-white"
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: ["-120%", "260%"],
                      }
                }
                transition={{
                  duration: 1.75,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            </motion.span>
          </motion.button>

          <div
            className={[
              "relative h-[430px] w-[224px]",
              "rounded-[26px] border-[3px] border-[#ff7438]",
              "bg-white/18 p-[8px]",
              "shadow-[0_28px_80px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.78)]",
              "backdrop-blur-[4px]",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.24),transparent_35%,rgba(255,116,56,0.06))]" />

            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-3px] rounded-[29px] border border-[#ff7438]/35"
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
              {products.map((product, index) => (
                <ProductTile key={product.id} item={product} index={index} />
              ))}

              <div className="h-[96px] w-[96px]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
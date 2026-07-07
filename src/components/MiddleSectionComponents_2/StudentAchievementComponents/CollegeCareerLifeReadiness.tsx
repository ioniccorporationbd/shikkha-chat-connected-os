"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
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
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";

type ProductCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  highlight?: boolean;
};

const rightImage = "/images/student-information-family.png";

const themeColor = "#9CF048";
const darkColor = "#236000";
const glowColor = "rgba(156,240,72,0.22)";

const products: ProductCard[] = [
  {
    id: "student-achievement",
    title: "Student Achievement",
    subtitle: "Unified Progress",
    icon: <MdOutlineAutoAwesome />,
  },
  {
    id: "classroom-solutions",
    title: "Classroom Solutions",
    subtitle: "Teaching Tools",
    icon: <MdOutlineGridView />,
  },
  {
    id: "learning-management-schoology",
    title: "Learning Management",
    subtitle: "Schoology",
    icon: <MdOutlinePsychology />,
  },
  {
    id: "assessment-performance-matters",
    title: "Assessment",
    subtitle: "Performance Matters",
    icon: <MdOutlineAnalytics />,
  },
  {
    id: "curriculum-instruction",
    title: "Curriculum & Instruction",
    subtitle: "Instruction",
    icon: <MdOutlineMenuBook />,
  },
  {
    id: "student-intervention",
    title: "Student Intervention",
    subtitle: "Support Plans",
    icon: <FaRegCircleQuestion />,
  },
  {
    id: "mtss",
    title: "MTSS",
    subtitle: "Multi-Tier Support",
    icon: <MdOutlineHub />,
  },
  {
    id: "behavior-support",
    title: "Behavior Support",
    subtitle: "Wellbeing",
    icon: <MdOutlineFavoriteBorder />,
  },
  {
    id: "college-career-life-readiness",
    title: "College Career Life Readiness",
    subtitle: "Future Ready",
    icon: <FaRegStar />,
    highlight: true,
  },
  {
    id: "cclr-naviance",
    title: "CCLR Naviance",
    subtitle: "Naviance",
    icon: <FaUsers />,
  },
];

const premiumEase = [0.22, 1, 0.36, 1] as const;

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.86,
    rotateX: 10,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: premiumEase,
    },
  },
};

const diagramInnerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 34,
    scale: 0.9,
    rotateX: 8,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: premiumEase,
      staggerChildren: 0.075,
      delayChildren: 0.18,
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

function ProductTile({ item, index }: { item: ProductCard; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "college-career-life-readiness";

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              scale: 1.055,
              rotateX: 2,
              rotateY: index % 2 === 0 ? -2 : 2,
              transition: {
                duration: 0.32,
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
        isActive
          ? "bg-[linear-gradient(145deg,#eaffd3_0%,#9CF048_52%,#f6ffe8_100%)]"
          : "bg-[linear-gradient(145deg,#ffffff_0%,#f8fff1_55%,#efffde_100%)]",
        isActive
          ? "border-[3px] border-[#9CF048]"
          : "border border-[#cfd8e3] bg-white/55",
        isActive
          ? "shadow-[0_22px_50px_rgba(156,240,72,0.32),inset_0_1px_0_rgba(255,255,255,0.76)]"
          : "shadow-[0_12px_30px_rgba(15,23,42,0.055),inset_0_1px_0_rgba(255,255,255,0.75)]",
        "hover:shadow-[0_24px_58px_rgba(35,96,0,0.18),inset_0_1px_0_rgba(255,255,255,0.8)]",
        "focus-visible:ring-2 focus-visible:ring-[#9CF048]/50 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.9),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.48),rgba(255,255,255,0)_48%,rgba(35,96,0,0.05))]" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[65%] top-0 h-full w-[58%] skew-x-[-18deg] bg-white/45 blur-[1px]"
        initial={{ x: "-30%" }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                x: "330%",
                transition: {
                  duration: 0.85,
                  ease: premiumEase,
                },
              }
        }
      />

      {isActive ? (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-[18px] border-[2px] border-[#236000]/35" />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[#9CF048]/55"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.25, 0.78, 0.25],
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{
              duration: 2.2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
        </>
      ) : null}

      <FaRegStar
        className="absolute right-[8px] top-[8px] z-10 text-[12.5px] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110"
        style={{ color: isActive ? darkColor : "#4b6377" }}
      />

      {item.icon ? (
        <div
          className="relative z-10 mb-[7px] text-[25px] leading-none drop-shadow-sm transition-all duration-500 group-hover:scale-115"
          style={{ color: isActive ? darkColor : "#236000" }}
        >
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center font-normal tracking-[-0.035em]",
          "transition-colors duration-500",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.5px] leading-[1.08]",
        ].join(" ")}
        style={{ color: isActive ? "#111827" : "#1f2937" }}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-[#243241]/90">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
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
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(156,240,72,0.24))]",
        "shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
        className,
      ].join(" ")}
      animate={
        shouldReduceMotion
          ? undefined
          : {
              y: [-10, 10],
              x: [-4, 4],
              opacity: [0.55, 1, 0.55],
            }
      }
      transition={{
        ...floatingTransition,
        delay,
      }}
    />
  );
}

export default function CollegeCareerLifeReadiness() {
  const shouldReduceMotion = useReducedMotion();
  const [isSeparated, setIsSeparated] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  useEffect(() => {
    const separateTimer = window.setTimeout(() => {
      setIsSeparated(true);
    }, 720);

    const jumpTimer = window.setTimeout(() => {
      setImageSettled(true);
    }, 1680);

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
        className="pointer-events-none absolute left-[38%] top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-[78px]"
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
        className="pointer-events-none absolute right-[17%] top-[52%] h-[330px] w-[330px] -translate-y-1/2 rounded-full blur-[95px]"
        style={{ background: glowColor }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.12, 1],
                opacity: [0.45, 0.85, 0.45],
              }
        }
        transition={{
          duration: 4.6,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <div className="pointer-events-none absolute left-[8%] top-[12%] h-[250px] w-[250px] rounded-full bg-[#9CF048]/10 blur-[85px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[24%] h-[260px] w-[260px] rounded-full bg-[#9CF048]/25 blur-[92px]" />

      <FloatingDot className="left-[21%] top-[18%] h-[13px] w-[13px]" delay={0.1} />
      <FloatingDot className="left-[64%] top-[15%] h-[9px] w-[9px]" delay={0.8} />
      <FloatingDot className="bottom-[22%] left-[16%] h-[10px] w-[10px]" delay={1.2} />
      <FloatingDot className="bottom-[16%] right-[18%] h-[14px] w-[14px]" delay={0.4} />

      <div className="relative z-10 h-full w-full">
        <motion.div
          initial={{
            x: "-50%",
            y: "-50%",
            scale: 1,
          }}
          animate={{
            x: isSeparated ? "calc(-50% - 200px)" : "-50%",
            y: "-50%",
            scale: isSeparated ? 0.985 : 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 1.08,
            ease: premiumEase,
          }}
          className="absolute left-1/2 top-1/2 z-20"
        >
          <motion.div
            variants={diagramInnerVariants}
            initial="hidden"
            animate="visible"
            className="relative shrink-0"
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
              onClick={() => scrollRightSidebarTo("student-achievement")}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.035,
                    }
              }
              whileTap={{ scale: 0.96 }}
              className={[
                "absolute left-1/2 top-[-54px] z-20 -translate-x-1/2",
                "h-[38px] min-w-[218px] rounded-full",
                "bg-[linear-gradient(145deg,#f4ffe9_0%,#dfffbd_100%)]",
                "px-[24px] text-[13px] font-black leading-[38px]",
                "whitespace-nowrap shadow-[0_16px_34px_rgba(35,96,0,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]",
                "transition-shadow duration-500 hover:shadow-[0_22px_44px_rgba(35,96,0,0.16)]",
              ].join(" ")}
              style={{ color: darkColor }}
            >
              Student Achievement

              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-full h-[22px] w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[#d8e8c8]"
              >
                <motion.span
                  className="absolute left-0 top-0 h-[40%] w-full rounded-full"
                  style={{ background: themeColor }}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: ["-120%", "260%"],
                        }
                  }
                  transition={{
                    duration: 1.8,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </motion.span>
            </motion.button>

            <div
              className={[
                "relative h-[536px] w-[224px]",
                "rounded-[26px] border-[3px] border-[#d8e8c8]/90",
                "bg-white/24 p-[8px]",
                "shadow-[0_28px_80px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.78)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0 rounded-[23px] bg-[linear-gradient(150deg,rgba(255,255,255,0.48),transparent_48%,rgba(156,240,72,0.075))]" />

              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[-3px] rounded-[29px] border border-white/70"
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
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            x: "-50%",
            y: "-50%",
            scale: 0.7,
            rotate: -2,
            filter: "blur(16px)",
          }}
          animate={{
            opacity: isSeparated ? 1 : 0,
            x: isSeparated ? "calc(-50% + 220px)" : "-50%",
            y: imageSettled
              ? ["-50%", "calc(-50% - 20px)", "calc(-50% + 8px)", "-50%"]
              : "-50%",
            scale: imageSettled ? [1, 1.065, 0.982, 1] : isSeparated ? 1 : 0.7,
            rotate: imageSettled ? [0, 1.4, -0.8, 0] : isSeparated ? 0 : -2,
            filter: isSeparated ? "blur(0px)" : "blur(16px)",
          }}
          transition={{
            opacity: {
              duration: shouldReduceMotion ? 0 : 0.36,
              ease: "easeOut",
            },
            x: {
              duration: shouldReduceMotion ? 0 : 1.1,
              ease: premiumEase,
            },
            y: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.86,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.1,
                  ease: premiumEase,
                },
            scale: imageSettled
              ? {
                  duration: shouldReduceMotion ? 0 : 0.86,
                  ease: premiumEase,
                }
              : {
                  duration: shouldReduceMotion ? 0 : 1.1,
                  ease: premiumEase,
                },
            rotate: {
              duration: shouldReduceMotion ? 0 : 0.86,
              ease: premiumEase,
            },
            filter: {
              duration: shouldReduceMotion ? 0 : 0.68,
              ease: premiumEase,
            },
          }}
          className="absolute left-1/2 top-1/2 z-10 hidden h-[430px] w-[310px] shrink-0 md:block"
        >
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[24px] left-1/2 h-[42px] w-[210px] -translate-x-1/2 rounded-full bg-[#0f172a]/18 blur-[18px]"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: imageSettled ? [1, 0.92, 1] : 1,
                    opacity: imageSettled ? [0.55, 0.34, 0.55] : 0.45,
                  }
            }
            transition={{
              duration: 2.8,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />

          <motion.div
            className="relative h-full w-full"
            animate={
              shouldReduceMotion || !imageSettled
                ? undefined
                : {
                    y: [-4, 5, -4],
                  }
            }
            transition={{
              duration: 4.2,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <Image
              src={rightImage}
              alt="College Career Life Readiness"
              fill
              priority
              sizes="310px"
              className="object-contain object-bottom drop-shadow-[0_28px_34px_rgba(15,23,42,0.18)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
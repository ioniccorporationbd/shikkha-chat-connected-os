"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  ghost?: boolean;
};

const rightImage = "/images/student-information-family.png";

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionText = {
  bn: {
    title: "শিক্ষার্থীর তথ্য",
    imageAlt: "শিক্ষার্থী তথ্য",
    goTo: "সেকশনে যান",
    cards: {
      "student-information": {
        title: "শিক্ষার্থী তথ্য",
        subtitle: "প্রোফাইল",
      },
      sis: {
        title: "এসআইএস",
        subtitle: "কোর সিস্টেম",
      },
      enrollment: {
        title: "ভর্তি",
        subtitle: "অ্যাডমিশন",
      },
      "special-programs": {
        title: "বিশেষ প্রোগ্রাম",
        subtitle: "সহায়তা",
      },
      "family-engagement": {
        title: "পরিবার সম্পৃক্ততা",
        subtitle: "অভিভাবক",
      },
      communications: {
        title: "যোগাযোগ",
        subtitle: "স্কুল মেসেঞ্জার",
      },
      "attendance-support": {
        title: "উপস্থিতি সহায়তা",
        subtitle: "রেসপন্স",
      },
    },
  },
  en: {
    title: "Studet Information",
    imageAlt: "Student Information",
    goTo: "Go to section",
    cards: {
      "student-information": {
        title: "Student Information",
        subtitle: "Profile",
      },
      sis: {
        title: "SIS",
        subtitle: "Core System",
      },
      enrollment: {
        title: "Enrollment",
        subtitle: "Admission",
      },
      "special-programs": {
        title: "Special Programs",
        subtitle: "Support",
      },
      "family-engagement": {
        title: "Family Engagement",
        subtitle: "Family",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
      },
      "attendance-support": {
        title: "Attendance Support",
        subtitle: "Response",
      },
    },
  },
} as const;

const productBase = [
  {
    id: "student-information" as const,
    featured: true,
  },
  {
    id: "sis" as const,
    icon: <FaUsers />,
    outline: true,
  },
  {
    id: "enrollment" as const,
    icon: <MdAddCircleOutline />,
    outline: true,
  },
  {
    id: "special-programs" as const,
    icon: <FaRegStar />,
    outline: true,
  },
  {
    id: "family-engagement" as const,
    ghost: true,
  },
  {
    id: "communications" as const,
    icon: <MdOutlineHub />,
    ghost: true,
  },
  {
    id: "attendance-support" as const,
    icon: <FaRegCircleQuestion />,
    ghost: true,
  },
];

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

function ProductTile({
  item,
  index,
  goToText,
}: {
  item: ProductCard;
  index: number;
  goToText: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "student-information";

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      aria-label={`${goToText}: ${item.title}`}
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
        "transition-[box-shadow,border-color,background-color,transform] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] focus-visible:ring-offset-2",
        isActive || item.featured
          ? "border-[3px] border-[var(--sc-primary)] bg-[var(--sc-primary)] text-[var(--sc-white)] shadow-[0_22px_55px_color-mix(in_srgb,var(--sc-primary)_24%,transparent)]"
          : item.outline
            ? "border-[3px] border-[var(--sc-primary)] bg-[var(--sc-white)] text-[var(--sc-primary)] shadow-[0_16px_42px_color-mix(in_srgb,var(--sc-primary)_13%,transparent)]"
            : item.ghost
              ? "border border-[var(--sc-primary)] bg-[var(--sc-secondary-light)] text-[var(--sc-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--sc-primary)_10%,transparent)]"
              : "border border-[var(--sc-primary)] bg-[var(--sc-white)] text-[var(--sc-primary)] shadow-[0_14px_34px_color-mix(in_srgb,var(--sc-primary)_10%,transparent)]",
        "hover:-translate-y-1 hover:border-[var(--sc-primary)] hover:bg-[var(--sc-secondary)] hover:text-[var(--sc-primary)] hover:shadow-[0_26px_64px_color-mix(in_srgb,var(--sc-primary)_20%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--sc-white),transparent_52%,var(--sc-secondary-light))] opacity-45" />

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[65%] top-0 h-full w-[58%] skew-x-[-18deg] bg-[var(--sc-white)] opacity-45 blur-[1px]"
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
          <span className="pointer-events-none absolute inset-0 rounded-[18px] border-[2px] border-[var(--sc-secondary)] opacity-55" />

          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--sc-secondary)]"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [0.25, 0.75, 0.25],
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-current opacity-80 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />

      {item.icon ? (
        <div className="relative z-10 mb-[7px] text-[25px] leading-none text-current drop-shadow-sm transition-all duration-500 group-hover:scale-[1.15]">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center font-semibold tracking-[-0.035em] text-current",
          "transition-colors duration-500",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.5px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-current opacity-75">
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
        "bg-[var(--sc-secondary-light)] shadow-[0_12px_30px_color-mix(in_srgb,var(--sc-primary)_10%,transparent)]",
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

function MobileTabletView({
  products,
  goToText,
}: {
  products: ProductCard[];
  goToText: string;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-[660px] w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border-[3px] border-[var(--sc-primary)] bg-[var(--sc-white)]/90 p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--sc-primary)_14%,transparent)] backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const active = product.id === "student-information";

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => scrollRightSidebarTo(product.id)}
                aria-label={`${goToText}: ${product.title}`}
                className={[
                  "group rounded-[22px] border p-4 text-left transition duration-300",
                  active || product.featured
                    ? "border-[var(--sc-primary)] bg-[var(--sc-primary)] text-[var(--sc-white)] shadow-[0_18px_44px_color-mix(in_srgb,var(--sc-primary)_18%,transparent)]"
                    : "border-[var(--sc-primary)] bg-[var(--sc-white)] text-[var(--sc-primary)] hover:bg-[var(--sc-secondary)]",
                  "hover:-translate-y-1 hover:shadow-[0_24px_54px_color-mix(in_srgb,var(--sc-primary)_18%,transparent)]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[22px]",
                      active || product.featured
                        ? "bg-[var(--sc-secondary)] text-[var(--sc-primary)]"
                        : "bg-[var(--sc-primary)] text-[var(--sc-white)]",
                    ].join(" ")}
                  >
                    {product.icon ?? <FaUsers />}
                  </div>

                  <div>
                    <h3 className="text-[18px] font-semibold leading-[1.08] tracking-[-0.045em] text-current">
                      {product.title}
                    </h3>

                    {product.subtitle ? (
                      <p className="mt-1 text-[12px] font-normal text-current opacity-75">
                        {product.subtitle}
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

export default function StudentInformation() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [isSeparated, setIsSeparated] = useState(false);
  const [imageSettled, setImageSettled] = useState(false);

  const products = useMemo<ProductCard[]>(() => {
    return productBase.map((product) => ({
      ...product,
      title: text.cards[product.id].title,
      subtitle: text.cards[product.id].subtitle,
    }));
  }, [text]);

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
    <section className="relative h-full min-h-[660px] w-full overflow-hidden bg-[var(--sc-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--sc-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[38%] top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sc-white)] opacity-75 blur-[78px]"
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
        className="pointer-events-none absolute right-[17%] top-[52%] h-[330px] w-[330px] -translate-y-1/2 rounded-full bg-[var(--sc-secondary)] blur-[95px]"
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

      <div className="pointer-events-none absolute left-[8%] top-[12%] h-[250px] w-[250px] rounded-full bg-[var(--sc-secondary-light)] blur-[85px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[24%] h-[260px] w-[260px] rounded-full bg-[var(--sc-secondary)] blur-[92px]" />

      <FloatingDot className="left-[21%] top-[18%] h-[13px] w-[13px]" delay={0.1} />
      <FloatingDot className="left-[64%] top-[15%] h-[9px] w-[9px]" delay={0.8} />
      <FloatingDot className="bottom-[22%] left-[16%] h-[10px] w-[10px]" delay={1.2} />
      <FloatingDot className="bottom-[16%] right-[18%] h-[14px] w-[14px]" delay={0.4} />

      <MobileTabletView products={products} goToText={text.goTo} />

      <div className="relative z-10 hidden h-full w-full lg:block">
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
              className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-[var(--sc-white)] opacity-35 blur-[34px]"
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
              whileTap={{ scale: 0.96 }}
              className={[
                "absolute left-1/2 top-[-56px] z-20 -translate-x-1/2",
                "h-[42px] min-w-[220px] rounded-full",
                "border-[3px] border-[var(--sc-primary)] bg-[var(--sc-primary)]",
                "px-[28px] text-[14px] font-semibold leading-[36px] text-[var(--sc-white)]",
                "whitespace-nowrap shadow-[0_20px_54px_color-mix(in_srgb,var(--sc-primary)_24%,transparent)]",
                "transition-all duration-500 hover:-translate-y-1 hover:bg-[var(--sc-secondary)] hover:text-[var(--sc-primary)] hover:shadow-[0_28px_70px_color-mix(in_srgb,var(--sc-primary)_22%,transparent)]",
              ].join(" ")}
            >
              {text.title}

              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-full h-[22px] w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[var(--sc-primary)]"
              >
                <motion.span
                  className="absolute left-0 top-0 h-[40%] w-full rounded-full bg-[var(--sc-secondary)]"
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
                "relative h-[430px] w-[224px]",
                "rounded-[26px] border-[3px] border-[var(--sc-primary)]",
                "bg-[var(--sc-white)]/24 p-[8px]",
                "shadow-[0_30px_90px_color-mix(in_srgb,var(--sc-primary)_16%,transparent)] backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-0 rounded-[23px] bg-[linear-gradient(150deg,var(--sc-white),transparent_48%,var(--sc-secondary-light))] opacity-45" />

              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[-3px] rounded-[29px] border border-[var(--sc-primary)] opacity-70"
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
                  <ProductTile
                    key={product.id}
                    item={product}
                    index={index}
                    goToText={text.goTo}
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
            scale: imageSettled
              ? [1, 1.065, 0.982, 1]
              : isSeparated
                ? 1
                : 0.7,
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
            className="absolute bottom-[24px] left-1/2 h-[42px] w-[210px] -translate-x-1/2 rounded-full bg-[var(--sc-primary)] opacity-20 blur-[18px]"
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
              alt={text.imageAlt}
              fill
              priority
              sizes="310px"
              className="object-contain object-bottom"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { useMemo, type ReactNode } from "react";
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
};

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionText = {
  bn: {
    title: "হোম কানেকশন",
    goTo: "সেকশনে যান",
    cards: {
      "student-information": {
        title: "শিক্ষার্থীর তথ্য",
        subtitle: "শিক্ষার্থী প্রোফাইল",
      },
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        subtitle: "মূল ব্যবস্থাপনা",
      },
      enrollment: {
        title: "ভর্তি ব্যবস্থাপনা",
        subtitle: "ভর্তি প্রক্রিয়া",
      },
      "special-programs": {
        title: "বিশেষ কার্যক্রম",
        subtitle: "সহায়তা কার্যক্রম",
      },
      "family-engagement": {
        title: "পরিবারের সম্পৃক্ততা",
        subtitle: "প্রধান এলাকা",
      },
      communications: {
        title: "যোগাযোগ ব্যবস্থা",
        subtitle: "স্কুল বার্তা",
      },
      "attendance-support": {
        title: "উপস্থিতি সহায়তা",
        subtitle: "দ্রুত সাড়া",
      },
    },
  },
  en: {
    title: "Home Connections",
    goTo: "Go to section",
    cards: {
      "student-information": {
        title: "Student Information",
        subtitle: "Student Profile",
      },
      sis: {
        title: "Student Information System",
        subtitle: "Core Management",
      },
      enrollment: {
        title: "Enrollment Management",
        subtitle: "Admission Process",
      },
      "special-programs": {
        title: "Special Programs",
        subtitle: "Support Programs",
      },
      "family-engagement": {
        title: "Family Engagement",
        subtitle: "Main Area",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
      },
      "attendance-support": {
        title: "Attendance Support",
        subtitle: "Quick Response",
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
  },
  {
    id: "enrollment" as const,
    icon: <MdAddCircleOutline />,
  },
  {
    id: "special-programs" as const,
    icon: <FaRegStar />,
  },
  {
    id: "family-engagement" as const,
    featured: true,
  },
  {
    id: "communications" as const,
    icon: <MdOutlineHub />,
  },
  {
    id: "attendance-support" as const,
    icon: <FaRegCircleQuestion />,
  },
];

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
        "bg-[var(--color-secondary-light)] shadow-[0_14px_32px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]",
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
  const isLongTitle = item.title.length > 16;

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
        "border transition-[box-shadow,border-color,background-color] duration-500",
        "will-change-transform [transform-style:preserve-3d]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        item.featured
          ? "border-[var(--color-primary)] bg-[var(--color-secondary-light)]"
          : "border-[var(--color-border-soft)] bg-[var(--color-white)]",
        "shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] hover:border-[var(--color-primary)] hover:bg-[var(--color-secondary)] hover:shadow-[0_24px_60px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,var(--color-white),transparent_52%,var(--color-secondary-light))] opacity-60" />

      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-[0.08]" />

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
                  duration: 0.82,
                  ease: premiumEase,
                },
              }
        }
      />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[var(--color-primary)] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[25px] leading-none text-[var(--color-primary)] drop-shadow-sm transition-all duration-500 group-hover:scale-110">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[34px] max-w-[88px] items-center justify-center",
          "text-center font-semibold tracking-[-0.035em] text-[var(--color-primary)]",
          "transition-colors duration-500",
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
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.6px] font-medium leading-none text-[var(--color-text-gray)]">
          {item.subtitle}
        </p>
      ) : null}

      <span className="absolute bottom-[7px] left-1/2 z-10 h-[3px] w-0 -translate-x-1/2 rounded-full bg-[var(--color-primary)] transition-all duration-500 group-hover:w-[28px]" />
    </motion.button>
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
      <div className="rounded-[30px] border border-[var(--color-border-soft)] bg-[var(--color-white)] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => scrollRightSidebarTo(product.id)}
              aria-label={`${goToText}: ${product.title}`}
              className={[
                "group rounded-[22px] border p-4 text-left transition duration-300",
                product.featured
                  ? "border-[var(--color-primary)] bg-[var(--color-secondary-light)]"
                  : "border-[var(--color-border-soft)] bg-[var(--color-white)] hover:bg-[var(--color-secondary-light)]",
                "hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_18px_44px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[22px] text-[var(--color-text-inverse)]">
                  {product.icon ?? <FaUsers />}
                </div>

                <div>
                  <h3 className="text-[18px] font-bold leading-[1.08] tracking-[-0.045em] text-[var(--color-primary)]">
                    {product.title}
                  </h3>

                  {product.subtitle ? (
                    <p className="mt-1 text-[12px] font-medium text-[var(--color-text-gray)]">
                      {product.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeConnections() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];
  const shouldReduceMotion = useReducedMotion();

  const products = useMemo<ProductCard[]>(() => {
    return productBase.map((product) => ({
      ...product,
      title: text.cards[product.id].title,
      subtitle: text.cards[product.id].subtitle,
    }));
  }, [text]);

  return (
    <div className="relative h-full min-h-[660px] w-full overflow-hidden bg-[var(--color-white)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-border-soft)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-white)] opacity-75 blur-[78px]"
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
        className="pointer-events-none absolute left-[52%] top-[48%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-secondary)] blur-[92px]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.13, 1],
                opacity: [0.24, 0.52, 0.24],
              }
        }
        transition={{
          duration: 4.4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <div className="pointer-events-none absolute left-[15%] top-[14%] h-[230px] w-[230px] rounded-full bg-[var(--color-secondary-light)] blur-[82px]" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[18%] h-[270px] w-[270px] rounded-full bg-[var(--color-secondary)] blur-[92px]" />

      <FloatingDot className="left-[25%] top-[18%] h-[13px] w-[13px]" delay={0.1} />
      <FloatingDot className="right-[25%] top-[18%] h-[9px] w-[9px]" delay={0.8} />
      <FloatingDot className="bottom-[23%] left-[24%] h-[10px] w-[10px]" delay={1.2} />
      <FloatingDot className="bottom-[18%] right-[28%] h-[14px] w-[14px]" delay={0.4} />

      <MobileTabletView products={products} goToText={text.goTo} />

      <div className="relative z-10 hidden h-full w-full items-center justify-center lg:flex">
        <motion.div
          variants={wrapperVariants}
          initial="hidden"
          animate="visible"
          className="relative translate-y-[5px] [transform-style:preserve-3d]"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[42px] bg-[var(--color-white)] opacity-35 blur-[34px]"
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
              "bg-[var(--color-primary)]",
              "px-[30px] text-[14px] font-bold leading-[38px] text-[var(--color-text-inverse)]",
              "whitespace-nowrap shadow-[0_18px_44px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] transition-shadow duration-500 hover:bg-[var(--color-primary)] hover:shadow-[0_24px_64px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
            ].join(" ")}
          >
            {text.title}

            <motion.span
              aria-hidden="true"
              className="absolute left-1/2 top-full h-[21px] w-[3px] -translate-x-1/2 overflow-hidden rounded-full bg-[var(--color-primary)]"
            >
              <motion.span
                className="absolute left-0 top-0 h-[40%] w-full rounded-full bg-[var(--color-white)]"
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
              "rounded-[26px] border-[3px] border-[var(--color-primary)]",
              "bg-[var(--color-white)] p-[8px]",
              "shadow-[0_24px_70px_color-mix(in_srgb,var(--color-primary)_16%,transparent)] backdrop-blur-[4px]",
            ].join(" ")}
          >
            <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,var(--color-white),transparent_35%,var(--color-secondary-light))] opacity-30" />

            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-3px] rounded-[29px] border border-[var(--color-primary)]"
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
      </div>
    </div>
  );
}
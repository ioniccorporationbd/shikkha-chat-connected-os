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
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlineHub,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

type CardId =
  | "sis"
  | "consistent-experience"
  | "contextual-ai"
  | "communications"
  | "family-engagement";

type CardItem = {
  id: CardId;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  positionClass?: string;
  label?: string;
  description?: string;
};

type ConnectorPath = {
  d: string;
  color: string;
  glowColor: string;
};

const premiumEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionText = {
  bn: {
    openSection: "সেকশন খুলুন",
    closeDetail: "ডিটেইল বন্ধ করুন",
    tapHint: "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",
    cards: {
      sis: {
        title: "এসআইএস",
        subtitle: "এসআইএস",
        label: "সংযুক্ত সিস্টেম",
        description:
          "এসআইএস শিক্ষার্থীর রেকর্ড, পরিবারের তথ্য, স্কুলের কাজের ধারা এবং যোগাযোগের তথ্যকে একটি কেন্দ্রীয় জায়গায় যুক্ত করে।",
      },
      "consistent-experience": {
        title: "একই অভিজ্ঞতা",
        subtitle: "ফ্যামিলি হাব",
        label: "পরিবারের অভিজ্ঞতা",
        description:
          "একই অভিজ্ঞতা পরিবার, শিক্ষার্থী এবং স্টাফকে প্রতিদিনের স্কুল টুলের মধ্যে একটি সংযুক্ত যোগাযোগ অভিজ্ঞতা দেয়।",
      },
      "contextual-ai": {
        title: "কনটেক্সচুয়াল এআই",
        subtitle: "এআই ইন্টেলিজেন্স",
        label: "এআই ইন্টেলিজেন্স",
        description:
          "কনটেক্সচুয়াল এআই স্কুলকে যোগাযোগের ডেটা, পরিবারের প্রয়োজন এবং শিক্ষার্থীর সংযুক্ত তথ্য দ্রুত বুঝতে সাহায্য করে।",
      },
      communications: {
        title: "যোগাযোগ",
        subtitle: "স্কুল মেসেঞ্জার",
        label: "প্রধান যোগাযোগ এলাকা",
        description:
          "যোগাযোগ ফিচার স্কুলকে নির্ভরযোগ্য শিক্ষার্থী ও স্কুল ডেটা ব্যবহার করে পরিবারকে সঠিক, সময়মতো এবং সংযুক্ত আপডেট পাঠাতে সাহায্য করে।",
      },
      "family-engagement": {
        title: "পরিবার সম্পৃক্ততা",
        subtitle: "অভিভাবক সেকশন",
        label: "অভিভাবক সেকশন",
        description:
          "পরিবার সম্পৃক্ততা যোগাযোগ, উপস্থিতি, শিক্ষার্থী তথ্য এবং পরিবারের সহায়তাকে একটি সংযুক্ত প্ল্যাটফর্মে নিয়ে আসে।",
      },
    },
  },
  en: {
    openSection: "Open Section",
    closeDetail: "Close detail",
    tapHint: "Click any card to view details",
    cards: {
      sis: {
        title: "SIS",
        subtitle: "SIS",
        label: "Connected System",
        description:
          "SIS connects student records, family data, school workflows, and communication information in one central place.",
      },
      "consistent-experience": {
        title: "Consistent Experience",
        subtitle: "Family Hub",
        label: "Family Experience",
        description:
          "Consistent Experience gives families, students, and staff a connected communication experience across daily school tools.",
      },
      "contextual-ai": {
        title: "Contextual AI",
        subtitle: "AI Intelligence",
        label: "AI Intelligence",
        description:
          "Contextual AI helps schools understand communication data, family needs, and connected student information faster.",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
        label: "Main Communication Area",
        description:
          "Communications helps schools send accurate, timely, and connected updates to families using trusted student and school data.",
      },
      "family-engagement": {
        title: "Family Engagement",
        subtitle: "Parent Section",
        label: "Parent Section",
        description:
          "Family Engagement connects communication, attendance, student information, and family support in one connected platform.",
      },
    },
  },
} as const;

const floatingCardBase = [
  {
    id: "sis" as const,
    icon: <FaUsers />,
    positionClass: "left-[4%] top-[12%]",
  },
  {
    id: "consistent-experience" as const,
    icon: <MdOutlineGridView />,
    positionClass: "right-[5%] top-[14%]",
  },
  {
    id: "contextual-ai" as const,
    icon: <MdOutlineAutoAwesome />,
    positionClass: "right-[22%] bottom-[8%]",
  },
];

const connectorPaths: Record<CardId, ConnectorPath> = {
  sis: {
    d: "M500 360 L420 360 Q400 360 400 340 L400 125 Q400 105 380 105 L125 105",
    color: "var(--sc-primary)",
    glowColor: "rgba(22,66,60,0.14)",
  },
  "consistent-experience": {
    d: "M500 360 L610 360 Q630 360 630 340 L630 145 Q630 125 650 125 L900 125",
    color: "var(--sc-primary)",
    glowColor: "rgba(22,66,60,0.14)",
  },
  "contextual-ai": {
    d: "M500 360 L600 360 Q620 360 620 380 L620 640 Q620 660 640 660 L760 660",
    color: "var(--sc-primary)",
    glowColor: "rgba(22,66,60,0.14)",
  },
  communications: {
    d: "M500 360 L500 360",
    color: "var(--sc-primary)",
    glowColor: "rgba(22,66,60,0.16)",
  },
  "family-engagement": {
    d: "M500 360 L500 360 Q500 340 500 320 L500 285",
    color: "var(--sc-primary)",
    glowColor: "rgba(22,66,60,0.14)",
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
        "focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] focus-visible:ring-offset-2",
        active
          ? "border-[3px] border-[var(--sc-primary)] bg-white shadow-[0_24px_60px_rgba(22,66,60,0.22),0_0_0_5px_rgba(22,66,60,0.08)]"
          : "border border-[var(--sc-border)] bg-white/84 shadow-[0_14px_34px_rgba(22,66,60,0.08)]",
        "hover:bg-white hover:shadow-[0_24px_58px_rgba(22,66,60,0.14)]",
        item.positionClass ?? "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[18px] bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(255,255,255,0)_52%,rgba(22,66,60,0.04))]" />

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
          className="pointer-events-none absolute inset-[-2px] rounded-[20px] border border-[var(--sc-primary)]"
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

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[var(--sc-primary)] transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-[7px] text-[26px] leading-none text-[var(--sc-primary)] transition-transform duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <div
        className={[
          "relative z-10 flex max-w-[84px] items-center justify-center text-center",
          "font-normal tracking-[-0.04em] text-[var(--sc-primary)]",
          isSingleWord
            ? "text-[10.5px] leading-none"
            : "text-[9.5px] leading-[1.05]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>

      {item.subtitle ? (
        <p className="relative z-10 mt-[2px] max-w-[82px] truncate whitespace-nowrap text-[7px] font-normal leading-none text-[var(--sc-muted)]">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
  );
}

function ActiveCommunicationsCard({
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
        "group relative h-[158px] w-[158px] overflow-hidden rounded-[22px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "border-[3px] border-[var(--sc-primary)] bg-[linear-gradient(180deg,#ffffff_0%,var(--sc-secondary-light)_100%)]",
        "shadow-[0_26px_70px_rgba(22,66,60,0.22),0_0_0_6px_rgba(22,66,60,0.08)]",
        "transition-shadow duration-500 hover:shadow-[0_32px_84px_rgba(22,66,60,0.26),0_0_0_7px_rgba(22,66,60,0.10)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(145deg,rgba(255,255,255,0.64),rgba(255,255,255,0)_52%,rgba(22,66,60,0.04))]" />

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
        className="pointer-events-none absolute inset-[-2px] rounded-[24px] border border-[var(--sc-primary)]"
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

      <FaRegStar className="absolute right-[10px] top-[10px] z-10 text-[13px] text-[var(--sc-primary)] transition-all duration-500 group-hover:rotate-12" />

      <div className="relative z-10 mb-4 text-[48px] leading-none text-[var(--sc-primary)] transition-all duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <h3 className="relative z-10 max-w-[132px] text-[15px] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--sc-primary)]">
        {item.title}
      </h3>

      {item.subtitle ? (
        <p className="relative z-10 mt-2 text-[11px] font-normal leading-none text-[var(--sc-muted)]">
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
        "border border-[var(--sc-border)] bg-white px-6 py-6",
        "shadow-[0_26px_80px_rgba(22,66,60,0.16)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-[var(--sc-border)] bg-white text-[var(--sc-muted)] transition hover:bg-[var(--sc-primary)] hover:text-white"
        aria-label={closeText}
      >
        <FaXmark />
      </button>

      <div className="flex items-start gap-4 pr-10">
        <div className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[18px] border border-[var(--sc-border)] bg-[var(--sc-secondary-light)] text-[var(--sc-primary)]">
          <div className="text-[31px] leading-none">{item.icon}</div>
        </div>

        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--sc-muted)]">
            {item.label}
          </p>

          <h3 className="mt-2 text-[30px] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--sc-primary)]">
            {item.title}
          </h3>

          {item.subtitle ? (
            <p className="mt-2 text-[13px] font-normal tracking-[-0.01em] text-[var(--sc-primary)]">
              {item.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-5 text-[15.5px] font-normal leading-7 tracking-[-0.01em] text-[var(--sc-muted)]">
        {item.description}
      </p>

      <div className="mt-5 h-px w-full bg-[var(--sc-border)]" />

      <button
        type="button"
        onClick={() => scrollRightSidebarTo(item.id)}
        className="mt-5 rounded-full bg-[var(--sc-primary)] px-5 py-3 text-[12px] font-normal uppercase tracking-[0.08em] text-white transition hover:translate-y-[-1px] hover:bg-[var(--sc-primary-dark)]"
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
            stroke="var(--sc-primary)"
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
          stroke="white"
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
    <div className="relative z-10 mx-auto flex min-h-[640px] w-full max-w-3xl flex-col justify-center px-5 py-10 md:px-8 lg:hidden">
      <div className="rounded-[30px] border border-[var(--sc-border)] bg-white/86 p-5 shadow-[0_24px_70px_rgba(22,66,60,0.12)] backdrop-blur-xl">
        <p className="mb-5 text-center text-[13px] font-normal tracking-[-0.02em] text-[var(--sc-muted)]">
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
                    ? "border-[var(--sc-primary)] bg-[var(--sc-secondary-light)] shadow-[0_18px_40px_rgba(22,66,60,0.14)]"
                    : "border-[var(--sc-border)] bg-white hover:-translate-y-1 hover:bg-[var(--sc-secondary-light)]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--sc-primary)] text-[22px] text-white">
                    {card.icon}
                  </div>

                  <div>
                    <p className="text-[11px] font-normal uppercase tracking-[0.12em] text-[var(--sc-muted)]">
                      {card.label}
                    </p>

                    <h3 className="mt-1 text-[18px] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--sc-primary)]">
                      {card.title}
                    </h3>

                    {card.subtitle ? (
                      <p className="mt-1 text-[12px] font-normal text-[var(--sc-muted)]">
                        {card.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-3 text-[13.5px] font-normal leading-6 text-[var(--sc-muted)]">
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

export default function Communications() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  const shouldReduceMotion = useReducedMotion();
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);

  const floatingCards = useMemo<CardItem[]>(() => {
    return floatingCardBase.map((card) => ({
      ...card,
      title: text.cards[card.id].title,
      subtitle: text.cards[card.id].subtitle,
      label: text.cards[card.id].label,
      description: text.cards[card.id].description,
    }));
  }, [text]);

  const mainCard = useMemo<CardItem>(
    () => ({
      id: "communications",
      title: text.cards.communications.title,
      subtitle: text.cards.communications.subtitle,
      icon: <MdOutlineHub />,
      label: text.cards.communications.label,
      description: text.cards.communications.description,
    }),
    [text]
  );

  const familyCard = useMemo<CardItem>(
    () => ({
      id: "family-engagement",
      title: text.cards["family-engagement"].title,
      subtitle: text.cards["family-engagement"].subtitle,
      icon: <MdOutlineGridView />,
      label: text.cards["family-engagement"].label,
      description: text.cards["family-engagement"].description,
    }),
    [text]
  );

  const allCards = useMemo<CardItem[]>(() => {
    return [mainCard, familyCard, ...floatingCards];
  }, [mainCard, familyCard, floatingCards]);

  const selectedId = selectedCard?.id;

  return (
    <section className="relative h-full min-h-[640px] w-full overflow-hidden bg-[var(--sc-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--sc-border)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.55]" />

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
        className="pointer-events-none absolute left-[52%] top-[48%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sc-secondary)] blur-[92px]"
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
            <div className="absolute left-1/2 top-[-64px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCard(familyCard);
                  scrollRightSidebarTo("family-engagement");
                }}
                className={[
                  "h-[40px] min-w-[300px] rounded-full bg-[var(--sc-secondary)] px-[44px]",
                  "text-center text-[13px] font-normal uppercase tracking-[0.13em]",
                  "leading-[40px] text-[var(--sc-primary)]",
                  "shadow-[0_16px_34px_rgba(22,66,60,0.14)]",
                  "transition duration-300 hover:scale-[1.025] hover:bg-[var(--sc-secondary-light)]",
                  "whitespace-nowrap outline-none",
                ].join(" ")}
              >
                {familyCard.title}
              </button>
            </div>

            <div
              className={[
                "relative h-[250px] w-[230px]",
                "rounded-[26px] border-[3px] border-[var(--sc-border)]",
                "bg-white/24 p-[18px]",
                "shadow-[0_28px_80px_rgba(22,66,60,0.10)]",
                "backdrop-blur-[4px]",
              ].join(" ")}
            >
              <span className="pointer-events-none absolute inset-[2px] rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_35%,rgba(22,66,60,0.04))]" />

              <div className="relative z-10 flex h-full items-center justify-center">
                <ActiveCommunicationsCard
                  item={mainCard}
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
              openSectionText={text.openSection}
              closeText={text.closeDetail}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { FaRegStar, FaUsers } from "react-icons/fa6";
import { MdOutlineAutoAwesome, MdOutlineGridView, MdOutlineHub } from "react-icons/md";

type CardItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  positionClass?: string;
  color?: string;
};

const floatingCards: CardItem[] = [
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
    positionClass: "left-[4%] top-[12%]",
    color: "#8b2d10",
  },
  {
    id: "consistent-experience",
    title: "Consistent Experience",
    subtitle: "Family Hub",
    icon: <MdOutlineGridView />,
    positionClass: "right-[5%] top-[14%]",
    color: "#001b70",
  },
  {
    id: "contextual-ai",
    title: "Contextual AI",
    icon: <MdOutlineAutoAwesome />,
    positionClass: "right-[22%] bottom-[8%]",
    color: "#001b70",
  },
];

const mainCard: CardItem = {
  id: "communications",
  title: "Communications",
  subtitle: "School Messenger",
  icon: <MdOutlineHub />,
  color: "#8b2d10",
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
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
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

function FloatingCard({ item }: { item: CardItem }) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={{
        y: -5,
        scale: 1.04,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group absolute z-20 h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "border border-[#cfd8e3] bg-white/78 shadow-[0_16px_38px_rgba(15,23,42,0.07)]",
        "transition-all duration-500 hover:border-[#0068ff] hover:shadow-[0_24px_60px_rgba(0,104,255,0.16)]",
        "focus-visible:ring-2 focus-visible:ring-[#0068ff]/30",
        item.positionClass ?? "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#0068ff]" />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none transition-all duration-500 group-hover:scale-110"
        style={{ color: item.color }}
      >
        {item.icon}
      </div>

      <div
        className={[
          "relative z-10 flex max-w-[84px] items-center justify-center text-center",
          "font-black tracking-[-0.04em] text-[#001b70]",
          isSingleWord ? "text-[10.5px] leading-none" : "text-[9.5px] leading-[1.05]",
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

function ActiveCommunicationsCard({ item }: { item: CardItem }) {
  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={{
        y: -5,
        scale: 1.025,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group relative h-[158px] w-[158px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "border-[3px] border-[#ff7438] bg-[#eaf4ff]",
        "shadow-[0_22px_55px_rgba(255,116,56,0.2)]",
        "transition-shadow duration-500 hover:shadow-[0_28px_70px_rgba(255,116,56,0.28)]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/35",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(255,255,255,0)_50%,rgba(15,23,42,0.04))]" />

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

export default function Communications() {
  return (
    <section className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      {/* dotted background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.72]" />

      {/* soft glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-[85px]" />
      <div className="pointer-events-none absolute left-[52%] top-[48%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7438]/8 blur-[90px]" />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative h-full w-full"
      >
        {floatingCards.map((item) => (
          <FloatingCard key={item.id} item={item} />
        ))}

        {/* center group */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            {/* title pill */}
            <div className="absolute left-1/2 top-[-58px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => scrollRightSidebarTo("family-engagement")}
                className={[
                  "h-[36px] min-w-[210px] rounded-full bg-[#ffd09a]",
                  "px-[28px] text-center text-[14px] font-normal uppercase tracking-[0.08em]",
                  "leading-[36px] text-[#8b2d10]",
                  "shadow-[0_14px_34px_rgba(255,116,56,0.14)]",
                  "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(255,116,56,0.22)]",
                ].join(" ")}
              >
                Family Engagement
              </button>
            </div>

            {/* outer panel */}
            <div
              className={[
                "relative h-[250px] w-[230px]",
                "rounded-[23px] border-[3px] border-[#cfd8e3]",
                "bg-white/8 p-[18px]",
                "shadow-[0_22px_70px_rgba(15,23,42,0.055)]",
                "backdrop-blur-[1px]",
              ].join(" ")}
            >
              <div className="flex h-full items-center justify-center">
                <ActiveCommunicationsCard item={mainCard} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
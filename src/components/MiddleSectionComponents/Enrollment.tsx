"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { FaRegStar, FaUsers } from "react-icons/fa6";
import { MdAddCircleOutline, MdOutlineHub } from "react-icons/md";

type CardItem = {
  id: string;
  title: string;
  icon?: ReactNode;
  active?: boolean;
  floating?: boolean;
};

const centerCards: CardItem[] = [
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
  },
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
    active: true,
  },
];

const floatingCard: CardItem = {
  id: "connected-intelligence",
  title: "Connected Intelligence",
  icon: <MdOutlineHub />,
  floating: true,
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

function MiniCard({ item }: { item: CardItem }) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={{
        y: -4,
        scale: 1.035,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "bg-[#eaf4ff] shadow-[0_12px_30px_rgba(15,23,42,0.055)]",
        "transition-shadow duration-500 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/35",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.52),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[25px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[30px] max-w-[86px] items-center justify-center",
          "text-center font-normal text-black tracking-[-0.035em]",
          isSingleWord
            ? "text-[14px] leading-none"
            : "text-[11.5px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

function ActiveEnrollmentCard({ item }: { item: CardItem }) {
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

      <div className="relative z-10 mb-4 text-[42px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
        {item.icon}
      </div>

      <h3 className="relative z-10 text-[15px] font-black leading-none tracking-[-0.04em] text-black">
        {item.title}
      </h3>
    </motion.button>
  );
}

function FloatingCard({ item }: { item: CardItem }) {
  return (
    <motion.button
      variants={itemVariants}
      type="button"
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
        "group absolute right-[3%] top-[31%] z-20 h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "border border-[#cfd8e3] bg-white/78 shadow-[0_16px_38px_rgba(15,23,42,0.07)]",
        "transition-all duration-500 hover:border-[#0068ff] hover:shadow-[0_24px_60px_rgba(0,104,255,0.16)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#0068ff]" />

      <div className="relative z-10 mb-[7px] text-[26px] leading-none text-[#001b70] transition-all duration-500 group-hover:scale-110">
        {item.icon}
      </div>

      <div className="relative z-10 flex max-w-[84px] items-center justify-center text-center text-[9.5px] font-black leading-[1.05] tracking-[-0.04em] text-[#001b70]">
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

export default function Enrollment() {
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
        {/* right floating card */}
        <FloatingCard item={floatingCard} />

        {/* center group */}
        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            {/* title pill */}
            <div className="absolute left-1/2 top-[-58px] z-20 -translate-x-1/2">
              <button
                type="button"
                onClick={() => scrollRightSidebarTo("student-information")}
                className={[
                  "h-[36px] min-w-[210px] rounded-full bg-[#ffd09a]",
                  "px-[28px] text-center text-[14px] font-normal uppercase tracking-[0.08em]",
                  "leading-[36px] text-[#8b2d10]",
                  "shadow-[0_14px_34px_rgba(255,116,56,0.14)]",
                  "transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(255,116,56,0.22)]",
                ].join(" ")}
              >
                Student Information
              </button>
            </div>

            {/* outer panel */}
            <div
              className={[
                "relative h-[250px] w-[340px]",
                "rounded-[23px] border-[3px] border-[#cfd8e3]",
                "bg-white/8 p-[18px]",
                "shadow-[0_22px_70px_rgba(15,23,42,0.055)]",
                "backdrop-blur-[1px]",
              ].join(" ")}
            >
              <div className="grid h-full grid-cols-[96px_1fr] items-center gap-[48px]">
                <MiniCard item={centerCards[0]} />

                <ActiveEnrollmentCard item={centerCards[1]} />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
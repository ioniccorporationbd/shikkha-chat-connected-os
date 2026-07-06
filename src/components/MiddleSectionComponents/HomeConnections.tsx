"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
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

const wrapperVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 22,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.9,
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

function ProductTile({ item }: { item: ProductCard }) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isLongTitle = item.title.length > 16;

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      aria-label={`Go to ${item.title}`}
      whileHover={{
        y: -4,
        scale: 1.035,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      whileTap={{
        scale: 0.96,
      }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "outline-none transition-shadow duration-500",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/35",
        item.orange ? "bg-[#ffd09a]" : "bg-[#eaf4ff]",
        "flex flex-col items-center justify-center text-center",
        "shadow-[0_10px_26px_rgba(15,23,42,0.055)]",
        "hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.48),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,116,56,0.5)_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-[0.14]" />

      <span className="pointer-events-none absolute -left-[70%] top-0 h-full w-[60%] skew-x-[-18deg] bg-white/30 transition-all duration-700 group-hover:left-[120%]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[25px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110 group-hover:text-[#ff7438]">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[34px] max-w-[88px] items-center justify-center",
          "text-center font-normal text-black tracking-[-0.035em]",
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
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.72]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/65 blur-[70px]" />
      <div className="pointer-events-none absolute left-[52%] top-[48%] h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7438]/8 blur-[80px]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <motion.div
          variants={wrapperVariants}
          initial="hidden"
          animate="visible"
          className="relative translate-y-[5px]"
        >
          <motion.button
            type="button"
            onClick={() => scrollRightSidebarTo("home-connections-panel")}
            whileHover={{
              y: -2,
              scale: 1.025,
            }}
            whileTap={{
              scale: 0.96,
            }}
            className={[
              "absolute left-1/2 top-[-52px] z-20 -translate-x-1/2",
              "h-[36px] min-w-[218px] rounded-full bg-[#ff7438]",
              "px-[30px] text-[14px] font-black leading-[36px] text-black",
              "whitespace-nowrap",
              "shadow-[0_14px_34px_rgba(255,116,56,0.24)]",
              "transition-shadow duration-500 hover:shadow-[0_18px_42px_rgba(255,116,56,0.34)]",
            ].join(" ")}
          >
            Home Connections

            <span className="absolute left-1/2 top-full h-[19px] w-[3px] -translate-x-1/2 bg-[#ff7438]" />
          </motion.button>

          <div
            className={[
              "relative h-[430px] w-[224px]",
              "rounded-[23px] border-[3px] border-[#ff7438]",
              "bg-white/5 p-[8px]",
              "shadow-[0_22px_70px_rgba(15,23,42,0.055)]",
              "backdrop-blur-[1px]",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-[2px] rounded-[19px] bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_35%,rgba(255,255,255,0.08))]" />

            <div className="relative z-10 grid grid-cols-2 gap-[8px]">
              <ProductTile item={products[0]} />
              <ProductTile item={products[1]} />

              <ProductTile item={products[2]} />
              <ProductTile item={products[3]} />

              <ProductTile item={products[4]} />
              <ProductTile item={products[5]} />

              <ProductTile item={products[6]} />

              <div className="h-[96px] w-[96px]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
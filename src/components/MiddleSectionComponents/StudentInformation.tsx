"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
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
  icon?: React.ReactNode;
  orange?: boolean;
  outline?: boolean;
  ghost?: boolean;
};

const rightImage = "/images/student-information-family.png";

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
    outline: true,
  },
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
    outline: true,
  },
  {
    id: "special-programs",
    title: "Special Programs",
    icon: <FaRegStar />,
    outline: true,
  },
  {
    id: "family-engagement",
    title: "FAMILY ENGAGEMENT",
    ghost: true,
  },
  {
    id: "communications",
    title: "Communications",
    subtitle: "School Messenger",
    icon: <MdOutlineHub />,
    ghost: true,
  },
  {
    id: "attendance-support",
    title: "Attendance Support",
    icon: <FaRegCircleQuestion />,
    ghost: true,
  },
];

const wrapperVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 26,
    scale: 0.96,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
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

function ProductTile({ item }: { item: ProductCard }) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;
  const isActive = item.id === "student-information";

  return (
    <motion.button
      variants={cardVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={{
        y: -3,
        scale: 1.025,
        transition: {
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-shadow duration-500",
        item.orange ? "bg-[#ffd09a]" : "bg-[#f8fbff]",
        item.outline ? "border-[3px] border-[#ff7438]" : "",
        item.ghost ? "border border-[#cfd8e3] bg-white/42" : "",
        isActive ? "shadow-[0_18px_42px_rgba(255,116,56,0.24)]" : "",
        "hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]",
        "focus-visible:ring-2 focus-visible:ring-[#ff7438]/35",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.48),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      {isActive ? (
        <span className="pointer-events-none absolute inset-0 rounded-[15px] border-[2px] border-[#ff7438]/40" />
      ) : null}

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div className="relative z-10 mb-[7px] text-[25px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110">
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

      {item.subtitle ? (
        <p className="relative z-10 mt-[4px] max-w-[82px] truncate whitespace-nowrap text-[7.4px] font-normal leading-none text-[#243241]/90">
          {item.subtitle}
        </p>
      ) : null}
    </motion.button>
  );
}

export default function StudentInformation() {
  return (
    <section className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      {/* dotted background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.72]" />

      {/* soft glow */}
      <div className="pointer-events-none absolute left-[38%] top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/65 blur-[70px]" />
      <div className="pointer-events-none absolute right-[20%] top-[52%] h-[260px] w-[260px] -translate-y-1/2 rounded-full bg-[#ff7438]/8 blur-[90px]" />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-8">
        <div className="flex w-full max-w-[760px] items-center justify-center gap-[92px]">
          {/* Left diagram */}
          <motion.div
            variants={wrapperVariants}
            initial="hidden"
            animate="visible"
            className="relative shrink-0 translate-y-[4px]"
          >
            {/* top pill */}
            <motion.button
              type="button"
              onClick={() => scrollRightSidebarTo("home-connections-panel")}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={[
                "absolute left-1/2 top-[-52px] z-20 -translate-x-1/2",
                "h-[35px] min-w-[190px] rounded-full bg-[#d7e1ec]",
                "px-[24px] text-[14px] font-black leading-[35px] text-black",
                "whitespace-nowrap shadow-[0_12px_28px_rgba(15,23,42,0.08)]",
              ].join(" ")}
            >
              Home Connections

              <span className="absolute left-1/2 top-full h-[20px] w-[3px] -translate-x-1/2 bg-[#cfd8e3]" />
            </motion.button>

            {/* outer box */}
            <div
              className={[
                "relative h-[430px] w-[224px]",
                "rounded-[23px] border-[3px] border-[#cfd8e3]",
                "bg-white/10 p-[8px]",
                "shadow-[0_22px_70px_rgba(15,23,42,0.055)]",
                "backdrop-blur-[1px]",
              ].join(" ")}
            >
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

          {/* Right local image */}
          <motion.div
            initial={{
              opacity: 0,
              x: 46,
              scale: 0.94,
              filter: "blur(10px)",
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2,
            }}
            className="relative hidden h-[420px] w-[300px] shrink-0 md:block"
          >
            <Image
              src={rightImage}
              alt="Student Information"
              fill
              priority
              sizes="300px"
              className="object-contain object-bottom drop-shadow-[0_24px_28px_rgba(15,23,42,0.16)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
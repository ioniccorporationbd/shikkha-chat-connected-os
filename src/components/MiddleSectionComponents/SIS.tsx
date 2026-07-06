"use client";

import { type ReactNode, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import {
  MdAddCircleOutline,
  MdOutlineHub,
  MdOutlineAutoAwesome,
  MdOutlineAnalytics,
  MdOutlineMenuBook,
  MdOutlineGridView,
  MdOutlineFavoriteBorder,
  MdOutlinePsychology,
} from "react-icons/md";

type CoreCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
};

type FloatingCard = {
  id: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  positionClass: string;
  description: string;
};

const coreCards: CoreCard[] = [
  {
    id: "enrollment",
    title: "Enrollment",
    icon: <MdAddCircleOutline />,
  },
  {
    id: "sis",
    title: "SIS",
    icon: <FaUsers />,
    active: true,
  },
  {
    id: "special-programs",
    title: "Special Programs",
    icon: <FaRegStar />,
  },
];

const floatingCards: FloatingCard[] = [
  {
    id: "communications",
    title: "Communications",
    subtitle: "School Messenger",
    icon: <MdOutlineHub />,
    color: "#8b2d10",
    positionClass: "left-[4%] top-[13%]",
    description:
      "Connect messages with student data so every family update is accurate, timely, and easier for staff to deliver.",
  },
  {
    id: "contextual-ai",
    title: "Contextual AI",
    icon: <MdOutlineAutoAwesome />,
    color: "#001b70",
    positionClass: "left-[19%] top-[5%]",
    description:
      "Talk to your SIS data and quickly streamline the process of building data requests, producing SQL queries, visualizing data, and delivering concise insights.",
  },
  {
    id: "learning-management",
    title: "Learning Management",
    subtitle: "Learning Suite",
    icon: <MdOutlinePsychology />,
    color: "#006642",
    positionClass: "right-[14%] top-[3%]",
    description:
      "Connect classroom learning activity with student information so educators understand progress in one connected experience.",
  },
  {
    id: "attendance-support",
    title: "Attendance Support",
    icon: <FaRegCircleQuestion />,
    color: "#8b2d10",
    positionClass: "right-[6%] top-[18%]",
    description:
      "Detect attendance patterns earlier and help schools respond with fast, connected family outreach.",
  },
  {
    id: "assessment",
    title: "Assessment",
    subtitle: "Performance Insights",
    icon: <FaRegStar />,
    color: "#006642",
    positionClass: "right-[3%] top-[36%]",
    description:
      "Bring assessment data closer to the SIS so teams can understand learning performance and student needs faster.",
  },
  {
    id: "consistent-experience",
    title: "Consistent Experience",
    subtitle: "Family Hub",
    icon: <MdOutlineGridView />,
    color: "#001b70",
    positionClass: "left-[1.5%] top-[58%]",
    description:
      "Give families, students, and staff a consistent connected experience across school tools and daily workflows.",
  },
  {
    id: "behavior-support",
    title: "Behavior Support",
    icon: <MdOutlineFavoriteBorder />,
    color: "#006642",
    positionClass: "left-[2.5%] bottom-[15%]",
    description:
      "Support positive behavior workflows with connected student information and clearer team visibility.",
  },
  {
    id: "connected-intelligence",
    title: "Connected Intelligence",
    icon: <MdOutlineHub />,
    color: "#001b70",
    positionClass: "left-[12%] bottom-[4%]",
    description:
      "Unify insights from connected systems so leaders can make better decisions with trusted student data.",
  },
  {
    id: "analytics-insights",
    title: "Analytics & Insights",
    icon: <MdOutlineAnalytics />,
    color: "#001b70",
    positionClass: "right-[6%] bottom-[16%]",
    description:
      "Transform operational and student data into clear dashboards, trends, and actionable insights.",
  },
  {
    id: "curriculum-instruction",
    title: "Curriculum & Instruction",
    icon: <MdOutlineMenuBook />,
    color: "#006642",
    positionClass: "right-[22%] bottom-[5%]",
    description:
      "Connect curriculum, instruction, and student performance data to support stronger teaching decisions.",
  },
];

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
      staggerChildren: 0.06,
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
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function scrollRightSidebarTo(id: string) {
  const validRightSections = [
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

function CoreTile({ item }: { item: CoreCard }) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={() => scrollRightSidebarTo(item.id)}
      whileHover={{ y: -4, scale: 1.035 }}
      whileTap={{ scale: 0.96 }}
      className={[
        "group relative h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-shadow duration-500",
        item.active
          ? "border-[3px] border-[#ff7438] bg-[#eaf4ff] shadow-[0_20px_46px_rgba(255,116,56,0.2)]"
          : "bg-[#eaf4ff] shadow-[0_10px_26px_rgba(15,23,42,0.055)]",
        "hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.48),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12.5px] text-[#4b6377] transition-all duration-500 group-hover:rotate-12 group-hover:text-[#ff7438]" />

      {item.icon ? (
        <div className="relative z-10 mb-[8px] text-[26px] leading-none text-[#8b2d10] transition-all duration-500 group-hover:scale-110">
          {item.icon}
        </div>
      ) : null}

      <div
        className={[
          "relative z-10 flex min-h-[32px] max-w-[86px] items-center justify-center",
          "text-center font-normal text-black tracking-[-0.035em]",
          isSingleWord ? "text-[14px] leading-none" : "text-[11.5px] leading-[1.08]",
        ].join(" ")}
      >
        {formatTitle(item.title)}
      </div>
    </motion.button>
  );
}

function FloatingTile({
  item,
  active,
  onClick,
}: {
  item: FloatingCard;
  active: boolean;
  onClick: () => void;
}) {
  const wordCount = item.title.trim().split(/\s+/).length;
  const isSingleWord = wordCount === 1;

  return (
    <motion.button
      variants={itemVariants}
      type="button"
      onClick={onClick}
      whileHover={{ y: -5, scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={[
        "absolute z-20 h-[96px] w-[96px] overflow-hidden rounded-[15px]",
        "flex flex-col items-center justify-center text-center outline-none",
        "transition-all duration-500",
        active
          ? "border-[3px] border-[#0068ff] bg-white shadow-[0_24px_60px_rgba(0,104,255,0.18)]"
          : "border border-[#cfd8e3] bg-white/75 shadow-[0_14px_34px_rgba(15,23,42,0.06)]",
        item.positionClass,
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(255,255,255,0)_48%,rgba(15,23,42,0.035))]" />

      <FaRegStar className="absolute right-[8px] top-[8px] z-10 text-[12px] text-[#4b6377]" />

      <div
        className="relative z-10 mb-[7px] text-[26px] leading-none"
        style={{ color: item.color }}
      >
        {item.icon}
      </div>

      <div
        className={[
          "relative z-10 flex max-w-[86px] items-center justify-center text-center",
          "font-black tracking-[-0.04em] text-black",
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

function DetailPanel({
  item,
  onClose,
}: {
  item: FloatingCard;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -24,
        y: 18,
        scale: 0.96,
        filter: "blur(8px)",
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
        x: -20,
        y: 18,
        scale: 0.96,
        filter: "blur(8px)",
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="absolute bottom-0 left-0 z-40 w-[500px] border border-slate-200 bg-white px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Close detail"
      >
        <FaXmark />
      </button>

      <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-[#0068ff]">
        Add-on Capability
      </p>

      <h3 className="mt-3 text-[28px] font-black leading-none tracking-[-0.05em] text-[#202833]">
        {item.title}
      </h3>

      <p className="mt-6 max-w-[410px] text-[16px] font-normal leading-8 text-[#333942]">
        {item.description}
      </p>
    </motion.div>
  );
}

export default function SIS() {
  const [selectedCapability, setSelectedCapability] =
    useState<FloatingCard | null>(null);

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.72]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-[85px]" />

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative h-full w-full"
      >
        {floatingCards.map((item) => (
          <FloatingTile
            key={item.id}
            item={item}
            active={selectedCapability?.id === item.id}
            onClick={() => setSelectedCapability(item)}
          />
        ))}

        <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute left-1/2 top-[-58px] z-20 -translate-x-1/2">
              <div className="h-[36px] min-w-[210px] rounded-full bg-[#ffd09a] px-[28px] text-center text-[14px] font-normal uppercase tracking-[0.08em] leading-[36px] text-[#8b2d10] shadow-[0_14px_34px_rgba(255,116,56,0.14)]">
                Student Information
              </div>
            </div>

            <div className="relative h-[290px] w-[340px] rounded-[23px] border-[3px] border-[#cfd8e3] bg-white/8 p-[14px] shadow-[0_22px_70px_rgba(15,23,42,0.055)] backdrop-blur-[1px]">
              <div className="grid h-full grid-cols-[96px_1fr] gap-[14px]">
                <div className="flex flex-col justify-center gap-[10px]">
                  <CoreTile item={coreCards[0]} />
                  <CoreTile item={coreCards[2]} />
                </div>

                <div className="flex items-center justify-center">
                  <div className="scale-[1.55]">
                    <CoreTile item={coreCards[1]} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedCapability ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 z-10 bg-white/0"
              />

              <ConnectorLine targetId={selectedCapability.id} />

              <DetailPanel
                item={selectedCapability}
                onClose={() => setSelectedCapability(null)}
              />
            </>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function ConnectorLine({ targetId }: { targetId: string }) {
  if (targetId !== "contextual-ai") return null;

  return (
    <motion.div
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ opacity: 1, pathLength: 1 }}
      exit={{ opacity: 0, pathLength: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="pointer-events-none absolute inset-0 z-25"
    >
      <svg className="h-full w-full" viewBox="0 0 1000 720" preserveAspectRatio="none">
        <motion.path
          d="M230 105 L230 390 Q230 410 250 410 L500 410"
          fill="none"
          stroke="#8b3a12"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          exit={{ pathLength: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>
    </motion.div>
  );
}
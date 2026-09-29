"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";

type SectionKey = "orange" | "green" | "purple";

type VisiblePeople = Record<SectionKey, boolean>;

/** Each hero graphic stands for one of the three home-page groups. */
const SECTION_GROUP: Record<SectionKey, string> = {
  orange: "home",
  green: "student",
  purple: "operational",
};

/** The section that a map click scrolls to, and the group each id belongs to. */
const GROUP_ANCHOR: Record<string, string> = {
  home: "home-connections-panel",
  student: "student-achievement",
  operational: "operational-excellence",
};

const HOME_SECTION_IDS = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

const STUDENT_SECTION_IDS = [
  "student-achievement",
  "classroom-solutions",
  "learning-management-schoology",
  "assessment-performance-matters",
  "curriculum-instruction",
  "student-intervention",
  "mtss",
  "behavior-support",
  "college-career-life-readiness",
  "cclr-naviance",
];

const OPERATIONAL_SECTION_IDS = [
  "operational-excellence",
  "resource-planning",
  "financial-strategy-allovue",
  "erp-systems",
  "predictive-enrollment",
  "talent-management",
  "recruiting-and-hr",
  "educator-support",
];

/** Map an active section id to the hero graphic it belongs to. */
function sectionKeyForId(id: string): SectionKey | null {
  if (STUDENT_SECTION_IDS.includes(id)) return "green";
  if (OPERATIONAL_SECTION_IDS.includes(id)) return "purple";
  if (HOME_SECTION_IDS.includes(id)) return "orange";
  return null;
}

/** Tell the page which group a clicked map should reveal. */
function selectGroup(group: string) {
  const id = GROUP_ANCHOR[group];
  if (!id) return;

  window.dispatchEvent(
    new CustomEvent("connected-os-scroll-to-section", { detail: { id } })
  );
  window.dispatchEvent(
    new CustomEvent("connected-os-active-section", { detail: { id } })
  );
}

const impactVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 18,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const peopleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.78,
    y: 72,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    scale: [0.78, 1.08, 0.98, 1],
    y: [72, -18, 6, 0],
    filter: "blur(0px)",
    transition: {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const floatVariants: Variants = {
  float: {
    y: [0, -8, 0],
    transition: {
      duration: 4.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function LandingHeroBanner() {
  const [visiblePeople, setVisiblePeople] = useState<VisiblePeople>({
    orange: false,
    green: false,
    purple: false,
  });

  const [pulse, setPulse] = useState<SectionKey | null>(null);
  const [active, setActive] = useState<SectionKey | null>(null);

  useEffect(() => {
    const schedule = (section: SectionKey, delay: number) =>
      window.setTimeout(() => {
        setPulse(section);

        window.setTimeout(() => {
          setVisiblePeople((prev) => ({
            ...prev,
            [section]: true,
          }));
        }, 220);

        window.setTimeout(() => {
          setPulse(null);
        }, 1100);
      }, delay);

    const timers = [
      schedule("orange", 900),
      schedule("green", 1350),
      schedule("purple", 1800),
    ];

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  // Follow the page's active section so the matching map lights up and the
  // others recede — the three graphics are never a static decoration.
  useEffect(() => {
    const handleActive = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;

      setActive(sectionKeyForId(id));
    };

    window.addEventListener("connected-os-active-section", handleActive);
    return () => window.removeEventListener("connected-os-active-section", handleActive);
  }, []);

  const impactAnimate = (section: SectionKey) =>
    pulse === section
      ? {
          opacity: 1,
          scale: [1, 1.08, 0.98, 1.02, 1],
          y: [0, -12, 4, -2, 0],
          filter: "blur(0px)",
          transition: {
            duration: 1.1,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }
      : {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  /** Dim everything except the active map, so the state reads at a glance. */
  const sectionStateClass = (section: SectionKey) =>
    active && active !== section
      ? "opacity-35 saturate-50 transition duration-500"
      : "opacity-100 transition duration-500";

  const isActive = (section: SectionKey) => active === section;

  const mapButtonProps = (section: SectionKey) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Show ${SECTION_GROUP[section]}`,
    "aria-pressed": isActive(section),
    onClick: () => selectGroup(SECTION_GROUP[section]),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectGroup(SECTION_GROUP[section]);
      }
    },
  });

  return (
    <section
      id="intro"
      className="relative min-h-[100svh] overflow-hidden bg-[var(--sc-surface)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:18px_18px] opacity-70" />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[760px] -translate-x-1/2 rounded-full bg-[var(--sc-primary)]/10 blur-[120px]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--sc-primary)_7%,transparent),transparent_46%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1540px] flex-col px-4 pb-6 pt-7 md:px-7 lg:px-10">
        <motion.div
          initial={{
            opacity: 0,
            y: -12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.55,
          }}
          className="mx-auto text-center"
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[var(--sc-primary)] md:text-[11px]">
            UNIFY THE HOME, CLASSROOM, AND CENTRAL OFFICE
          </p>

          <h1 className="text-[30px] font-black leading-[1.08] tracking-[-0.05em] text-[var(--sc-primary)] sm:text-[34px] md:text-[40px] lg:text-[44px]">
            The K–12 Connected Operating System
          </h1>

          <p className="mx-auto mt-3 max-w-[660px] text-[13px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--sc-primary)_72%,transparent)] md:text-[15px]">
            One connected platform for school, family and learning — tap a section to explore it.
          </p>
        </motion.div>

        <div className="relative mt-5 flex flex-1 items-center justify-center lg:mt-8">
          <div className="relative h-[560px] w-full max-w-[1420px] md:h-[610px] lg:h-[650px]">
            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={impactAnimate("orange")}
              className={`absolute left-[0%] top-[2%] h-[390px] w-[35%] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[430px] ${sectionStateClass("orange")}`}
              {...mapButtonProps("orange")}
            >
              {isActive("orange") ? (
                <span
                  aria-hidden
                  className="absolute inset-x-[6%] top-[6%] h-[92%] rounded-[32px] bg-[var(--sc-primary)]/8 blur-2xl"
                />
              ) : null}
              <Image
                src="/Banner-imaes/orange-impact.png"
                alt="Home Connections"
                fill
                sizes="(max-width: 768px) 34vw, 460px"
                priority
                className="object-contain object-top"
              />
            </motion.div>

            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.orange ? "visible" : "hidden"}
              className={`absolute bottom-[5%] left-[1%] h-[350px] w-[28%] md:h-[430px] ${sectionStateClass("orange")}`}
            >
              <motion.div
                variants={floatVariants}
                animate={visiblePeople.orange ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/orange-people.png"
                  alt="Home Connections people"
                  fill
                  sizes="(max-width: 768px) 26vw, 340px"
                  priority
                  className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]"
                />
              </motion.div>
            </motion.div>

            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={impactAnimate("green")}
              className={`absolute left-1/2 top-[2%] h-[360px] w-[34%] -translate-x-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[395px] ${sectionStateClass("green")}`}
              {...mapButtonProps("green")}
            >
              {isActive("green") ? (
                <span
                  aria-hidden
                  className="absolute inset-x-[6%] top-[6%] h-[92%] rounded-[32px] bg-[var(--color-secondary)]/25 blur-2xl"
                />
              ) : null}
              <Image
                src="/Banner-imaes/green-impact.png"
                alt="Student Achievement"
                fill
                sizes="(max-width: 768px) 34vw, 460px"
                priority
                className="object-contain object-top"
              />
            </motion.div>

            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.green ? "visible" : "hidden"}
              className={`absolute bottom-[4%] left-1/2 h-[380px] w-[20%] -translate-x-1/2 md:h-[455px] ${sectionStateClass("green")}`}
            >
              <motion.div
                variants={floatVariants}
                animate={visiblePeople.green ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/green-people.png"
                  alt="Student Achievement person"
                  fill
                  sizes="(max-width: 768px) 26vw, 340px"
                  priority
                  className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]"
                />
              </motion.div>
            </motion.div>

            <motion.div
              variants={impactVariants}
              initial="hidden"
              animate={impactAnimate("purple")}
              className={`absolute right-[0%] top-[2%] h-[395px] w-[35%] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[440px] ${sectionStateClass("purple")}`}
              {...mapButtonProps("purple")}
            >
              {isActive("purple") ? (
                <span
                  aria-hidden
                  className="absolute inset-x-[6%] top-[6%] h-[92%] rounded-[32px] bg-[var(--sc-primary)]/8 blur-2xl"
                />
              ) : null}
              <Image
                src="/Banner-imaes/purple-impact.png"
                alt="Operational Excellence"
                fill
                sizes="(max-width: 768px) 34vw, 460px"
                priority
                className="object-contain object-top"
              />
            </motion.div>

            <motion.div
              variants={peopleVariants}
              initial="hidden"
              animate={visiblePeople.purple ? "visible" : "hidden"}
              className={`absolute bottom-[4%] right-[5%] h-[350px] w-[26%] md:h-[430px] ${sectionStateClass("purple")}`}
            >
              <motion.div
                variants={floatVariants}
                animate={visiblePeople.purple ? "float" : undefined}
                className="relative h-full w-full"
              >
                <Image
                  src="/Banner-imaes/purple-people.png"
                  alt="Operational Excellence people"
                  fill
                  sizes="(max-width: 768px) 26vw, 340px"
                  priority
                  className="object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)]"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

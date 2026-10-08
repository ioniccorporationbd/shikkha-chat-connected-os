"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";

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

/** Shared signature easing — matches the site's --ease-smooth. */
const EASE = [0.22, 1, 0.36, 1] as const;

const impactVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 26,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: EASE,
      delay: 0.12,
    },
  },
};

const peopleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 60,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: EASE,
    },
  },
};

const floatVariants: Variants = {
  float: {
    y: [0, -9, 0],
    transition: {
      duration: 5.4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/** Text block entrance — a single tasteful stagger. */
const textContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.04,
    },
  },
};

const textItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE,
    },
  },
};

export default function LandingHeroBanner() {
  const reduce = useReducedMotion();

  const [visiblePeople, setVisiblePeople] = useState<VisiblePeople>({
    orange: false,
    green: false,
    purple: false,
  });

  const [pulse, setPulse] = useState<SectionKey | null>(null);
  const [active, setActive] = useState<SectionKey | null>(null);
  // While the Main Banner itself fills the viewport no group is "active" — the hero
  // shows all three graphics. Mirrors the sidebar's #intro rule.
  const [heroInView, setHeroInView] = useState(true);

  // Reveal the three people with a small spotlight pulse, one at a time.
  // Skipped entirely under `prefers-reduced-motion` (they render shown).
  useEffect(() => {
    if (reduce) return;

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
  }, [reduce]);

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

  // Track whether the Main Banner fills the viewport, so the hero stays neutral there.
  useEffect(() => {
    const el = document.getElementById("intro");
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setHeroInView(entry.isIntersecting && entry.intersectionRatio > 0.6);
      },
      { threshold: [0, 0.6, 0.9] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reduced motion: keep the heroes fully present instead of animating them in.
  const shown: VisiblePeople = reduce
    ? { orange: true, green: true, purple: true }
    : visiblePeople;

  const impactAnimate = (section: SectionKey) =>
    pulse === section
      ? {
          opacity: 1,
          scale: [1, 1.06, 0.99, 1.01, 1],
          y: [0, -10, 3, -1, 0],
          filter: "blur(0px)",
          transition: {
            duration: 1.1,
            ease: EASE,
          },
        }
      : {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.7,
            ease: EASE,
          },
        };

  // Dim everything except the active graphic. Applied on a wrapper so the CSS
  // opacity multiplies with framer-motion's inline opacity instead of losing to it.
  const shownActive = heroInView ? null : active;
  const isDimmed = (section: SectionKey) => Boolean(shownActive && shownActive !== section);

  // Dim the two non-active groups. Opacity lives on a WRAPPER so it multiplies with
  // framer-motion's inline opacity. NEVER put a filter-based dim (saturate/grayscale)
  // on this wrapper: a filter makes it the containing block for absolutely-positioned
  // descendants and detaches the bottom-anchored people. Desaturation goes on the leaf
  // <Image> instead.
  const sectionStateClass = (section: SectionKey) =>
    isDimmed(section)
      ? "opacity-35 transition duration-500"
      : "opacity-100 transition duration-500";

  const isActive = (section: SectionKey) => shownActive === section;

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

  // A subtle lift on the clickable map graphics (CSS so it never fights the
  // framer-motion transform on the parent).
  const mapImageClass = (section: SectionKey) =>
    `object-contain object-top transition duration-500 [transition-timing-function:var(--ease-smooth)] group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5${isDimmed(section) ? " saturate-[0.45]" : ""}`;

  const peopleImageClass = (section: SectionKey) =>
    `object-contain object-bottom drop-shadow-[0_22px_18px_rgba(15,23,42,0.16)] transition duration-500${isDimmed(section) ? " saturate-[0.45]" : ""}`;

  return (
    <section
      id="intro"
      className="relative min-h-[100svh] overflow-hidden bg-[var(--sc-surface)]"
    >
      {/* Refined background — masked blueprint grid over soft brand glows. */}
      <div className="hero-bg" aria-hidden>
        <div className="hero-bg__grid" />

        <div className="absolute left-1/2 top-[-4%] h-[520px] w-[min(1150px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-secondary)_34%,transparent),transparent)] blur-[100px]" />

        <div className="absolute -left-24 bottom-[-10%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-accent)_30%,transparent),transparent)] blur-[120px]" />

        <div className="absolute -right-24 top-[4%] h-[470px] w-[470px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-secondary-strong)_24%,transparent),transparent)] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1540px] flex-col px-4 pb-6 pt-7 md:px-7 lg:px-10">
        <motion.div
          variants={textContainer}
          initial={reduce ? "visible" : "hidden"}
          animate="visible"
          className="mx-auto text-center"
        >
          <motion.p
            variants={textItem}
            className="mb-3 inline-flex items-center justify-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--color-secondary-strong)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,transparent)] px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-secondary-strong)] backdrop-blur-sm md:text-[11.5px]"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-action)]" />
            CONNECT HOME, CLASSROOM &amp; CENTRAL OFFICE
          </motion.p>

          <motion.h1
            variants={textItem}
            className="text-balance text-[34px] font-black leading-[1.04] tracking-[-0.03em] text-[var(--sc-primary)] sm:text-[40px] md:text-[46px] lg:text-[54px]"
          >
            The K–12 Connected Operating System
          </motion.h1>

          <motion.p
            variants={textItem}
            className="mx-auto mt-4 max-w-[640px] text-pretty text-[15px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--sc-primary)_66%,transparent)] md:text-[16.5px]"
          >
            Bring your school, families and every learner onto one connected platform — explore the system below.
          </motion.p>

          <motion.div
            variants={textItem}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <a className="mk-btn mk-btn--primary" href="#home-connections-content">
              Request a Demo
            </a>
            <a className="mk-btn mk-btn--ghost" href="#home-connections-content">
              Explore Features
            </a>
          </motion.div>
        </motion.div>

        <div className="relative mt-5 flex flex-1 items-center justify-center lg:mt-8">
          <div className="relative h-[560px] w-full max-w-[1420px] md:h-[610px] lg:h-[650px]">
            <div className={sectionStateClass("orange")}>
              <motion.div
                variants={impactVariants}
                initial={reduce ? false : "hidden"}
                animate={impactAnimate("orange")}
                className="group absolute left-[0%] top-[2%] h-[390px] w-[35%] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[430px]"
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
                  className={mapImageClass("orange")}
                />
              </motion.div>
            </div>

            <div className={sectionStateClass("orange")}>
              <motion.div
                variants={peopleVariants}
                initial={reduce ? false : "hidden"}
                animate={shown.orange ? "visible" : "hidden"}
                className="absolute bottom-[5%] left-[1%] h-[350px] w-[28%] md:h-[430px]"
              >
                <motion.div
                  variants={floatVariants}
                  animate={!reduce && shown.orange ? "float" : undefined}
                  className="relative h-full w-full"
                >
                  <Image
                    src="/Banner-imaes/orange-people.png"
                    alt="Home Connections people"
                    fill
                    sizes="(max-width: 768px) 26vw, 340px"
                    priority
                    className={peopleImageClass("orange")}
                  />
                </motion.div>
              </motion.div>
            </div>

            <div className={sectionStateClass("green")}>
              <motion.div
                variants={impactVariants}
                initial={reduce ? false : "hidden"}
                animate={impactAnimate("green")}
                className="group absolute left-1/2 top-[2%] h-[360px] w-[34%] -translate-x-1/2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[395px]"
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
                  className={mapImageClass("green")}
                />
              </motion.div>
            </div>

            <div className={sectionStateClass("green")}>
              <motion.div
                variants={peopleVariants}
                initial={reduce ? false : "hidden"}
                animate={shown.green ? "visible" : "hidden"}
                className="absolute bottom-[4%] left-1/2 h-[380px] w-[20%] -translate-x-1/2 md:h-[455px]"
              >
                <motion.div
                  variants={floatVariants}
                  animate={!reduce && shown.green ? "float" : undefined}
                  className="relative h-full w-full"
                >
                  <Image
                    src="/Banner-imaes/green-people.png"
                    alt="Student Achievement person"
                    fill
                    sizes="(max-width: 768px) 26vw, 340px"
                    priority
                    className={peopleImageClass("green")}
                  />
                </motion.div>
              </motion.div>
            </div>

            <div className={sectionStateClass("purple")}>
              <motion.div
                variants={impactVariants}
                initial={reduce ? false : "hidden"}
                animate={impactAnimate("purple")}
                className="group absolute right-[0%] top-[2%] h-[395px] w-[35%] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--sc-primary)] md:h-[440px]"
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
                  className={mapImageClass("purple")}
                />
              </motion.div>
            </div>

            <div className={sectionStateClass("purple")}>
              <motion.div
                variants={peopleVariants}
                initial={reduce ? false : "hidden"}
                animate={shown.purple ? "visible" : "hidden"}
                className="absolute bottom-[4%] right-[5%] h-[350px] w-[26%] md:h-[430px]"
              >
                <motion.div
                  variants={floatVariants}
                  animate={!reduce && shown.purple ? "float" : undefined}
                  className="relative h-full w-full"
                >
                  <Image
                    src="/Banner-imaes/purple-people.png"
                    alt="Operational Excellence people"
                    fill
                    sizes="(max-width: 768px) 26vw, 340px"
                    priority
                    className={peopleImageClass("purple")}
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

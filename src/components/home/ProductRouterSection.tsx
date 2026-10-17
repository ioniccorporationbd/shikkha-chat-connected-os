"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaStar,
  FaUsers,
} from "react-icons/fa6";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlinePsychology,
  MdOutlineSchool,
  MdOutlineFamilyRestroom,
  MdOutlineChat,
  MdOutlineFactCheck,
  MdOutlineCelebration,
  MdOutlineFavoriteBorder,
  MdOutlineMenuBook,
} from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  SAVED_SECTIONS_EVENT,
  readSavedSections,
  toggleSavedSection,
} from "@/lib/savedSections";
import { FEATURE_SHOWCASE } from "@/lib/feature-showcase";
import { catalogSectionId } from "@/components/showcase/catalog/sceneGroups";

type LanguageCode = "bn" | "en";
type ProductGroupId =
  | "home-connections"
  | "student-achievement"
  | "operational-excellence";

type ProductId =
  | "home-connections-panel"
  | "student-achievement"
  | "operational-excellence"
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support"
  | "classroom-solutions"
  | "learning-management-schoology"
  | "assessment-performance-matters"
  | "curriculum-instruction"
  | "student-intervention"
  | "mtss"
  | "behavior-support"
  | "college-career-life-readiness"
  | "cclr-naviance"
  | "resource-planning"
  | "financial-strategy-allovue"
  | "erp-systems"
  | "predictive-enrollment"
  | "talent-management"
  | "recruiting-and-hr"
  | "educator-support";

type ProductItem = {
  id: ProductId;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  /** Hub overview card — rendered full-width as the group header card. */
  overview?: boolean;
};

type ProductGroup = {
  id: ProductGroupId;
  title: string;
  products: ProductItem[];
};

type RouterProductText = {
  title: string;
  subtitle?: string;
};

type RouterText = {
  eyebrow: string;
  heading: string;
  subheading: string;
  saved: string;
  allProducts: string;
  noSavedTitle: string;
  noSavedDescription: string;
  saveProduct: string;
  overviewPill: string;
  linksHeading: string;
  linkHome: string;
  linkHelpDesk: string;
  linkMyOs: string;
  linkExpert: string;
  groups: Record<ProductGroupId, string>;
  products: Record<ProductId, RouterProductText>;
};

const textContent: Record<LanguageCode, RouterText> = {
  bn: {
    eyebrow: "সাইটম্যাপ",
    heading: "পুরো সংযুক্ত ওএস এক নজরে",
    subheading:
      "হোম কানেকশন, শিক্ষার্থী অর্জন ও অপারেশনাল উৎকর্ষতার প্রতিটি সেকশন — এক জায়গায়, এক ক্লিকে।",
    saved: "সংরক্ষিত",
    allProducts: "সব সেকশন",
    noSavedTitle: "এখনও কোনো সেকশন সংরক্ষিত নেই",
    noSavedDescription: "সংরক্ষণ করতে যেকোনো সেকশনের স্টার আইকনে ক্লিক করুন।",
    saveProduct: "সেকশন সংরক্ষণ করুন",
    overviewPill: "ওভারভিউ",
    linksHeading: "সম্পূর্ণ ওয়েবসাইট",
    linkHome: "হোম",
    linkHelpDesk: "হেল্প ডেস্ক",
    linkMyOs: "আমার সংযুক্ত সিস্টেম",
    linkExpert: "বিশেষজ্ঞের সাথে কথা বলুন",
    groups: {
      "home-connections": "হোম কানেকশন",
      "student-achievement": "শিক্ষার্থী অর্জন",
      "operational-excellence": "অপারেশনাল উৎকর্ষতা",
    },
    products: {
      "home-connections-panel": {
        title: "হোম কানেকশন সারাংশ",
        subtitle: "হাব ওভারভিউ",
      },
      "student-achievement": {
        title: "শিক্ষার্থী অর্জন সারাংশ",
        subtitle: "হাব ওভারভিউ",
      },
      "operational-excellence": {
        title: "অপারেশনাল উৎকর্ষতা সারাংশ",
        subtitle: "হাব ওভারভিউ",
      },
      "student-information": {
        title: "শিক্ষার্থীর তথ্য",
      },
      sis: {
        title: "শিক্ষার্থী তথ্য ব্যবস্থা",
        subtitle: "কেন্দ্রীয় শিক্ষার্থী সিস্টেম",
      },
      enrollment: {
        title: "ভর্তি ব্যবস্থাপনা",
      },
      "special-programs": {
        title: "বিশেষ কার্যক্রম",
      },
      "family-engagement": {
        title: "পরিবারের সম্পৃক্ততা",
      },
      communications: {
        title: "যোগাযোগ ব্যবস্থা",
        subtitle: "স্কুল বার্তা",
      },
      "attendance-support": {
        title: "উপস্থিতি সহায়তা",
      },
      "classroom-solutions": {
        title: "শ্রেণিকক্ষ সমাধান",
      },
      "learning-management-schoology": {
        title: "লার্নিং ব্যবস্থাপনা",
        subtitle: "শেখার প্ল্যাটফর্ম",
      },
      "assessment-performance-matters": {
        title: "মূল্যায়ন",
        subtitle: "পারফরম্যান্স বিশ্লেষণ",
      },
      "curriculum-instruction": {
        title: "কারিকুলাম ও পাঠদান",
      },
      "student-intervention": {
        title: "শিক্ষার্থী সহায়তা",
      },
      mtss: {
        title: "বহুস্তরীয় সহায়তা ব্যবস্থা",
      },
      "behavior-support": {
        title: "আচরণগত সহায়তা",
      },
      "college-career-life-readiness": {
        title: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
      },
      "cclr-naviance": {
        title: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
        subtitle: "ভবিষ্যৎ প্রস্তুতি",
      },
      "resource-planning": {
        title: "রিসোর্স পরিকল্পনা",
      },
      "financial-strategy-allovue": {
        title: "আর্থিক কৌশল",
        subtitle: "আর্থিক ব্যবস্থাপনা",
      },
      "erp-systems": {
        title: "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা",
      },
      "predictive-enrollment": {
        title: "পূর্বাভাসভিত্তিক ভর্তি",
      },
      "talent-management": {
        title: "প্রতিভা ব্যবস্থাপনা",
      },
      "recruiting-and-hr": {
        title: "নিয়োগ ও মানবসম্পদ",
      },
      "educator-support": {
        title: "শিক্ষক সহায়তা",
      },
    },
  },
  en: {
    eyebrow: "Site map",
    heading: "The whole connected OS at a glance",
    subheading:
      "Every section across Home Connections, Student Achievement and Operational Excellence — in one place, one click away.",
    saved: "Saved",
    allProducts: "All sections",
    noSavedTitle: "No saved sections yet",
    noSavedDescription: "Click the star icon on any section to save it here.",
    saveProduct: "Save section",
    overviewPill: "Overview",
    linksHeading: "Whole website",
    linkHome: "Home",
    linkHelpDesk: "Help Desk",
    linkMyOs: "My Connected System",
    linkExpert: "Talk to an Expert",
    groups: {
      "home-connections": "Home Connections",
      "student-achievement": "Student Achievement",
      "operational-excellence": "Operational Excellence",
    },
    products: {
      "home-connections-panel": {
        title: "Home Connections Summary",
        subtitle: "Hub overview",
      },
      "student-achievement": {
        title: "Student Achievement Summary",
        subtitle: "Hub overview",
      },
      "operational-excellence": {
        title: "Operational Excellence Summary",
        subtitle: "Hub overview",
      },
      "student-information": {
        title: "Student Information",
      },
      sis: {
        title: "Student Information System",
        subtitle: "Central Student System",
      },
      enrollment: {
        title: "Enrollment Management",
      },
      "special-programs": {
        title: "Special Programs",
      },
      "family-engagement": {
        title: "Family Engagement",
      },
      communications: {
        title: "Communications",
        subtitle: "School Messenger",
      },
      "attendance-support": {
        title: "Attendance Support",
      },
      "classroom-solutions": {
        title: "Classroom Solutions",
      },
      "learning-management-schoology": {
        title: "Learning Management",
        subtitle: "Learning Platform",
      },
      "assessment-performance-matters": {
        title: "Assessment",
        subtitle: "Performance Analytics",
      },
      "curriculum-instruction": {
        title: "Curriculum and Instruction",
      },
      "student-intervention": {
        title: "Student Intervention",
      },
      mtss: {
        title: "Multi-Tiered System of Supports",
      },
      "behavior-support": {
        title: "Behavior Support",
      },
      "college-career-life-readiness": {
        title: "College, Career and Life Readiness",
      },
      "cclr-naviance": {
        title: "Career and Life Readiness Guidance",
        subtitle: "Future Readiness",
      },
      "resource-planning": {
        title: "Resource Planning",
      },
      "financial-strategy-allovue": {
        title: "Financial Strategy",
        subtitle: "Financial Management",
      },
      "erp-systems": {
        title: "Enterprise Resource Planning",
      },
      "predictive-enrollment": {
        title: "Predictive Enrollment",
      },
      "talent-management": {
        title: "Talent Management",
      },
      "recruiting-and-hr": {
        title: "Recruiting and Human Resources",
      },
      "educator-support": {
        title: "Educator Support",
      },
    },
  },
};

/**
 * One card per sidebar dropdown section. Each group opens with its hub-overview
 * card so the router mirrors the left rail exactly (8 / 10 / 8 = 26 sections).
 */
const productBase: Record<
  ProductGroupId,
  {
    products: Array<{
      id: ProductId;
      icon: ReactNode;
      overview?: boolean;
    }>;
  }
> = {
  "home-connections": {
    products: [
      { id: "home-connections-panel", icon: <MdOutlineHub />, overview: true },
      { id: "student-information", icon: <MdOutlineSchool /> },
      { id: "sis", icon: <FaUsers /> },
      { id: "enrollment", icon: <MdOutlineFactCheck /> },
      { id: "special-programs", icon: <MdOutlineCelebration /> },
      { id: "family-engagement", icon: <MdOutlineFamilyRestroom /> },
      { id: "communications", icon: <MdOutlineChat /> },
      { id: "attendance-support", icon: <FaRegCircleQuestion /> },
    ],
  },
  "student-achievement": {
    products: [
      { id: "student-achievement", icon: <MdOutlineAnalytics />, overview: true },
      { id: "classroom-solutions", icon: <MdOutlineGridView /> },
      { id: "learning-management-schoology", icon: <MdOutlinePsychology /> },
      { id: "assessment-performance-matters", icon: <MdOutlineAnalytics /> },
      { id: "curriculum-instruction", icon: <MdOutlineMenuBook /> },
      { id: "student-intervention", icon: <FaRegCircleQuestion /> },
      { id: "mtss", icon: <MdOutlineHub /> },
      { id: "behavior-support", icon: <MdOutlineFavoriteBorder /> },
      { id: "college-career-life-readiness", icon: <FaRegStar /> },
      { id: "cclr-naviance", icon: <FaUsers /> },
    ],
  },
  "operational-excellence": {
    products: [
      { id: "operational-excellence", icon: <MdOutlineAutoAwesome />, overview: true },
      { id: "resource-planning", icon: <MdOutlineGridView /> },
      { id: "financial-strategy-allovue", icon: <MdOutlineAnalytics /> },
      { id: "erp-systems", icon: <MdOutlineAutoAwesome /> },
      { id: "predictive-enrollment", icon: <FaUsers /> },
      { id: "talent-management", icon: <MdOutlinePsychology /> },
      { id: "recruiting-and-hr", icon: <FaRegStar /> },
      { id: "educator-support", icon: <FaRegCircleQuestion /> },
    ],
  },
};

function getGroups(language: LanguageCode): ProductGroup[] {
  const text = textContent[language];

  return (Object.keys(productBase) as ProductGroupId[]).map((groupId) => ({
    id: groupId,
    title: text.groups[groupId],
    products: productBase[groupId].products.map((product) => ({
      ...product,
      title: text.products[product.id].title,
      subtitle: text.products[product.id].subtitle,
    })),
  }));
}

/**
 * SAVEED-01 — the "Home Connections" group button targeted the non-existent
 * `home-connections` id; its real rail panel is `home-connections-panel`.
 */
const groupScrollTargets: Record<ProductGroupId, string> = {
  // The legacy hub panels are gone; each group now targets the first catalog
  // main section of its legacy group on the rebuilt homepage.
  "home-connections": catalogSectionId(FEATURE_SHOWCASE[0].id),
  "student-achievement": catalogSectionId(FEATURE_SHOWCASE[5].id),
  "operational-excellence": catalogSectionId(FEATURE_SHOWCASE[10].id),
};

function scrollToProduct(id: string) {
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

  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

/** Shared signature easing — matches the site's --ease-smooth (see LandingHeroBanner). */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Regular section card — raised, bolder, hover-lifted to the brand red. */
function ProductCard({
  product,
  isSaved,
  onSave,
}: {
  product: ProductItem;
  isSaved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => scrollToProduct(product.id)}
        className={[
          "flex h-[132px] w-full flex-col items-center justify-center gap-1.5 rounded-[22px] border p-3 text-center",
          "border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] text-[var(--color-primary)]",
          "shadow-[0_16px_36px_-18px_color-mix(in_srgb,var(--color-primary)_42%,transparent)]",
          "transition duration-300 hover:-translate-y-1.5",
          "hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]",
          "hover:shadow-[0_28px_52px_-16px_color-mix(in_srgb,var(--color-action)_36%,transparent)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]",
        ].join(" ")}
      >
        <span className="mb-0.5 grid h-11 w-11 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] text-[26px] text-[var(--color-primary)] transition duration-300 group-hover:scale-110 group-hover:bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))] group-hover:text-[var(--color-action)]">
          {product.icon}
        </span>

        <h3 className="max-w-[150px] text-[13.5px] font-extrabold leading-[1.14] tracking-[-0.03em] text-[var(--color-primary)] transition-colors duration-300 group-hover:text-[var(--color-action)]">
          {product.title}
        </h3>

        {product.subtitle ? (
          <p className="text-[11px] font-semibold leading-none text-[var(--color-black)] opacity-60">
            {product.subtitle}
          </p>
        ) : null}
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSave();
        }}
        aria-label="Save section"
        aria-pressed={isSaved}
        className="absolute right-3 top-3 z-20 cursor-pointer text-[15px] text-[var(--color-primary)] transition duration-300 hover:scale-125 group-hover:text-[var(--color-action)]"
      >
        {isSaved ? <FaStar /> : <FaRegStar />}
      </button>
    </div>
  );
}

/** Hub-overview card — a full-width, inverse "cover" card for each group. */
function OverviewCard({
  product,
  overviewPill,
}: {
  product: ProductItem;
  overviewPill: string;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollToProduct(product.id)}
      className={[
        "group col-span-2 flex w-full items-center gap-3.5 rounded-[22px] p-4 text-left",
        "bg-[linear-gradient(135deg,var(--color-primary),color-mix(in_srgb,var(--color-primary)_78%,var(--color-action)))] text-[var(--color-white)]",
        "shadow-[0_20px_44px_-20px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]",
        "transition duration-300 hover:-translate-y-1",
        "hover:shadow-[0_28px_54px_-16px_color-mix(in_srgb,var(--color-action)_45%,transparent)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-action)]",
      ].join(" ")}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-white)_16%,transparent)] text-[26px] text-[var(--color-white)] transition duration-300 group-hover:scale-110">
        {product.icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-[color-mix(in_srgb,var(--color-white)_18%,transparent)] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em]">
            {overviewPill}
          </span>
        </span>
        <span className="mt-1 block truncate text-[15px] font-extrabold tracking-[-0.02em]">
          {product.title}
        </span>
        {product.subtitle ? (
          <span className="block truncate text-[11.5px] font-medium text-[color-mix(in_srgb,var(--color-white)_72%,transparent)]">
            {product.subtitle}
          </span>
        ) : null}
      </span>

      <FiArrowRight className="shrink-0 text-[18px] text-[color-mix(in_srgb,var(--color-white)_80%,transparent)] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--color-white)]" />
    </button>
  );
}

export default function ProductRouterSection() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = textContent[currentLanguage];

  const [tab, setTab] = useState<"saved" | "all">("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const groups = useMemo(() => getGroups(currentLanguage), [currentLanguage]);

  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Subtle per-column scroll drift so the router joins the homepage's
  // scroll-synchronised motion system (reversible; a SEPARATE element from the
  // reveal transform so the two never fight for `y`).
  const colDriftA = useTransform(scrollYProgress, [0, 1], [26, -26]);
  const colDriftB = useTransform(scrollYProgress, [0, 1], [10, -10]);
  const colDriftC = useTransform(scrollYProgress, [0, 1], [34, -34]);
  const colDrift = [colDriftA, colDriftB, colDriftC];

  const reveal = useMemo(() => {
    const stagger = (step: number): Variants => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: shouldReduceMotion ? 0 : step,
          delayChildren: shouldReduceMotion ? 0 : 0.04,
        },
      },
    });
    const up: Variants = shouldReduceMotion
      ? { hidden: { opacity: 0, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
      : {
          hidden: { opacity: 0, y: 44 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.65, ease: EASE, staggerChildren: 0.06, delayChildren: 0.04 },
          },
        };
    const card: Variants = shouldReduceMotion
      ? { hidden: { opacity: 0, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
      : {
          hidden: { opacity: 0, y: 18 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
        };
    const head: Variants = shouldReduceMotion
      ? { hidden: { opacity: 0, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
      : {
          hidden: { opacity: 0, y: 24 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
        };
    return { container: stagger(0.09), grid: stagger(0.09), up, card, head };
  }, [shouldReduceMotion]);

  // Scroll-driven reveal. We deliberately avoid `whileInView` (IntersectionObserver)
  // so the router joins the homepage's native scroll system and stays testable /
  // deterministic: a passive, rAF-throttled listener flips the variant state ONCE
  // the section is meaningfully on-screen (no reset on reverse scroll).
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (shouldReduceMotion) {
      setRevealed(true);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const shownTop = Math.max(r.top, 0);
        const shownBottom = Math.min(r.bottom, vh);
        const ratio = Math.max(0, shownBottom - shownTop) / Math.max(1, Math.min(r.height, vh));
        if (ratio > 0.16) {
          setRevealed(true);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    const sync = () => setSavedIds(readSavedSections());

    sync();

    window.addEventListener(SAVED_SECTIONS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SAVED_SECTIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggleSaved(id: ProductId) {
    setSavedIds(toggleSavedSection(id));
  }

  const visibleGroups = useMemo(() => {
    if (tab === "all") return groups;

    return groups
      .map((group) => ({
        ...group,
        products: group.products.filter((product) =>
          savedIds.includes(product.id)
        ),
      }))
      .filter((group) => group.products.length > 0);
  }, [tab, groups, savedIds]);

  const siteLinks = [
    { label: text.linkHome, href: "#intro", external: false },
    { label: text.linkHelpDesk, href: "/help-desk", external: true },
    { label: text.linkMyOs, href: "#my-connected-os", external: false },
    { label: text.linkExpert, href: "#connect", external: false },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-[var(--color-white)] px-4 py-16 text-[var(--color-primary)] sm:px-6 lg:px-8 lg:py-20"
    >
      {/* soft decorative glow so the section reads as a premium site-map band */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_srgb,var(--color-action)_7%,transparent),transparent_70%)]"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center">
        <motion.div
          variants={reveal.container}
          initial={shouldReduceMotion ? "show" : "hidden"}
          animate={revealed ? "show" : "hidden"}
          className="flex w-full flex-col items-center"
        >
          {/* Section intro — modernises the plain toggle-only opening. */}
          <motion.div variants={reveal.head} className="mb-8 flex max-w-2xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-action)_40%,transparent)] bg-[var(--color-action-tint)] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-action)]">
              <MdOutlineGridView className="text-[14px]" />
              {text.eyebrow}
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--color-primary)] sm:text-[32px]">
              {text.heading}
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-[color-mix(in_srgb,var(--color-black)_62%,var(--color-primary))]">
              {text.subheading}
            </p>
          </motion.div>

          {/* Saved / All toggle */}
          <motion.div
            variants={reveal.head}
            className="mb-10 flex overflow-hidden rounded-[16px] border border-[var(--color-primary)] bg-[var(--color-white)] p-1 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
          >
            <button
              type="button"
              onClick={() => setTab("saved")}
              className={[
                "flex h-[50px] items-center gap-2 rounded-[12px] px-5 text-[15px] font-bold transition duration-300 sm:px-7 sm:text-[17px]",
                tab === "saved"
                  ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-[0_10px_24px_color-mix(in_srgb,var(--color-action)_30%,transparent)]"
                  : "bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]",
              ].join(" ")}
            >
              <FaStar className="text-[17px]" />
              {text.saved}
            </button>

            <button
              type="button"
              onClick={() => setTab("all")}
              className={[
                "h-[50px] rounded-[12px] px-5 text-[15px] font-bold transition duration-300 sm:px-8 sm:text-[17px]",
                tab === "all"
                  ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-[0_10px_24px_color-mix(in_srgb,var(--color-action)_30%,transparent)]"
                  : "bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-action-tint)] hover:text-[var(--color-action)]",
              ].join(" ")}
            >
              {text.allProducts}
            </button>
          </motion.div>

          {visibleGroups.length === 0 ? (
            <motion.div
              variants={reveal.head}
              className="rounded-3xl border border-[var(--color-primary)] bg-[var(--color-white)] px-8 py-8 text-center shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
            >
              <h3 className="text-2xl font-bold text-[var(--color-primary)]">
                {text.noSavedTitle}
              </h3>

              <p className="mt-2 text-[15px] font-medium text-[var(--color-black)] opacity-70">
                {text.noSavedDescription}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={reveal.grid}
              className="grid w-full grid-cols-1 items-start gap-8 md:grid-cols-2 xl:grid-cols-3"
            >
              {visibleGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  style={{ y: shouldReduceMotion ? 0 : colDrift[index % colDrift.length] }}
                  className="relative flex flex-col items-center"
                >
                  <motion.div variants={reveal.up} className="flex w-full flex-col items-center">
                    <button
                      type="button"
                      onClick={() => scrollToProduct(groupScrollTargets[group.id])}
                      className={[
                        "relative z-20 inline-flex items-center gap-2 rounded-full border border-[var(--color-action)] px-6 py-3 text-[16px] font-bold",
                        "bg-[var(--color-action)] text-[var(--color-white)]",
                        "shadow-[0_16px_34px_color-mix(in_srgb,var(--color-action)_18%,transparent)]",
                        "transition duration-300 hover:-translate-y-1 hover:bg-[var(--color-action-hover)] hover:text-[var(--color-white)]",
                      ].join(" ")}
                    >
                      {group.title}
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--color-white)_22%,transparent)] px-2 py-0.5 text-[12px] font-bold tabular-nums">
                        {group.products.length}
                      </span>
                    </button>

                    <div className="h-7 w-[4px] bg-[var(--color-primary)]" />

                    <div className="group/wrap relative w-full rounded-[30px] border-2 border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[color-mix(in_srgb,var(--color-primary)_2%,var(--color-white))] p-3 shadow-[0_24px_54px_-24px_color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition-colors duration-300 hover:border-[var(--color-action)]">
                      <div className="relative z-10 grid grid-cols-2 gap-3">
                        {group.products.map((product) => {
                          if (product.overview) {
                            return (
                              <motion.div key={product.id} variants={reveal.card} className="col-span-2">
                                <OverviewCard
                                  product={product}
                                  overviewPill={text.overviewPill}
                                />
                              </motion.div>
                            );
                          }

                          const isSaved = savedIds.includes(product.id);

                          return (
                            <motion.div key={product.id} variants={reveal.card}>
                              <ProductCard
                                product={product}
                                isSaved={isSaved}
                                onSave={() => toggleSaved(product.id)}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Whole-website link strip — every top-level destination in one row. */}
          <motion.div
            variants={reveal.head}
            className="mt-14 w-full rounded-[26px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] px-6 py-6 sm:px-8"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {text.linksHeading}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
              {siteLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group inline-flex items-center gap-1.5 text-[14px] font-bold tracking-[-0.01em] text-[var(--color-primary)] transition-colors duration-200 hover:text-[var(--color-action)]"
                >
                  {link.label}
                  {link.external ? (
                    <FiArrowUpRight
                      aria-hidden
                      className="text-[13px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  ) : (
                    <FiArrowRight
                      aria-hidden
                      className="text-[13px] opacity-45 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                    />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

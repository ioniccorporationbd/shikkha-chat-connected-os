"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaStar,
  FaUsers,
} from "react-icons/fa6";
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
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";
type ProductGroupId =
  | "home-connections"
  | "student-achievement"
  | "operational-excellence";

type ProductId =
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
  featured?: boolean;
};

type ProductGroup = {
  id: ProductGroupId;
  title: string;
  products: ProductItem[];
};

const STORAGE_KEY = "connected-os-saved-products";

const colorPrimary = "var(--color-primary)";
const colorSecondary = "var(--color-secondary)";
const colorWhite = "var(--color-white)";
const colorBlack = "var(--color-black)";

const textContent = {
  bn: {
    saved: "সংরক্ষিত",
    allProducts: "সব পণ্য",
    noSavedTitle: "এখনও কোনো পণ্য সংরক্ষিত নেই",
    noSavedDescription: "সংরক্ষণ করতে যেকোনো পণ্যের স্টার আইকনে ক্লিক করুন।",
    saveProduct: "পণ্য সংরক্ষণ করুন",
    groups: {
      "home-connections": "হোম কানেকশন",
      "student-achievement": "শিক্ষার্থী অর্জন",
      "operational-excellence": "অপারেশনাল উৎকর্ষতা",
    },
    products: {
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
    saved: "Saved",
    allProducts: "All Products",
    noSavedTitle: "No saved products yet",
    noSavedDescription: "Click any star icon to save a product here.",
    saveProduct: "Save product",
    groups: {
      "home-connections": "Home Connections",
      "student-achievement": "Student Achievement",
      "operational-excellence": "Operational Excellence",
    },
    products: {
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
} as const;

const productBase: Record<
  ProductGroupId,
  {
    products: Array<{
      id: ProductId;
      icon: ReactNode;
      featured?: boolean;
    }>;
  }
> = {
  "home-connections": {
    products: [
      {
        id: "student-information",
        icon: <MdOutlineSchool />,
        featured: true,
      },
      {
        id: "sis",
        icon: <FaUsers />,
      },
      {
        id: "enrollment",
        icon: <MdOutlineFactCheck />,
      },
      {
        id: "special-programs",
        icon: <MdOutlineCelebration />,
      },
      {
        id: "family-engagement",
        icon: <MdOutlineFamilyRestroom />,
        featured: true,
      },
      {
        id: "communications",
        icon: <MdOutlineChat />,
      },
      {
        id: "attendance-support",
        icon: <FaRegCircleQuestion />,
      },
    ],
  },
  "student-achievement": {
    products: [
      {
        id: "classroom-solutions",
        icon: <MdOutlineGridView />,
        featured: true,
      },
      {
        id: "learning-management-schoology",
        icon: <MdOutlinePsychology />,
      },
      {
        id: "assessment-performance-matters",
        icon: <MdOutlineAnalytics />,
      },
      {
        id: "curriculum-instruction",
        icon: <MdOutlineMenuBook />,
      },
      {
        id: "student-intervention",
        icon: <FaRegCircleQuestion />,
        featured: true,
      },
      {
        id: "mtss",
        icon: <MdOutlineHub />,
      },
      {
        id: "behavior-support",
        icon: <MdOutlineFavoriteBorder />,
      },
      {
        id: "college-career-life-readiness",
        icon: <FaRegStar />,
        featured: true,
      },
      {
        id: "cclr-naviance",
        icon: <FaUsers />,
      },
    ],
  },
  "operational-excellence": {
    products: [
      {
        id: "resource-planning",
        icon: <MdOutlineGridView />,
        featured: true,
      },
      {
        id: "financial-strategy-allovue",
        icon: <MdOutlineAnalytics />,
      },
      {
        id: "erp-systems",
        icon: <MdOutlineAutoAwesome />,
      },
      {
        id: "predictive-enrollment",
        icon: <FaUsers />,
      },
      {
        id: "talent-management",
        icon: <MdOutlinePsychology />,
        featured: true,
      },
      {
        id: "recruiting-and-hr",
        icon: <FaRegStar />,
      },
      {
        id: "educator-support",
        icon: <FaRegCircleQuestion />,
      },
    ],
  },
};

function getGroups(language: LanguageCode): ProductGroup[] {
  const text = textContent[language];

  return (
    Object.keys(productBase) as ProductGroupId[]
  ).map((groupId) => ({
    id: groupId,
    title: text.groups[groupId],
    products: productBase[groupId].products.map((product) => ({
      ...product,
      title: text.products[product.id].title,
      subtitle: text.products[product.id].subtitle,
    })),
  }));
}

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

function readSavedIds(): ProductId[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ProductId => typeof item === "string");
  } catch {
    return [];
  }
}

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
    <button
      type="button"
      onClick={() => scrollToProduct(product.id)}
      className={[
        "group relative flex h-[124px] flex-col justify-center rounded-[18px] border p-3 text-center",
        "border-[var(--color-primary)] bg-[var(--color-white)] text-[var(--color-primary)]",
        "shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]",
        "transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-secondary)]",
        "hover:shadow-[0_22px_46px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]",
        product.featured ? "items-start text-left" : "items-center",
      ].join(" ")}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation();
          onSave();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onSave();
          }
        }}
        className="absolute right-3 top-3 z-20 cursor-pointer text-[15px] text-[var(--color-primary)] transition hover:scale-125"
        aria-label="Save product"
      >
        {isSaved ? <FaStar /> : <FaRegStar />}
      </span>

      {!product.featured ? (
        <div className="mb-2 text-[30px] text-[var(--color-primary)] transition duration-300 group-hover:scale-110">
          {product.icon}
        </div>
      ) : (
        <div className="mb-2 text-[26px] text-[var(--color-primary)] transition duration-300 group-hover:scale-110">
          {product.icon}
        </div>
      )}

      <h3
        className={[
          "max-w-[125px] text-[13px] font-bold leading-[1.12] tracking-[-0.03em] text-[var(--color-primary)]",
          product.featured ? "uppercase" : "",
        ].join(" ")}
      >
        {product.title}
      </h3>

      {product.subtitle ? (
        <p className="mt-1 text-[11px] font-medium leading-none text-[var(--color-black)] opacity-65">
          {product.subtitle}
        </p>
      ) : null}
    </button>
  );
}

export default function ProductRouterSection() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = textContent[currentLanguage];

  const [tab, setTab] = useState<"saved" | "all">("all");
  const [savedIds, setSavedIds] = useState<ProductId[]>([]);

  const groups = useMemo(() => getGroups(currentLanguage), [currentLanguage]);

  useEffect(() => {
    setSavedIds(readSavedIds());
  }, []);

  function toggleSaved(id: ProductId) {
    setSavedIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      return next;
    });
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

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--color-white)] px-4 py-16 text-[var(--color-primary)] sm:px-6 lg:px-8 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.08]" />

      <div className="pointer-events-none absolute left-1/2 top-12 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[var(--color-secondary)] opacity-70 blur-[90px]" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center">
        <div className="mb-10 flex overflow-hidden rounded-[16px] border border-[var(--color-primary)] bg-[var(--color-white)] p-1 shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
          <button
            type="button"
            onClick={() => setTab("saved")}
            className={[
              "flex h-[50px] items-center gap-2 rounded-[12px] px-5 text-[15px] font-bold transition-all duration-300 sm:px-7 sm:text-[17px]",
              tab === "saved"
                ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                : "bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
            ].join(" ")}
          >
            <FaStar className="text-[17px]" />
            {text.saved}
          </button>

          <button
            type="button"
            onClick={() => setTab("all")}
            className={[
              "h-[50px] rounded-[12px] px-5 text-[15px] font-bold transition-all duration-300 sm:px-8 sm:text-[17px]",
              tab === "all"
                ? "bg-[var(--color-primary)] text-[var(--color-white)]"
                : "bg-[var(--color-white)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
            ].join(" ")}
          >
            {text.allProducts}
          </button>
        </div>

        {visibleGroups.length === 0 ? (
          <div className="rounded-3xl border border-[var(--color-primary)] bg-[var(--color-white)] px-8 py-8 text-center shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_12%,transparent)]">
            <h3 className="text-2xl font-bold text-[var(--color-primary)]">
              {text.noSavedTitle}
            </h3>

            <p className="mt-2 text-[15px] font-medium text-[var(--color-black)] opacity-70">
              {text.noSavedDescription}
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 items-start gap-8 md:grid-cols-2 xl:grid-cols-3">
            {visibleGroups.map((group) => (
              <div key={group.id} className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => scrollToProduct(group.id)}
                  className={[
                    "relative z-20 rounded-full border border-[var(--color-primary)] px-7 py-3 text-[16px] font-bold",
                    "bg-[var(--color-primary)] text-[var(--color-white)]",
                    "shadow-[0_16px_34px_color-mix(in_srgb,var(--color-primary)_18%,transparent)]",
                    "transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {group.title}
                </button>

                <div className="h-7 w-[4px] bg-[var(--color-primary)]" />

                <div className="relative w-full rounded-[30px] border-[4px] border-[var(--color-primary)] bg-[var(--color-white)] p-3 shadow-[0_24px_54px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]">
                  <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-[linear-gradient(180deg,var(--color-white),var(--color-secondary))] opacity-35" />

                  <div className="relative z-10 grid grid-cols-2 gap-3">
                    {group.products.map((product) => {
                      const isSaved = savedIds.includes(product.id);

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isSaved={isSaved}
                          onSave={() => toggleSaved(product.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </section>
  );
}
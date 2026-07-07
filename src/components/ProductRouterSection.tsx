"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FaRegCircleQuestion, FaRegStar, FaStar, FaUsers } from "react-icons/fa6";
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

type ProductItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  featured?: boolean;
};

type ProductGroup = {
  id: string;
  title: string;
  color: string;
  light: string;
  dark: string;
  products: ProductItem[];
};

const STORAGE_KEY = "connected-os-saved-products";

const groups: ProductGroup[] = [
  {
    id: "home-connections",
    title: "Home Connections",
    color: "#16423C",
    light: "#EDE6B3",
    dark: "#16423C",
    products: [
      {
        id: "student-information",
        title: "Student Information",
        icon: <MdOutlineSchool />,
        featured: true,
      },
      {
        id: "sis",
        title: "SIS",
        subtitle: "SIS",
        icon: <FaUsers />,
      },
      {
        id: "enrollment",
        title: "Enrollment",
        icon: <MdOutlineFactCheck />,
      },
      {
        id: "special-programs",
        title: "Special Programs",
        icon: <MdOutlineCelebration />,
      },
      {
        id: "family-engagement",
        title: "Family Engagement",
        icon: <MdOutlineFamilyRestroom />,
        featured: true,
      },
      {
        id: "communications",
        title: "Communications",
        subtitle: "SchoolMessenger",
        icon: <MdOutlineChat />,
      },
      {
        id: "attendance-support",
        title: "Attendance Support",
        icon: <FaRegCircleQuestion />,
      },
    ],
  },
  {
    id: "student-achievement",
    title: "Student Achievement",
    color: "#EDE6B3",
    light: "#fff9d7",
    dark: "#16423C",
    products: [
      {
        id: "classroom-solutions",
        title: "Classroom Solutions",
        icon: <MdOutlineGridView />,
        featured: true,
      },
      {
        id: "learning-management-schoology",
        title: "Learning Management",
        subtitle: "Schoology",
        icon: <MdOutlinePsychology />,
      },
      {
        id: "assessment-performance-matters",
        title: "Assessment",
        subtitle: "Performance Matters",
        icon: <MdOutlineAnalytics />,
      },
      {
        id: "curriculum-instruction",
        title: "Curriculum & Instruction",
        icon: <MdOutlineMenuBook />,
      },
      {
        id: "student-intervention",
        title: "Student Intervention",
        icon: <FaRegCircleQuestion />,
        featured: true,
      },
      {
        id: "mtss",
        title: "MTSS",
        icon: <MdOutlineHub />,
      },
      {
        id: "behavior-support",
        title: "Behavior Support",
        icon: <MdOutlineFavoriteBorder />,
      },
      {
        id: "college-career-life-readiness",
        title: "College, Career & Life Readiness",
        icon: <FaRegStar />,
        featured: true,
      },
      {
        id: "cclr-naviance",
        title: "CCLR Naviance",
        subtitle: "Naviance",
        icon: <FaUsers />,
      },
    ],
  },
  {
    id: "operational-excellence",
    title: "Operational Excellence",
    color: "#16423C",
    light: "#EDE6B3",
    dark: "#16423C",
    products: [
      {
        id: "resource-planning",
        title: "Resource Planning",
        icon: <MdOutlineGridView />,
        featured: true,
      },
      {
        id: "financial-strategy-allovue",
        title: "Financial Strategy",
        subtitle: "Allovue",
        icon: <MdOutlineAnalytics />,
      },
      {
        id: "erp-systems",
        title: "ERP Systems",
        icon: <MdOutlineAutoAwesome />,
      },
      {
        id: "predictive-enrollment",
        title: "Predictive Enrollment",
        icon: <FaUsers />,
      },
      {
        id: "talent-management",
        title: "Talent Management",
        icon: <MdOutlinePsychology />,
        featured: true,
      },
      {
        id: "recruiting-and-hr",
        title: "Recruiting & Human Resources",
        icon: <FaRegStar />,
      },
      {
        id: "educator-support",
        title: "Educator Support",
        icon: <FaRegCircleQuestion />,
      },
    ],
  },
];

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

function formatTitle(title: string) {
  return title.replace("&", "&");
}

export default function ProductRouterSection() {
  const [tab, setTab] = useState<"saved" | "all">("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedIds(JSON.parse(saved));
    }
  }, []);

  function toggleSaved(id: string) {
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
        products: group.products.filter((product) => savedIds.includes(product.id)),
      }))
      .filter((group) => group.products.length > 0);
  }, [tab, savedIds]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--sc-surface)] px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#b8c8d8_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.75]" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-12 flex overflow-hidden rounded-[10px] border border-[var(--sc-primary)] bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={() => setTab("saved")}
            className={[
              "flex h-[54px] items-center gap-2 px-7 text-[18px] font-semibold transition",
              tab === "saved"
                ? "bg-[var(--sc-primary)] text-white"
                : "bg-white text-[var(--sc-primary)]",
            ].join(" ")}
          >
            <FaStar className="text-[18px]" />
            Saved
          </button>

          <button
            type="button"
            onClick={() => setTab("all")}
            className={[
              "h-[54px] px-8 text-[18px] font-semibold transition",
              tab === "all"
                ? "bg-[var(--sc-primary)] text-white"
                : "bg-white text-[var(--sc-primary)]",
            ].join(" ")}
          >
            All Products
          </button>
        </div>

        {visibleGroups.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-center shadow-xl">
            <h3 className="text-2xl font-semibold text-slate-900">
              No saved products yet
            </h3>
            <p className="mt-2 text-slate-500">
              Star a product to keep it here.
            </p>
          </div>
        ) : (
          <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {visibleGroups.map((group) => (
              <div key={group.id} className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => scrollToProduct(group.id)}
                  className="relative z-20 rounded-full px-7 py-3 text-[18px] font-semibold text-black shadow-[0_12px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
                  style={{ backgroundColor: group.color }}
                >
                  {group.title}
                </button>

                <div
                  className="h-7 w-[4px]"
                  style={{ backgroundColor: group.color }}
                />

                <div
                  className="relative w-full rounded-[30px] border-[4px] bg-white/20 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
                  style={{ borderColor: group.color }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {group.products.map((product) => {
                      const isSaved = savedIds.includes(product.id);

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => scrollToProduct(product.id)}
                          className={[
                            "group relative flex h-[118px] flex-col items-center justify-center rounded-[16px] border border-slate-200 p-3 text-center",
                            "transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]",
                            product.featured ? "items-start text-left" : "bg-[var(--sc-secondary-light)]",
                          ].join(" ")}
                          style={{
                            background: product.featured
                              ? group.light
                              : "linear-gradient(180deg,#ffffff,#fff9d7)",
                          }}
                        >
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSaved(product.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                toggleSaved(product.id);
                              }
                            }}
                            className="absolute right-3 top-3 z-20 cursor-pointer text-[15px] text-slate-600 transition hover:scale-125"
                            aria-label="Save product"
                          >
                            {isSaved ? (
                              <FaStar style={{ color: group.dark }} />
                            ) : (
                              <FaRegStar />
                            )}
                          </span>

                          {!product.featured ? (
                            <div
                              className="mb-2 text-[30px]"
                              style={{ color: group.dark }}
                            >
                              {product.icon}
                            </div>
                          ) : null}

                          <h3
                            className={[
                              "max-w-[115px] text-[13px] leading-[1.12] tracking-[-0.03em] text-black",
                              product.featured ? "font-semibold uppercase" : "font-semibold",
                            ].join(" ")}
                          >
                            {formatTitle(product.title)}
                          </h3>

                          {product.subtitle ? (
                            <p className="mt-1 text-[11px] leading-none text-slate-500">
                              {product.subtitle}
                            </p>
                          ) : null}
                        </button>
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
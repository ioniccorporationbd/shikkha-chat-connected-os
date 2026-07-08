"use client";

import OrbitProductPanel from "@/components/MiddleSectionShared/OrbitProductPanel";
import { FaRegCircleQuestion, FaRegStar, FaUsers } from "react-icons/fa6";
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";
import { useLanguage } from "@/lib/language";


type LanguageCode = "bn" | "en";

const sectionTranslations: Record<string, string> = {
  "Operational Excellence": "অপারেশনাল উৎকর্ষতা",
  "Operations Hub": "অপারেশন হাব",
  "Resource Planning": "রিসোর্স পরিকল্পনা",
  "Planning": "পরিকল্পনা",
  "Financial Strategy": "আর্থিক কৌশল",
  "Allovue": "আর্থিক ব্যবস্থাপনা",
  "ERP Systems": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা",
  "Core ERP": "মূল এন্টারপ্রাইজ রিসোর্স পরিকল্পনা",
  "Predictive Enrollment": "পূর্বাভাসভিত্তিক ভর্তি ব্যবস্থাপনা",
  "Forecasting": "পূর্বাভাস",
  "Talent Management": "প্রতিভা ব্যবস্থাপনা",
  "People": "মানুষ",
  "Recruiting and HR": "নিয়োগ ও মানবসম্পদ",
  "Hiring": "নিয়োগ",
  "Educator Support": "শিক্ষক সহায়তা",
  "Staff Success": "স্টাফ সাফল্য",
  "Hiring Workflow": "নিয়োগ কার্যধারা",
  "Planning Hub": "পরিকল্পনা হাব",
  "Finance Strategy": "আর্থিক কৌশল",
  "Finance Planning": "আর্থিক পরিকল্পনা",
  "Enrollment Forecasting": "ভর্তি পূর্বাভাস",
  "People Operations": "মানবসম্পদ পরিচালনা",
  "Talent Planning": "প্রতিভা পরিকল্পনা",
  "Connected Operations": "সংযুক্ত অপারেশন",
  "Connected Capability": "সংযুক্ত সক্ষমতা",
  "ERP Core": "মূল এন্টারপ্রাইজ ব্যবস্থা",
  "Close detail": "বিস্তারিত বন্ধ করুন",
  "Open Section": "সেকশন খুলুন",
  "Resource Planning helps school leaders align budgets, staffing, programs, and operational priorities with better visibility.": "রিসোর্স পরিকল্পনা স্কুল নেতৃত্বকে বাজেট, জনবল, কার্যক্রম এবং অপারেশনাল অগ্রাধিকার আরও পরিষ্কারভাবে মিলিয়ে নিতে সাহায্য করে।",
  "Resource Planning helps leaders align people, budgets, programs, and priorities with better visibility.": "রিসোর্স পরিকল্পনা নেতৃত্বকে মানুষ, বাজেট, কার্যক্রম এবং অগ্রাধিকার আরও পরিষ্কারভাবে মিলিয়ে নিতে সাহায্য করে।",
  "Resource Planning aligns people, programs, budgets, and priorities into a clearer planning process.": "রিসোর্স পরিকল্পনা মানুষ, কার্যক্রম, বাজেট এবং অগ্রাধিকারকে আরও পরিষ্কার পরিকল্পনা প্রক্রিয়ায় যুক্ত করে।",
  "Financial Strategy connects budgets, spending visibility, finance planning, and operational priorities.": "আর্থিক কৌশল বাজেট, ব্যয়ের দৃশ্যমানতা, আর্থিক পরিকল্পনা এবং অপারেশনাল অগ্রাধিকারকে সংযুক্ত করে।",
  "Financial Strategy connects budgets, spending visibility, and finance planning with operational priorities.": "আর্থিক কৌশল বাজেট, ব্যয়ের দৃশ্যমানতা এবং আর্থিক পরিকল্পনাকে অপারেশনাল অগ্রাধিকারের সাথে যুক্ত করে।",
  "ERP Systems connect finance, HR, purchasing, payroll, operations, and administrative workflows into one central business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অর্থ, মানবসম্পদ, ক্রয়, পেরোল, অপারেশন এবং প্রশাসনিক কাজকে একটি কেন্দ্রীয় ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "ERP Systems connect finance, HR, purchasing, operations, and administrative workflows into one central business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অর্থ, মানবসম্পদ, ক্রয়, অপারেশন এবং প্রশাসনিক কাজকে একটি কেন্দ্রীয় ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "ERP Systems connect operations, finance, purchasing, payroll, HR, and administration through one trusted business system.": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা অপারেশন, অর্থ, ক্রয়, পেরোল, মানবসম্পদ এবং প্রশাসনকে একটি নির্ভরযোগ্য ব্যবসায়িক ব্যবস্থায় যুক্ত করে।",
  "Operational Excellence brings school business systems together so leaders can plan, manage, and act with confidence.": "অপারেশনাল উৎকর্ষতা স্কুলের ব্যবসায়িক ব্যবস্থাগুলোকে একত্র করে, যাতে নেতৃত্ব আত্মবিশ্বাসের সাথে পরিকল্পনা, ব্যবস্থাপনা এবং সিদ্ধান্ত নিতে পারে।",
  "Operational Excellence brings every operational system together so leaders can plan, manage, and act with confidence.": "অপারেশনাল উৎকর্ষতা প্রতিটি অপারেশনাল ব্যবস্থাকে একত্র করে, যাতে নেতৃত্ব আত্মবিশ্বাসের সাথে পরিকল্পনা, ব্যবস্থাপনা এবং সিদ্ধান্ত নিতে পারে।",
  "Talent Management supports staff growth, role planning, performance, and people-centered operational decisions.": "প্রতিভা ব্যবস্থাপনা স্টাফের বৃদ্ধি, ভূমিকা পরিকল্পনা, পারফরম্যান্স এবং মানুষকেন্দ্রিক অপারেশনাল সিদ্ধান্তকে সহায়তা করে।",
  "Talent Management supports staff development, role planning, performance, and people-centered operational decisions.": "প্রতিভা ব্যবস্থাপনা স্টাফ উন্নয়ন, ভূমিকা পরিকল্পনা, পারফরম্যান্স এবং মানুষকেন্দ্রিক অপারেশনাল সিদ্ধান্তকে সহায়তা করে।",
  "Talent Management supports employee growth, staff planning, role visibility, and people-centered school operations.": "প্রতিভা ব্যবস্থাপনা কর্মী উন্নয়ন, স্টাফ পরিকল্পনা, ভূমিকার দৃশ্যমানতা এবং মানুষকেন্দ্রিক স্কুল অপারেশনকে সহায়তা করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, applicant tracking, and human resource workflows with school operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড, আবেদনকারী ট্র্যাকিং এবং মানবসম্পদ কার্যধারাকে স্কুল অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, and HR workflows with school operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড এবং মানবসম্পদ কার্যধারাকে স্কুল অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, onboarding, staff records, and HR workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, অনবোর্ডিং, স্টাফ রেকর্ড এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, staff records, onboarding, and human resources workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, স্টাফ রেকর্ড, অনবোর্ডিং এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Recruiting and HR connects hiring, staff records, onboarding, and HR workflows with district operations.": "নিয়োগ ও মানবসম্পদ নিয়োগ, স্টাফ রেকর্ড, অনবোর্ডিং এবং মানবসম্পদ কার্যধারাকে ডিস্ট্রিক্ট অপারেশনের সাথে যুক্ত করে।",
  "Educator Support helps leaders support teacher growth, staff development, coaching, and instructional success.": "শিক্ষক সহায়তা নেতৃত্বকে শিক্ষক উন্নয়ন, স্টাফ বিকাশ, কোচিং এবং পাঠদান সাফল্য সহায়তা করতে সাহায্য করে।"
};

function useSectionText() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;

  return (text?: string) => {
    if (!text) return "";
    if (currentLanguage === "en") return text;
    return sectionTranslations[text] ?? text;
  };
}


const products = [
    { id: "operational-excellence", title: "Operational Excellence", subtitle: "Operations Hub", icon: <MdOutlineHub />, highlight: true },
    { id: "resource-planning", title: "Resource Planning", subtitle: "Planning", icon: <MdOutlineGridView />, highlight: false },
    { id: "financial-strategy-allovue", title: "Financial Strategy", subtitle: "Allovue", icon: <MdOutlineAnalytics />, highlight: false },
    { id: "erp-systems", title: "ERP Systems", subtitle: "Core ERP", icon: <MdOutlineAutoAwesome />, highlight: false },
    { id: "predictive-enrollment", title: "Predictive Enrollment", subtitle: "Forecasting", icon: <FaUsers />, highlight: false },
    { id: "talent-management", title: "Talent Management", subtitle: "People", icon: <MdOutlinePsychology />, highlight: false },
    { id: "recruiting-and-hr", title: "Recruiting and HR", subtitle: "Hiring", icon: <FaRegStar />, highlight: false },
    { id: "educator-support", title: "Educator Support", subtitle: "Staff Success", icon: <FaRegCircleQuestion />, highlight: false },
];

export default function OperationalExcellenceOverview() {
  const t = useSectionText();
  const localizedProducts = products.map((product) => ({
    ...product,
    title: t(product.title),
    subtitle: t(product.subtitle),
  }));

  return (
    <OrbitProductPanel
      title={t("Operational Excellence")}
      activeId="operational-excellence"
      products={localizedProducts}
      themeColor="var(--color-secondary)"
      darkColor="var(--color-primary)"
      glowColor="color-mix(in srgb, var(--color-primary) 18%, transparent)"
    />
  );
}

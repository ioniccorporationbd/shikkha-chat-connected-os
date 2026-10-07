"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuLandmark } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "আর্থিক কৌশল",
    title: "প্রতিটি আর্থিক সিদ্ধান্তকে আরও কৌশলগত করুন।",
    description: "Admission fee, monthly fee, exam fee, transport fee, payment, due tracking ও collection report-কে structuredভাবে পরিচালনা করুন—ERP-backed architecture আর্থিক ব্যবস্থাপনাকে আরও সংগঠিত করে।",
    supporting: "আর্থিক ডেটা operations-এর সাথে যুক্ত হওয়ায় নেতৃত্ব প্রতিষ্ঠানের অগ্রাধিকারের পরিষ্কার চিত্র নিয়ে বাজেট পরিকল্পনা করতে পারে।",
    capabilities: [
      "Operations-এর সাথে যুক্ত finance",
      "Budget ও অগ্রাধিকারের দৃশ্যমানতা",
      "আরও পরিষ্কার কৌশলগত পরিকল্পনা",
    ],
    stats: [
      { value: "Fee ব্যবস্থাপনা", label: "Admission, monthly, exam, transport fee ও due tracking" },
      { value: "সংগঠিত report", label: "Daily collection summary ও report" },
    ],
    quote: "ERP-backed architecture আর্থিক ব্যবস্থাপনাকে আরও structured করার সুযোগ তৈরি করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Financial Strategy",
    title: "Make every financial decision more strategic.",
    description: "Manage admission fees, monthly fees, exam fees, transport fees, payments, due tracking, and collection reports in a structured way—an ERP-backed architecture keeps financial management organized.",
    supporting: "Because financial data connects to operations, leadership can plan budgets with a clearer picture of institutional priorities.",
    capabilities: [
      "Finance connected to operations",
      "Budget and priority visibility",
      "Clearer strategic planning",
    ],
    stats: [
      { value: "Fee management", label: "Admission, monthly, exam, transport fees and due tracking" },
      { value: "Organized reporting", label: "Daily collection summaries and reports" },
    ],
    quote: "An ERP-backed architecture creates the opportunity to structure financial management.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function FinancialStrategyAllovuePanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="financial-strategy-allovue"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuLandmark}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

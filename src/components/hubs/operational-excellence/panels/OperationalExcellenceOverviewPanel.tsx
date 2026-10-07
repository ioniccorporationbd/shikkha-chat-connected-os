"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "অপারেশনাল উৎকর্ষতা",
    title: "সংযুক্ত ডেটা দিয়ে স্মার্ট প্রতিষ্ঠান পরিচালনা।",
    description: "অর্থ, মানবসম্পদ, রিসোর্স পরিকল্পনা, ERP, ভর্তি ও শিক্ষক সহায়তা—সব একটি ERP-backed architecture-এ যুক্ত করে management-কে সঠিক সিদ্ধান্ত নিতে সহায়তা করুন।",
    stats: [
      { value: "ERP-backed", label: "Finance, HR ও operations এক কাঠামোয়" },
      { value: "ব্যবস্থাপনার অন্তর্দৃষ্টি", label: "Report-ভিত্তিক দ্রুত সিদ্ধান্ত" },
    ],
    quote: "Management যেন প্রয়োজনীয় তথ্যের ভিত্তিতে দ্রুত সিদ্ধান্ত নিতে পারে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Operational Excellence",
    title: "Run smarter operations with connected data.",
    description: "Connect finance, HR, resource planning, ERP, admissions, and educator support on one ERP-backed architecture so management can make the right decisions.",
    stats: [
      { value: "ERP-backed", label: "Finance, HR, and operations in one structure" },
      { value: "Management insight", label: "Report-based, faster decisions" },
    ],
    quote: "So management can make fast decisions based on the information they need.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function OperationalExcellenceOverviewPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="operational-excellence"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

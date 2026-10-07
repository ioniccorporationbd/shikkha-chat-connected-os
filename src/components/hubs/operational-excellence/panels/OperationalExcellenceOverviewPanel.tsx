"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuGauge } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "অপারেশনাল উৎকর্ষতা",
    title: "সংযুক্ত ডেটা দিয়ে স্মার্ট প্রতিষ্ঠান পরিচালনা।",
    description: "অর্থ, মানবসম্পদ, রিসোর্স পরিকল্পনা, ERP, ভর্তি ও শিক্ষক সহায়তা—সব একটি ERP-backed architecture-এ যুক্ত করে management-কে সঠিক সিদ্ধান্ত নিতে সহায়তা করুন।",
    supporting: "অর্থ, HR ও operations একই ভিত্তি শেয়ার করায় management আলাদা রিপোর্ট মিলিয়ে না দেখেই সামঞ্জস্যপূর্ণ তথ্যের ভিত্তিতে সিদ্ধান্ত নিতে পারে।",
    capabilities: [
      "Finance, HR ও operations এক কাঠামোয়",
      "সংযুক্ত ERP-backed ডেটা",
      "Management-এর জন্য report-ভিত্তিক সিদ্ধান্ত",
    ],
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
    supporting: "Because finance, HR, and operations share one foundation, management can act on consistent information instead of reconciling separate reports.",
    capabilities: [
      "Finance, HR, and operations in one structure",
      "Connected ERP-backed data",
      "Report-based decisions for management",
    ],
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
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuGauge}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

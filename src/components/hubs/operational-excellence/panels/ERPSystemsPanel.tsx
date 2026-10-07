"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuServer } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "ইআরপি সিস্টেম",
    title: "মূল ব্যবস্থাকে আধুনিক, ERP-backed foundation দিন।",
    description: "Finance, purchasing, HR, payroll ও administrative workflow-কে ERPNext-compatible architecture-এ যুক্ত করুন, যাতে প্রতিষ্ঠানের core operation নির্ভরযোগ্যভাবে চলে।",
    supporting: "মূল operation একটি শেয়ার করা ERP ভিত্তিতে চালিত হওয়ায় finance, HR ও administrative workflow সামঞ্জস্যপূর্ণ ও নির্ভরযোগ্য থাকে।",
    capabilities: [
      "ERPNext-compatible architecture",
      "Finance, HR ও admin workflow একসাথে",
      "নির্ভরযোগ্য enterprise ডেটা ফাউন্ডেশন",
    ],
    stats: [
      { value: "ERPNext-compatible", label: "এন্টারপ্রাইজ-মানের ERP আর্কিটেকচার" },
      { value: "সংযুক্ত", label: "Finance, HR ও administrative workflow একসাথে" },
    ],
    quote: "ERP-backed architecture একটি powerful enterprise data management foundation দেয়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "ERP Systems",
    title: "Give the core system a modern, ERP-backed foundation.",
    description: "Connect finance, purchasing, HR, payroll, and administrative workflows on an ERPNext-compatible architecture so the institution's core operation runs reliably.",
    supporting: "Because core operations run on a shared ERP foundation, finance, HR, and administrative workflows stay consistent and reliable.",
    capabilities: [
      "ERPNext-compatible architecture",
      "Finance, HR, and admin workflow together",
      "A reliable enterprise data foundation",
    ],
    stats: [
      { value: "ERPNext-compatible", label: "Enterprise-grade ERP architecture" },
      { value: "Connected", label: "Finance, HR, and administrative workflow together" },
    ],
    quote: "An ERP-backed architecture provides a powerful enterprise data management foundation.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function ERPSystemsPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="erp-systems"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuServer}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

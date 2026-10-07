
"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuDatabase } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী তথ্য ব্যবস্থা",
    title: "ছড়িয়ে থাকা তথ্য নয়—একটি নির্ভরযোগ্য উৎস।",
    description: "ERP-backed architecture ব্যবহার করে ভর্তি, সময়সূচি, উপস্থিতি, গ্রেড ও কার্যক্রমের তথ্য একটি কেন্দ্রীভূত, structured record হিসেবে রক্ষণাবেক্ষণ করুন।",
    supporting: "প্রতিটি record permission-নিয়ন্ত্রিত ও ট্রেসযোগ্য হওয়ায় রিপোর্ট তৈরি সহজ হয় এবং ভবিষ্যতের automation একই structured ডেটার উপর গড়ে তোলা যায়।",
    capabilities: [
      "ERP-ভিত্তিক ডেটা ফাউন্ডেশন",
      "Permission-নিয়ন্ত্রিত, ট্রেসযোগ্য রেকর্ড",
      "রিপোর্টের জন্য প্রস্তুত structured তথ্য",
    ],
    stats: [
      { value: "ERP-ভিত্তিক", label: "এন্টারপ্রাইজ-মানের সুসংগঠিত ডেটা ভিত্তি" },
      { value: "অডিট-বান্ধব", label: "Permission-নিয়ন্ত্রিত, ট্রেসযোগ্য record" },
    ],
    quote: "কেন্দ্রীভূত তথ্য reporting সহজ করে, permission নিয়ন্ত্রণ বাড়ায় এবং ভবিষ্যতের automation সম্ভব করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Student Information System",
    title: "Not scattered data—one reliable source.",
    description: "An ERP-backed architecture keeps enrollment, schedules, attendance, grades, and activity data as one centralized, structured record.",
    supporting: "Because every record is permission-controlled and traceable, reporting becomes straightforward and future automation can build on the same structured data.",
    capabilities: [
      "ERP-backed data foundation",
      "Permission-controlled, traceable records",
      "Reporting-ready structured information",
    ],
    stats: [
      { value: "ERP-backed", label: "An enterprise-grade structured data foundation" },
      { value: "Audit-friendly", label: "Permission-controlled, traceable records" },
    ],
    quote: "Centralized information makes reporting easier, strengthens permission control, and enables future automation.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function StudentInformationSystemPanel() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = sectionText[currentLanguage];

  return (
    <section
      lang={currentLanguage}
      className="home-connections-section text-[var(--color-primary)]"
    >
      <SectionPanel
        id="sis"
        pill={text.pill}
        pillStyle="solid"
        title={text.title}
        description={text.description}
        supporting={text.supporting}
        capabilities={text.capabilities}
        icon={LuDatabase}
        stats={text.stats}
        quote={text.quote}
        author={text.author}
        role={text.role}
      />
    </section>
  );
}

"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuRoute } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
    title: "Career ও জীবন প্রস্তুতির দিকনির্দেশনা এক জায়গায়।",
    description: "শিক্ষার্থীর academic তথ্য ও ফলাফল structuredভাবে রাখুন, যাতে career ও higher-study সংক্রান্ত দিকনির্দেশনার জন্য প্রয়োজনীয় তথ্য সহজে পাওয়া যায়।",
    supporting: "অ্যাকাডেমিক record structured থাকায় পরামর্শদাতা ও কর্মীরা নির্ভরযোগ্য তথ্য নিয়ে শিক্ষার্থীদের career ও higher-study-এর দিকে দিকনির্দেশনা দিতে পারেন।",
    capabilities: [
      "সুসংগঠিত অ্যাকাডেমিক record",
      "ফলাফল ও অগ্রগতি এক জায়গায়",
      "দিকনির্দেশনার জন্য প্রস্তুত তথ্য",
    ],
    stats: [
      { value: "একাডেমিক রেকর্ড", label: "ফলাফল ও অগ্রগতির তথ্য এক জায়গায়" },
      { value: "প্রস্তুত তথ্য", label: "দিকনির্দেশনার জন্য তথ্য প্রস্তুত" },
    ],
    quote: "সঠিক তথ্য থাকলে শিক্ষার্থীদের জন্য দিকনির্দেশনা দেওয়া সহজ হয়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Career and Life Readiness Guidance",
    title: "Career and life-readiness guidance, in one place.",
    description: "Keep student academic information and results structured, so the information needed for career and higher-study guidance is easy to find.",
    supporting: "Because academic records are structured, counselors and staff can guide students toward careers and higher study with reliable information.",
    capabilities: [
      "Structured academic records",
      "Results and progress in one place",
      "Information ready for guidance",
    ],
    stats: [
      { value: "Academic record", label: "Results and progress in one place" },
      { value: "Guidance-ready", label: "Information ready for guidance" },
    ],
    quote: "Having the right information makes guiding students easier.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function CCLRNaviancePanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      variant="dashboard"
      id='cclr-naviance'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuRoute}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

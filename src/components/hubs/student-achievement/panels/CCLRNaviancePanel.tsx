"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
    title: "Career ও জীবন প্রস্তুতির দিকনির্দেশনা এক জায়গায়।",
    description: "শিক্ষার্থীর academic তথ্য ও ফলাফল structuredভাবে রাখুন, যাতে career ও higher-study সংক্রান্ত দিকনির্দেশনার জন্য প্রয়োজনীয় তথ্য সহজে পাওয়া যায়।",
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
      id='cclr-naviance'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

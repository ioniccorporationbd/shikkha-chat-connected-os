"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "বহুস্তরীয় সহায়তা ব্যবস্থা",
    title: "প্রতিটি শিক্ষার্থীর জন্য সঠিক স্তরের সহায়তা।",
    description: "উপস্থিতি ও অগ্রগতির তথ্যের ভিত্তিতে যেসব শিক্ষার্থীর অতিরিক্ত সহায়তা দরকার তাদের চিহ্নিত করুন এবং tiered সহায়তাকে সংগঠিতভাবে track করুন।",
    stats: [
      { value: "তথ্য-ভিত্তিক", label: "উপস্থিতি ও অগ্রগতি থেকে শিক্ষার্থী চিহ্নিতকরণ" },
      { value: "স্তরভিত্তিক", label: "সংগঠিত, ধাপভিত্তিক সহায়তা" },
    ],
    quote: "ছোট লক্ষণ আগে দেখা গেলে বড় সমস্যা হওয়ার আগেই পদক্ষেপ নেওয়া যায়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Multi-Tier Support System",
    title: "The right level of support for every student.",
    description: "Identify the students who need extra support from attendance and progress data, and track tiered support in an organized way.",
    stats: [
      { value: "Data-driven", label: "Identify students from attendance and progress" },
      { value: "Tiered", label: "Organized, step-based support" },
    ],
    quote: "Seeing small signs early means acting before they become a bigger problem.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function MTSSPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='mtss'
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

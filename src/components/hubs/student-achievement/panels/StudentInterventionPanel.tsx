"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী সহায়তা",
    title: "সহায়তা কার্যক্রম সংগঠিতভাবে পরিচালনা করুন।",
    description: "যেসব শিক্ষার্থীর হস্তক্ষেপ দরকার তাদের জন্য কার্যক্রম, দায়িত্ব ও অগ্রগতি এক জায়গায় track করুন, যাতে কেউ পিছিয়ে না পড়ে।",
    stats: [
      { value: "Track", label: "সহায়তা কার্যক্রমের অগ্রগতি এক জায়গায়" },
      { value: "দলগত", label: "দায়িত্ব ও সমন্বয় সংগঠিত" },
    ],
    quote: "সংগঠিত সহায়তা নিশ্চিত করে প্রতিটি শিক্ষার্থী প্রয়োজনীয় মনোযোগ পায়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Student Intervention",
    title: "Manage support activity in an organized way.",
    description: "Track activity, ownership, and progress for every student who needs intervention in one place, so no one is left behind.",
    stats: [
      { value: "Track", label: "Intervention progress in one place" },
      { value: "Team-based", label: "Organized ownership and coordination" },
    ],
    quote: "Organized support ensures every student gets the attention they need.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function StudentInterventionPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='student-intervention'
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

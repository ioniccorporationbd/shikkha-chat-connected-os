"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষক সহায়তা",
    title: "শিক্ষকদের প্রয়োজনীয় operational সহায়তা দিন।",
    description: "প্রশাসনিক জটিলতা কমিয়ে দিন এবং প্রয়োজনীয় তথ্য এক জায়গায় রাখুন, যাতে শিক্ষকরা শিক্ষার্থীদের উপর আরও বেশি মনোযোগ দিতে পারেন।",
    stats: [
      { value: "কম জটিলতা", label: "প্রশাসনিক কাজ সহজ" },
      { value: "তথ্য এক জায়গায়", label: "শিক্ষকদের জন্য দ্রুত তথ্য" },
    ],
    quote: "শিক্ষকদের প্রশাসনিক কাজ কমলে তারা শিক্ষার্থীদের উপর আরও মনোযোগ দিতে পারেন।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Educator Support",
    title: "Give educators the operational support they deserve.",
    description: "Reduce administrative friction and keep the information educators need in one place, so they can focus more energy on students.",
    stats: [
      { value: "Less friction", label: "Administrative work made simpler" },
      { value: "One place", label: "Information educators need, at hand" },
    ],
    quote: "When administrative work is reduced, educators can focus more on students.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function EducatorSupportPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="educator-support"
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

"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "আচরণগত সহায়তা",
    title: "সঠিক তথ্য, সময়মতো পদক্ষেপ।",
    description: "প্রতিটি শিক্ষার্থীর তথ্য ও অগ্রগতি এক জায়গায় থাকলে staff দ্রুত বুঝতে পারে কে সহায়তা প্রয়োজন, আর role-based access নিশ্চিত করে সঠিক ব্যক্তি সঠিক তথ্য দেখে।",
    stats: [
      { value: "রোল-ভিত্তিক", label: "নিয়ন্ত্রিত access—যতটুকু প্রয়োজন ততটুকু" },
      { value: "সংযুক্ত", label: "শিক্ষার্থীর তথ্য এক জায়গায়" },
    ],
    quote: "সংগঠিত, নিরাপদ তথ্য staff-কে দ্রুত ও সঠিক সিদ্ধান্ত নিতে সাহায্য করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Behavior Support",
    title: "The right information, at the right time.",
    description: "When each student's information and progress live in one place, staff can quickly see who needs support—and role-based access ensures the right people see the right information.",
    stats: [
      { value: "Role-based", label: "Controlled access—only what each user needs" },
      { value: "Connected", label: "Student information in one place" },
    ],
    quote: "Organized, secure information helps staff make fast and accurate decisions.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function BehaviorSupportPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='behavior-support'
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

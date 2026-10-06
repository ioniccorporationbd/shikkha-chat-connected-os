"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "প্রতিভা ব্যবস্থাপনা",
    title: "কর্মজীবনের পুরো যাত্রায় মানুষকে সহায়তা করুন।",
    description: "Employee profile, department, designation, joining information ও HR record structuredভাবে manage করুন, যাতে প্রতিষ্ঠান তার টিমকে ভালোভাবে সহায়তা করতে পারে।",
    stats: [
      { value: "HR record", label: "Profile, department, designation ও joining তথ্য" },
      { value: "সংগঠিত", label: "Employee lifecycle-এর তথ্য এক জায়গায়" },
    ],
    quote: "সংগঠিত HR তথ্য প্রতিষ্ঠানকে তার টিমকে ভালোভাবে সহায়তা করতে সাহায্য করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Talent Management",
    title: "Support people across the employee lifecycle.",
    description: "Manage employee profiles, departments, designations, joining information, and HR records in a structured way, so the institution can support its team well.",
    stats: [
      { value: "HR records", label: "Profile, department, designation, and joining data" },
      { value: "Organized", label: "Employee lifecycle data in one place" },
    ],
    quote: "Organized HR information helps an institution support its team well.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function TalentManagementPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="talent-management"
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

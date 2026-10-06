"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const sectionText = {
  bn: {
    pill: "পরিবারের সম্পৃক্ততা",
    title: "প্রতিটি পরিবারকে আরও কাছে রাখুন।",
    description: "Guardian communication-কে শিক্ষার্থীর তথ্যের সাথে যুক্ত করুন—উপস্থিতি, ফি, notice বা জরুরি তথ্য SMS, email ও portal-এর মাধ্যমে সময়মতো পৌঁছে দিন।",
    stats: [
      { value: "৩টি channel", label: "SMS, Email ও portal communication" },
      { value: "সমন্বিত", label: "শিক্ষার্থীর তথ্যের সাথে যুক্ত বার্তা" },
    ],
    quote: "Administrator, staff, student ও guardian-এর মধ্যে timely information flow নিশ্চিত করা যায়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Family Engagement",
    title: "Keep every family closer.",
    description: "Connect guardian communication directly to student information—deliver attendance, fee, notice, or urgent updates on time through SMS, email, and the portal.",
    stats: [
      { value: "3 channels", label: "SMS, email, and portal communication" },
      { value: "Connected", label: "Messages linked to student information" },
    ],
    quote: "Timely information flow is maintained between the administrator, staff, student, and guardian.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function FamilyEngagementPanel() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="family-engagement"
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

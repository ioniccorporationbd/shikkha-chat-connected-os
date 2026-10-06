"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const sectionText = {
  bn: {
    pill: "যোগাযোগ ব্যবস্থা",
    title: "কম manual outreach, বেশি সংযুক্ত প্রতিষ্ঠান।",
    description: "যোগাযোগকে শিক্ষার্থীর তথ্যের সাথে যুক্ত করে নিশ্চিত করুন প্রতিটি update সঠিক ও সময়মতো। notice, announcement ও জরুরি তথ্য একই system থেকে পাঠান।",
    stats: [
      { value: "সেন্ট্রালাইজড", label: "Academic, exam, holiday ও admission notice এক জায়গায়" },
    ],
    quote: "একই information বিভিন্ন channel-এ manually পাঠানোর প্রয়োজন কমে আসে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Communications",
    title: "Less manual outreach. More connected institutions.",
    description: "Connect communication to student information so every update is accurate and on time. Send notices, announcements, and urgent information from one system.",
    stats: [
      { value: "Centralized", label: "Academic, exam, holiday, and admission notices in one place" },
    ],
    quote: "The need to send the same information to different channels manually is reduced.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function CommunicationsPanel() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="communications"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuMessageSquare } from "react-icons/lu";

const sectionText = {
  bn: {
    pill: "যোগাযোগ ব্যবস্থা",
    title: "কম manual outreach, বেশি সংযুক্ত প্রতিষ্ঠান।",
    description: "যোগাযোগকে শিক্ষার্থীর তথ্যের সাথে যুক্ত করে নিশ্চিত করুন প্রতিটি update সঠিক ও সময়মতো। notice, announcement ও জরুরি তথ্য একই system থেকে পাঠান।",
    supporting: "প্রতিটি notice সঠিক audience ও record-এর সাথে যুক্ত হওয়ায় একই বার্তা বিভিন্ন channel-এ বারবার manually পাঠাতে হয় না।",
    capabilities: [
      "কেন্দ্রীভূত notice ও announcement",
      "শিক্ষার্থী ও প্রতিষ্ঠানের record-এর সাথে যুক্ত",
      "কম manual, পুনরাবৃত্ত outreach",
    ],
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
    supporting: "Because every notice is linked to the right audience and record, the same message does not have to be re-sent manually across channels.",
    capabilities: [
      "Centralized notices and announcements",
      "Linked to student and institution records",
      "Less manual, repeated outreach",
    ],
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
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuMessageSquare}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

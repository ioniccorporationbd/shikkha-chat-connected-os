"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuHandHeart } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী সহায়তা",
    title: "সহায়তা কার্যক্রম সংগঠিতভাবে পরিচালনা করুন।",
    description: "যেসব শিক্ষার্থীর হস্তক্ষেপ দরকার তাদের জন্য কার্যক্রম, দায়িত্ব ও অগ্রগতি এক জায়গায় track করুন, যাতে কেউ পিছিয়ে না পড়ে।",
    supporting: "কার্যক্রম ও দায়িত্ব এক জায়গায় track হওয়ায় সহায়তা দল সমন্বয় করে নিশ্চিত করতে পারে কোনো শিক্ষার্থী বাদ পড়ে না।",
    capabilities: [
      "সহায়তা কার্যক্রম এক জায়গায়",
      "পরিষ্কার দায়িত্ব ও সমন্বয়",
      "প্রতি শিক্ষার্থীর অগ্রগতি ট্র্যাকিং",
    ],
    stats: [
      { value: "ট্র্যাকিং", label: "সহায়তা কার্যক্রমের অগ্রগতি এক জায়গায়" },
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
    supporting: "Because activity and ownership are tracked in one place, support teams can coordinate and make sure no student is missed.",
    capabilities: [
      "Intervention activity in one place",
      "Clear ownership and coordination",
      "Progress tracking per student",
    ],
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
      variant="dashboard"
      id='student-intervention'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuHandHeart}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

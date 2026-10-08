"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuCompass } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
    title: "প্রস্তুতির প্রতিটি ধাপ track করুন।",
    description: "শিক্ষার্থীর অগ্রগতি ও ফলাফলের ধারাবাহিক record রাখুন, যাতে college, career ও জীবনের জন্য প্রস্তুতির প্রতিটি ধাপ management দেখতে পারে।",
    supporting: "অগ্রগতি ধারাবাহিকভাবে লিপিবদ্ধ হওয়ায় management প্রতিটি শিক্ষার্থীর college, career ও জীবন পরিকল্পনায় প্রতিটি ধাপে সহায়তা করতে পারে।",
    capabilities: [
      "ধারাবাহিক অগ্রগতির record",
      "প্রস্তুতির পরিষ্কার চিত্র",
      "প্রতিটি ধাপে সহায়তা",
    ],
    stats: [
      { value: "অগ্রগতির record", label: "ধারাবাহিক academic তথ্য" },
      { value: "ব্যবস্থাপনার অন্তর্দৃষ্টি", label: "প্রস্তুতির চিত্র এক দৃশ্যে" },
    ],
    quote: "ধারাবাহিক record ভবিষ্যৎ পরিকল্পনা ও সিদ্ধান্ত সহজ করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "College, Career and Life Readiness",
    title: "Track every step of readiness.",
    description: "Keep a continuous record of student progress and results, so management can see each stage of preparation for college, career, and life.",
    supporting: "Because progress is recorded continuously, management can support each student's college, career, and life planning at every stage.",
    capabilities: [
      "Continuous progress records",
      "A clear view of readiness",
      "Support at every stage",
    ],
    stats: [
      { value: "Progress record", label: "Continuous academic information" },
      { value: "Management insight", label: "A clear view of readiness" },
    ],
    quote: "A continuous record makes future planning and decisions easier.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function CollegeCareerLifeReadinessPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      variant="dashboard"
      id='college-career-life-readiness'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuCompass}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

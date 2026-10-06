"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী অর্জন",
    title: "প্রতিটি শিক্ষার্থীর অগ্রগতির সংযুক্ত চিত্র।",
    description: "পরীক্ষা, ফলাফল, উপস্থিতি ও সহায়তা কার্যক্রমকে একসাথে এনে শিক্ষক ও management-কে প্রতিটি শিক্ষার্থীর অগ্রগতি আত্মবিশ্বাসের সাথে বুঝতে সহায়তা করুন।",
    stats: [
      { value: "এক দৃশ্যে", label: "Exam, result, attendance ও progress একসাথে" },
      { value: "সিদ্ধান্ত-সহায়ক", label: "Management-এর জন্য report-ভিত্তিক insight" },
    ],
    quote: "Management যেন প্রয়োজনীয় তথ্যের ভিত্তিতে দ্রুত সিদ্ধান্ত নিতে পারে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Student Achievement",
    title: "A connected view of every student's progress.",
    description: "Bring examination, results, attendance, and support activity together so teachers and management can understand every student's progress with confidence.",
    stats: [
      { value: "One view", label: "Exam, result, attendance, and progress together" },
      { value: "Decision-ready", label: "Report-based insight for management" },
    ],
    quote: "So that management can make fast decisions based on the information they need.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function StudentAchievementOverviewPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='student-achievement'
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

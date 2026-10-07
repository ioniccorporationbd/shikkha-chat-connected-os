"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuClipboardCheck } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণ",
    title: "মূল্যায়ন থেকে দ্রুত সিদ্ধান্ত।",
    description: "Exam create, marks entry, grade calculation ও result processing এক workflow-এ পরিচালনা করুন, যাতে ফলাফল process করে report card তৈরি সহজ হয়।",
    supporting: "নম্বর, গ্রেড ও ফলাফল একই workflow শেয়ার করায় পরীক্ষার সময় গৃহীত ডেটা থেকেই সরাসরি report card তৈরি হয়।",
    capabilities: [
      "Exam create ও subject assign",
      "Marks entry ও গ্রেড গণনা",
      "Result processing থেকে report card",
    ],
    stats: [
      { value: "পরীক্ষা কার্যধারা", label: "Exam create, subject assign ও result processing" },
      { value: "গ্রেড গণনা", label: "সংগঠিত grade ও report card" },
    ],
    quote: "একটি integrated examination management system result processing সহজ করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Assessment and Performance Analytics",
    title: "From assessment to faster decisions.",
    description: "Run exam creation, marks entry, grade calculation, and result processing in one workflow, so producing report cards after results is easier.",
    supporting: "Because marks, grades, and results share one workflow, report cards follow directly from data already captured during the exam.",
    capabilities: [
      "Exam creation and subject assignment",
      "Marks entry and grade calculation",
      "Result processing to report cards",
    ],
    stats: [
      { value: "Exam workflow", label: "Exam create, subject assign, and result processing" },
      { value: "Grade calculation", label: "Organized grades and report cards" },
    ],
    quote: "An integrated examination management system simplifies result processing.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function AssessmentPerformanceMattersPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='assessment-performance-matters'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuClipboardCheck}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

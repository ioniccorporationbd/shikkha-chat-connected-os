"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuLibrary } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "কারিকুলাম ও পাঠদান",
    title: "পাঠ্যক্রম ও পাঠদানকে এক কাঠামোয় সাজান।",
    description: "Academic program, subject ও curriculum-এর তথ্য structuredভাবে রাখুন। Exam create, subject assign ও marks entry-সহ পাঠদান-সংশ্লিষ্ট workflow এক system থেকে পরিচালনা করুন।",
    supporting: "কারিকুলাম, subject ও exam একই কাঠামোয় থাকায় অ্যাকাডেমিক পরিকল্পনা ও প্রতিদিনের পাঠদান সমন্বিত থাকে।",
    capabilities: [
      "Academic program ও curriculum তথ্য",
      "সংগঠিত subject ও exam workflow",
      "পরিকল্পনার জন্য সুসংগত কাঠামো",
    ],
    stats: [
      { value: "Academic তথ্য", label: "Program ও curriculum information এক জায়গায়" },
      { value: "সুসংগঠিত", label: "Subject ও exam workflow সংগঠিত" },
    ],
    quote: "একটি integrated examination system subject assign ও marks entry-এর মতো workflow সহজ করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Curriculum and Instruction",
    title: "Structure curriculum and instruction in one place.",
    description: "Keep academic programs, subjects, and curriculum information structured. Manage teaching-related workflows—including exam creation, subject assignment, and marks entry—from one system.",
    supporting: "Because curriculum, subjects, and exams live in one structure, academic planning and day-to-day instruction stay aligned.",
    capabilities: [
      "Academic program and curriculum data",
      "Organized subject and exam workflows",
      "Consistent structure for planning",
    ],
    stats: [
      { value: "Academic data", label: "Program and curriculum information in one place" },
      { value: "Structured", label: "Organized subject and exam workflows" },
    ],
    quote: "An integrated examination system simplifies workflows such as subject assignment and marks entry.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function CurriculumInstructionPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      variant="dashboard"
      id='curriculum-instruction'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuLibrary}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

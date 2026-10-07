"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuTrendingUp } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "ভর্তি পূর্বাভাস",
    title: "আত্মবিশ্বাসের সাথে ভর্তি পরিকল্পনা করুন।",
    description: "ভর্তি ও শিক্ষার্থী তথ্যের ধারা দেখে staffing, রিসোর্স ও প্রোগ্রাম পরিকল্পনা করুন, যাতে চাপ তৈরি হওয়ার আগেই প্রতিষ্ঠান প্রস্তুত থাকতে পারে।",
    supporting: "ভর্তির ধারা আগেই দৃশ্যমান হওয়ায় প্রতিষ্ঠান চাপ তৈরি হওয়ার আগেই staffing ও program পরিকল্পনা করতে পারে।",
    capabilities: [
      "ভর্তি ও শিক্ষার্থী তথ্যের ধারা",
      "Staffing, রিসোর্স ও প্রোগ্রাম পরিকল্পনা",
      "চাপ তৈরির আগেই প্রস্তুত",
    ],
    stats: [
      { value: "তথ্য-ভিত্তিক", label: "ভর্তি ও শিক্ষার্থী তথ্যের ধারা" },
      { value: "পরিকল্পনা", label: "Staffing, রিসোর্স ও প্রোগ্রাম পরিকল্পনা" },
    ],
    quote: "সঠিক তথ্য থাকলে ভবিষ্যতের প্রয়োজন আগেই বোঝা যায়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Predictive Enrollment",
    title: "Plan enrollment with confidence.",
    description: "Use enrollment and student-information trends to plan staffing, resources, and programs, so the institution is ready before pressure builds.",
    supporting: "Because enrollment trends are visible early, institutions can plan staffing and programs before pressure builds.",
    capabilities: [
      "Enrollment and student trends",
      "Staffing, resource, and program planning",
      "Ready before pressure builds",
    ],
    stats: [
      { value: "Data-driven", label: "Enrollment and student-information trends" },
      { value: "Planning", label: "Staffing, resource, and program planning" },
    ],
    quote: "With the right information, future needs become visible earlier.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function PredictiveEnrollmentPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="predictive-enrollment"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuTrendingUp}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

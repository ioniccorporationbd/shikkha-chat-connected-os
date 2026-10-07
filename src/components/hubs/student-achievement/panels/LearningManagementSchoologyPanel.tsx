"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "লার্নিং ব্যবস্থাপনা",
    title: "ডিজিটাল শেখার তথ্য একসাথে রাখুন।",
    description: "Course, subject ও academic রিসোর্সের তথ্য structuredভাবে সংরক্ষণ করে শিক্ষার্থীর অগ্রগতির সাথে যুক্ত করুন, যাতে শিক্ষক ও প্রতিষ্ঠান এক দৃশ্যে সবকিছু দেখতে পারে।",
    stats: [
      { value: "Resource তথ্য", label: "Course ও academic data structuredভাবে" },
      { value: "সংযুক্ত", label: "শিক্ষার্থীর অগ্রগতির সাথে যুক্ত" },
    ],
    quote: "সুসংগঠিত তথ্য শিক্ষক ও প্রতিষ্ঠানকে দ্রুত সিদ্ধান্ত নিতে সাহায্য করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Learning Management",
    title: "Keep digital learning information together.",
    description: "Store course, subject, and academic resource information in a structured way and link it to student progress, so teachers and the institution can see everything in one view.",
    stats: [
      { value: "Resource data", label: "Course and academic data, structured" },
      { value: "Connected", label: "Linked to student progress" },
    ],
    quote: "Structured information helps teachers and the institution act faster.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function LearningManagementSchoologyPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='learning-management-schoology'
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

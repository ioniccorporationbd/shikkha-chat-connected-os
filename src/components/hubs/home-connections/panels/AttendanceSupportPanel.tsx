"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuCalendarCheck } from "react-icons/lu";

const sectionText = {
  bn: {
    pill: "উপস্থিতি সহায়তা",
    title: "উপস্থিতি ডিজিটাল করুন, কাগজের রেজিস্টার কমান।",
    description: "দৈনিক উপস্থিতি, present/absent report, মাসিক report ও শিক্ষার্থী-ভিত্তিক history digitally পরিচালনা করুন। কর্মীদের জন্য Check-In / Check-Out workflow attendance-কে HR-এর সাথে যুক্ত করে।",
    supporting: "উপস্থিতি HR ও শিক্ষার্থী record-এর সাথে যুক্ত হওয়ায় প্রতিষ্ঠানগুলি আলাদা রেজিস্টার না রেখেই নির্ভুল দৈনিক হিসাব পায়।",
    capabilities: [
      "দৈনিক present/absent ও মাসিক রিপোর্ট",
      "শিক্ষার্থী-ভিত্তিক উপস্থিতির history",
      "কর্মীদের Check-In / Check-Out workflow",
    ],
    stats: [
      { value: "দৈনিক ও মাসিক", label: "Present/Absent report ও শিক্ষার্থী-ভিত্তিক history" },
      { value: "Check-In / Out", label: "কর্মীদের ডিজিটাল attendance workflow" },
    ],
    quote: "ডিজিটাল attendance manual register-এর উপর নির্ভরতা কমায় এবং guardian notification integration সহজ করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Attendance Support",
    title: "Digitize attendance, reduce the paper register.",
    description: "Manage daily attendance, present/absent reports, monthly summaries, and student-level history digitally. For staff, a Check-In / Check-Out workflow connects attendance to HR.",
    supporting: "Because attendance connects to HR and student records, institutions get accurate daily figures without maintaining parallel registers.",
    capabilities: [
      "Daily present/absent and monthly reports",
      "Student-level attendance history",
      "Staff Check-In / Check-Out workflow",
    ],
    stats: [
      { value: "Daily & monthly", label: "Present/absent reports and student-level history" },
      { value: "Check-In / Out", label: "A digital attendance workflow for employees" },
    ],
    quote: "Digital attendance reduces reliance on manual registers and makes guardian notification integration easier.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function AttendanceSupportPanel() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="attendance-support"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuCalendarCheck}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuBriefcase } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "নিয়োগ ও মানবসম্পদ",
    title: "নিয়োগ ও HR কাজকে সহজ করুন।",
    description: "Employee profile, attendance ও Check-In / Check-Out-সহ HR workflow এক system-এ যুক্ত করুন, যাতে নিয়োগ ও মানবসম্পদ কাজ সংগঠিতভাবে চলে।",
    supporting: "HR workflow কর্মী record-এর সাথে যুক্ত হওয়ায় নিয়োগ ও প্রতিদিনের people operation একটি সংগঠিত system-এ চলে।",
    capabilities: [
      "Employee profile ও attendance",
      "Check-In / Check-Out workflow",
      "নিয়োগ থেকে HR record এক system-এ",
    ],
    stats: [
      { value: "HR কার্যধারা", label: "Profile, attendance ও Check-In / Check-Out" },
      { value: "সংগঠিত", label: "নিয়োগ থেকে HR record—এক system-এ" },
    ],
    quote: "বর্তমান Employee Check-In/Out workflow HR ecosystem-এর একটি গুরুত্বপূর্ণ foundation।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Recruiting and HR",
    title: "Make hiring and HR smoother.",
    description: "Connect employee profiles, attendance, and Check-In / Check-Out in one system, so hiring and HR work runs in an organized way.",
    supporting: "Because HR workflows connect to employee records, hiring and day-to-day people operations run in one organized system.",
    capabilities: [
      "Employee profiles and attendance",
      "Check-In / Check-Out workflow",
      "Hiring to HR records in one system",
    ],
    stats: [
      { value: "HR workflow", label: "Profile, attendance, and Check-In / Check-Out" },
      { value: "Organized", label: "Hiring to HR records in one system" },
    ],
    quote: "The current Employee Check-In/Out workflow is an important foundation of the HR ecosystem.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function RecruitingAndHRPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      variant="dashboard"
      id="recruiting-and-hr"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuBriefcase}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
    />
  );
}

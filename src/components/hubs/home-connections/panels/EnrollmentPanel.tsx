"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const sectionText = {
  bn: {
    pill: "ভর্তি ব্যবস্থাপনা",
    title: "প্রতিটি নতুন শিক্ষার্থীর জন্য সহজ, নিরাপদ শুরু।",
    description: "ভর্তির তথ্য সংগ্রহ থেকে account creation পর্যন্ত—OTP verification-সহ একটি structured registration workflow, যা শিক্ষার্থী তথ্য ব্যবস্থার সাথে সরাসরি যুক্ত।",
    stats: [
      { value: "OTP-যাচাইকৃত", label: "Email বা configured SMS channel দিয়ে verification" },
      { value: "সংযুক্ত", label: "Registration থেকে student profile—একই workflow-এ" },
    ],
    quote: "নিরাপদ registration workflow unauthorized বা ভুল account creation-এর ঝুঁকি কমায়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Enrollment Management",
    title: "A simple, secure start for every new student.",
    description: "From collecting admission information to account creation—a structured registration workflow with OTP verification, connected directly to your student information system.",
    stats: [
      { value: "OTP-verified", label: "Verification over email or a configured SMS channel" },
      { value: "Connected", label: "Registration to student profile in one workflow" },
    ],
    quote: "A secure registration workflow reduces the risk of unauthorized or incorrect account creation.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function EnrollmentPanel() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="enrollment"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

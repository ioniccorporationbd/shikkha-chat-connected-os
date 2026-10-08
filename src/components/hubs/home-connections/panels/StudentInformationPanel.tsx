
"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuUserRound } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থীর তথ্য ব্যবস্থাপনা",
    title: "প্রতিটি শিক্ষার্থীর তথ্য এক জায়গায়, সবসময় হালনাগাদ।",
    description: "শিক্ষার্থীর প্রোফাইল, ভর্তির তথ্য, ক্লাস, সেকশন, রোল, অভিভাবক ও যোগাযোগের তথ্য কাগজ বা Excel-এর বদলে একটি structured system-এ সংরক্ষণ করুন।",
    supporting: "record structured থাকায় staff কয়েক সেকেন্ডেই শিক্ষার্থীর প্রোফাইল, অভিভাবক ও অ্যাকাডেমিক ইতিহাস খুঁজে পান, ছড়িয়ে থাকা ফাইল খোঁজার দরকার নেই।",
    capabilities: [
      "কেন্দ্রীভূত শিক্ষার্থী প্রোফাইল ও অভিভাবক রেকর্ড",
      "Class, section ও roll এক জায়গায় সংগঠিত",
      "প্রতিদিনের অনুসন্ধানের জন্য একটি নির্ভরযোগ্য উৎস",
    ],
    statValue: "সেন্ট্রালাইজড",
    statLabel: "প্রোফাইল, ভর্তি, ক্লাস, রোল ও অভিভাবকের তথ্য",
    quote: "শিক্ষার্থীর তথ্য সঠিক ও সংগঠিত থাকলে প্রতিষ্ঠানের প্রতিদিনের কাজ অনেক সহজ হয়।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Student Information Management",
    title: "Every student's record in one place, always up to date.",
    description: "Keep student profiles, admission details, class, section, roll, guardian, and contact information in one structured system—instead of paper registers or spreadsheets.",
    supporting: "Because the record is structured, staff can find a student's profile, guardian, and academic history in seconds instead of searching scattered files.",
    capabilities: [
      "Centralized student profiles and guardian records",
      "Class, section, and roll organized in one place",
      "A single reliable source for everyday queries",
    ],
    statValue: "Centralized",
    statLabel: "Profile, admission, class, roll, and guardian records",
    quote: "When student information is accurate and organized, everyday institution work becomes far simpler.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;


export default function StudentInformationPanel() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];
  const panelStats = [{ value: text.statValue, label: text.statLabel }];

  return (
    <section
      className="home-connections-section relative bg-transparent text-[var(--color-primary)]"
      lang={currentLanguage}
    >
      <div className="home-section-panel">
        <SectionPanel
          id="student-information"
          variant="dashboard"
          pill={text.pill}
          title={text.title}
          description={text.description}
          supporting={text.supporting}
          capabilities={text.capabilities}
          icon={LuUserRound}
          stats={panelStats}
          quote={text.quote}
          author={text.author}
          role={text.role}
        />
      </div>
    </section>
  );
}

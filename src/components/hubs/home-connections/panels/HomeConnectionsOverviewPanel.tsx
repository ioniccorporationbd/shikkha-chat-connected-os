"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuLayoutGrid } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "হোম কানেকশন",
    title: "একটি প্রতিষ্ঠান। একটি সংযুক্ত ব্যবস্থা।",
    description: "শিক্ষা চ্যাট একটি web-based education management platform, যা ভর্তি, শিক্ষার্থী তথ্য, কর্মী ব্যবস্থাপনা, উপস্থিতি, যোগাযোগ, হিসাব ও রিপোর্টকে একটি সংযুক্ত digital ecosystem-এ নিয়ে আসে।",
    supporting: "ভর্তি থেকে রিপোর্ট পর্যন্ত প্রতিটি module একই শিক্ষার্থী ও প্রতিষ্ঠানের তথ্য ব্যবহার করে, তাই একবার যোগ করা তথ্য সবখানে সামঞ্জস্যপূর্ণ থাকে।",
    capabilities: [
      "সব module জুড়ে একটি সংযুক্ত ডেটা ভিত্তি",
      "প্রতিটি ধরনের ব্যবহারকারীর জন্য role-ভিত্তিক access",
      "প্রতিদিনের প্রতিষ্ঠান পরিচালনার জন্য তৈরি",
    ],
    stats: [
      { value: "১টি সিস্টেম", label: "প্রতিষ্ঠানের সব operational তথ্য এক জায়গায়" },
      { value: "রোল-ভিত্তিক", label: "প্রতিটি ব্যবহারকারীর জন্য নিয়ন্ত্রিত আলাদা access" },
    ],
    quote: "আপনার প্রতিষ্ঠানের প্রয়োজনীয় digital operations, users, information ও communication—একটি সংযুক্ত platform থেকে পরিচালিত।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Home Connections",
    title: "One Institution. One Connected System.",
    description: "Shikkha Chat is a web-based education management platform that brings admission, student information, employee management, attendance, communication, accounts, and reports into one connected digital ecosystem.",
    supporting: "From admission to reporting, every module shares the same student and institutional data, so information entered once stays consistent everywhere.",
    capabilities: [
      "One connected data foundation across modules",
      "Role-based access for every type of user",
      "Built for day-to-day institutional operations",
    ],
    stats: [
      { value: "1 System", label: "All of your institution's operational data in one place" },
      { value: "Role-based", label: "A controlled, separate experience for every user" },
    ],
    quote: "Your institution's digital operations, users, information, and communication—managed from one connected platform.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function HomeConnectionsOverviewPanel() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = sectionText[currentLanguage];

  return (
    <section
      lang={currentLanguage}
      className={[
        "home-connections-section",
        "relative",
        "bg-[var(--color-white)]",
        "text-[var(--color-primary)]",
      ].join(" ")}
    >
      <div className="home-section-panel">
        <SectionPanel
          id="home-connections-panel"
          pill={text.pill}
          pillStyle="solid"
          title={text.title}
          description={text.description}
          supporting={text.supporting}
          capabilities={text.capabilities}
          icon={LuLayoutGrid}
          showButtons={false}
          stats={text.stats}
          quote={text.quote}
          author={text.author}
          role={text.role}
        />
      </div>
    </section>
  );
}

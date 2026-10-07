"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuBoxes } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "রিসোর্স পরিকল্পনা",
    title: "বাস্তব প্রতিষ্ঠান-প্রয়োজনকে কেন্দ্র করে পরিকল্পনা।",
    description: "প্রোগ্রাম, staffing, বাজেট ও অগ্রাধিকারের পরিষ্কার দৃশ্য রাখুন, যাতে রিসোর্স সবচেয়ে প্রয়োজনীয় জায়গায় ব্যবহার করা যায়।",
    supporting: "Program, staffing ও budget একসাথে দৃশ্যমান হওয়ায় রিসোর্স সবচেয়ে প্রয়োজনীয় জায়গায় সরানো যায়।",
    capabilities: [
      "Program, staffing ও budget এক দৃশ্যে",
      "অগ্রাধিকার-ভিত্তিক বণ্টন",
      "আরও পরিষ্কার পরিকল্পনা সিদ্ধান্ত",
    ],
    stats: [
      { value: "পরিষ্কার দৃশ্য", label: "Program, staffing ও budget এক জায়গায়" },
      { value: "অগ্রাধিকার-ভিত্তিক", label: "প্রয়োজন অনুযায়ী রিসোর্স বণ্টন" },
    ],
    quote: "যুক্ত তথ্য প্রতিষ্ঠানকে দ্রুত ও ভালো সিদ্ধান্ত নিতে সহায়তা করে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Resource Planning",
    title: "Plan resources around real institutional needs.",
    description: "Keep a clear view of programs, staffing, budgets, and priorities so resources move where they are needed most.",
    supporting: "Because programs, staffing, and budgets are visible together, resources can be shifted to the areas that need them most.",
    capabilities: [
      "Programs, staffing, and budget in one view",
      "Priority-based allocation",
      "Clearer planning decisions",
    ],
    stats: [
      { value: "Clear view", label: "Program, staffing, and budget in one place" },
      { value: "Priority-based", label: "Resources allocated where they matter" },
    ],
    quote: "Connected data helps institutions make faster, better decisions.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function ResourcePlanningPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="resource-planning"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuBoxes}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      pillStyle="solid"
      showButtons={false}
    />
  );
}

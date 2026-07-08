"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "রিসোর্স পরিকল্পনা",
    title: "বাস্তব স্কুল প্রয়োজনকে কেন্দ্র করে রিসোর্স পরিকল্পনা করুন।",
    description: "প্রোগ্রাম, স্টাফিং, বাজেট এবং অগ্রাধিকারের পরিষ্কার দৃশ্য দিন, যাতে রিসোর্স সবচেয়ে প্রয়োজনীয় জায়গায় ব্যবহার করা যায়।",
    stats: [
      { value: "রিয়েল-টাইম", label: "অপারেশনজুড়ে পরিকল্পনার দৃশ্যমানতা" },
    ],
    quote: "সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, মানুষকে ভালোভাবে সহায়তা করতে এবং শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার ধারণা দেয়।",
    author: "শিক্ষা চ্যাট টিম",
    role: "সংযুক্ত অপারেটিং সিস্টেম বাস্তবায়ন সহযোগী",
    logo: "পরিকল্পনা",
    productDetailsText: "পণ্যের বিস্তারিত",
    saveProductText: "পণ্য সংরক্ষণ করুন",
    activeProductText: "সক্রিয় পণ্য",
    imageAlt: "স্কুল নেতৃত্বের ছবি",
  },
  en: {
    pill: "Resource Planning",
    title: "Plan resources around real school needs.",
    description: "Give leaders clear visibility into programs, staffing, budgets, and priorities so resources can move where they matter most.",
    stats: [
      { value: "Real-time", label: "Planning visibility across operations" },
    ],
    quote: "Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.",
    author: "Shikkha Chat Team",
    role: "Connected OS Implementation Partner",
    logo: "Planning",
    productDetailsText: "Product Details",
    saveProductText: "Save Product",
    activeProductText: "Active Product",
    imageAlt: "School leader image",
  },
} as const;

export default function ResourcePlanning() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="resource-planning"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      logo={text.logo}
      productDetailsText={text.productDetailsText}
      saveProductText={text.saveProductText}
      activeProductText={text.activeProductText}
      imageAlt={text.imageAlt}
      pillStyle="solid"
      showButtons={false}
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
    />
  );
}

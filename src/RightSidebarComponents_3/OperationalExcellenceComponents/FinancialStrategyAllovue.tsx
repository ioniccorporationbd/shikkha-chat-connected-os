"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "আর্থিক কৌশল",
    title: "প্রতিটি বাজেট সিদ্ধান্তকে আরও কৌশলগত করুন।",
    description: "আর্থিক কৌশল ব্যয়, পরিকল্পনা এবং ফলাফলকে যুক্ত করে, যাতে স্কুল বাজেটকে অগ্রাধিকারের সাথে মিলিয়ে নিতে পারে।",
    stats: [
      { value: "বাজেট", label: "প্রভাবের সাথে মিলানো কৌশল" },
    ],
    quote: "সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, মানুষকে ভালোভাবে সহায়তা করতে এবং শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার ধারণা দেয়।",
    author: "শিক্ষা চ্যাট টিম",
    role: "সংযুক্ত অপারেটিং সিস্টেম বাস্তবায়ন সহযোগী",
    logo: "অর্থ",
    productDetailsText: "পণ্যের বিস্তারিত",
    saveProductText: "পণ্য সংরক্ষণ করুন",
    activeProductText: "সক্রিয় পণ্য",
    imageAlt: "স্কুল নেতৃত্বের ছবি",
  },
  en: {
    pill: "Financial Strategy",
    title: "Make every budget decision more strategic.",
    description: "Financial strategy connects spending, planning, and outcomes so schools can align budgets with priorities.",
    stats: [
      { value: "Budget", label: "Strategy aligned to impact" },
    ],
    quote: "Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.",
    author: "Shikkha Chat Team",
    role: "Connected OS Implementation Partner",
    logo: "Finance",
    productDetailsText: "Product Details",
    saveProductText: "Save Product",
    activeProductText: "Active Product",
    imageAlt: "School leader image",
  },
} as const;

export default function FinancialStrategyAllovue() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="financial-strategy-allovue"
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

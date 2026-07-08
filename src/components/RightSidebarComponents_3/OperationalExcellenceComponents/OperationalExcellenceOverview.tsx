"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "অপারেশনাল উৎকর্ষতা",
    title: "সংযুক্ত ডেটা দিয়ে আরও স্মার্ট স্কুল অপারেশন পরিচালনা করুন।",
    description: "অর্থ, মানবসম্পদ, রিসোর্স পরিকল্পনা, এন্টারপ্রাইজ রিসোর্স ব্যবস্থা, ভর্তি পূর্বাভাস এবং শিক্ষক সহায়তাকে যুক্ত করুন, যাতে নেতৃত্ব আত্মবিশ্বাসের সাথে পরিকল্পনা ও পরিচালনা করতে পারে।",
    stats: [
      { value: "১ সিস্টেম", label: "সিদ্ধান্তকে কেন্দ্র করে সংযুক্ত অপারেশন" },
    ],
    quote: "সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, মানুষকে ভালোভাবে সহায়তা করতে এবং শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার ধারণা দেয়।",
    author: "শিক্ষা চ্যাট টিম",
    role: "সংযুক্ত অপারেটিং সিস্টেম বাস্তবায়ন সহযোগী",
    logo: "অপারেশন",
    productDetailsText: "পণ্যের বিস্তারিত",
    saveProductText: "পণ্য সংরক্ষণ করুন",
    activeProductText: "সক্রিয় পণ্য",
    imageAlt: "স্কুল নেতৃত্বের ছবি",
  },
  en: {
    pill: "Operational Excellence",
    title: "Run smarter school operations with connected data.",
    description: "Connect finance, HR, resource planning, ERP, enrollment forecasting, and educator support so leaders can plan and operate with confidence.",
    stats: [
      { value: "1 OS", label: "Operations connected around decisions" },
    ],
    quote: "Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.",
    author: "Shikkha Chat Team",
    role: "Connected OS Implementation Partner",
    logo: "OpsOS",
    productDetailsText: "Product Details",
    saveProductText: "Save Product",
    activeProductText: "Active Product",
    imageAlt: "School leader image",
  },
} as const;

export default function OperationalExcellenceOverview() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="operational-excellence"
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

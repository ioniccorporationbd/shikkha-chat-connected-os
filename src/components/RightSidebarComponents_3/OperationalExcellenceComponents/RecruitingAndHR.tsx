"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "নিয়োগ ও মানবসম্পদ",
    title: "সবার জন্য নিয়োগ ও মানবসম্পদ কাজ সহজ করুন।",
    description: "নিয়োগ, অনবোর্ডিং, মানবসম্পদ রেকর্ড এবং স্টাফ কাজের ধারাকে সহজ করুন, যাতে স্কুল দ্রুত এগোতে পারে এবং টিমকে ভালোভাবে সহায়তা করতে পারে।",
    stats: [
      { value: "দ্রুত", label: "নিয়োগ ও মানবসম্পদ অপারেশন" },
    ],
    quote: "সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, মানুষকে ভালোভাবে সহায়তা করতে এবং শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার ধারণা দেয়।",
    author: "শিক্ষা চ্যাট টিম",
    role: "সংযুক্ত অপারেটিং সিস্টেম বাস্তবায়ন সহযোগী",
    logo: "মানবসম্পদ",
    productDetailsText: "পণ্যের বিস্তারিত",
    saveProductText: "পণ্য সংরক্ষণ করুন",
    activeProductText: "সক্রিয় পণ্য",
    imageAlt: "স্কুল নেতৃত্বের ছবি",
  },
  en: {
    pill: "Recruiting and HR",
    title: "Make hiring and HR smoother for everyone.",
    description: "Streamline recruiting, onboarding, HR records, and staff workflows so schools can move faster and support teams better.",
    stats: [
      { value: "Faster", label: "Recruiting and HR operations" },
    ],
    quote: "Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.",
    author: "Shikkha Chat Team",
    role: "Connected OS Implementation Partner",
    logo: "HR",
    productDetailsText: "Product Details",
    saveProductText: "Save Product",
    activeProductText: "Active Product",
    imageAlt: "School leader image",
  },
} as const;

export default function RecruitingAndHR() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="recruiting-and-hr"
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

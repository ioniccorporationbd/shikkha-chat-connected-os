"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষক সহায়তা",
    title: "শিক্ষকদের প্রাপ্য অপারেশনাল সহায়তা দিন।",
    description: "প্রশাসনিক জটিলতা কমান এবং সহায়তা কাজের ধারাকে যুক্ত করুন, যাতে শিক্ষকরা শিক্ষার্থীদের ওপর আরও বেশি মনোযোগ দিতে পারেন।",
    stats: [
      { value: "আরও সময়", label: "শিক্ষক ও স্টাফের সহায়তা" },
    ],
    quote: "সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, মানুষকে ভালোভাবে সহায়তা করতে এবং শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার ধারণা দেয়।",
    author: "শিক্ষা চ্যাট টিম",
    role: "সংযুক্ত অপারেটিং সিস্টেম বাস্তবায়ন সহযোগী",
    logo: "শিক্ষক",
    productDetailsText: "পণ্যের বিস্তারিত",
    saveProductText: "পণ্য সংরক্ষণ করুন",
    activeProductText: "সক্রিয় পণ্য",
    imageAlt: "স্কুল নেতৃত্বের ছবি",
  },
  en: {
    pill: "Educator Support",
    title: "Give educators the operational support they deserve.",
    description: "Reduce administrative friction and connect support workflows so educators can focus more energy on students.",
    stats: [
      { value: "More time", label: "Support for teachers and staff" },
    ],
    quote: "Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.",
    author: "Shikkha Chat Team",
    role: "Connected OS Implementation Partner",
    logo: "Educator",
    productDetailsText: "Product Details",
    saveProductText: "Save Product",
    activeProductText: "Active Product",
    imageAlt: "School leader image",
  },
} as const;

export default function EducatorSupport() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="educator-support"
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

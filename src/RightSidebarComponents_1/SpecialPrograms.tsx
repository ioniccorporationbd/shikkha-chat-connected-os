"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "বিশেষ কার্যক্রম",
    title: "শিক্ষার্থীদের প্রাপ্য সহায়তা পৌঁছে দিন।",
    description:
      "কমপ্লায়েন্স কার্যধারা এবং ডেটাকে একটি সংযুক্ত ব্যবস্থায় আনুন। ম্যানুয়াল ট্র্যাকিং কমিয়ে এবং দলগত সমন্বয় উন্নত করে নিশ্চিত করুন প্রতিটি শিক্ষার্থী সময়মতো সঠিক সেবা পাচ্ছে।",
    stats: [
      { value: "১২০০+", label: "বিশেষ কার্যক্রমের জন্য শিক্ষা চ্যাট ব্যবহারকারী প্রতিষ্ঠান" },
      { value: "১.৭M", label: "প্রতি বছর সম্পন্ন শিক্ষার্থী সেবা ফর্ম" },
      { value: "৯M+", label: "সহায়তা পাওয়া শিক্ষার্থী" },
    ],
    quote:
      "শিক্ষা চ্যাট শিক্ষার্থী তথ্য ব্যবস্থা এবং বিশেষ কার্যক্রমের মধ্যে দুই দিকের ডেটা প্রবাহ নিশ্চিত করে যে ডেটা সবসময় বর্তমান থাকে। শিক্ষকরা শিক্ষার্থীর প্রয়োজনীয় সুবিধার সতর্কতাও পান।",
    author: "পল হাওয়ার্ড",
    role: "বিশেষ সেবা নেতৃত্ব, স্কুল অব ড্রিমস একাডেমি",
    logo: "স্কুল অব ড্রিমস একাডেমি",
  },
  en: {
    pill: "Special Programs",
    title: "Deliver the Support Students Deserve",
    description:
      "Bring compliance workflows and data into one connected system. Ensure every student receives the right services on time by reducing manual tracking and improving team alignment.",
    stats: [
      { value: "1200+", label: "Organizations using Shikkha Chat for special programs" },
      { value: "1.7M", label: "Student services forms completed each year" },
      { value: "9M+", label: "Students supported" },
    ],
    quote:
      "Two-way data flow between Shikkha Chat SIS and Special Programs ensures that data is always current. Teachers also get alerts for student accommodations.",
    author: "Paul Howard",
    role: "Special Services Leader, School of Dreams Academy",
    logo: "School of Dreams Academy",
  },
} as const;

export default function SpecialPrograms() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="special-programs"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      logo={text.logo}
    />
  );
}

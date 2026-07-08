"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী তথ্য ব্যবস্থা",
    title: "তথ্যের বিশৃঙ্খলা কমান, শিক্ষার্থীর পরিষ্কার ধারণা বাড়ান।",
    description:
      "শিক্ষা চ্যাট শিক্ষার্থী তথ্য ব্যবস্থা ভর্তি, সময়সূচি, উপস্থিতি, গ্রেড এবং কার্যক্রম ডেটাকে একটি একক নির্ভরযোগ্য উৎসে রাখে। সঠিক ও সহজলভ্য শিক্ষার্থী তথ্যের মাধ্যমে স্টাফরা ডেটা ঠিক করার সময় কমিয়ে শিক্ষার্থী, পরিবার এবং দৈনন্দিন স্কুল পরিচালনায় বেশি সহায়তা দিতে পারেন।",
    stats: [
      { value: "৫০০০+", label: "শিক্ষা চ্যাট শিক্ষার্থী তথ্য ব্যবস্থা ব্যবহারকারী প্রতিষ্ঠান" },
      { value: "১৭M+", label: "সহায়তা পাওয়া শিক্ষার্থী" },
    ],
    quote: "আমাদের সিস্টেমগুলো শেষ পর্যন্ত একসাথে কাজ করছে। এর ফলে আমাদের মানুষও একসাথে কাজ করতে পারছে।",
    author: "সারা মিলার",
    role: "প্রযুক্তি নেতৃত্ব, লোরেনা ইন্ডিপেনডেন্ট স্কুল ডিস্ট্রিক্ট, টেক্সাস",
    logo: "লোরেনা আইএসডি",
  },
  en: {
    pill: "Student Information System",
    title: "Less Information Chaos. More Student Clarity.",
    description:
      "Shikkha Chat SIS centralizes enrollment, schedules, attendance, grades, and program data in one single source of truth. With accurate, accessible student information, staff spend less time fixing data and more time supporting students, families, and daily school operations.",
    stats: [
      { value: "5000+", label: "Organizations Using Shikkha Chat SIS" },
      { value: "17M+", label: "Students Supported" },
    ],
    quote: "Our systems are finally working together. That means our people can work together too.",
    author: "Sarah Miller",
    role: "Technology Leader, Lorena Independent School District, Texas",
    logo: "Lorena ISD",
  },
} as const;

export default function SIS() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="sis"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

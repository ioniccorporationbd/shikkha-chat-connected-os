"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণ',
    title: 'মূল্যায়ন ডেটাকে পাঠদানের কার্যকর সিদ্ধান্তে রূপ দিন।',
    description: 'বেঞ্চমার্ক, ফরমেটিভ এবং পারফরম্যান্স ডেটাকে পরিষ্কার ভিউতে আনুন, যাতে শিক্ষকরা ঘাটতি শনাক্ত করতে, দক্ষতা পর্যবেক্ষণ করতে এবং দ্রুত সাড়া দিতে পারেন।',
    stats: [{ value: '৩ গুণ', label: 'আরও কার্যকর মূল্যায়ন আলোচনা' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'মূল্যায়ন',
  },
  en: {
    pill: 'Assessment and Performance Analytics',
    title: 'Turn assessment data into instructional action.',
    description: 'Bring benchmark, formative, and performance data into clear views that help educators identify gaps, monitor mastery, and respond quickly.',
    stats: [{ value: '3x', label: 'More actionable assessment conversations' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Assessment',
  },
} as const;

export default function AssessmentPerformanceMatters() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='assessment-performance-matters'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image='https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80'
      logo={text.logo}
    />
  );
}

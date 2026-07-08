"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি',
    title: 'শিক্ষার্থীদের অর্থপূর্ণ পরবর্তী ধাপের জন্য প্রস্তুত করুন।',
    description: 'একাডেমিক অগ্রগতি, আগ্রহ, লক্ষ্য, পরিকল্পনা এবং প্রস্তুতি ডেটা যুক্ত করুন, যাতে শিক্ষার্থীরা আরও শক্তিশালী ভবিষ্যৎ তৈরি করতে পারে।',
    stats: [{ value: 'ভবিষ্যৎ', label: 'প্রতিটি শিক্ষার্থীর জন্য প্রস্তুতি পরিকল্পনা' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'প্রস্তুতি',
  },
  en: {
    pill: 'College, Career and Life Readiness',
    title: 'Prepare students for meaningful next steps.',
    description: 'Connect academic progress, interests, goals, planning, and readiness data so students can build stronger futures.',
    stats: [{ value: 'Future', label: 'Readiness planning for every learner' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Readiness',
  },
} as const;

export default function CollegeCareerLifeReadiness() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='college-career-life-readiness'
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

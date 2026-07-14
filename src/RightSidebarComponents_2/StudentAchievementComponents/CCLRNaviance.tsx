"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা',
    title: 'ব্যক্তিগত পরিকল্পনার মতো অনুভব হয় এমন দিকনির্দেশনা দিন।',
    description: 'প্রস্তুতি নির্দেশনা টুল শিক্ষার্থীদের পথ খুঁজতে, লক্ষ্য ঠিক করতে এবং শেখাকে কলেজ, ক্যারিয়ার ও জীবনের পরিকল্পনার সাথে যুক্ত করতে সাহায্য করে।',
    stats: [{ value: 'পথনির্দেশনা', label: 'কলেজ ও ক্যারিয়ার পরিকল্পনা সহায়তা' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'প্রস্তুতি',
  },
  en: {
    pill: 'Career and Life Readiness Guidance',
    title: 'Guide students with planning that feels personal.',
    description: 'Readiness guidance tools help students explore pathways, set goals, and connect learning to college, career, and life plans.',
    stats: [{ value: 'Pathway', label: 'College and career planning support' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Readiness',
  },
} as const;

export default function CCLRNaviance() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='cclr-naviance'
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

"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'আচরণগত সহায়তা',
    title: 'ভালো প্রেক্ষাপট দিয়ে ইতিবাচক আচরণে সহায়তা দিন।',
    description: 'সংযুক্ত তথ্যের মাধ্যমে স্টাফদের আচরণের ধরন বুঝতে, সহায়তা নথিভুক্ত করতে এবং শিক্ষার্থীর সুস্থতা কার্যধারা সমন্বয় করতে সাহায্য করুন।',
    stats: [{ value: '৩৬০°', label: 'শিক্ষার্থী সহায়তার পূর্ণ প্রেক্ষাপট' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'আচরণ',
  },
  en: {
    pill: 'Behavior Support',
    title: 'Support positive behavior with better context.',
    description: 'Help staff understand behavior patterns, document supports, and coordinate student wellbeing workflows with connected information.',
    stats: [{ value: '360°', label: 'Student support context' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Behavior',
  },
} as const;

export default function BehaviorSupport() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='behavior-support'
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

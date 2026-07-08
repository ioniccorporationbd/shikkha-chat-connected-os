"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'বহুস্তরীয় সহায়তা ব্যবস্থা',
    title: 'বহুস্তরীয় সহায়তাকে একটি সংযুক্ত কার্যধারায় আনুন।',
    description: 'একাডেমিক, আচরণ, উপস্থিতি এবং সহায়তা ডেটা যুক্ত করুন, যাতে স্কুলগুলো বিভিন্ন স্তরে সহায়তা আরও পরিষ্কারভাবে সমন্বয় করতে পারে।',
    stats: [{ value: 'স্তর ১–৩', label: 'সহায়তা পরিকল্পনার দৃশ্যমানতা' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'সহায়তা',
  },
  en: {
    pill: 'Multi-Tier Support System',
    title: 'Bring multi-tier support into one connected workflow.',
    description: 'Connect academic, behavior, attendance, and intervention data so schools can coordinate supports across tiers with better clarity.',
    stats: [{ value: 'Tier 1–3', label: 'Support planning visibility' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Support',
  },
} as const;

export default function MTSS() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='mtss'
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

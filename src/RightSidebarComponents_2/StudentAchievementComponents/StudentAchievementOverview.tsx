"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'শিক্ষার্থী অর্জন',
    title: 'প্রতিটি শিক্ষার্থীর জন্য সংযুক্ত অর্জন বুদ্ধিমত্তা।',
    description: 'শ্রেণিকক্ষ কার্যক্রম, মূল্যায়ন ফলাফল, সহায়তা কার্যক্রম এবং প্রস্তুতি পরিকল্পনাকে একত্র করুন, যাতে শিক্ষকরা আত্মবিশ্বাসের সাথে অগ্রগতি বুঝতে এবং প্রতিটি শিক্ষার্থীকে সহায়তা করতে পারেন।',
    stats: [{ value: '+৩৪%', label: 'শেখার অগ্রগতিতে দ্রুত দৃশ্যমানতা' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'অর্জন',
  },
  en: {
    pill: 'Student Achievement',
    title: 'Connected achievement intelligence for every learner.',
    description: 'Unify classroom activity, assessment results, interventions, and readiness planning so educators can understand progress and support each student with confidence.',
    stats: [{ value: '+34%', label: 'Faster visibility into learning progress' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Achievement',
  },
} as const;

export default function StudentAchievementOverview() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='student-achievement'
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

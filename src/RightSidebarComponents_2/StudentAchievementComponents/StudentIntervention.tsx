"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'শিক্ষার্থী সহায়তা',
    title: 'শিক্ষার্থী পিছিয়ে পড়ার আগে সহায়তা সমন্বয় করুন।',
    description: 'শেখার ঝুঁকি শনাক্ত করুন, সহায়তা কার্যক্রম নির্ধারণ করুন, সহায়তা পরিকল্পনা পর্যবেক্ষণ করুন এবং শিক্ষার্থীর সাফল্যের জন্য টিমকে একসাথে রাখুন।',
    stats: [{ value: 'আগাম', label: 'কার্যকর পদক্ষেপের সাথে যুক্ত সহায়তা সংকেত' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'সহায়তা',
  },
  en: {
    pill: 'Student Intervention',
    title: 'Coordinate support before students fall behind.',
    description: 'Identify learning risks, assign interventions, monitor support plans, and keep teams aligned around student success.',
    stats: [{ value: 'Early', label: 'Intervention signals connected to action' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Intervention',
  },
} as const;

export default function StudentIntervention() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='student-intervention'
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

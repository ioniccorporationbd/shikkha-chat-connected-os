"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'কারিকুলাম ও পাঠদান',
    title: 'কারিকুলাম, পাঠদান এবং শিক্ষার্থীর ফলাফল একসাথে মিলিয়ে নিন।',
    description: 'সংযুক্ত কারিকুলাম পরিকল্পনা, মানদণ্ড সামঞ্জস্য, শ্রেণিকক্ষ রিসোর্স এবং অগ্রগতি দৃশ্যমানতার মাধ্যমে শক্তিশালী পাঠদান নিশ্চিত করুন।',
    stats: [{ value: '১০০%', label: 'শিক্ষার্থীর প্রয়োজন অনুযায়ী পাঠদান সামঞ্জস্য' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'কারিকুলাম',
  },
  en: {
    pill: 'Curriculum and Instruction',
    title: 'Align curriculum, teaching, and student outcomes.',
    description: 'Support stronger instruction with connected curriculum planning, standards alignment, classroom resources, and progress visibility.',
    stats: [{ value: '100%', label: 'Instruction aligned around student needs' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Curriculum',
  },
} as const;

export default function CurriculumInstruction() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='curriculum-instruction'
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

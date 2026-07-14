"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'শ্রেণিকক্ষ সমাধান',
    title: 'শিক্ষকদের জন্য দৈনন্দিন শ্রেণিকক্ষ কাজ আরও পরিষ্কার করুন।',
    description: 'পাঠদান, অংশগ্রহণ, অ্যাসাইনমেন্ট এবং শিক্ষার্থীর প্রেক্ষাপট এক জায়গায় আনুন, যাতে শিক্ষকরা সিস্টেম বদলানোর বদলে শেখানোর কাজে বেশি সময় দিতে পারেন।',
    stats: [{ value: '১ ভিউ', label: 'শিক্ষার্থীকে কেন্দ্র করে সংযুক্ত শ্রেণিকক্ষ টুল' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'শ্রেণিকক্ষ',
  },
  en: {
    pill: 'Classroom Solutions',
    title: 'Give teachers a clearer daily classroom workflow.',
    description: 'Bring instruction, participation, assignments, and student context together so teachers can spend more time teaching and less time switching systems.',
    stats: [{ value: '1 View', label: 'Classroom tools connected around the learner' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Classroom',
  },
} as const;

export default function ClassroomSolutions() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='classroom-solutions'
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

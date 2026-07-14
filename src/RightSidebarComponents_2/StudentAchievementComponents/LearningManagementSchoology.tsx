"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: 'লার্নিং ব্যবস্থাপনা',
    title: 'ডিজিটাল শেখাকে শিক্ষার্থীর অগ্রগতির সাথে যুক্ত করুন।',
    description: 'লার্নিং ব্যবস্থাপনা কোর্সওয়ার্ক, অ্যাসাইনমেন্ট, রিসোর্স এবং সম্পৃক্ততা ডেটাকে শিক্ষার্থী অর্জনের বিস্তৃত অভিজ্ঞতার সাথে যুক্ত করে।',
    stats: [{ value: '২৪/৭', label: 'শিক্ষার্থী ও পরিবারের জন্য ডিজিটাল শেখার অ্যাক্সেস' }],
    quote: 'সংযুক্ত ডেটা স্কুল টিমকে দ্রুত সিদ্ধান্ত নিতে, ভালো সহায়তা দিতে এবং আরও শক্তিশালী ফলাফল তৈরি করতে পরিষ্কার দিকনির্দেশনা দেয়।',
    author: 'শিক্ষা চ্যাট টিম',
    role: 'সংযুক্ত সিস্টেম বাস্তবায়ন সহযোগী',
    logo: 'লার্নিং',
  },
  en: {
    pill: 'Learning Management',
    title: 'Connect digital learning with student progress.',
    description: 'Learning management connects coursework, assignments, resources, and engagement data to the broader student achievement experience.',
    stats: [{ value: '24/7', label: 'Digital learning access for students and families' }],
    quote: 'Connected data gives school teams the clarity to act faster, support people better, and build stronger outcomes.',
    author: 'Shikkha Chat Team',
    role: 'Connected OS Implementation Partner',
    logo: 'Learning',
  },
} as const;

export default function LearningManagementSchoology() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id='learning-management-schoology'
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

"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "যোগাযোগ ব্যবস্থা",
    title: "ম্যানুয়াল যোগাযোগ কমান, পরিবারকে আরও সংযুক্ত রাখুন।",
    description:
      "যোগাযোগকে সরাসরি শিক্ষার্থীর তথ্যের সাথে যুক্ত করে শিক্ষা চ্যাট নিশ্চিত করে প্রতিটি আপডেট সঠিক, সময়মতো এবং সহজে পাঠানো যায়। এতে স্টাফদের সময় বাঁচে এবং পরিবার অবগত ও আত্মবিশ্বাসী থাকে।",
    stats: [
      { value: "৪০০০+", label: "যোগাযোগের জন্য শিক্ষা চ্যাট ব্যবহারকারী প্রতিষ্ঠান" },
      { value: "২২M+", label: "সহায়তা পাওয়া শিক্ষার্থী" },
      { value: "৫B+", label: "প্রতি স্কুল বছরে পাঠানো বার্তা" },
    ],
    quote:
      "এটি শিক্ষা চ্যাটের মধ্যেই আছে। আমি টুল বদলানো ছাড়াই কয়েক সেকেন্ডে বার্তা পাঠাতে পারি। ব্যস্ত প্রশাসকদের জন্য এটি বড় সুবিধা।",
    author: "কেল ব্লিকেনস্টাফ",
    role: "জেলা নেতৃত্ব, মিল ক্রিক কমিউনিটি স্কুল কর্পোরেশন, ইন্ডিয়ানা",
    logo: "মিল ক্রিক",
  },
  en: {
    pill: "Communications",
    title: "Less Manual Outreach. More Connected Families.",
    description:
      "By connecting communications directly to student information, Shikkha Chat ensures every update is accurate, timely, and easy to deliver—saving staff time while keeping families informed and confident.",
    stats: [
      { value: "4000+", label: "Organizations using Shikkha Chat for communications" },
      { value: "22M+", label: "Students supported" },
      { value: "5B+", label: "Messages sent each school year" },
    ],
    quote:
      "It’s built right into Shikkha Chat. I can send a message in seconds, without switching tools. That’s a big deal for busy administrators.",
    author: "Kale Blickenstaff",
    role: "District Leader, Mill Creek Community School Corporation, Indiana",
    logo: "Mill Creek",
  },
} as const;

export default function Communications() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="communications"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

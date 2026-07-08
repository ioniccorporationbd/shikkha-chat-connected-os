"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "পরিবারের সম্পৃক্ততা",
    title: "প্রতিটি স্কুল দিনের সাথে পরিবারকে আরও কাছে আনুন।",
    description:
      "পরিবারকে অবগত রাখতে একাধিক টুল, ডেটা ঘাটতি বা মিশ্র বার্তা সামলানোর প্রয়োজন হওয়া উচিত নয়। শিক্ষা চ্যাট যোগাযোগকে পরিষ্কার, ধারাবাহিক এবং সহজলভ্য করে; এতে স্টাফদের সময় বাঁচে, পরিবার সংযুক্ত থাকে এবং শিক্ষার্থীরা স্কুলে থাকতে পারে।",
    stats: [{ value: "৪%", label: "জেলা জুড়ে দীর্ঘমেয়াদি অনুপস্থিতি উন্নতি" }],
    quote:
      "যত বেশি স্টাফ ও শিক্ষক প্ল্যাটফর্মটি ব্যবহার শুরু করলেন, একটি যোগাযোগ টুল ধীরে ধীরে সম্পৃক্ততার শক্তিশালী ইঞ্জিনে পরিণত হলো।",
    author: "ড. ম্যাট অ্যান্ডারসন",
    role: "জলবায়ু ও সংস্কৃতি নেতৃত্ব, জেফারসন কাউন্টি পাবলিক স্কুলস, কেনটাকি",
    logo: "জেসিপিএস",
  },
  en: {
    pill: "Family Engagement",
    title: "Bring Families Closer to Every School Day",
    description:
      "Keeping families informed shouldn’t require juggling tools, data gaps, or mixed messages. Shikkha Chat makes communication clear, consistent, and accessible—saving staff time, keeping families connected, and ensuring students are in school.",
    stats: [{ value: "4%", label: "Improvement in chronic absenteeism districtwide" }],
    quote:
      "As more staff and teachers began using the platform, what started as a communication tool became an engagement engine.",
    author: "Dr. Matt Anderson",
    role: "Climate and Culture Leader, Jefferson County Public Schools, Kentucky",
    logo: "JCPS",
  },
} as const;

export default function FamilyEngagement() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="family-engagement"
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

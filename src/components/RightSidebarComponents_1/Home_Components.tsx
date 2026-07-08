"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "হোম কানেকশন",
    title: "প্রতিটি স্কুলের জন্য সংযুক্ত পারিবারিক অভিজ্ঞতা।",
    description:
      "শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, পরিবার যোগাযোগ, উপস্থিতি সহায়তা, ভর্তি ব্যবস্থাপনা এবং স্কুল পরিচালনাকে একটি নির্ভরযোগ্য প্ল্যাটফর্মে যুক্ত করে। স্কুল পরিষ্কার আপডেট শেয়ার করতে পারে, পরিবার সবসময় প্রয়োজনীয় তথ্য জানতে পারে এবং প্রতিটি শিক্ষার্থী আরও ভালো সহায়তা পায়।",
    stats: [
      {
        value: "+৭০%",
        label: "ডেটা নির্ভুলতা বৃদ্ধি",
      },
      {
        value: "২৪/৭",
        label: "পরিবারের অ্যাক্সেস",
      },
      {
        value: "১ সিস্টেম",
        label: "একীভূত স্কুল ব্যবস্থা",
      },
    ],
    quote:
      "শিক্ষা চ্যাট আমাদের যোগাযোগের দূরত্ব কমাতে এবং আরও স্মার্ট সংযুক্ত স্কুল অভিজ্ঞতা তৈরি করতে সাহায্য করেছে।",
    author: "ড. অ্যাঞ্জেলা হারগ্রেভ",
    role: "প্রযুক্তি নেতৃত্ব, সংযুক্ত স্কুল কমিউনিটি",
    logo: "শিক্ষা চ্যাট",
  },
  en: {
    pill: "Home Connections",
    title: "Connected family experience for every school.",
    description:
      "Shikkha Chat connects student information, family communication, attendance support, enrollment management, and school operations in one trusted platform. Schools can share clear updates, families can stay informed, and every learner gets better support.",
    stats: [
      {
        value: "+70%",
        label: "Better data accuracy",
      },
      {
        value: "24/7",
        label: "Family access",
      },
      {
        value: "1 System",
        label: "Unified school system",
      },
    ],
    quote:
      "Shikkha Chat helped us reduce communication gaps and create a smarter connected school experience.",
    author: "Dr. Angela Hargrave",
    role: "Technology Leader, Connected School Community",
    logo: "Shikkha Chat",
  },
} as const;

export default function HomeComponents() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <section
      id="home-connections-panel-wrapper"
      className={[
        "home-connections-section",
        "bg-[var(--color-white)]",
        "text-[var(--color-primary)]",
      ].join(" ")}
    >
      <SectionPanel
        id="home-connections-panel"
        pill={text.pill}
        pillStyle="solid"
        title={text.title}
        description={text.description}
        showButtons={false}
        stats={text.stats}
        quote={text.quote}
        author={text.author}
        role={text.role}
        image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
        logo={text.logo}
      />
    </section>
  );
}
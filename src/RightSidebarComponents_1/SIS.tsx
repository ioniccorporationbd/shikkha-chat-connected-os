
"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থী তথ্য ব্যবস্থা",
    title: "তথ্যের বিশৃঙ্খলা কমান, শিক্ষার্থীর পরিষ্কার ধারণা বাড়ান।",
    description:
      "শিক্ষা চ্যাট শিক্ষার্থী তথ্য ব্যবস্থা ভর্তি, সময়সূচি, উপস্থিতি, গ্রেড এবং কার্যক্রমের তথ্যকে একটি নির্ভরযোগ্য কেন্দ্রীভূত ব্যবস্থায় সংরক্ষণ করে। সঠিক ও সহজলভ্য শিক্ষার্থী তথ্যের মাধ্যমে কর্মীরা তথ্য সংশোধনে কম সময় ব্যয় করে শিক্ষার্থী, পরিবার এবং বিদ্যালয়ের দৈনন্দিন কার্যক্রমে আরও বেশি সহায়তা দিতে পারেন।",
    stats: [
      {
        value: "৫০০০+",
        label:
          "শিক্ষা চ্যাট শিক্ষার্থী তথ্য ব্যবস্থা ব্যবহারকারী প্রতিষ্ঠান",
      },
      {
        value: "১ কোটি ৭০ লাখ+",
        label: "সহায়তা পাওয়া শিক্ষার্থী",
      },
    ],
    quote:
      "আমাদের ব্যবস্থাগুলো অবশেষে একসঙ্গে কাজ করছে। এর ফলে আমাদের কর্মীরাও আরও সমন্বিতভাবে কাজ করতে পারছেন।",
    author: "সারা মিলার",
    role:
      "প্রযুক্তি প্রধান, লোরেনা ইন্ডিপেনডেন্ট স্কুল ডিস্ট্রিক্ট, টেক্সাস",
    logo: "লোরেনা আইএসডি",
  },

  en: {
    pill: "Student Information System",
    title: "Less information chaos. More student clarity.",
    description:
      "Shikkha Chat SIS centralizes enrollment, schedules, attendance, grades, and program data in one reliable source of truth. With accurate and accessible student information, staff spend less time correcting data and more time supporting students, families, and daily school operations.",
    stats: [
      {
        value: "5000+",
        label: "Organizations using Shikkha Chat SIS",
      },
      {
        value: "17M+",
        label: "Students supported",
      },
    ],
    quote:
      "Our systems are finally working together. That means our people can work together more effectively too.",
    author: "Sarah Miller",
    role:
      "Technology Leader, Lorena Independent School District, Texas",
    logo: "Lorena ISD",
  },
} as const;

export default function SIS() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = sectionText[currentLanguage];

  return (
    <section
      id="sis-section-wrapper"
      lang={currentLanguage}
      className="home-connections-section text-[var(--color-primary)]"
    >
      <SectionPanel
        id="sis"
        pill={text.pill}
        pillStyle="solid"
        title={text.title}
        description={text.description}
        stats={text.stats}
        quote={text.quote}
        author={text.author}
        role={text.role}
        image="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=220&q=80"
        logo={text.logo}
      />
    </section>
  );
}

"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "হোম কানেকশন",
    floatingEyebrow: "সক্রিয় পণ্য",
    floatingTitle: "হোম কানেকশন",
    title: "প্রতিটি বিদ্যালয়ের জন্য সংযুক্ত পারিবারিক অভিজ্ঞতা।",
    description:
      "শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, পরিবারের সঙ্গে যোগাযোগ, উপস্থিতি সহায়তা, ভর্তি ব্যবস্থাপনা এবং বিদ্যালয়ের কার্যক্রমকে একটি নির্ভরযোগ্য প্ল্যাটফর্মে যুক্ত করে। বিদ্যালয় সহজভাবে প্রয়োজনীয় হালনাগাদ তথ্য শেয়ার করতে পারে, পরিবার সবসময় গুরুত্বপূর্ণ তথ্য জানতে পারে এবং প্রতিটি শিক্ষার্থী আরও কার্যকর সহায়তা পায়।",
    stats: [
      {
        value: "+৭০%",
        label: "তথ্যের নির্ভুলতা বৃদ্ধি",
      },
      {
        value: "২৪/৭",
        label: "পরিবারের সার্বক্ষণিক প্রবেশাধিকার",
      },
      {
        value: "১টি ব্যবস্থা",
        label: "সমন্বিত বিদ্যালয় ব্যবস্থাপনা",
      },
    ],
    quote:
      "শিক্ষা চ্যাট আমাদের যোগাযোগের ব্যবধান কমাতে এবং আরও আধুনিক ও সংযুক্ত বিদ্যালয় অভিজ্ঞতা তৈরি করতে সাহায্য করেছে।",
    author: "ড. অ্যাঞ্জেলা হারগ্রেভ",
    role: "প্রযুক্তি প্রধান, সংযুক্ত বিদ্যালয় সম্প্রদায়",
    logo: "শিক্ষা চ্যাট",
  },

  en: {
    pill: "Home Connections",
    floatingEyebrow: "Active Product",
    floatingTitle: "Home Connections",
    title: "A connected family experience for every school.",
    description:
      "Shikkha Chat connects student information, family communication, attendance support, enrollment management, and school operations through one trusted platform. Schools can share clear updates, families can always access important information, and every learner can receive better support.",
    stats: [
      {
        value: "+70%",
        label: "Improved data accuracy",
      },
      {
        value: "24/7",
        label: "Continuous family access",
      },
      {
        value: "1 System",
        label: "Unified school management",
      },
    ],
    quote:
      "Shikkha Chat helped us reduce communication gaps and create a smarter, more connected school experience.",
    author: "Dr. Angela Hargrave",
    role: "Technology Leader, Connected School Community",
    logo: "Shikkha Chat",
  },
} as const;

export default function HomeComponents() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode =
    language === "en" ? "en" : "bn";

  const text = sectionText[currentLanguage];

  return (
    <section
      id="home-connections-panel-wrapper"
      lang={currentLanguage}
      className={[
        "home-connections-section",
        "relative",
        "bg-[var(--color-white)]",
        "text-[var(--color-primary)]",
      ].join(" ")}
    >
      <div
        className={[
          "home-floating-card",
          "pointer-events-none",
          "absolute",
          "right-4",
          "top-4",
          "z-30",
          "hidden",
          "rounded-2xl",
          "border",
          "border-[var(--color-white)]",
          "bg-[var(--color-primary)]",
          "px-4",
          "py-3",
          "text-[var(--color-white)]",
          "shadow-[0_18px_42px_color-mix(in_srgb,var(--color-primary)_24%,transparent)]",
          "md:block",
        ].join(" ")}
      >
        <p
          className={[
            "home-floating-eyebrow",
            "active-product-text",
            "text-[var(--color-white)]",
          ].join(" ")}
        >
          {text.floatingEyebrow}
        </p>

        <h3
          className={[
            "home-floating-title",
            "product-pill-text",
            "mt-1",
            "text-[var(--color-white)]",
          ].join(" ")}
        >
          {text.floatingTitle}
        </h3>
      </div>

      <div className="home-section-panel">
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
      </div>
    </section>
  );
}
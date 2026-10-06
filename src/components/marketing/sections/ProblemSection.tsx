"use client";

import { useMemo } from "react";
import {
  MdContentCopy,
  MdOutlineBarChart,
  MdOutlineForum,
  MdOutlineHub,
  MdShield,
  MdTrendingUp,
} from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal, RevealGroup } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
    closing: string;
  }
> = {
  bn: {
    eyebrow: "সমস্যা",
    title: "আপনার শিক্ষা প্রতিষ্ঠানের তথ্য কি এখনো বিভিন্ন জায়গায় ছড়িয়ে আছে?",
    lead: "Student information এক জায়গায়, employee information অন্য জায়গায়, attendance register কাগজে, notice Facebook বা Messenger-এ, accounts Excel-এ, আর website আবার আলাদা। এই fragmented process institution management-কে অপ্রয়োজনীয়ভাবে জটিল করে তোলে।",
    items: [
      { title: "ছড়িয়ে থাকা তথ্য", body: "একই প্রতিষ্ঠানের বিভিন্ন তথ্য বিভিন্ন জায়গায় থাকে।" },
      { title: "ডুপ্লিকেট কাজ", body: "একই তথ্য একাধিক জায়গায় লিখতে হয়।" },
      { title: "রিপোর্টিং সমস্যা", body: "প্রয়োজনের সময় accurate report তৈরি করা কঠিন হয়ে পড়ে।" },
      { title: "যোগাযোগের দূরত্ব", body: "Administrator, staff, student ও guardian-এর মধ্যে timely information flow বাধাগ্রস্ত হয়।" },
      { title: "নিরাপত্তা ঝুঁকি", body: "কে কোন তথ্য দেখতে বা পরিবর্তন করতে পারবে তা নিয়ন্ত্রণ কঠিন।" },
      { title: "ম্যানুয়াল নির্ভরতা", body: "একজন নির্দিষ্ট employee অনুপস্থিত থাকলে গুরুত্বপূর্ণ কাজ বন্ধ হয়ে যেতে পারে।" },
    ],
    closing: "শিক্ষা চ্যাট সবকিছুকে একটি connected digital ecosystem-এর মধ্যে আনার জন্য তৈরি।",
  },
  en: {
    eyebrow: "The Problem",
    title: "Is your institution’s information still scattered everywhere?",
    lead: "Student information in one place, employee records somewhere else, attendance on paper registers, notices on Facebook or Messenger, accounts in Excel, and a website that is separate again. This fragmented process makes institution management needlessly complex.",
    items: [
      { title: "Scattered information", body: "The same institution’s data lives in many different places." },
      { title: "Duplicate work", body: "The same information has to be written down more than once." },
      { title: "Reporting gaps", body: "Building an accurate report when management needs it is hard." },
      { title: "Communication gaps", body: "Timely information flow between admin, staff, students and guardians breaks down." },
      { title: "Security risk", body: "Controlling who can view or change which data is difficult." },
      { title: "Manual dependency", body: "If one employee is absent, a critical operation can stop." },
    ],
    closing: "Shikkha Chat exists to bring all of this into one connected digital ecosystem.",
  },
};

const ICONS = [
  <MdOutlineHub key="0" />,
  <MdContentCopy key="1" />,
  <MdOutlineBarChart key="2" />,
  <MdOutlineForum key="3" />,
  <MdShield key="4" />,
  <MdTrendingUp key="5" />,
];

export default function ProblemSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-problem" className="mk-section mk-section--tint mk-dots">
      <div className="mk-container">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head mk-head--center">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead" style={{ marginInline: "auto" }}>
              {c.lead}
            </p>
          </Reveal>

          <div className="mk-grid mk-grid--3">
            {c.items.map((item, i) => (
              <Reveal key={item.title}>
                <div className="mk-card mk-card--flat">
                  <span className="mk-icon-badge" aria-hidden>
                    {ICONS[i]}
                  </span>
                  <h3 className="mk-h3" style={{ marginTop: "1rem" }}>
                    {item.title}
                  </h3>
                  <p className="mk-body">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mk-head mk-head--center">
            <span className="mk-chip">{c.closing}</span>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}

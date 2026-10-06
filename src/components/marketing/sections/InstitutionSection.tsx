"use client";

import { useMemo } from "react";
import {
  MdOutlineAccountTree,
  MdOutlineCastForEducation,
  MdOutlineGroups,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlineSchool,
} from "react-icons/md";
import { FaGraduationCap } from "react-icons/fa6";
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
  }
> = {
  bn: {
    eyebrow: "কাদের জন্য",
    title: "সব ধরনের শিক্ষা প্রতিষ্ঠানের জন্য তৈরি",
    lead: "Primary school থেকে training institute পর্যন্ত — প্রতিটি প্রতিষ্ঠানের প্রয়োজন আলাদা, platform উভয়কেই মানিয়ে নিতে পারে।",
    items: [
      { title: "School", body: "Primary, secondary ও higher secondary institution।" },
      { title: "College", body: "Academic ও administrative operation manage করার জন্য।" },
      { title: "Madrasa", body: "General অথবা specialized madrasa management-এর জন্য।" },
      { title: "Coaching Centre", body: "Student, fees, batch ও administrative management-এর জন্য।" },
      { title: "Training Institute", body: "Learner ও course administration-এর জন্য।" },
      { title: "Technical Institute", body: "Student, employee ও operational management-এর জন্য।" },
      { title: "Educational Organization", body: "Multiple programs অথবা branches পরিচালনাকারী organization-এর জন্য।" },
    ],
  },
  en: {
    eyebrow: "Who It’s For",
    title: "Built for every kind of education institution",
    lead: "From primary schools to training institutes — every institution is different, and the platform adapts to each.",
    items: [
      { title: "School", body: "Primary, secondary and higher secondary institutions." },
      { title: "College", body: "For managing academic and administrative operations." },
      { title: "Madrasa", body: "For general or specialized madrasa management." },
      { title: "Coaching Centre", body: "For student, fees, batch and administrative management." },
      { title: "Training Institute", body: "For learner and course administration." },
      { title: "Technical Institute", body: "For student, employee and operational management." },
      { title: "Educational Organization", body: "For organizations running multiple programs or branches." },
    ],
  },
};

const ICONS = [
  <MdOutlineSchool key="0" />,
  <FaGraduationCap key="1" />,
  <MdOutlineMenuBook key="2" />,
  <MdOutlineGroups key="3" />,
  <MdOutlineCastForEducation key="4" />,
  <MdOutlineHub key="5" />,
  <MdOutlineAccountTree key="6" />,
];

export default function InstitutionSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-institutions" className="mk-section mk-section--tint">
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
                <div className="mk-card mk-card--flat mk-card--row">
                  <span className="mk-icon-badge" aria-hidden style={{ flex: "none" }}>
                    {ICONS[i]}
                  </span>
                  <div>
                    <h3 className="mk-h3">{item.title}</h3>
                    <p className="mk-body mk-body--sm">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}

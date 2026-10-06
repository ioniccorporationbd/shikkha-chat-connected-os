"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<Lang, { eyebrow: string; title: string; lead: string }> = {
  bn: {
    eyebrow: "Dashboard Showcase",
    title: "সংযুক্ত platform — এক নজরে",
    lead: "একটি প্রতিষ্ঠান, একটি সংযুক্ত ব্যবস্থা। নিচে দেখুন কীভাবে বিভিন্ন role ও operation একই platform-এ যুক্ত হয়।",
  },
  en: {
    eyebrow: "Dashboard Showcase",
    title: "The connected platform — at a glance",
    lead: "One institution, one connected system. Below you can see how different roles and operations come together inside the same platform.",
  },
};

export default function DashboardShowcaseIntro() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-showcase" className="mk-section mk-section--dark">
      <div className="mk-container">
        <Reveal className="mk-head mk-head--center">
          <span className="mk-eyebrow mk-eyebrow--invert">{c.eyebrow}</span>
          <h2 className="mk-h2">{c.title}</h2>
          <p className="mk-lead" style={{ marginInline: "auto" }}>
            {c.lead}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

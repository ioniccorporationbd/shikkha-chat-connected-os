"use client";

import { useMemo } from "react";
import {
  MdOutlineBuild,
  MdOutlineSupportAgent,
  MdOutlineSchool,
  MdOutlineVerifiedUser,
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
    footer: string;
  }
> = {
  bn: {
    eyebrow: "Why IONIC Corporation",
    title: "কেন IONIC Corporation?",
    lead: "Shikkha Chat তৈরি করেছে IONIC Corporation — ERP, POS, Ecommerce এবং business automation সলিউশনে অভিজ্ঞ একটি software প্রতিষ্ঠান।",
    items: [
      { title: "ERP Expertise", body: "ERPNext/Frappe-ভিত্তিক enterprise system তৈরিতে অভিজ্ঞতা।" },
      { title: "End-to-End Delivery", body: "Consultation থেকে implementation, training ও support পর্যন্ত।" },
      { title: "Education-Focused", body: "শিক্ষা প্রতিষ্ঠানের operation বুঝে সমাধান design করা হয়।" },
      { title: "Long-Term Support", body: "Go-live-এর পরও configuration, maintenance ও enhancement।" },
    ],
    footer: "আপনার প্রতিষ্ঠানের প্রয়োজন বুঝে একটি tailored solution দিতে আমরা প্রস্তুত।",
  },
  en: {
    eyebrow: "Why IONIC Corporation",
    title: "Why IONIC Corporation?",
    lead: "Shikkha Chat is built by IONIC Corporation — a software company experienced in ERP, POS, ecommerce and business automation solutions.",
    items: [
      { title: "ERP Expertise", body: "Experience building enterprise systems on ERPNext / Frappe." },
      { title: "End-to-End Delivery", body: "From consultation to implementation, training and support." },
      { title: "Education-Focused", body: "Solutions designed around how education institutions actually operate." },
      { title: "Long-Term Support", body: "Configuration, maintenance and enhancements after go-live." },
    ],
    footer: "We are ready to craft a solution tailored to your institution’s needs.",
  },
};

const ICONS = [
  <MdOutlineBuild key="0" />,
  <MdOutlineVerifiedUser key="1" />,
  <MdOutlineSchool key="2" />,
  <MdOutlineSupportAgent key="3" />,
];

export default function IonicSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-ionic" className="mk-section mk-section--tint">
      <div className="mk-container">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head mk-head--center">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead" style={{ marginInline: "auto" }}>
              {c.lead}
            </p>
          </Reveal>

          <div className="mk-grid mk-grid--4">
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
            <span className="mk-chip">{c.footer}</span>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}

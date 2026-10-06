"use client";

import { useMemo } from "react";
import {
  MdOutlineAccountTree,
  MdOutlineApi,
  MdOutlineInsights,
  MdOutlineStorage,
  MdOutlineVpnKey,
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
    note: string;
  }
> = {
  bn: {
    eyebrow: "Technology Foundation",
    title: "ERP-backed architecture — শুধু একটি website নয়",
    lead: "শিক্ষা চ্যাট একটি শক্তিশালী ERP ভিত্তির উপর তৈরি, তাই তথ্য কেন্দ্রীভূত থাকে, permission নিয়ন্ত্রিত থাকে এবং প্রতিষ্ঠান বড় হওয়ার সাথে সাথে system scale করতে পারে।",
    items: [
      { title: "Centralized Database", body: "সব তথ্য একটি reliable, relational database-এ কেন্দ্রীভূত।" },
      { title: "Role-Based Permissions", body: "কে কোন তথ্য দেখবে বা পরিবর্তন করবে তা সুনির্দিষ্টভাবে নিয়ন্ত্রণ।" },
      { title: "Secure Authentication", body: "OTP ও session-ভিত্তিক নিরাপদ login workflow।" },
      { title: "Integration-Ready APIs", body: "Website, SMS, email ও ভবিষ্যৎ app ইন্টিগ্রেশনের জন্য প্রস্তুত।" },
      { title: "Reliable Reporting", body: "প্রয়োজনের সময় accurate, verifiable report তৈরি করা যায়।" },
    ],
    note: "একটি পরিপক্ব, উন্মুক্ত ERP foundation — যা ভবিষ্যতে নতুন module যোগ করার সুযোগ রাখে।",
  },
  en: {
    eyebrow: "Technology Foundation",
    title: "ERP-backed architecture — not just a website",
    lead: "Shikkha Chat is built on a powerful ERP foundation, so information stays centralized, permissions stay controlled, and the system scales as your institution grows.",
    items: [
      { title: "Centralized Database", body: "All information held in one reliable, relational database." },
      { title: "Role-Based Permissions", body: "Precise control over who can view or modify which data." },
      { title: "Secure Authentication", body: "An OTP and session-based secure login workflow." },
      { title: "Integration-Ready APIs", body: "Ready to integrate with your website, SMS, email and future apps." },
      { title: "Reliable Reporting", body: "Accurate, verifiable reports available when management needs them." },
    ],
    note: "A mature, open ERP foundation — leaving room to add new modules in the future.",
  },
};

const ICONS = [
  <MdOutlineStorage key="0" />,
  <MdOutlineAccountTree key="1" />,
  <MdOutlineVpnKey key="2" />,
  <MdOutlineApi key="3" />,
  <MdOutlineInsights key="4" />,
];

export default function TechnologySection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-technology" className="mk-section">
      <div className="mk-container">
        <div className="mk-split">
          <Reveal className="mk-head">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-display">{c.title}</h2>
            <p className="mk-lead">{c.lead}</p>
            <p className="mk-note">{c.note}</p>
          </Reveal>

          <RevealGroup className="mk-stack" amount={0.2}>
            {c.items.map((item, i) => (
              <Reveal key={item.title}>
                <div className="mk-card mk-card--row mk-card--flat">
                  <span className="mk-icon-badge" aria-hidden style={{ flex: "none" }}>
                    {ICONS[i]}
                  </span>
                  <div>
                    <h3 className="mk-h3">{item.title}</h3>
                    <p className="mk-body">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

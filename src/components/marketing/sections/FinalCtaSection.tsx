"use client";

import { useMemo } from "react";
import { MdArrowForward, MdOutlineMailOutline, MdOutlinePhone } from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    contact: string;
  }
> = {
  bn: {
    eyebrow: "Get Started",
    title: "আপনার প্রতিষ্ঠানকে ডিজিটাল যাত্রায় নিয়ে যেতে প্রস্তুত?",
    lead: "একটি demo request করুন — আমরা আপনার প্রতিষ্ঠানের প্রয়োজন বুঝে সঠিকভাবে দেখিয়ে দেবো কীভাবে শিক্ষা চ্যাট কাজে লাগতে পারে।",
    primary: "ডেমো রিকোয়েস্ট করুন",
    secondary: "ফিচার দেখুন",
    contact: "অথবা সরাসরি যোগাযোগ করুন IONIC Corporation-এর সাথে।",
  },
  en: {
    eyebrow: "Get Started",
    title: "Ready to take your institution on a digital journey?",
    lead: "Request a demo — we’ll understand your institution’s needs and show you exactly how Shikkha Chat fits.",
    primary: "Request a Demo",
    secondary: "Explore Features",
    contact: "Or reach out directly to IONIC Corporation.",
  },
};

export default function FinalCtaSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-demo-form" className="mk-section mk-cta">
      <div className="mk-container">
        <Reveal className="mk-cta-inner">
          <span className="mk-eyebrow mk-eyebrow--invert">{c.eyebrow}</span>
          <h2 className="mk-display">{c.title}</h2>
          <p className="mk-lead" style={{ marginInline: "auto" }}>
            {c.lead}
          </p>
          <div className="mk-btn-row mk-btn-row--center">
            <a className="mk-btn mk-btn--onDark" href="#mk-demo-form">
              {c.primary}
              <MdArrowForward />
            </a>
            <a className="mk-btn mk-btn--ghostOnDark" href="#mk-features">
              {c.secondary}
            </a>
          </div>
          <p className="mk-cta-contact">
            <MdOutlinePhone aria-hidden />
            <span>{c.contact}</span>
            <MdOutlineMailOutline aria-hidden />
          </p>
        </Reveal>
      </div>
    </section>
  );
}

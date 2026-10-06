"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal, RevealGroup } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    steps: { title: string; body: string }[];
  }
> = {
  bn: {
    eyebrow: "কিভাবে কাজ করে",
    title: "কিভাবে কাজ করে",
    lead: "Institution consultation থেকে go-live পর্যন্ত — একটি স্পষ্ট, ধাপে ধাপে প্রক্রিয়া।",
    steps: [
      { title: "Institution Consultation", body: "প্রতিষ্ঠানের বর্তমান workflow এবং প্রয়োজন বোঝা হয়।" },
      { title: "System Configuration", body: "Institution অনুযায়ী modules এবং access configure করা হয়।" },
      { title: "Data Setup", body: "প্রয়োজনীয় organizational information system-এ setup করা হয়।" },
      { title: "User Setup", body: "Administrator, employees এবং প্রয়োজনীয় users create করা হয়।" },
      { title: "Training", body: "Relevant users-কে system ব্যবহার শেখানো হয়।" },
      { title: "Go Live", body: "Institution real operation-এ platform ব্যবহার শুরু করে।" },
      { title: "Support & Improvement", body: "প্রয়োজন অনুযায়ী configuration, support এবং enhancement দেওয়া হয়।" },
    ],
  },
  en: {
    eyebrow: "How It Works",
    title: "How it works",
    lead: "From institution consultation to go-live — a clear, step-by-step process.",
    steps: [
      { title: "Institution Consultation", body: "We understand your institution’s current workflow and needs." },
      { title: "System Configuration", body: "Modules and access are configured for your institution." },
      { title: "Data Setup", body: "The required organizational information is set up in the system." },
      { title: "User Setup", body: "Administrators, employees and the necessary users are created." },
      { title: "Training", body: "Relevant users are trained to use the system." },
      { title: "Go Live", body: "Your institution starts using the platform in real operations." },
      { title: "Support & Improvement", body: "Configuration, support and enhancements are provided as needed." },
    ],
  },
};

export default function HowItWorksSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-how" className="mk-section">
      <div className="mk-container">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead">{c.lead}</p>
          </Reveal>

          <div className="mk-grid mk-grid--2">
            {c.steps.map((step, i) => (
              <Reveal key={step.title}>
                <div className="mk-step">
                  <span className="mk-step-num">{i + 1}</span>
                  <div>
                    <h3 className="mk-h3">{step.title}</h3>
                    <p className="mk-body">{step.body}</p>
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

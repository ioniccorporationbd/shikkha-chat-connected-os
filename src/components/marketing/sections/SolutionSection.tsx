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
    pillars: { title: string; body: string }[];
  }
> = {
  bn: {
    eyebrow: "সমাধান",
    title: "One Institution. One Connected System.",
    lead: "শিক্ষা চ্যাট একটি centralized digital platform তৈরি করে যেখানে institution-এর users, operations এবং data organisedভাবে পরিচালিত হতে পারে — একটি প্রতিষ্ঠান, একটি সংযুক্ত ব্যবস্থা, কিন্তু প্রত্যেকের জন্য আলাদা role-based অভিজ্ঞতা।",
    pillars: [
      { title: "Role-Based Experience", body: "Admin, staff ও user প্রত্যেকে তার কাজ অনুযায়ী আলাদা interface পায়।" },
      { title: "Centralized Information", body: "গুরুত্বপূর্ণ তথ্য fragmented না হয়ে এক জায়গায় সংরক্ষিত থাকে।" },
      { title: "ERP-Backed Architecture", body: "শক্তিশালী enterprise-grade data management ভিত্তি।" },
    ],
  },
  en: {
    eyebrow: "The Solution",
    title: "One Institution. One Connected System.",
    lead: "Shikkha Chat builds a centralized digital platform where an institution’s users, operations and data are managed in an organized way — one institution, one connected system, yet a distinct role-based experience for everyone.",
    pillars: [
      { title: "Role-Based Experience", body: "Admins, staff and users each get an interface shaped around their work." },
      { title: "Centralized Information", body: "Important information is stored in one place instead of being fragmented." },
      { title: "ERP-Backed Architecture", body: "A powerful, enterprise-grade data management foundation." },
    ],
  },
};

export default function SolutionSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-solution" className="mk-section">
      <div className="mk-container">
        <div className="mk-split">
          <Reveal className="mk-head">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-display">{c.title}</h2>
            <p className="mk-lead">{c.lead}</p>
          </Reveal>

          <RevealGroup className="mk-stack" amount={0.2}>
            {c.pillars.map((p) => (
              <Reveal key={p.title}>
                <div className="mk-card">
                  <h3 className="mk-h3">{p.title}</h3>
                  <p className="mk-body">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

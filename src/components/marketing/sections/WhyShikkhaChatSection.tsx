"use client";

import { useMemo } from "react";
import {
  MdOutlineChat,
  MdOutlineGroups,
  MdOutlinePublic,
  MdOutlineStorage,
  MdOutlineTune,
  MdVerified,
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
  }
> = {
  bn: {
    eyebrow: "কেন শিক্ষা চ্যাট",
    title: "কেন Shikkha Chat?",
    lead: "শুধু সুন্দর interface যথেষ্ট নয় — প্রতিষ্ঠানের software-এ প্রয়োজন reliable data, simple workflow, সঠিক permission এবং নিরাপদ login।",
    items: [
      { title: "Built for Real Operations", body: "শুধু static website নয় — daily operational workflow-এর জন্য design করা।" },
      { title: "Role-Based Experience", body: "প্রত্যেক user তার কাজ অনুযায়ী interface পেতে পারে।" },
      { title: "Centralized Information", body: "গুরুত্বপূর্ণ information এক জায়গায় রাখা যায়।" },
      { title: "Flexible & Customizable", body: "প্রতিষ্ঠানের workflow অনুযায়ী feature customize করার সুযোগ।" },
      { title: "ERP-Backed Architecture", body: "Powerful enterprise data management foundation।" },
      { title: "Secure Authentication", body: "OTP এবং authenticated user workflow।" },
    ],
  },
  en: {
    eyebrow: "Why Shikkha Chat",
    title: "Why Shikkha Chat?",
    lead: "A polished interface is not enough — an institution needs reliable data, simple workflows, the right permissions and secure login.",
    items: [
      { title: "Built for Real Operations", body: "Not just a static website — designed for daily operational workflows." },
      { title: "Role-Based Experience", body: "Every user gets an interface based on their role." },
      { title: "Centralized Information", body: "Keep important information in one place." },
      { title: "Flexible & Customizable", body: "Room to customize features around your workflow." },
      { title: "ERP-Backed Architecture", body: "A powerful enterprise data management foundation." },
      { title: "Secure Authentication", body: "OTP and an authenticated user workflow." },
    ],
  },
};

const ICONS = [
  <MdOutlineStorage key="0" />,
  <MdOutlineGroups key="1" />,
  <MdOutlinePublic key="2" />,
  <MdOutlineTune key="3" />,
  <MdVerified key="4" />,
  <MdOutlineChat key="5" />,
];

export default function WhyShikkhaChatSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-why" className="mk-section mk-section--dark">
      <div className="mk-container">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head mk-head--center">
            <span className="mk-eyebrow mk-eyebrow--invert">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead" style={{ marginInline: "auto" }}>
              {c.lead}
            </p>
          </Reveal>

          <div className="mk-grid mk-grid--3">
            {c.items.map((item, i) => (
              <Reveal key={item.title}>
                <div className="mk-card mk-card--glass">
                  <span className="mk-icon-badge" aria-hidden>
                    {ICONS[i]}
                  </span>
                  <h3 className="mk-h3" style={{ marginTop: "1.1rem" }}>
                    {item.title}
                  </h3>
                  <p className="mk-body mk-body--onDark">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}

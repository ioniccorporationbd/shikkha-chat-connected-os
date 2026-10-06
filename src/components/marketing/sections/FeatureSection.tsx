"use client";

import { useMemo } from "react";
import {
  MdOutlineChat,
  MdOutlineDashboard,
  MdOutlineGroups,
  MdOutlineSchedule,
  MdOutlineTune,
  MdShield,
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
    eyebrow: "ফিচার",
    title: "আপনার প্রতিষ্ঠানের দৈনন্দিন কাজের জন্য সংযুক্ত ফিচার",
    lead: "একটি প্রতিষ্ঠান। একটি Platform। Connected Management — সবকিছু একসাথে।",
    items: [
      { title: "Smart Dashboard", body: "গুরুত্বপূর্ণ operation ও information একটি organised dashboard থেকে access করুন।" },
      { title: "Secure User Access", body: "প্রত্যেক user-এর জন্য role-based এবং authenticated access।" },
      { title: "Employee Attendance", body: "Digital check-in/check-out workflow দিয়ে employee attendance manage করুন।" },
      { title: "User Management", body: "প্রতিষ্ঠানের প্রয়োজন অনুযায়ী user ও profile manage করুন।" },
      { title: "Communication Ready", body: "SMS, email এবং portal-based communication integration-এর জন্য প্রস্তুত architecture।" },
      { title: "Customizable", body: "আপনার institution-এর process অনুযায়ী system customize করুন।" },
    ],
  },
  en: {
    eyebrow: "Features",
    title: "Connected features for your institution’s daily work",
    lead: "One institution. One platform. Connected management — everything together.",
    items: [
      { title: "Smart Dashboard", body: "Access important operations and information from one organized dashboard." },
      { title: "Secure User Access", body: "Role-based and authenticated access for every user." },
      { title: "Employee Attendance", body: "Manage employee attendance with a digital check-in/check-out workflow." },
      { title: "User Management", body: "Create and manage the users and profiles your institution needs." },
      { title: "Communication Ready", body: "Architecture ready for SMS, email and portal-based communication." },
      { title: "Customizable", body: "Customize the system around your institution’s processes." },
    ],
  },
};

const ICONS = [
  <MdOutlineDashboard key="0" />,
  <MdShield key="1" />,
  <MdOutlineSchedule key="2" />,
  <MdOutlineGroups key="3" />,
  <MdOutlineChat key="4" />,
  <MdOutlineTune key="5" />,
];

export default function FeatureSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-features" className="mk-section mk-section--tint">
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
                <div className="mk-card">
                  <span className="mk-icon-badge" aria-hidden>
                    {ICONS[i]}
                  </span>
                  <h3 className="mk-h3" style={{ marginTop: "1.1rem" }}>
                    {item.title}
                  </h3>
                  <p className="mk-body">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}

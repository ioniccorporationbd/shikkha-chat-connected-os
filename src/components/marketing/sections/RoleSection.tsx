"use client";

import { useMemo } from "react";
import {
  MdOutlineAdminPanelSettings,
  MdOutlineBadge,
  MdOutlineGroups,
  MdOutlineSchool,
} from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal, RevealGroup } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";
type Status = "current" | "configurable";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    currentLabel: string;
    configurableLabel: string;
    roles: { title: string; body: string; status: Status }[];
  }
> = {
  bn: {
    eyebrow: "Role-Based Platform",
    title: "একই platform — কিন্তু প্রত্যেকের জন্য তার কাজ অনুযায়ী আলাদা অভিজ্ঞতা",
    lead: "Platform-এর architecture role-based, তাই Administrator থেকে employee পর্যন্ত প্রত্যেকে নিজের role অনুযায়ী প্রাসঙ্গিক module ও তথ্য দেখেন — এবং student ও guardian-এর জন্য access প্রয়োজন অনুযায়ী কনফিগার করা যায়।",
    currentLabel: "বর্তমানে",
    configurableLabel: "কনফিগারযোগ্য",
    roles: [
      { title: "Administrator", body: "সম্পূর্ণ control, configuration, user ও permission management।", status: "current" },
      { title: "Employee / Staff", body: "নিজের কাজ ও attendance — যতটুকু authorization দেওয়া হয়েছে ততটুকু।", status: "current" },
      { title: "Custom Roles", body: "প্রতিষ্ঠানের প্রয়োজন অনুযায়ী নতুন role ও permission সংজ্ঞায়িত করা যায়।", status: "configurable" },
      { title: "Student & Guardian Access", body: "Student ও guardian-facing role-based experience — project scope অনুযায়ী কনফিগারযোগ্য।", status: "configurable" },
    ],
  },
  en: {
    eyebrow: "Role-Based Platform",
    title: "One platform — yet a distinct experience shaped around each person’s work",
    lead: "The platform architecture is role-based, so from administrators to employees everyone sees the modules and information relevant to their role — and access for students and guardians can be configured to fit your scope.",
    currentLabel: "Available now",
    configurableLabel: "Configurable",
    roles: [
      { title: "Administrator", body: "Full control, configuration, and user & permission management.", status: "current" },
      { title: "Employee / Staff", body: "Their own work and attendance — limited to the authorization they are granted.", status: "current" },
      { title: "Custom Roles", body: "Define new roles and permissions around your institution’s needs.", status: "configurable" },
      { title: "Student & Guardian Access", body: "A role-based student and guardian experience — configurable within project scope.", status: "configurable" },
    ],
  },
};

const ICONS = [
  <MdOutlineAdminPanelSettings key="0" />,
  <MdOutlineBadge key="1" />,
  <MdOutlineGroups key="2" />,
  <MdOutlineSchool key="3" />,
];

export default function RoleSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-roles" className="mk-section">
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
            {c.roles.map((role, i) => (
              <Reveal key={role.title}>
                <div className="mk-card mk-card--role">
                  <span className="mk-icon-badge" aria-hidden>
                    {ICONS[i]}
                  </span>
                  <h3 className="mk-h3" style={{ marginTop: "1rem" }}>
                    {role.title}
                  </h3>
                  <p className="mk-body">{role.body}</p>
                  <span
                    className={
                      role.status === "current"
                        ? "mk-badge mk-badge--now"
                        : "mk-badge mk-badge--soon"
                    }
                  >
                    {role.status === "current" ? c.currentLabel : c.configurableLabel}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}

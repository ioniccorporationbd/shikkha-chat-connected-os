"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal, RevealGroup } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

/**
 * Operational Modules / Current Capabilities.
 *
 * HARD RULE (content policy): features that are NOT production-verified must be
 * presented as configurable / roadmap — never advertised as live. The 12 flagged
 * areas (Online Payment, Student App, Guardian App, Full Exam Module, Online
 * Admission, Biometric Attendance, GPS Attendance, Payroll, Library, Transport,
 * Hostel, AI) all live in the "future-ready" column with configurable wording.
 */
const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    nowTitle: string;
    nowLead: string;
    now: { title: string; body: string }[];
    nextTitle: string;
    nextLead: string;
    next: { title: string; body: string }[];
  }
> = {
  bn: {
    eyebrow: "Operational Modules",
    title: "বর্তমানে যেসব capability আছে — এবং যা কনফিগার করে যোগ করা যায়",
    lead: "শিক্ষা চ্যাট একটি extensible platform। নিচে বর্তমান verified capability এবং সেই সাথে যে module গুলো আপনার প্রতিষ্ঠানের প্রয়োজন অনুযায়ী কনফিগার বা roadmap-এ যোগ করা যায়।",
    nowTitle: "বর্তমানে উপলব্ধ",
    nowLead: "Platform-এর core operation-এর মধ্যে আছে:",
    now: [
      { title: "Smart Dashboard", body: "একটি organised dashboard থেকে গুরুত্বপূর্ণ operation।" },
      { title: "Secure Role-Based Access", body: "OTP-সহ authenticated login এবং role-based permission।" },
      { title: "Employee Attendance", body: "Digital check-in / check-out workflow।" },
      { title: "User & Profile Management", body: "প্রতিষ্ঠানের প্রয়োজন অনুযায়ী user ও profile manage।" },
      { title: "Communication Architecture", body: "SMS, email ও portal-based communication-এর জন্য প্রস্তুত।" },
      { title: "ERP-Backed Data", body: "Enterprise-grade data management ভিত্তি।" },
    ],
    nextTitle: "Configurable / Roadmap",
    nextLead: "প্রতিষ্ঠানের scope অনুযায়ী কনফিগার বা পরবর্তী ধাপে যুক্ত করা যায়:",
    next: [
      { title: "Online Payment", body: "অনলাইন পেমেন্ট collection — কনফিগারযোগ্য।" },
      { title: "Student App", body: "Student-facing app experience — planned।" },
      { title: "Guardian App", body: "Guardian-facing app experience — planned।" },
      { title: "Full Exam Module", body: "সম্পূর্ণ exam ও result management — roadmap।" },
      { title: "Online Admission", body: "অনলাইন ভর্তি workflow — কনফিগারযোগ্য।" },
      { title: "Biometric Attendance", body: "Biometric device ইন্টিগ্রেশন — কনফিগারযোগ্য।" },
      { title: "GPS Attendance", body: "Location-based attendance — roadmap।" },
      { title: "Payroll", body: "Salary ও payroll management — কনফিগারযোগ্য।" },
      { title: "Library", body: "Library management module — roadmap।" },
      { title: "Transport", body: "Transport ও route management — roadmap।" },
      { title: "Hostel", body: "Hostel management module — roadmap।" },
      { title: "AI Assistance", body: "AI-ভিত্তিক সহায়তা — পরিকল্পিত।" },
    ],
  },
  en: {
    eyebrow: "Operational Modules",
    title: "What is available today — and what can be configured in",
    lead: "Shikkha Chat is an extensible platform. Below are the current verified capabilities, alongside the modules that can be configured or added to the roadmap to fit your institution.",
    nowTitle: "Available now",
    nowLead: "The platform’s core operations include:",
    now: [
      { title: "Smart Dashboard", body: "Important operations from one organized dashboard." },
      { title: "Secure Role-Based Access", body: "OTP-auth login with role-based permissions." },
      { title: "Employee Attendance", body: "A digital check-in / check-out workflow." },
      { title: "User & Profile Management", body: "Create and manage users and profiles as needed." },
      { title: "Communication Architecture", body: "Ready for SMS, email and portal communication." },
      { title: "ERP-Backed Data", body: "An enterprise-grade data management foundation." },
    ],
    nextTitle: "Configurable / Roadmap",
    nextLead: "These can be configured or added in a later phase based on your scope:",
    next: [
      { title: "Online Payment", body: "Online payment collection — configurable." },
      { title: "Student App", body: "A student-facing app experience — planned." },
      { title: "Guardian App", body: "A guardian-facing app experience — planned." },
      { title: "Full Exam Module", body: "Complete exam & result management — roadmap." },
      { title: "Online Admission", body: "An online admission workflow — configurable." },
      { title: "Biometric Attendance", body: "Biometric device integration — configurable." },
      { title: "GPS Attendance", body: "Location-based attendance — roadmap." },
      { title: "Payroll", body: "Salary & payroll management — configurable." },
      { title: "Library", body: "A library management module — roadmap." },
      { title: "Transport", body: "Transport & route management — roadmap." },
      { title: "Hostel", body: "A hostel management module — roadmap." },
      { title: "AI Assistance", body: "AI-assisted capabilities — planned." },
    ],
  },
};

export default function CapabilitiesSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="mk-capabilities" className="mk-section mk-section--tint">
      <div className="mk-container">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head mk-head--center">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead" style={{ marginInline: "auto" }}>
              {c.lead}
            </p>
          </Reveal>

          <div className="mk-cap-grid">
            <Reveal className="mk-cap-col">
              <div className="mk-cap-head">
                <span className="mk-badge mk-badge--now">{c.nowTitle}</span>
                <p className="mk-cap-head-lead">{c.nowLead}</p>
              </div>
              <ul className="mk-cap-list">
                {c.now.map((item) => (
                  <li key={item.title} className="mk-cap-item mk-cap-item--now">
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="mk-cap-col">
              <div className="mk-cap-head">
                <span className="mk-badge mk-badge--soon">{c.nextTitle}</span>
                <p className="mk-cap-head-lead">{c.nextLead}</p>
              </div>
              <ul className="mk-cap-list">
                {c.next.map((item) => (
                  <li key={item.title} className="mk-cap-item mk-cap-item--soon">
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </RevealGroup>
      </div>
    </section>
  );
}

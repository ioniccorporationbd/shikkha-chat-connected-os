"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  MdArrowForward,
  MdOutlineChat,
  MdOutlineDashboard,
  MdOutlineGroups,
  MdOutlineSchedule,
  MdVerified,
} from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    brand: string;
    title: string;
    lead: string;
    primary: string;
    secondary: string;
    visualTitle: string;
    visualSub: string;
    nodes: { label: string; body: string }[];
  }
> = {
  bn: {
    brand: "Your Institution. Connected.",
    title: "আপনার শিক্ষা প্রতিষ্ঠানকে নিয়ে যান সম্পূর্ণ ডিজিটাল ব্যবস্থাপনায়",
    lead: "Administration, user management, employee attendance, communication এবং digital operations একটি connected platform থেকে পরিচালনা করুন।",
    primary: "ডেমো রিকোয়েস্ট করুন",
    secondary: "ফিচার দেখুন",
    visualTitle: "একটি প্রতিষ্ঠান, একটি সংযুক্ত প্ল্যাটফর্ম",
    visualSub: "প্রতিটি role-এর জন্য আলাদা অভিজ্ঞতা, কিন্তু সব তথ্য এক জায়গায় সংযুক্ত।",
    nodes: [
      { label: "Administration", body: "কেন্দ্রীয় নিয়ন্ত্রণ ও কনফিগারেশন" },
      { label: "User Management", body: "Role-based access ও profile" },
      { label: "Employee Attendance", body: "ডিজিটাল check-in / check-out" },
      { label: "Communication", body: "SMS, email ও portal messaging" },
    ],
  },
  en: {
    brand: "Your Institution. Connected.",
    title: "Take your institution to complete digital management",
    lead: "Run administration, user management, employee attendance, communication and digital operations from a single connected platform.",
    primary: "Request a Demo",
    secondary: "Explore Features",
    visualTitle: "One institution, one connected platform",
    visualSub: "A distinct experience for every role — with all the information connected in one place.",
    nodes: [
      { label: "Administration", body: "Central control & configuration" },
      { label: "User Management", body: "Role-based access & profiles" },
      { label: "Employee Attendance", body: "Digital check-in / check-out" },
      { label: "Communication", body: "SMS, email & portal messaging" },
    ],
  },
};

const NODE_ICONS = [
  <MdOutlineDashboard key="0" />,
  <MdOutlineGroups key="1" />,
  <MdOutlineSchedule key="2" />,
  <MdOutlineChat key="3" />,
];

export default function Hero() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section id="intro" className="mk-section mk-hero mk-section--dark mk-dots">
      <div className="mk-container">
        <div className="mk-hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mk-head"
          >
            <span className="mk-chip mk-chip--onDark">
              <MdVerified aria-hidden />
              {c.brand}
            </span>
            <h1 className="mk-display">{c.title}</h1>
            <p className="mk-lead">{c.lead}</p>
            <div className="mk-btn-row">
              <a className="mk-btn mk-btn--onDark" href="#mk-demo-form">
                {c.primary}
                <MdArrowForward />
              </a>
              <a className="mk-btn mk-btn--ghostOnDark" href="#mk-features">
                {c.secondary}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mk-hero-visual"
          >
            <div className="mk-card mk-card--glass mk-hero-visual-card">
              <h3 className="mk-h3">{c.visualTitle}</h3>
              <p className="mk-hero-visual-sub">{c.visualSub}</p>
              <ul className="mk-hero-nodes">
                {c.nodes.map((n, i) => (
                  <li key={n.label} className="mk-hero-node">
                    <span className="mk-icon-badge" aria-hidden>
                      {NODE_ICONS[i]}
                    </span>
                    <span className="mk-hero-node-text">
                      <strong>{n.label}</strong>
                      <em>{n.body}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

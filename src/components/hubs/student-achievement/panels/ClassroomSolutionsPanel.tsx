"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuSchool } from "react-icons/lu";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শ্রেণিকক্ষ সমাধান",
    title: "শ্রেণিকক্ষের তথ্য ও অগ্রগতি একসাথে।",
    description: "Class, section ও roll-সহ শ্রেণিকক্ষ-সংশ্লিষ্ট তথ্য এবং শিক্ষার্থীর academic history একত্রে রাখুন, যাতে শিক্ষক দ্রুত প্রয়োজনীয় তথ্য খুঁজে পান।",
    supporting: "শ্রেণিকক্ষ কাঠামো ও অ্যাকাডেমিক ইতিহাস যুক্ত থাকায় শিক্ষকরা পাঠদানের ধারা না ভেঙেই সঠিক শিক্ষার্থী প্রসঙ্গে পৌঁছান।",
    capabilities: [
      "Class ও section অনুযায়ী সংগঠিত record",
      "শিক্ষার্থী-ভিত্তিক অ্যাকাডেমিক ইতিহাস",
      "শিক্ষকদের জন্য দ্রুত access",
    ],
    stats: [
      { value: "Class ও Section", label: "শ্রেণিকক্ষ কাঠামো অনুযায়ী শিক্ষার্থী তথ্য" },
      { value: "একাডেমিক ইতিহাস", label: "শিক্ষার্থী-ভিত্তিক অগ্রগতির record" },
    ],
    quote: "তথ্য খুঁজে পাওয়া সহজ হলে শিক্ষকদের মূল্যবান সময় শিক্ষার্থীদের জন্য বাঁচে।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Classroom Solutions",
    title: "Classroom and progress data together.",
    description: "Keep classroom information—class, section, and roll—alongside each student's academic history, so teachers can find what they need quickly.",
    supporting: "Because classroom structure and academic history stay linked, teachers reach the right student context without leaving the flow of teaching.",
    capabilities: [
      "Records organized by class and section",
      "Student-level academic history",
      "Quick access for teachers",
    ],
    stats: [
      { value: "Class & Section", label: "Student records by classroom structure" },
      { value: "Academic history", label: "Student-level progress records" },
    ],
    quote: "When information is easy to find, teachers' valuable time goes back to students.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function ClassroomSolutionsPanel() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      variant="dashboard"
      id='classroom-solutions'
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuSchool}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

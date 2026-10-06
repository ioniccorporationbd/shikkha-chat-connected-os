
"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type LanguageCode = "bn" | "en";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থীর তথ্য ব্যবস্থাপনা",
    title: "শিক্ষকদের মূল্যবান সময় ফিরিয়ে দিন",
    description:
      "শিক্ষার্থীদের তথ্য বিভিন্ন ব্যবস্থায় ছড়িয়ে থাকলে শিক্ষক ও কর্মীরা শিক্ষার্থীদের প্রতি মনোযোগ দেওয়ার পরিবর্তে রেকর্ড সংশোধনে মূল্যবান সময় ব্যয় করেন। শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, ভর্তি কার্যক্রম এবং বিশেষ কর্মসূচি ব্যবস্থাপনাকে একটি সমন্বিত ব্যবস্থায় যুক্ত করে। এর ফলে বিদ্যালয় আত্মবিশ্বাসের সঙ্গে কার্যক্রম পরিচালনা করতে পারে এবং প্রতিটি শিক্ষার্থীর প্রয়োজন অনুযায়ী সহায়তা নিশ্চিত করতে পারে।",
    statValue: "১০–২০ ঘণ্টা",
    statLabel: "প্রতি সপ্তাহে শিক্ষকদের প্রশাসনিক কাজের সময় সাশ্রয়",
    quote:
      "শিক্ষা চ্যাট আমাদের শিক্ষকদের হাতে করা মূল্যায়ন ও পুনরাবৃত্তিমূলক কাজের সময় কমিয়ে দিচ্ছে। আমরা চাই শিক্ষকরা পাঠদান, শিক্ষার্থীদের সহায়তা এবং তাদের অগ্রগতি মূল্যায়নে আরও বেশি মনোযোগ দিন।",
    author: "বার্ট ব্যানফিল্ড",
    role: "সাবেক বিদ্যালয় প্রধান, এপিক চার্টার স্কুলস, ওকলাহোমা",
    logo: "এপিক চার্টার স্কুলস",
    imageAlt: "বিদ্যালয়ের সাবেক প্রধান বার্ট ব্যানফিল্ড",
  },

  en: {
    pill: "Student Information Management",
    title: "Give educators their valuable time back",
    description:
      "When student data is scattered across multiple systems, teachers and staff spend valuable time correcting records instead of focusing on learners. Shikkha Chat brings student information, enrollment operations, and special program management into one connected system. This helps schools operate confidently and provide support based on every student’s needs.",
    statValue: "10–20 Hours",
    statLabel: "Administrative work time saved by teachers every week",
    quote:
      "Shikkha Chat is reducing the time our teachers spend on manual grading and repetitive work. We want educators to focus more on teaching, supporting learners, and measuring student progress.",
    author: "Bart Banfield",
    role: "Former School Leader, Epic Charter Schools, Oklahoma",
    logo: "Epic Charter Schools",
    imageAlt: "Former school leader Bart Banfield",
  },
} as const;


export default function StudentInformationPanel() {
  const { language } = useLanguage();

  const currentLanguage: LanguageCode = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];
  const panelStats = [{ value: text.statValue, label: text.statLabel }];

  return (
    <section
      className="home-connections-section relative bg-[var(--color-white)] text-[var(--color-primary)]"
      lang={currentLanguage}
    >
      <div className="home-section-panel">
        <SectionPanel
          id="student-information"
          pill={text.pill}
          title={text.title}
          description={text.description}
          showButtons={false}
          stats={panelStats}
          quote={text.quote}
          author={text.author}
          role={text.role}
        />
      </div>
    </section>
  );
}

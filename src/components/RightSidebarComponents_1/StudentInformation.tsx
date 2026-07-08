"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "শিক্ষার্থীর তথ্য",
    title: "শিক্ষকদের সময় ফিরিয়ে দিন",
    description:
      "ডেটা যখন বিভিন্ন সিস্টেমে ছড়িয়ে থাকে, তখন স্টাফরা শিক্ষার্থীদের দিকে মনোযোগ দেওয়ার বদলে রেকর্ড ঠিক করতে সময় ব্যয় করেন। শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, ভর্তি এবং বিশেষ কার্যক্রম ব্যবস্থাপনাকে একটি সংযুক্ত ব্যবস্থায় আনে, যাতে স্কুল আত্মবিশ্বাসের সাথে পরিচালনা করতে পারে এবং প্রতিটি শিক্ষার্থীর প্রয়োজন পূরণ করতে পারে।",
    stats: [{ value: "১০–২০ ঘণ্টা", label: "প্রতি সপ্তাহে শিক্ষকদের ব্যস্ত কাজের সময় সাশ্রয়" }],
    quote:
      "শিক্ষা চ্যাট আমাদের শিক্ষকদের ম্যানুয়াল মূল্যায়নের সময় বাঁচাচ্ছে। আমরা চাই তারা পাঠদান এবং শিক্ষার্থীর অগ্রগতি পরিমাপে মনোযোগ দিক।",
    author: "বার্ট ব্যানফিল্ড",
    role: "সাবেক স্কুল নেতৃত্ব, এপিক চার্টার স্কুলস, ওকলাহোমা",
    logo: "এপিক চার্টার স্কুলস",
  },
  en: {
    pill: "Student Information",
    title: "Give Educators Time Back",
    description:
      "When data is scattered across systems, staff spend time fixing records instead of focusing on students. Shikkha Chat brings student information, enrollment, and special program management into one connected system so schools can operate confidently and meet every student’s needs.",
    stats: [{ value: "10–20 Hours", label: "Busy-work time saved by teachers every week" }],
    quote:
      "Shikkha Chat is saving our teachers time in manual grading, which is low-level work. You want them focused on teaching and measuring the students.",
    author: "Bart Banfield",
    role: "Former School Leader, Epic Charter Schools, Oklahoma",
    logo: "Epic Charter Schools",
  },
} as const;

export default function StudentInformation() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="student-information"
      pill={text.pill}
      pillStyle="solid"
      title={text.title}
      description={text.description}
      showButtons={false}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "উপস্থিতি সহায়তা",
    title: "লক্ষণ আগে দেখুন, আরও দ্রুত পদক্ষেপ নিন।",
    description:
      "অনুপস্থিতি বড় সমস্যায় পরিণত হওয়ার অনেক আগেই ছোট ছোট লক্ষণ দেখা যায়। শিক্ষা চ্যাট উপস্থিতি সহায়তা সেই লক্ষণগুলো আগে শনাক্ত করে এবং পরিবারে যোগাযোগ স্বয়ংক্রিয় করে, যাতে স্টাফ দ্রুত সাড়া দিতে পারে এবং শিক্ষার্থীদের সঠিক পথে রাখতে পারে।",
    stats: [
      { value: "৬০০+", label: "উপস্থিতি সহায়তার জন্য শিক্ষা চ্যাট ব্যবহারকারী প্রতিষ্ঠান" },
      { value: "২.২M+", label: "সহায়তা পাওয়া শিক্ষার্থী" },
      { value: "৮০M+", label: "প্রতি স্কুল বছরে পাঠানো বার্তা" },
    ],
    quote: "হেইউড কাউন্টি স্কুলস শিক্ষা চ্যাটের সহায়তায় দীর্ঘমেয়াদি অনুপস্থিতি কমিয়েছে।",
    author: "নিকোল বন্ড",
    role: "উপস্থিতি ও ভর্তি নেতৃত্ব, হেইউড কাউন্টি স্কুলস, টেনেসি",
    logo: "হেইউড কাউন্টি স্কুলস",
  },
  en: {
    pill: "Attendance Support",
    title: "Spot the Signs Early. Step in Sooner.",
    description:
      "Absenteeism starts with small signs long before it becomes a serious problem. Shikkha Chat Attendance Support detects those signs early and automates family outreach so staff can respond quickly and keep students on track.",
    stats: [
      { value: "600+", label: "Organizations using Shikkha Chat for attendance support" },
      { value: "2.2M+", label: "Students supported" },
      { value: "80M+", label: "Messages sent each school year" },
    ],
    quote: "Haywood County Schools lowers chronic absenteeism with support from Shikkha Chat.",
    author: "Nicole Bond",
    role: "Attendance and Enrollment Leader, Haywood County Schools, Tennessee",
    logo: "Haywood County Schools",
  },
} as const;

export default function AttendanceSupport() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="attendance-support"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

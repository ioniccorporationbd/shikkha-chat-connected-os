"use client";

import SectionPanel from "./SectionPanel";
import { useLanguage } from "@/lib/language";

const sectionText = {
  bn: {
    pill: "ভর্তি ব্যবস্থাপনা",
    title: "প্রতিটি শিক্ষার্থীর জন্য আরও সহজ শুরু।",
    description:
      "আপনার শিক্ষার্থী নিবন্ধনের সব তথ্য সঠিক ও আপডেট রাখুন এবং তা শিক্ষার্থী তথ্য ব্যবস্থার সাথে সহজভাবে যুক্ত করুন। শিক্ষা চ্যাট ভর্তি ব্যবস্থাপনা ম্যানুয়াল ডেটা এন্ট্রি ও কাগজের কাজ কমায়, যাতে স্টাফ এবং পরিবার প্রথম যোগাযোগ থেকে গ্র্যাজুয়েশন পর্যন্ত সহজ অভিজ্ঞতা পায়।",
    stats: [
      { value: "৪৫০০+", label: "ভর্তি ও নিবন্ধনের জন্য শিক্ষা চ্যাট ব্যবহারকারী প্রতিষ্ঠান" },
      { value: "১৬M+", label: "প্রতি বছর ভর্তি হওয়া শিক্ষার্থী" },
    ],
    quote:
      "সপ্তাহ বা মাস ধরে ম্যানুয়ালি শিক্ষার্থী তথ্য এন্ট্রি করার বদলে স্টাফরা এখন শুধু তথ্য অনুমোদন বা বাতিল করতে পারে এবং গুরুত্বপূর্ণ কাজে এগিয়ে যেতে পারে।",
    author: "ক্রিস্টিন বোলিং",
    role: "প্রযুক্তি নেতৃত্ব, এন্টারপ্রাইজ এলিমেন্টারি স্কুল ডিস্ট্রিক্ট",
    logo: "এন্টারপ্রাইজ এলিমেন্টারি স্কুল ডিস্ট্রিক্ট",
  },
  en: {
    pill: "Enrollment Management",
    title: "A Smoother Start for Every Student",
    description:
      "Keep all your student registration information accurate and up to date with seamless connections to your SIS. Shikkha Chat Enrollment reduces manual entry and paperwork, so your staff and families enjoy a smooth experience from first contact to graduation.",
    stats: [
      { value: "4500+", label: "Organizations using Shikkha Chat for enrollment and registrations" },
      { value: "16M+", label: "Students enrolled every year" },
    ],
    quote:
      "Instead of spending weeks—or even months—manually entering student information, staff could simply approve or reject entries, allowing them to move on to more critical tasks.",
    author: "Kristin Bowling",
    role: "Technology Leader, Enterprise Elementary School District",
    logo: "Enterprise Elementary School District",
  },
} as const;

export default function Enrollment() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="enrollment"
      pill={text.pill}
      title={text.title}
      description={text.description}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
      image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=220&q=80"
      logo={text.logo}
    />
  );
}

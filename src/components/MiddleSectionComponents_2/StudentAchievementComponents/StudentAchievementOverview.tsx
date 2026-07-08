"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language";
import OrbitProductPanel from "@/components/MiddleSectionShared/OrbitProductPanel";
import { FaRegCircleQuestion, FaRegStar, FaUsers } from "react-icons/fa6";
import {
  MdOutlineAnalytics,
  MdOutlineAutoAwesome,
  MdOutlineFavoriteBorder,
  MdOutlineGridView,
  MdOutlineHub,
  MdOutlineMenuBook,
  MdOutlinePsychology,
} from "react-icons/md";


type LanguageCode = "bn" | "en";

type LocalizedCardText = {
  title: string;
  subtitle?: string;
  label?: string;
  description?: string;
};

const interfaceText: Record<LanguageCode, { studentAchievement: string; openSection: string; closeDetail: string; connectedCapability: string; imageAlt: string }> = {
  bn: {
    studentAchievement: "শিক্ষার্থী অর্জন",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    connectedCapability: "সংযুক্ত সক্ষমতা",
    imageAlt: "শিক্ষার্থী অর্জন চিত্র",
  },
  en: {
    studentAchievement: "Student Achievement",
    openSection: "Open Section",
    closeDetail: "Close detail",
    connectedCapability: "Connected Capability",
    imageAlt: "Student Achievement illustration",
  },
};

const localizedCardText: Record<LanguageCode, Record<string, LocalizedCardText>> = {
  bn: {
    "student-achievement": {
      title: "শিক্ষার্থী অর্জন",
      subtitle: "একীভূত অগ্রগতি",
      label: "অর্জন ভিউ",
      description:
        "শিক্ষার্থী অর্জন শিক্ষক ও নেতৃত্বকে অগ্রগতি, শেখার ফলাফল, সহায়তার প্রয়োজন এবং ভবিষ্যৎ প্রস্তুতি এক জায়গায় বুঝতে সাহায্য করে।",
    },
    "classroom-solutions": {
      title: "শ্রেণিকক্ষ সমাধান",
      subtitle: "শিক্ষণ টুলস",
      label: "শিক্ষণ টুলস",
      description:
        "শ্রেণিকক্ষ সমাধান দৈনন্দিন পাঠদান, ক্লাসরুম সংগঠন, শেখার কার্যক্রম এবং শিক্ষার্থীর কাজকে আরও সহজ ও পরিষ্কার করে।",
    },
    "learning-management-schoology": {
      title: "লার্নিং ব্যবস্থাপনা",
      subtitle: "শেখার প্ল্যাটফর্ম",
      label: "লার্নিং ডেটা",
      description:
        "লার্নিং ব্যবস্থাপনা অ্যাসাইনমেন্ট, রিসোর্স, ডিজিটাল শেখার কার্যক্রম এবং শিক্ষার্থী সম্পৃক্ততাকে অর্জন ডেটার সাথে যুক্ত করে।",
    },
    "assessment-performance-matters": {
      title: "মূল্যায়ন",
      subtitle: "পারফরম্যান্স বিশ্লেষণ",
      label: "মূল্যায়ন ডেটা",
      description:
        "মূল্যায়ন শিক্ষককে দক্ষতা বোঝা, অগ্রগতি মাপা, পারফরম্যান্স ডেটা দেখা এবং আরও ভালো পাঠদান সিদ্ধান্ত নিতে সাহায্য করে।",
    },
    "curriculum-instruction": {
      title: "কারিকুলাম ও পাঠদান",
      subtitle: "পাঠদান পরিকল্পনা",
      label: "পাঠদান পরিকল্পনা",
      description:
        "কারিকুলাম ও পাঠদান মানদণ্ড, পাঠ পরিকল্পনা, শিক্ষণ রিসোর্স এবং ক্লাসরুম ডেলিভারিকে একটি পরিষ্কার কাজের ধারায় যুক্ত করে।",
    },
    "student-intervention": {
      title: "শিক্ষার্থী সহায়তা",
      subtitle: "সহায়তা পরিকল্পনা",
      label: "সহায়তা পরিকল্পনা",
      description:
        "শিক্ষার্থী সহায়তা শেখার ঘাটতি চিহ্নিত করা, লক্ষ্যভিত্তিক পরিকল্পনা তৈরি করা এবং অগ্রগতি নিয়মিত ট্র্যাক করতে সাহায্য করে।",
    },
    mtss: {
      title: "বহুস্তরীয় সহায়তা ব্যবস্থা",
      subtitle: "স্তরভিত্তিক সহায়তা",
      label: "বহুস্তরীয় সিস্টেম",
      description:
        "বহুস্তরীয় সহায়তা ব্যবস্থা একাডেমিক, আচরণ, উপস্থিতি এবং সুস্থতা সহায়তাকে একসাথে এনে দ্রুত সিদ্ধান্ত নিতে সাহায্য করে।",
    },
    "behavior-support": {
      title: "আচরণগত সহায়তা",
      subtitle: "সুস্থতা",
      label: "সুস্থতা ইনসাইট",
      description:
        "আচরণগত সহায়তা আচরণের ধরণ, সুস্থতার সংকেত এবং সহায়তা কার্যক্রম বুঝে আরও নিরাপদ ও ইতিবাচক শেখার পরিবেশ তৈরি করে।",
    },
    "college-career-life-readiness": {
      title: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
      subtitle: "ভবিষ্যৎ প্রস্তুতি",
      label: "ভবিষ্যৎ প্রস্তুতি",
      description:
        "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি শিক্ষার্থীর লক্ষ্য, পথ নির্বাচন, প্রস্তুতি এবং ভবিষ্যৎ সাফল্যের পরিকল্পনা পরিষ্কার করে।",
    },
    "cclr-naviance": {
      title: "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
      subtitle: "পরিকল্পনা নির্দেশনা",
      label: "ভবিষ্যৎ পরিকল্পনা",
      description:
        "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা শিক্ষার্থীর পথ অনুসন্ধান, লক্ষ্য পরিকল্পনা, প্রস্তুতি ট্র্যাকিং এবং ভবিষ্যৎ সিদ্ধান্তকে সহজ করে।",
    },
  },
  en: {
    "student-achievement": {
      title: "Student Achievement",
      subtitle: "Unified Progress",
      label: "Achievement View",
      description:
        "Student Achievement gives educators and leaders one clear view of progress, learning performance, support needs, and future readiness.",
    },
    "classroom-solutions": {
      title: "Classroom Solutions",
      subtitle: "Teaching Tools",
      label: "Teaching Tools",
      description:
        "Classroom Solutions supports daily teaching, classroom organization, learning activity, and stronger instructional workflows.",
    },
    "learning-management-schoology": {
      title: "Learning Management",
      subtitle: "Learning Platform",
      label: "Learning Data",
      description:
        "Learning Management connects assignments, resources, digital learning activity, and student engagement with achievement data.",
    },
    "assessment-performance-matters": {
      title: "Assessment",
      subtitle: "Performance Analytics",
      label: "Assessment Data",
      description:
        "Assessment helps educators understand mastery, measure growth, review performance data, and make better instructional decisions.",
    },
    "curriculum-instruction": {
      title: "Curriculum and Instruction",
      subtitle: "Instruction Planning",
      label: "Instruction Planning",
      description:
        "Curriculum and Instruction connects standards, lesson planning, teaching resources, and classroom delivery into one clear flow.",
    },
    "student-intervention": {
      title: "Student Intervention",
      subtitle: "Support Plans",
      label: "Support Planning",
      description:
        "Student Intervention helps schools identify learning gaps, create targeted support plans, and track student progress clearly.",
    },
    mtss: {
      title: "Multi-Tier Support",
      subtitle: "Tiered Support",
      label: "Multi-Tier System",
      description:
        "Multi-Tier Support connects academic, behavior, attendance, and wellbeing support so teams can respond earlier with better visibility.",
    },
    "behavior-support": {
      title: "Behavior Support",
      subtitle: "Wellbeing",
      label: "Wellbeing Insight",
      description:
        "Behavior Support helps schools understand behavior patterns, wellbeing signals, and support actions for a safer learning environment.",
    },
    "college-career-life-readiness": {
      title: "College, Career and Life Readiness",
      subtitle: "Future Ready",
      label: "Future Readiness",
      description:
        "College, Career and Life Readiness helps students plan goals, explore pathways, and prepare for future success.",
    },
    "cclr-naviance": {
      title: "Career and Life Readiness Guidance",
      subtitle: "Planning Guidance",
      label: "Future Planning",
      description:
        "Career and Life Readiness Guidance supports pathway exploration, goal planning, readiness tracking, and future decisions.",
    },
  },
};

function localizeCard<T extends { id: string; title: string; subtitle?: string; label?: string; description?: string }>(
  card: T,
  language: LanguageCode
): T {
  const localized = localizedCardText[language][card.id];
  if (!localized) return card;

  return {
    ...card,
    title: localized.title,
    subtitle: localized.subtitle ?? card.subtitle,
    label: localized.label ?? card.label,
    description: localized.description ?? card.description,
  };
}

const products = [
    { id: "student-achievement", title: "Student Achievement", subtitle: "Unified Progress", icon: <MdOutlineAutoAwesome />, highlight: true },
    { id: "classroom-solutions", title: "Classroom Solutions", subtitle: "Teaching Tools", icon: <MdOutlineGridView />, highlight: false },
    { id: "learning-management-schoology", title: "Learning Management", subtitle: "Schoology", icon: <MdOutlinePsychology />, highlight: false },
    { id: "assessment-performance-matters", title: "Assessment", subtitle: "Performance Matters", icon: <MdOutlineAnalytics />, highlight: false },
    { id: "curriculum-instruction", title: "Curriculum & Instruction", subtitle: "Instruction", icon: <MdOutlineMenuBook />, highlight: false },
    { id: "student-intervention", title: "Student Intervention", subtitle: "Support Plans", icon: <FaRegCircleQuestion />, highlight: false },
    { id: "mtss", title: "MTSS", subtitle: "Multi-Tier Support", icon: <MdOutlineHub />, highlight: false },
    { id: "behavior-support", title: "Behavior Support", subtitle: "Wellbeing", icon: <MdOutlineFavoriteBorder />, highlight: false },
    { id: "college-career-life-readiness", title: "College, Career & Life Readiness", subtitle: "Future Ready", icon: <FaRegStar />, highlight: false },
    { id: "cclr-naviance", title: "CCLR Naviance", subtitle: "Naviance", icon: <FaUsers />, highlight: false },
];

export default function StudentAchievementOverview() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;
  const localizedProducts = useMemo(
    () => products.map((product) => localizeCard(product, currentLanguage)),
    [currentLanguage]
  );

  return (
    <OrbitProductPanel
      title={interfaceText[currentLanguage].studentAchievement}
      activeId="student-achievement"
      products={localizedProducts}
      themeColor="var(--color-secondary)"
      darkColor="var(--color-primary)"
      glowColor="color-mix(in srgb, var(--color-primary) 18%, transparent)"
    />
  );
}

"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language";
import OrbitProductPanel from "@/components/MiddleSectionShared/OrbitProductPanel";
import {
  FaRegCircleQuestion,
  FaRegStar,
  FaUsers,
} from "react-icons/fa6";
import {
  MdAddCircleOutline,
  MdOutlineAutoAwesome,
  MdOutlineGridView,
  MdOutlineHub,
} from "react-icons/md";

type LanguageCode = "bn" | "en";

type LocalizedCardText = {
  title: string;
  subtitle?: string;
  label?: string;
  description?: string;
};

const interfaceText: Record<
  LanguageCode,
  {
    homeConnections: string;
    openSection: string;
    closeDetail: string;
    connectedCapability: string;
    imageAlt: string;
  }
> = {
  bn: {
    homeConnections: "হোম কানেকশন",
    openSection: "সেকশন খুলুন",
    closeDetail: "বিস্তারিত বন্ধ করুন",
    connectedCapability: "সংযুক্ত সক্ষমতা",
    imageAlt: "হোম কানেকশন চিত্র",
  },
  en: {
    homeConnections: "Home Connections",
    openSection: "Open Section",
    closeDetail: "Close detail",
    connectedCapability: "Connected Capability",
    imageAlt: "Home Connections illustration",
  },
};

const localizedCardText: Record<LanguageCode, Record<string, LocalizedCardText>> = {
  bn: {
    "home-connections": {
      title: "হোম কানেকশন",
      subtitle: "পরিবার সংযোগ",
      label: "সংযুক্ত পরিবার অভিজ্ঞতা",
      description:
        "হোম কানেকশন স্কুল, পরিবার এবং শিক্ষার্থীকে একটি সহজ, পরিষ্কার এবং সংযুক্ত অভিজ্ঞতায় নিয়ে আসে। পরিবার দ্রুত আপডেট পায়, স্কুল নির্ভরযোগ্য যোগাযোগ রাখতে পারে এবং শিক্ষার্থী আরও ভালো সহায়তা পায়।",
    },
    "student-information": {
      title: "শিক্ষার্থীর তথ্য",
      subtitle: "শিক্ষার্থী প্রোফাইল",
      label: "শিক্ষার্থী প্রোফাইল",
      description:
        "শিক্ষার্থীর তথ্য প্রোফাইল, যোগাযোগ, পরিবার, ক্লাস এবং প্রয়োজনীয় সহায়তার তথ্যকে এক জায়গায় পরিষ্কারভাবে দেখায়।",
    },
    sis: {
      title: "শিক্ষার্থী তথ্য ব্যবস্থা",
      subtitle: "মূল ব্যবস্থাপনা",
      label: "কেন্দ্রীয় তথ্য ব্যবস্থা",
      description:
        "শিক্ষার্থী তথ্য ব্যবস্থা ভর্তি, রেকর্ড, পরিবার তথ্য, যোগাযোগ এবং স্কুলের দৈনন্দিন কাজকে একটি নির্ভরযোগ্য কেন্দ্রীয় সিস্টেমে যুক্ত করে।",
    },
    enrollment: {
      title: "ভর্তি ব্যবস্থাপনা",
      subtitle: "ভর্তি প্রক্রিয়া",
      label: "ভর্তি কার্যধারা",
      description:
        "ভর্তি ব্যবস্থাপনা আবেদন, যাচাই, শিক্ষার্থী রেকর্ড তৈরি এবং পরিবার যোগাযোগকে সহজ ও পরিষ্কার প্রক্রিয়ায় পরিচালনা করে।",
    },
    "special-programs": {
      title: "বিশেষ কার্যক্রম",
      subtitle: "সহায়তা কার্যক্রম",
      label: "শিক্ষার্থী সহায়তা",
      description:
        "বিশেষ কার্যক্রম শিক্ষার্থীর বিশেষ প্রয়োজন, সহায়তা পরিকল্পনা এবং স্কুলভিত্তিক সাপোর্টকে সংগঠিতভাবে পরিচালনা করতে সাহায্য করে।",
    },
    "family-engagement": {
      title: "পরিবারের সম্পৃক্ততা",
      subtitle: "পরিবার হাব",
      label: "পরিবার সংযোগ",
      description:
        "পরিবারের সম্পৃক্ততা অভিভাবক, স্কুল এবং শিক্ষার্থীর মধ্যে নির্ভরযোগ্য যোগাযোগ তৈরি করে, যাতে পরিবার সবসময় প্রয়োজনীয় তথ্য পায়।",
    },
    communications: {
      title: "যোগাযোগ ব্যবস্থা",
      subtitle: "স্কুল বার্তা",
      label: "স্কুল যোগাযোগ",
      description:
        "যোগাযোগ ব্যবস্থা স্কুলকে সময়মতো ঘোষণা, সতর্কতা, আপডেট এবং গুরুত্বপূর্ণ বার্তা পরিবার পর্যন্ত পৌঁছে দিতে সাহায্য করে।",
    },
    "attendance-support": {
      title: "উপস্থিতি সহায়তা",
      subtitle: "দ্রুত সাড়া",
      label: "উপস্থিতি সাড়া",
      description:
        "উপস্থিতি সহায়তা অনুপস্থিতি, দেরি, উপস্থিতির ধরণ এবং পরিবারের সাথে দ্রুত যোগাযোগকে আরও সহজ করে।",
    },
  },
  en: {
    "home-connections": {
      title: "Home Connections",
      subtitle: "Family Connection",
      label: "Connected Family Experience",
      description:
        "Home Connections brings school, family, and learner support into one clear connected experience. Families stay informed, schools communicate with confidence, and every student receives better support.",
    },
    "student-information": {
      title: "Student Information",
      subtitle: "Student Profile",
      label: "Student Profile",
      description:
        "Student Information gives teams a clear view of profile, contact, family, classroom, and support information in one place.",
    },
    sis: {
      title: "Student Information System",
      subtitle: "Core Management",
      label: "Central Information System",
      description:
        "The Student Information System connects enrollment, records, family data, communication, and daily school workflows in one trusted system.",
    },
    enrollment: {
      title: "Enrollment Management",
      subtitle: "Admission Process",
      label: "Admission Workflow",
      description:
        "Enrollment Management helps schools manage applications, verification, student record creation, and family communication with a clear workflow.",
    },
    "special-programs": {
      title: "Special Programs",
      subtitle: "Support Programs",
      label: "Student Support",
      description:
        "Special Programs helps schools manage student support needs, service planning, and program workflows with stronger visibility.",
    },
    "family-engagement": {
      title: "Family Engagement",
      subtitle: "Family Hub",
      label: "Family Connection",
      description:
        "Family Engagement builds reliable communication between families, schools, and students so everyone can stay informed.",
    },
    communications: {
      title: "Communications",
      subtitle: "School Messenger",
      label: "School Communication",
      description:
        "Communications helps schools send announcements, alerts, updates, and important messages to families at the right time.",
    },
    "attendance-support": {
      title: "Attendance Support",
      subtitle: "Quick Response",
      label: "Attendance Response",
      description:
        "Attendance Support makes it easier to understand absences, late arrivals, attendance patterns, and family follow-up.",
    },
  },
};

function localizeCard<
  T extends {
    id: string;
    title: string;
    subtitle?: string;
    label?: string;
    description?: string;
  },
>(card: T, language: LanguageCode): T {
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
  {
    id: "home-connections",
    title: "Home Connections",
    subtitle: "Family Connection",
    icon: <MdOutlineAutoAwesome />,
    highlight: true,
  },
  {
    id: "student-information",
    title: "Student Information",
    subtitle: "Student Profile",
    icon: <MdOutlineGridView />,
    highlight: false,
  },
  {
    id: "sis",
    title: "Student Information System",
    subtitle: "Core Management",
    icon: <FaUsers />,
    highlight: false,
  },
  {
    id: "enrollment",
    title: "Enrollment Management",
    subtitle: "Admission Process",
    icon: <MdAddCircleOutline />,
    highlight: false,
  },
  {
    id: "special-programs",
    title: "Special Programs",
    subtitle: "Support Programs",
    icon: <FaRegStar />,
    highlight: false,
  },
  {
    id: "family-engagement",
    title: "Family Engagement",
    subtitle: "Family Hub",
    icon: <MdOutlineHub />,
    highlight: false,
  },
  {
    id: "communications",
    title: "Communications",
    subtitle: "School Messenger",
    icon: <MdOutlineGridView />,
    highlight: false,
  },
  {
    id: "attendance-support",
    title: "Attendance Support",
    subtitle: "Quick Response",
    icon: <FaRegCircleQuestion />,
    highlight: false,
  },
];

export default function HomeConnections() {
  const { language } = useLanguage();
  const currentLanguage = (language === "en" ? "en" : "bn") as LanguageCode;

  const localizedProducts = useMemo(
    () => products.map((product) => localizeCard(product, currentLanguage)),
    [currentLanguage]
  );

  return (
    <OrbitProductPanel
      title={interfaceText[currentLanguage].homeConnections}
      activeId="home-connections"
      products={localizedProducts}
      themeColor="var(--color-secondary)"
      darkColor="var(--color-primary)"
      glowColor="color-mix(in srgb, var(--color-primary) 18%, transparent)"
    />
  );
}

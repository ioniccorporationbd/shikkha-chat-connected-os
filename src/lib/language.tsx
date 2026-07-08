"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Language = "bn" | "en";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
};

const LANGUAGE_STORAGE_KEY = "shikkha-chat-site-language";

const translations: Record<string, string> = {
  "UNIFY THE HOME, CLASSROOM, AND CENTRAL OFFICE":
    "বাড়ি, শ্রেণিকক্ষ এবং কেন্দ্রীয় অফিসকে একসাথে যুক্ত করুন",
  "The K–12 Connected Operating System": "কে–টুয়েলভ সংযুক্ত অপারেটিং সিস্টেম",
  "The K-12 Connected Operating System": "কে–টুয়েলভ সংযুক্ত অপারেটিং সিস্টেম",
  "The K–12 OS": "কে–টুয়েলভ অপারেটিং সিস্টেম",
  "The K-12 OS": "কে–টুয়েলভ অপারেটিং সিস্টেম",
  "The K–12 Operating System": "কে–টুয়েলভ অপারেটিং সিস্টেম",
  "The K-12 Operating System": "কে–টুয়েলভ অপারেটিং সিস্টেম",

  "Home Connections": "হোম কানেকশন",
  "Student Achievement": "শিক্ষার্থী অর্জন",
  "Operational Excellence": "অপারেশনাল উৎকর্ষতা",

  "Home Connections people": "হোম কানেকশনের মানুষ",
  "Student Achievement person": "শিক্ষার্থী অর্জনের ব্যক্তি",
  "Operational Excellence people": "অপারেশনাল উৎকর্ষতার মানুষ",

  "More power to reach every family and keep students connected":
    "প্রতিটি পরিবারে পৌঁছানো এবং শিক্ষার্থীদের সংযুক্ত রাখার আরও শক্তিশালী উপায়",
  "Bring family communication, student updates, attendance support, and school engagement into one connected experience.":
    "পরিবারের যোগাযোগ, শিক্ষার্থীর আপডেট, উপস্থিতি সহায়তা এবং স্কুল সম্পৃক্ততাকে একটি সংযুক্ত অভিজ্ঞতায় নিয়ে আসুন।",
  "Connect school, home, and every learner in one living system":
    "স্কুল, পরিবার এবং প্রতিটি শিক্ষার্থীকে একটি জীবন্ত ব্যবস্থায় যুক্ত করুন",
  "Give educators one connected way to understand progress, support needs, and readiness.":
    "অগ্রগতি, সহায়তার প্রয়োজন এবং প্রস্তুতি বোঝার জন্য শিক্ষকদের একটি সংযুক্ত পথ দিন।",
  "Run every operational workflow with clarity, speed, and confidence":
    "স্বচ্ছতা, গতি এবং আত্মবিশ্বাসের সাথে প্রতিটি অপারেশনাল কাজ পরিচালনা করুন",
  "Connect finance, planning, talent, enrollment, and staff support in one operational experience.":
    "অর্থ, পরিকল্পনা, প্রতিভা, ভর্তি এবং স্টাফ সহায়তাকে একটি অপারেশনাল অভিজ্ঞতায় যুক্ত করুন।",

  "Play video": "ভিডিও চালান",
  "Pause video": "ভিডিও বিরতি দিন",

  "Currently viewing": "বর্তমানে দেখছেন",
  "Overview": "সারসংক্ষেপ",

  "Student Information": "শিক্ষার্থীর তথ্য",
  "Student Information System": "শিক্ষার্থী তথ্য ব্যবস্থা",
  "SIS": "শিক্ষার্থী তথ্য ব্যবস্থা",

  "Enrollment": "ভর্তি",
  "Enrollment Management": "ভর্তি ব্যবস্থাপনা",
  "Special Programs": "বিশেষ কার্যক্রম",
  "Family Engagement": "পরিবারের সম্পৃক্ততা",
  "Communications": "যোগাযোগ ব্যবস্থা",
  "Attendance Support": "উপস্থিতি সহায়তা",

  "Classroom Solutions": "শ্রেণিকক্ষ সমাধান",
  "Learning Management": "লার্নিং ব্যবস্থাপনা",
  "Learning Management System": "লার্নিং ব্যবস্থাপনা",
  "Learning Management (Schoology)": "লার্নিং ব্যবস্থাপনা",
  "Schoology": "লার্নিং প্ল্যাটফর্ম",

  "Assessment": "মূল্যায়ন",
  "Assessment and Performance Analytics": "মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণ",
  "Assessment (Performance Matters)": "মূল্যায়ন ও পারফরম্যান্স বিশ্লেষণ",
  "Performance Matters": "পারফরম্যান্স বিশ্লেষণ",

  "Curriculum & Instruction": "কারিকুলাম ও পাঠদান",
  "Curriculum and Instruction": "কারিকুলাম ও পাঠদান",
  "Student Intervention": "শিক্ষার্থী সহায়তা",
  "MTSS": "বহুস্তরীয় সহায়তা ব্যবস্থা",
  "Multi-Tiered System of Supports": "বহুস্তরীয় সহায়তা ব্যবস্থা",
  "Behavior Support": "আচরণগত সহায়তা",

  "College, Career & Life Readiness": "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
  "College, Career and Life Readiness": "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
  "College Career Life Readiness": "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
  "CCLR (Naviance)": "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
  "CCLR Naviance": "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
  "Career and Life Readiness Guidance": "ক্যারিয়ার ও জীবন প্রস্তুতি নির্দেশনা",
  "Naviance": "জীবন প্রস্তুতি নির্দেশনা",

  "Resource Planning": "রিসোর্স পরিকল্পনা",
  "Financial Strategy": "আর্থিক কৌশল",
  "Financial Strategy Management": "আর্থিক কৌশল ব্যবস্থাপনা",
  "Financial Strategy (Allovue)": "আর্থিক কৌশল ব্যবস্থাপনা",
  "Allovue": "আর্থিক ব্যবস্থাপনা",

  "ERP Systems": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা",
  "Enterprise Resource Planning Systems": "এন্টারপ্রাইজ রিসোর্স পরিকল্পনা ব্যবস্থা",
  "Predictive Enrollment": "পূর্বাভাসভিত্তিক ভর্তি ব্যবস্থাপনা",
  "Predictive Enrollment Management": "পূর্বাভাসভিত্তিক ভর্তি ব্যবস্থাপনা",
  "Talent Management": "প্রতিভা ব্যবস্থাপনা",
  "Recruiting and HR": "নিয়োগ ও মানবসম্পদ",
  "Recruiting & Human Resources": "নিয়োগ ও মানবসম্পদ",
  "Recruiting and Human Resources": "নিয়োগ ও মানবসম্পদ",
  "Educator Support": "শিক্ষক সহায়তা",

  "★ My Connected OS": "★ আমার সংযুক্ত সিস্টেম",
  "My Connected OS": "আমার সংযুক্ত সিস্টেম",
  "My Connected System": "আমার সংযুক্ত সিস্টেম",

  "Talk to an Expert": "বিশেষজ্ঞের সাথে কথা বলুন",
  "Saved": "সংরক্ষিত",
  "All Products": "সব পণ্য",
  "No saved products yet": "এখনও কোনো পণ্য সংরক্ষিত নেই",
  "Click any star icon to save a product.":
    "পণ্য সংরক্ষণ করতে যেকোনো স্টার আইকনে ক্লিক করুন।",
  "Star a product to keep it here.": "এখানে রাখতে পণ্যটিতে স্টার দিন।",
  "Save product": "পণ্য সংরক্ষণ করুন",

  "Menu": "মেনু",
  "Close menu": "মেনু বন্ধ করুন",
  "Language": "ভাষা",
  "Language Mode": "ভাষা নির্বাচন",
  "English Interface": "ইংরেজি ইন্টারফেস",
  "Bangla Interface": "বাংলা ইন্টারফেস",
  "Change language": "ভাষা পরিবর্তন করুন",
  "Bangla": "বাংলা",
  "English": "ইংরেজি",
  "বাংলা": "বাংলা",
  "ইংরেজি": "ইংরেজি",

  "Teaching Tools": "শিক্ষণ টুলস",
  "Unified Progress": "একীভূত অগ্রগতি",
  "Instruction": "পাঠদান",
  "Support Plans": "সহায়তা পরিকল্পনা",
  "Multi-Tier Support": "বহুস্তরীয় সহায়তা",
  "Wellbeing": "সুস্থতা",
  "Future Ready": "ভবিষ্যৎ প্রস্তুত",

  "Operations Hub": "অপারেশন হাব",
  "Planning": "পরিকল্পনা",
  "Core ERP": "মূল এন্টারপ্রাইজ রিসোর্স পরিকল্পনা",
  "Forecasting": "পূর্বাভাস",
  "People": "মানুষ",
  "Hiring": "নিয়োগ",
  "Staff Success": "স্টাফ সাফল্য",

  "Main Finance Strategy": "প্রধান আর্থিক কৌশল",
  "Main Instruction Hub": "প্রধান পাঠদান হাব",
  "Main Multi-Tier Support": "প্রধান বহুস্তরীয় সহায়তা",
  "Active Learning Platform": "সক্রিয় লার্নিং প্ল্যাটফর্ম",
  "Performance Data": "পারফরম্যান্স ডেটা",
  "Teaching Workspace": "শিক্ষণ কর্মক্ষেত্র",
  "Instruction Planning": "পাঠদান পরিকল্পনা",
  "Support Workflow": "সহায়তা কার্যধারা",
  "Achievement View": "অর্জন ভিউ",
  "Assessment Data": "মূল্যায়ন ডেটা",
  "Support Planning": "সহায়তা পরিকল্পনা",
  "Tiered Support": "স্তরভিত্তিক সহায়তা",

  "Home Connections Overview": "হোম কানেকশন সারসংক্ষেপ",
  "Student Profile": "শিক্ষার্থী প্রোফাইল",
  "Core Management": "মূল ব্যবস্থাপনা",
  "Admission Process": "ভর্তি প্রক্রিয়া",
  "Support Programs": "সহায়তা কার্যক্রম",
  "Main Area": "প্রধান এলাকা",
  "School Messenger": "স্কুল বার্তা",
  "Quick Response": "দ্রুত সাড়া",

  "Connected Capability": "সংযুক্ত সক্ষমতা",
  "Connected Add-on": "সংযুক্ত অতিরিক্ত সুবিধা",
  "Connected System": "সংযুক্ত ব্যবস্থা",
  "Central System": "কেন্দ্রীয় ব্যবস্থা",
  "Inside Student Information System": "শিক্ষার্থী তথ্য ব্যবস্থার ভিতরে",
  "Open Section": "সেকশন খুলুন",
  "Close detail": "বিস্তারিত বন্ধ করুন",
  "Click any card to view details": "যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন",

  "Contextual AI": "প্রাসঙ্গিক কৃত্রিম বুদ্ধিমত্তা",
  "AI Intelligence": "কৃত্রিম বুদ্ধিমত্তা",
  "Connected Intelligence": "সংযুক্ত বুদ্ধিমত্তা",
  "Analytics & Insights": "বিশ্লেষণ ও ইনসাইটস",
  "Analytics and Insights": "বিশ্লেষণ ও ইনসাইটস",
  "Consistent Experience": "একীভূত অভিজ্ঞতা",
  "Family Hub": "পরিবার হাব",
  "Parent Section": "অভিভাবক সেকশন",
  "Family Experience": "পরিবারের অভিজ্ঞতা",
  "Student Section": "শিক্ষার্থী সেকশন",
  "Student Management": "শিক্ষার্থী ব্যবস্থাপনা",
  "Main Enrollment Area": "প্রধান ভর্তি এলাকা",
  "Main Program Area": "প্রধান কার্যক্রম এলাকা",
  "Main Communication Area": "প্রধান যোগাযোগ এলাকা",
  "Main Family Area": "প্রধান পরিবার এলাকা",
  "Admission Workflow": "ভর্তি প্রক্রিয়া",
  "Student Support": "শিক্ষার্থী সহায়তা",
  "Attendance Response": "উপস্থিতি সাড়া",
  "School Communication": "স্কুল যোগাযোগ",

  "Connected family experience for every school.":
    "প্রতিটি স্কুলের জন্য সংযুক্ত পারিবারিক অভিজ্ঞতা।",
  "Shikkha Chat connects student information, family communication, attendance support, enrollment management, and school operations in one trusted platform. Schools can share clear updates, families can stay informed, and every learner gets better support.":
    "শিক্ষা চ্যাট শিক্ষার্থীর তথ্য, পরিবার যোগাযোগ, উপস্থিতি সহায়তা, ভর্তি ব্যবস্থাপনা এবং স্কুল পরিচালনাকে একটি নির্ভরযোগ্য প্ল্যাটফর্মে যুক্ত করে। স্কুল পরিষ্কার আপডেট শেয়ার করতে পারে, পরিবার সবসময় প্রয়োজনীয় তথ্য জানতে পারে এবং প্রতিটি শিক্ষার্থী আরও ভালো সহায়তা পায়।",
  "Better data accuracy": "ডেটা নির্ভুলতা বৃদ্ধি",
  "Family access": "পরিবারের অ্যাক্সেস",
  "Unified school system": "একীভূত স্কুল ব্যবস্থা",
  "Shikkha Chat helped us reduce communication gaps and create a smarter connected school experience.":
    "শিক্ষা চ্যাট আমাদের যোগাযোগের দূরত্ব কমাতে এবং আরও স্মার্ট সংযুক্ত স্কুল অভিজ্ঞতা তৈরি করতে সাহায্য করেছে।",
  "Technology Leader, Connected School Community":
    "প্রযুক্তি নেতৃত্ব, সংযুক্ত স্কুল কমিউনিটি",
  "Shikkha Chat": "শিক্ষা চ্যাট",
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function translateText(text: string, language: Language) {
  if (language === "en") return text;

  const normalized = normalizeText(text);
  if (!normalized) return text;

  return translations[normalized] ?? text;
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "bn";

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (saved === "en" || saved === "bn") {
    return saved;
  }

  return "bn";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const originalTextRef = useRef(new WeakMap<Text, string>());

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLanguage;
      document.documentElement.dataset.lang = nextLanguage;
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage(language === "bn" ? "en" : "bn"),
      t: (text: string) => translateText(text, language),
    }),
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;

    const originalText = originalTextRef.current;

    const shouldSkipParent = (parent: ParentNode | null) => {
      if (!(parent instanceof HTMLElement)) return true;

      return Boolean(
        parent.closest(
          [
            "script",
            "style",
            "textarea",
            "input",
            "select",
            "option",
            "code",
            "pre",
            "svg",
            "[contenteditable='true']",
            "[data-no-translate='true']",
          ].join(", ")
        )
      );
    };

    const applyToTextNode = (node: Text) => {
      if (shouldSkipParent(node.parentNode)) return;

      const currentValue = node.nodeValue ?? "";

      if (!originalText.has(node)) {
        originalText.set(node, currentValue);
      }

      const originalValue = originalText.get(node) ?? currentValue;

      if (!originalValue.trim()) return;

      if (language === "en") {
        if (node.nodeValue !== originalValue) {
          node.nodeValue = originalValue;
        }

        return;
      }

      const normalized = normalizeText(originalValue);
      const translated = translations[normalized];

      if (!translated) return;

      const nextValue = originalValue.replace(normalized, translated);

      if (node.nodeValue !== nextValue) {
        node.nodeValue = nextValue;
      }
    };

    const translateTree = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();

      while (node) {
        applyToTextNode(node as Text);
        node = walker.nextNode();
      }
    };

    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.TEXT_NODE) {
            applyToTextNode(node as Text);
            continue;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            translateTree(node as Element);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => observer.disconnect();
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export function T({ children }: { children: string }) {
  const { t } = useLanguage();

  return <>{t(children)}</>;
}
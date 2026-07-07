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
  "UNIFY THE HOME, CLASSROOM, AND CENTRAL OFFICE": "বাড়ি, শ্রেণিকক্ষ এবং অফিসকে একসাথে যুক্ত করুন",
  "The K–12 Connected Operating System": "কে–১২ সংযুক্ত অপারেটিং সিস্টেম",
  "Home Connections": "হোম কানেকশনস",
  "Student Achievement": "শিক্ষার্থীর অর্জন",
  "Operational Excellence": "অপারেশনাল উৎকর্ষতা",
  "Home Connections people": "হোম কানেকশনস মানুষ",
  "Student Achievement person": "শিক্ষার্থীর অর্জন ব্যক্তি",
  "Operational Excellence people": "অপারেশনাল উৎকর্ষতা মানুষ",
  "More power to reach every family and keep students connected": "প্রতিটি পরিবারে পৌঁছানো এবং শিক্ষার্থীদের যুক্ত রাখার আরও শক্তিশালী উপায়",
  "Bring family communication, student updates, attendance support, and school engagement into one connected experience.": "পরিবারের যোগাযোগ, শিক্ষার্থীর আপডেট, উপস্থিতি সহায়তা এবং স্কুল সম্পৃক্ততা এক সংযুক্ত অভিজ্ঞতায় নিয়ে আসুন।",
  "Connect school, home, and every learner in one living system": "স্কুল, পরিবার এবং প্রতিটি শিক্ষার্থীকে এক জীবন্ত সিস্টেমে যুক্ত করুন",
  "Give educators one connected way to understand progress, support needs, and readiness.": "অগ্রগতি, সহায়তার প্রয়োজন এবং প্রস্তুতি বোঝার জন্য শিক্ষকদের একটি সংযুক্ত পথ দিন।",
  "Run every operational workflow with clarity, speed, and confidence": "স্বচ্ছতা, গতি এবং আত্মবিশ্বাসের সাথে প্রতিটি অপারেশনাল কাজ পরিচালনা করুন",
  "Connect finance, planning, talent, enrollment, and staff support in one operational experience.": "ফাইন্যান্স, পরিকল্পনা, ট্যালেন্ট, এনরোলমেন্ট এবং স্টাফ সহায়তা এক অপারেশনাল অভিজ্ঞতায় যুক্ত করুন।",
  "Play video": "ভিডিও চালান",
  "Pause video": "ভিডিও বিরতি দিন",
  "The K–12 OS": "কে–১২ ওএস",
  "Currently viewing": "বর্তমানে দেখা হচ্ছে",
  "Overview": "ওভারভিউ",
  "Student Information": "শিক্ষার্থীর তথ্য",
  "SIS": "এসআইএস",
  "Enrollment": "ভর্তি",
  "Special Programs": "বিশেষ প্রোগ্রাম",
  "Family Engagement": "পরিবারের সম্পৃক্ততা",
  "Communications": "যোগাযোগ",
  "Attendance Support": "উপস্থিতি সহায়তা",
  "Classroom Solutions": "শ্রেণিকক্ষ সমাধান",
  "Learning Management": "শিক্ষা ব্যবস্থাপনা",
  "Learning Management (Schoology)": "শিক্ষা ব্যবস্থাপনা (স্কুলজি)",
  "Schoology": "স্কুলজি",
  "Assessment": "মূল্যায়ন",
  "Assessment (Performance Matters)": "মূল্যায়ন (পারফরম্যান্স ম্যাটারস)",
  "Performance Matters": "পারফরম্যান্স ম্যাটারস",
  "Curriculum & Instruction": "কারিকুলাম ও নির্দেশনা",
  "Student Intervention": "শিক্ষার্থী সহায়তা",
  "MTSS": "এমটিএসএস",
  "Behavior Support": "আচরণ সহায়তা",
  "College, Career & Life Readiness": "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
  "College Career Life Readiness": "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি",
  "CCLR (Naviance)": "সিসিএলআর (নেভিয়েন্স)",
  "CCLR Naviance": "সিসিএলআর নেভিয়েন্স",
  "Naviance": "নেভিয়েন্স",
  "Resource Planning": "রিসোর্স পরিকল্পনা",
  "Financial Strategy": "আর্থিক কৌশল",
  "Financial Strategy (Allovue)": "আর্থিক কৌশল (অ্যালোভিউ)",
  "Allovue": "অ্যালোভিউ",
  "ERP Systems": "ইআরপি সিস্টেম",
  "Predictive Enrollment": "ভবিষ্যৎ ভর্তি পূর্বাভাস",
  "Talent Management": "ট্যালেন্ট ব্যবস্থাপনা",
  "Recruiting and HR": "নিয়োগ ও এইচআর",
  "Recruiting & Human Resources": "নিয়োগ ও মানবসম্পদ",
  "Educator Support": "শিক্ষক সহায়তা",
  "★ My Connected OS": "★ আমার কানেক্টেড ওএস",
  "My Connected OS": "আমার কানেক্টেড ওএস",
  "Talk to an Expert": "বিশেষজ্ঞের সাথে কথা বলুন",
  "Saved": "সংরক্ষিত",
  "All Products": "সব প্রোডাক্ট",
  "No saved products yet": "এখনও কোনো প্রোডাক্ট সংরক্ষিত নেই",
  "Click any star icon to save a product.": "প্রোডাক্ট সংরক্ষণ করতে যেকোনো স্টার আইকনে ক্লিক করুন।",
  "Star a product to keep it here.": "এখানে রাখতে প্রোডাক্টে স্টার দিন।",
  "Save product": "প্রোডাক্ট সংরক্ষণ করুন",
  "Menu": "মেনু",
  "Close menu": "মেনু বন্ধ করুন",
  "Language": "ভাষা",
  "Bangla": "বাংলা",
  "English": "ইংরেজি",
  "বাংলা": "বাংলা",
  "ইংরেজি": "ইংরেজি",
  "Teaching Tools": "শিক্ষণ টুলস",
  "Unified Progress": "একীভূত অগ্রগতি",
  "Instruction": "নির্দেশনা",
  "Support Plans": "সহায়তা পরিকল্পনা",
  "Multi-Tier Support": "বহুস্তর সহায়তা",
  "Wellbeing": "সুস্থতা",
  "Future Ready": "ভবিষ্যৎ প্রস্তুত",
  "Operations Hub": "অপারেশনস হাব",
  "Planning": "পরিকল্পনা",
  "Core ERP": "কোর ইআরপি",
  "Forecasting": "পূর্বাভাস",
  "People": "মানুষ",
  "Hiring": "নিয়োগ",
  "Staff Success": "স্টাফ সাফল্য",
  "Main Finance Strategy": "প্রধান আর্থিক কৌশল",
  "Main Instruction Hub": "প্রধান নির্দেশনা হাব",
  "Main Multi-Tier Support": "প্রধান বহুস্তর সহায়তা",
  "Active Learning Platform": "সক্রিয় শিক্ষা প্ল্যাটফর্ম",
  "Performance Data": "পারফরম্যান্স ডেটা",
  "Teaching Workspace": "শিক্ষণ কর্মক্ষেত্র",
  "Instruction Planning": "নির্দেশনা পরিকল্পনা",
  "Support Workflow": "সহায়তা ওয়ার্কফ্লো",
  "Achievement View": "অর্জন ভিউ",
  "Assessment Data": "মূল্যায়ন ডেটা",
  "Support Planning": "সহায়তা পরিকল্পনা",
  "Tiered Support": "স্তরভিত্তিক সহায়তা",
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function translateText(text: string, language: Language) {
  if (language === "en") return text;
  const normalized = text.replace(/\s+/g, " ").trim();
  return translations[normalized] ?? text;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");
  const originalTextRef = useRef(new WeakMap<Text, string>());

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "en" || saved === "bn") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
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

    const skipParent = (parent: ParentNode | null) => {
      if (!(parent instanceof HTMLElement)) return true;
      return Boolean(
        parent.closest(
          "script, style, textarea, input, code, pre, [data-no-translate='true']"
        )
      );
    };

    const applyToTextNode = (node: Text) => {
      if (skipParent(node.parentNode)) return;

      const currentValue = node.nodeValue ?? "";
      const originalValue = originalText.get(node) ?? currentValue;

      if (!originalText.has(node)) {
        originalText.set(node, originalValue);
      }

      if (!originalValue.trim()) return;

      if (language === "en") {
        if (node.nodeValue !== originalValue) node.nodeValue = originalValue;
        return;
      }

      const normalized = originalValue.replace(/\s+/g, " ").trim();
      const translated = translations[normalized];

      if (translated && node.nodeValue !== originalValue.replace(normalized, translated)) {
        node.nodeValue = originalValue.replace(normalized, translated);
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
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            applyToTextNode(node as Text);
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            translateTree(node as Element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => observer.disconnect();
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
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

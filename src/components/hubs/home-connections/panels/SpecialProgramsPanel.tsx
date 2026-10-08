"use client";

import SectionPanel from "../../shared/SectionPanel";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LuBlocks } from "react-icons/lu";

const sectionText = {
  bn: {
    pill: "বিশেষ কার্যক্রম",
    title: "আপনার প্রতিষ্ঠানের নিয়মে চলা কার্যক্রম।",
    description: "প্রতিটি প্রতিষ্ঠানের workflow আলাদা। শিক্ষা চ্যাট customizable architecture-এর উপর তৈরি—প্রয়োজন অনুযায়ী modules, fields ও access কনফিগার করে প্রতিষ্ঠান-নির্দিষ্ট কার্যক্রম পরিচালনা করা যায়।",
    supporting: "platform configurable হওয়ায় প্রতিষ্ঠানগুলি তাদের নিজস্ব academic program ও নিয়ম মডেল করতে পারে, সংযুক্ত ডেটা ভিত্তি অক্ষুণ্ণ রেখে।",
    capabilities: [
      "কনফিগারযোগ্য module, field ও access",
      "প্রতিষ্ঠান-নির্দিষ্ট workflow সমর্থন",
      "ছোট থেকে বড় প্রতিষ্ঠান পর্যন্ত বিস্তৃত",
    ],
    stats: [
      { value: "কাস্টমাইজযোগ্য", label: "প্রতিষ্ঠানের process অনুযায়ী module configuration" },
      { value: "নমনীয়", label: "ছোট প্রতিষ্ঠান থেকে বড় organization পর্যন্ত" },
    ],
    quote: "প্রতিষ্ঠানের workflow অনুযায়ী feature customize করার সুযোগ শিক্ষা চ্যাটের অন্যতম মূল সুবিধা।",
    author: "শিক্ষা চ্যাট",
    role: "স্মার্ট এডুকেশন ম্যানেজমেন্ট প্ল্যাটফর্ম, IONIC Corporation",
  },
  en: {
    pill: "Special Programs",
    title: "Programs that run the way your institution works.",
    description: "Every institution's workflow is different. Shikkha Chat is built on a customizable architecture, so modules, fields, and access can be configured around your institution's specific programs.",
    supporting: "Because the platform is configurable, institutions can model their own academic programs and rules without disrupting the shared data foundation.",
    capabilities: [
      "Configurable modules, fields, and access",
      "Supports institution-specific workflows",
      "Scales from small to large organizations",
    ],
    stats: [
      { value: "Customizable", label: "Module configuration around your institution's process" },
      { value: "Flexible", label: "From a small institution to a growing organization" },
    ],
    quote: "The ability to customize features around your workflow is one of Shikkha Chat's core strengths.",
    author: "Shikkha Chat",
    role: "Smart Education Management Platform, IONIC Corporation",
  },
} as const;

export default function SpecialProgramsPanel() {
  const { language } = useLanguage();
  const currentLanguage = language === "en" ? "en" : "bn";
  const text = sectionText[currentLanguage];

  return (
    <SectionPanel
      id="special-programs"
      variant="dashboard"
      pill={text.pill}
      title={text.title}
      description={text.description}
      supporting={text.supporting}
      capabilities={text.capabilities}
      icon={LuBlocks}
      stats={text.stats}
      quote={text.quote}
      author={text.author}
      role={text.role}
    />
  );
}

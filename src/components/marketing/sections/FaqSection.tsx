"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MdAdd, MdRemove } from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Reveal, RevealGroup } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lead: string;
    items: { q: string; a: string }[];
  }
> = {
  bn: {
    eyebrow: "FAQ",
    title: "সাধারণ জিজ্ঞাসা",
    lead: "Shikkha Chat সম্পর্কে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নগুলোর উত্তর।",
    items: [
      { q: "Shikkha Chat কী?", a: "Shikkha Chat একটি web-based education institution management platform যা verschiedene administrative ও digital operation একটি connected system-এর মধ্যে পরিচালনা করতে সাহায্য করে।" },
      { q: "কোন ধরনের প্রতিষ্ঠান Shikkha Chat ব্যবহার করতে পারে?", a: "School, college, madrasa, coaching centre, training institute এবং অন্যান্য educational organization।" },
      { q: "Software install করতে হবে?", a: "Platform web-based হওয়ায় supported browser থেকে ব্যবহার করা যায় — আলাদা install লাগে না।" },
      { q: "আলাদা user-এর আলাদা permission দেওয়া যাবে?", a: "হ্যাঁ। Platformটি role-based user access architecture সমর্থন করে।" },
      { q: "Employee attendance নেওয়া যাবে?", a: "বর্তমান system-এ Employee Check-In/Check-Out workflow রয়েছে।" },
      { q: "আমাদের প্রয়োজন অনুযায়ী feature পরিবর্তন করা যাবে?", a: "Shikkha Chat customizable architecture-এর উপর তৈরি, তাই project scope অনুযায়ী configuration ও customization করা সম্ভব।" },
      { q: "Mobile থেকে ব্যবহার করা যাবে?", a: "Interface responsive web design-এর মাধ্যমে mobile, tablet এবং desktop experience-এর জন্য তৈরি।" },
      { q: "Demo পাওয়া যাবে?", a: "হ্যাঁ। Institution-এর requirement বুঝে product demonstration দেওয়া যেতে পারে।" },
    ],
  },
  en: {
    eyebrow: "FAQ",
    title: "Frequently asked questions",
    lead: "Answers to the questions we hear most about Shikkha Chat.",
    items: [
      { q: "What is Shikkha Chat?", a: "Shikkha Chat is a web-based education institution management platform that helps you run administrative and digital operations inside one connected system." },
      { q: "Which institutions can use Shikkha Chat?", a: "Schools, colleges, madrasas, coaching centres, training institutes and other educational organizations." },
      { q: "Do we need to install software?", a: "The platform is web-based, so it can be used from a supported browser — no separate installation needed." },
      { q: "Can different users have different permissions?", a: "Yes. The platform supports a role-based user access architecture." },
      { q: "Can we track employee attendance?", a: "The current system includes an Employee Check-In/Check-Out workflow." },
      { q: "Can features be changed to fit our needs?", a: "Shikkha Chat is built on a customizable architecture, so configuration and customization are possible within the project scope." },
      { q: "Can it be used from mobile?", a: "The interface is built with responsive web design for mobile, tablet and desktop." },
      { q: "Can we get a demo?", a: "Yes. A product demonstration can be arranged after understanding your institution’s requirements." },
    ],
  },
};

export default function FaqSection() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="mk-faq" className="mk-section mk-section--tint">
      <div className="mk-container mk-container--narrow">
        <RevealGroup className="mk-stack">
          <Reveal className="mk-head mk-head--center">
            <span className="mk-eyebrow">{c.eyebrow}</span>
            <h2 className="mk-h2">{c.title}</h2>
            <p className="mk-lead" style={{ marginInline: "auto" }}>
              {c.lead}
            </p>
          </Reveal>

          <Reveal>
            <div>
              {c.items.map((item, i) => {
                const isOpen = open === i;
                return (
                  <div key={item.q} className="mk-faq-item">
                    <button
                      type="button"
                      className="mk-faq-q"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : i)}
                    >
                      <span>{item.q}</span>
                      <span className="mk-faq-toggle" aria-hidden>
                        {isOpen ? <MdRemove /> : <MdAdd />}
                      </span>
                    </button>
                    <motion.div
                      className="mk-faq-a"
                      initial={false}
                      animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p style={{ paddingBottom: "1.35rem", paddingInlineEnd: "2.5rem" }}>{item.a}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}

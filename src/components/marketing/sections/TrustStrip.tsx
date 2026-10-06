"use client";

import { useMemo } from "react";
import {
  MdOutlineAccountTree,
  MdOutlineAutoGraph,
  MdOutlineSecurity,
  MdOutlineStorage,
} from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { RevealGroup, Reveal } from "@/components/marketing/Reveal";

type Lang = "bn" | "en";

const COPY: Record<Lang, { items: { title: string; body: string }[] }> = {
  bn: {
    items: [
      { title: "ERP-Backed Foundation", body: "Enterprise-grade ডেটা ভিত্তি" },
      { title: "Role-Based Access", body: "প্রতিটি user-এর জন্য আলাদা permission" },
      { title: "OTP-Secured Login", body: "নিরাপদ authentication workflow" },
      { title: "Configurable Modules", body: "প্রতিষ্ঠান অনুযায়ী কনফিগারযোগ্য" },
    ],
  },
  en: {
    items: [
      { title: "ERP-Backed Foundation", body: "Enterprise-grade data foundation" },
      { title: "Role-Based Access", body: "Distinct permission per user" },
      { title: "OTP-Secured Login", body: "Secure authentication workflow" },
      { title: "Configurable Modules", body: "Configured around each institution" },
    ],
  },
};

const ICONS = [
  <MdOutlineStorage key="0" />,
  <MdOutlineAccountTree key="1" />,
  <MdOutlineSecurity key="2" />,
  <MdOutlineAutoGraph key="3" />,
];

export default function TrustStrip() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);

  return (
    <section className="mk-trust-strip" aria-label="Platform foundations">
      <div className="mk-container">
        <RevealGroup className="mk-trust-grid" amount={0.3}>
          {c.items.map((item, i) => (
            <Reveal key={item.title}>
              <div className="mk-trust-cell">
                <span className="mk-trust-icon" aria-hidden>
                  {ICONS[i]}
                </span>
                <span className="mk-trust-cell-text">
                  <strong>{item.title}</strong>
                  <em>{item.body}</em>
                </span>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

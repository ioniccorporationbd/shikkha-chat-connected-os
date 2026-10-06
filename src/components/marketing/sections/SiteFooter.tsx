"use client";

import { useMemo } from "react";
import { MdOutlineArrowUpward } from "react-icons/md";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Lang = "bn" | "en";

const COPY: Record<
  Lang,
  {
    brand: string;
    tagline: string;
    colProduct: string;
    colPlatform: string;
    product: { label: string; href: string }[];
    platform: { label: string; href: string }[];
    builtBy: string;
    rights: string;
  }
> = {
  bn: {
    brand: "Shikkha Chat",
    tagline: "Your Institution. Connected.",
    colProduct: "Product",
    colPlatform: "Platform",
    product: [
      { label: "Features", href: "#mk-features" },
      { label: "Who It’s For", href: "#mk-institutions" },
      { label: "How It Works", href: "#mk-how" },
      { label: "FAQ", href: "#mk-faq" },
    ],
    platform: [
      { label: "Why Shikkha Chat", href: "#mk-why" },
      { label: "Technology", href: "#mk-technology" },
      { label: "Why IONIC", href: "#mk-ionic" },
      { label: "Request a Demo", href: "#mk-demo-form" },
    ],
    builtBy: "Built by IONIC Corporation",
    rights: "All rights reserved.",
  },
  en: {
    brand: "Shikkha Chat",
    tagline: "Your Institution. Connected.",
    colProduct: "Product",
    colPlatform: "Platform",
    product: [
      { label: "Features", href: "#mk-features" },
      { label: "Who It’s For", href: "#mk-institutions" },
      { label: "How It Works", href: "#mk-how" },
      { label: "FAQ", href: "#mk-faq" },
    ],
    platform: [
      { label: "Why Shikkha Chat", href: "#mk-why" },
      { label: "Technology", href: "#mk-technology" },
      { label: "Why IONIC", href: "#mk-ionic" },
      { label: "Request a Demo", href: "#mk-demo-form" },
    ],
    builtBy: "Built by IONIC Corporation",
    rights: "All rights reserved.",
  },
};

export default function SiteFooter() {
  const { language } = useLanguage();
  const c = useMemo(() => COPY[language], [language]);
  const year = new Date().getFullYear();

  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-grid">
          <div className="mk-footer-brand">
            <span className="mk-footer-logo">{c.brand}</span>
            <p className="mk-footer-tagline">{c.tagline}</p>
          </div>

          <nav className="mk-footer-col" aria-label={c.colProduct}>
            <h4>{c.colProduct}</h4>
            <ul>
              {c.product.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="mk-footer-col" aria-label={c.colPlatform}>
            <h4>{c.colPlatform}</h4>
            <ul>
              {c.platform.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mk-footer-bottom">
          <p>
            © {year} {c.brand}. {c.rights} · {c.builtBy}
          </p>
          <a className="mk-footer-top" href="#intro" aria-label="Back to top">
            <MdOutlineArrowUpward />
          </a>
        </div>
      </div>
    </footer>
  );
}

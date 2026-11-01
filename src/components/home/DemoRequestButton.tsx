"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

import DemoRequestModal from "./DemoRequestModal";

/*
 * -------------------------------------------------------------------------
 * THE homepage "Request a Demo" button.
 *
 * One component so every demo CTA on the homepage looks and behaves the same:
 * the hero banner's button, the footer of each right-rail section card, the
 * role-access card and the left sidebar's footer CTA.
 *
 * The look is NOT re-implemented here — it is the hero's own `.mk-btn`
 * (pill radius, 0.95rem/600, 1px transparent border, -2px lift on hover,
 * the same shadow growth). Only two modifiers are added:
 *   • `tone="deep"`  — the rail's brand-primary #032521 instead of the hero
 *                      red, for the sidebar CTA that must keep its own colour;
 *                      geometry and hover mechanics stay identical.
 *   • `fullWidth`    — fills the card/sidebar column (`.mk-btn--block`).
 *
 * The click opens the EXISTING `DemoRequestModal`; there is no second dialog
 * and no new API. The label is the same English string the hero uses, run
 * through the language provider, so the Bangla/English toggle swaps it.
 * -------------------------------------------------------------------------
 */
export default function DemoRequestButton({
  tone = "primary",
  fullWidth = false,
  className = "",
}: {
  /** "primary" = hero red (default); "deep" = brand primary #032521. */
  tone?: "primary" | "deep";
  /** Stretch to the parent column width. */
  fullWidth?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const classes = [
    "mk-btn",
    tone === "deep" ? "mk-btn--deep" : "mk-btn--primary",
    fullWidth ? "mk-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        data-demo-request-cta={tone}
        className={classes}
      >
        {t("Request a Demo")}
      </button>
      {/* Portalled to <body>: the rail and the sidebar both sit inside
          transformed/`overflow-hidden` ancestors, which would turn the dialog's
          `position: fixed` into a containing-block trap. Only mounted when
          open, so nothing extra renders (and no hydration mismatch). */}
      {open && typeof document !== "undefined"
        ? createPortal(
            <DemoRequestModal open={open} onClose={() => setOpen(false)} />,
            document.body,
          )
        : null}
    </>
  );
}

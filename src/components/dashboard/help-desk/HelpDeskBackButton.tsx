"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

/**
 * The small "back" pill that sits at the top of every Help Desk section.
 *
 * It performs a real navigation: browser history when there is a page to
 * return to, otherwise it falls back to the section parent (the dashboard
 * overview, the ticket list, …) so the control is never a dead click — e.g.
 * when the panel URL was opened directly in a fresh tab.
 *
 * Styling matches the section's primary action (the "new ticket" button):
 * filled brand-red pill, bold white label, white icon.
 */
export default function HelpDeskBackButton({
  label,
  fallbackHref,
}: {
  label: string;
  fallbackHref: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="inline-flex w-fit items-center gap-1.5 rounded-2xl bg-[var(--color-action)] px-3.5 py-2 text-[12px] font-bold text-[var(--color-white)] shadow-[0_12px_24px_-16px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-[1px] hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
    >
      <FiArrowLeft size={14} className="text-[var(--color-white)]" aria-hidden />
      <span className="font-bold text-[var(--color-white)]">{label}</span>
    </button>
  );
}

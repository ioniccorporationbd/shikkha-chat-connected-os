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
      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:-translate-y-[1px] hover:border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] focus-visible:ring-offset-2"
    >
      <FiArrowLeft size={14} aria-hidden />
      {label}
    </button>
  );
}

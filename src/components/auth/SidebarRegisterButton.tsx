"use client";

import Link from "next/link";
import { FiUserPlus } from "react-icons/fi";

import { registerCopyFor } from "@/lib/auth/register-messages";
import { REGISTER_PATH } from "@/lib/auth/session";
import { useAuthStore } from "@/lib/auth/store";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type SidebarRegisterButtonProps = {
  /**
   * `sidebar` sits right of the logo (and beside the sign-in pill);
   * `compact` is the floating twin shown while the sidebar is a drawer.
   */
  variant?: "sidebar" | "compact";
};

/**
 * The home-page sign-up affordance.
 *
 * A filled brand pill so it reads as the *primary* call to action next to the
 * outlined sign-in button, and the same three rules as `SidebarAuthButton`
 * apply: it renders for `guest` **and** `loading` (never hide a CTA behind the
 * /api/auth/me round trip), it opts out of the language DOM walker with
 * `data-no-translate`, and every text utility lives on an inner <span> because
 * this project's unlayered reset outranks Tailwind utilities on <a>/<button>.
 */
export default function SidebarRegisterButton({
  variant = "sidebar",
}: SidebarRegisterButtonProps = {}) {
  const { language } = useLanguage();
  const copy = registerCopyFor(language);

  const status = useAuthStore((state) => state.status);

  // Someone already signed in has no use for sign-up — the auth button has
  // already become their dashboard shortcut.
  if (status === "authenticated") return null;

  const compact = variant === "compact";

  return (
    <Link
      href={REGISTER_PATH}
      data-no-translate="true"
      className={[
        "group relative inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-2xl border border-[var(--color-action)] bg-[var(--color-action)] shadow-[0_1px_2px_color-mix(in_srgb,var(--color-action)_16%,transparent)] transition duration-300 ease-out",
        "hover:-translate-y-[2px] hover:bg-[var(--color-action-hover)] hover:shadow-[0_14px_28px_-10px_color-mix(in_srgb,var(--color-action)_62%,transparent)]",
        "active:translate-y-0 active:shadow-[0_6px_14px_-8px_color-mix(in_srgb,var(--color-action)_58%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-secondary)_85%,var(--color-white))] focus-visible:ring-offset-2",
        compact ? "px-3 py-2" : "mt-1 px-3.5 py-2.5",
      ].join(" ")}
    >
      {/* Hover fill: a lighter gradient wipes in from the left. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[linear-gradient(115deg,color-mix(in_srgb,var(--color-action)_82%,var(--color-white)),var(--color-action-hover))] opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
        <FiUserPlus aria-hidden size={15} />
        {copy.button}
      </span>
    </Link>
  );
}

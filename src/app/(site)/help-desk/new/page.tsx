"use client";

import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

import CreateTicketForm from "@/components/help-desk/CreateTicketForm";
import HelpDeskShell from "@/components/help-desk/HelpDeskShell";
import { HELP_DESK_PATH } from "@/lib/auth/session";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

/** Public New Ticket route — `/help-desk/new`. */
export default function HelpDeskNewTicketPage() {
  const { language } = useLanguage();
  const copy = helpDeskCopyFor(language);

  return (
    <HelpDeskShell active="new">
      <div className="mb-4">
        <Link
          href={HELP_DESK_PATH}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          <FiArrowLeft className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <span className="text-sm font-semibold text-[var(--color-primary)]">{copy.navHelpDesk}</span>
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold text-[var(--color-primary)]">{copy.createTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[color-mix(in_srgb,var(--color-primary)_68%,var(--color-white))]">
          {copy.createSubtitle}
        </p>
      </div>

      <CreateTicketForm copy={copy} language={language} />
    </HelpDeskShell>
  );
}

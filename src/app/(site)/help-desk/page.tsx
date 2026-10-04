"use client";

import HelpDeskLanding from "@/components/help-desk/HelpDeskLanding";
import HelpDeskShell from "@/components/help-desk/HelpDeskShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { helpDeskCopyFor } from "@/lib/help-desk/messages";

/**
 * Public Help Desk home — `/help-desk`.
 *
 * Lives in the `(site)` route group so it inherits the public marketing shell
 * (left sidebar + branding) and the global toast/language providers. It is
 * deliberately NOT under a dashboard and NOT in `proxy.ts`'s matcher, so guests
 * reach it without a session while signed-in users keep their prefill/lists.
 */
export default function HelpDeskHomePage() {
  const { language } = useLanguage();
  const copy = helpDeskCopyFor(language);

  return (
    <HelpDeskShell active="home">
      <HelpDeskLanding copy={copy} language={language} />
    </HelpDeskShell>
  );
}

"use client";

import type { ReactNode } from "react";

import HelpDeskHeader from "./HelpDeskHeader";

type ActiveTab = "home" | "new" | "tickets";

/**
 * Shared frame for every Help Desk screen: the public header plus a centred,
 * responsive content column. `data-no-translate` opts the whole subtree out of
 * the site-wide DOM translator — Help Desk copy is served already-localised
 * from `helpDeskCopyFor(language)`, and ticket content is user data that must
 * never be auto-translated.
 */
export default function HelpDeskShell({
  active,
  children,
}: {
  active?: ActiveTab;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen" data-no-translate="true">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 xl:px-10 2xl:pt-8">
        <HelpDeskHeader active={active} />
        <main className="mt-6 sm:mt-8">{children}</main>
      </div>
    </div>
  );
}

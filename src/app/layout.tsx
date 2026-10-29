import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";

import AuthBootstrap from "@/components/auth/AuthBootstrap";
import QueryProvider from "@/components/providers/QueryProvider";
import Toaster from "@/components/ui/Toaster";
import {
  LANGUAGE_COOKIE,
  normalizeLanguage,
} from "@/lib/i18n/language-config";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Shikkha Chat",
  description: "Shikkha Chat Connected OS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The visitor's language is decided HERE, before the HTML is written: the
  // client mirrors its choice into a cookie (see LanguageProvider), so an
  // English visitor gets English text in the very first paint instead of the
  // Bangla SSR page being retranslated after hydration.
  const language = normalizeLanguage(
    (await cookies()).get(LANGUAGE_COOKIE)?.value
  );

  return (
    // Light mode is the only supported theme (dark mode was removed). The
    // attribute is still written so any stale `data-theme` value left in a
    // user's storage is overridden, and the inline script in <head> clears the
    // retired preference key so nobody keeps a dark flag around.
    <html
      lang={language}
      data-lang={language}
      data-theme="light"
      translate="no"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      {/*
        The initial language comes from the preference cookie, and that same
        value is handed to LanguageProvider, so the server HTML and the client's
        first render agree — React compares the <html> tree for real, and no
        suppressHydrationWarning is needed there.

        Browser extensions still mutate the DOM we server-rendered:
        - Google Translate rewrites <html lang>/class and wraps text in <font>.
          We opt the document out of machine translation with translate="no" +
          the google notranslate meta: that is the actual fix, not a silencer.
        - ColorZilla injects cz-shortcut-listen="true" onto <body>. There is no
          app-side way to stop it, so <body> carries suppressHydrationWarning —
          scoped to that element's own attributes only (React suppresses one
          level deep), the sanctioned fix for extension-injected attributes.
      */}
      <head>
        {/* Preconnect to the font hosts so the Latin + Noto Serif Bengali
            webfonts start downloading before globals.css is parsed — the first
            paint lands with the real typeface instead of a fallback flash. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Keep the Google Translate extension from rewriting the DOM we
            server-rendered (it adds translated-ltr / <font> and changes
            lang="bn" -> "en"). The app has its own language switch. */}
        <meta name="google" content="notranslate" />
        {/* Dark mode was retired: drop the old preference key before first
            paint so a previously-dark user cannot flash or re-enter dark mode.
            Runs once, costs one localStorage lookup, and never throws when
            storage is blocked. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{localStorage.removeItem("shikkha-theme")}catch(e){}' +
              'try{document.documentElement.setAttribute("data-theme","light");document.documentElement.style.colorScheme="light"}catch(e){}' +
              // Mirror an existing localStorage choice into the cookie the server
              // reads, so the next navigation is rendered in that language from
              // the start instead of waiting for hydration to retranslate.
              'try{var l=localStorage.getItem("shikkha-chat-site-language");' +
              'if((l==="en"||l==="bn")&&document.cookie.indexOf("shikkha-chat-site-language=")<0){' +
              'document.cookie="shikkha-chat-site-language="+l+"; path=/; max-age=31536000; samesite=lax"}}catch(e){}',
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full w-full overflow-x-clip bg-[var(--background)] text-[var(--foreground)]"
      >
        <QueryProvider>
          <LanguageProvider initialLanguage={language}>
            {/* Hydrates the auth store so the sidebar and the dashboard agree. */}
            <AuthBootstrap />
            {children}
            {/* Error / success / warning / info feedback for every surface. */}
            <Toaster />
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

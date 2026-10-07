import type { Metadata } from "next";
import "./globals.css";

import AuthBootstrap from "@/components/auth/AuthBootstrap";
import QueryProvider from "@/components/providers/QueryProvider";
import Toaster from "@/components/ui/Toaster";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Shikkha Chat",
  description: "Shikkha Chat Connected OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" data-lang="bn" translate="no" className="h-full antialiased">
      {/*
        The initial language is a deterministic constant ("bn") for both the
        server render and the client's first render, so React compares the
        <html> tree for real — no suppressHydrationWarning is needed there.

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
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full w-full overflow-x-clip bg-[var(--background)] text-[var(--foreground)]"
      >
        <QueryProvider>
          <LanguageProvider>
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

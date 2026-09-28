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
        No suppressHydrationWarning: the initial language is a deterministic
        constant ("bn") for both the server render and the client's first
        render, so React compares the tree for real.

        The remaining hydration mismatch comes from the **Google Translate**
        browser extension, which rewrites <html lang>/class (adds
        "translated-ltr") and wraps text nodes in <font> before React hydrates.
        The app owns its own bn/en switch, so we opt the document out of
        machine translation with translate="no" + the google notranslate meta:
        that stops the extension from mutating the DOM the server rendered,
        which is the actual fix (not a hydration-warning silencer).
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
      <body className="min-h-full w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
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

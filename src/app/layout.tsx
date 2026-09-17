import type { Metadata } from "next";
import "./globals.css";

import AuthBootstrap from "@/components/auth/AuthBootstrap";
import QueryProvider from "@/components/providers/QueryProvider";
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
    <html lang="bn" data-lang="bn" className="h-full antialiased">
      {/*
        No suppressHydrationWarning: the initial language is a deterministic
        constant ("bn") for both the server render and the client's first
        render, so React compares the tree for real. A browser extension that
        injects attributes (cz-shortcut-listen, data-gr-ext-installed) before
        hydration can still make React warn about <body> in that one browser —
        verify hydration in Incognito/extensions-disabled mode.
      */}
      <head>
        {/* Preconnect to the font hosts so the Latin + Noto Serif Bengali
            webfonts start downloading before globals.css is parsed — the first
            paint lands with the real typeface instead of a fallback flash. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
        <QueryProvider>
          <LanguageProvider>
            {/* Hydrates the auth store so the sidebar and the dashboard agree. */}
            <AuthBootstrap />
            {children}
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

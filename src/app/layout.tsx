import type { Metadata } from "next";
import "./globals.css";

import AuthBootstrap from "@/components/auth/AuthBootstrap";
import QueryProvider from "@/components/providers/QueryProvider";
import { LanguageProvider } from "@/lib/language";

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
    <html lang="bn" data-lang="bn" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]"
        // Browser extensions inject attributes here (e.g. cz-shortcut-listen,
        // data-gr-ext-installed) before React hydrates; that is not our mismatch.
        suppressHydrationWarning
      >
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

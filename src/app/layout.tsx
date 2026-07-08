import type { Metadata } from "next";
import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";
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
    <html lang="bn" data-lang="bn" className="h-full antialiased">
      <body className="min-h-full w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
        <LanguageProvider>
          <LeftSidebar />
          <div className="site-content-shell min-h-screen min-w-0 overflow-x-hidden">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
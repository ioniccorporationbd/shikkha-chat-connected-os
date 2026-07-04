import type { Metadata } from "next";
import "./globals.css";


import LeftSidebar from "@/components/LeftSidebar";

import { Ubuntu, Geist_Mono, Noto_Serif_Bengali } from "next/font/google";

export const metadata: Metadata = {
  title: "Shikkha Chat",
  description: "Shikkha Chat Website",
};

const englishFont = Ubuntu({
  variable: "--font-english",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const banglaFont = Noto_Serif_Bengali({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const monoFont = Geist_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      className={`${englishFont.variable} ${banglaFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full w-full overflow-x-hidden bg-background font-sans text-foreground">
        <LeftSidebar />

        <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:pl-[310px]">
          <main className="min-w-0 flex-1 overflow-x-hidden">
            {children}
          </main>

       
        </div>
      </body>
    </html>
  );
}
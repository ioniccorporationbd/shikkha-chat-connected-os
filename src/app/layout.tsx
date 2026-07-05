import type { Metadata } from "next";
import "./globals.css";
import LeftSidebar from "@/components/LeftSidebar";

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
    <html lang="bn" className="h-full antialiased">
      <body className="min-h-full w-full overflow-x-hidden bg-white text-slate-950">
        <LeftSidebar />
        <div className="min-h-screen min-w-0 overflow-x-hidden lg:pl-[292px]">
          {children}
        </div>
      </body>
    </html>
  );
}

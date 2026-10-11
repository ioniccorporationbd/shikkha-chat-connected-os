import LeftSidebar from "@/components/layout/LeftSidebar";

/**
 * Marketing site shell. Kept out of the root layout so the auth and dashboard
 * routes can render full-bleed without the sidebar.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-white focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[var(--sc-primary)] focus:shadow-[0_16px_38px_rgba(0,0,0,0.18)]"
      >
        মূল কন্টেন্টে যান
      </a>
      <LeftSidebar />
      <main
        id="main-content"
        className="site-content-shell min-h-screen min-w-0 overflow-x-clip"
      >
        {children}
      </main>
    </>
  );
}

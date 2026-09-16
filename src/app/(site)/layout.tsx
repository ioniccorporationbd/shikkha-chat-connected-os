import LeftSidebar from "@/components/LeftSidebar";

/**
 * Marketing site shell. Kept out of the root layout so the auth and dashboard
 * routes can render full-bleed without the sidebar.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeftSidebar />
      <div className="site-content-shell min-h-screen min-w-0 overflow-x-hidden">
        {children}
      </div>
    </>
  );
}

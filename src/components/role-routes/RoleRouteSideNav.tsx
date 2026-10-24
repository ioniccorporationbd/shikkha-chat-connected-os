"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ROLE_DOC_TEXT, roleRouteEntries } from "@/lib/role-route-docs";
import { type RoleAccessGuide } from "@/lib/role-routes";

/**
 * All routes of one role as a compact sidebar list, grouped exactly like that
 * role's Shikkha Chat Apps sidebar (modules / AI Pathshala / reports). Every
 * row links to its own documentation page under /dashboard, so the list is one
 * click away from the description of what the route does in the app.
 */
export default function RoleRouteSideNav({
  guide,
  activePath,
}: {
  guide: RoleAccessGuide;
  activePath?: string;
}) {
  const { language } = useLanguage();
  const entries = roleRouteEntries(guide);

  return (
    <div className="rounded-3xl border border-[var(--color-border-soft)] p-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--color-black)_50%,var(--color-primary))]">
        {ROLE_DOC_TEXT.routesInRole[language]}
      </p>

      <Link
        href={guide.dashboardRoute}
        aria-current={activePath === guide.dashboardRoute ? "page" : undefined}
        className={[
          "mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 text-[13px] font-semibold transition",
          activePath === guide.dashboardRoute
            ? "role-doc-pill-active"
            : "text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]",
        ].join(" ")}
      >
        <span className="truncate">{guide.dashboardRoute}</span>
        <span className="shrink-0 text-[11px] opacity-80">{entries.length}</span>
      </Link>

      <div className="mt-4 space-y-4">
        {guide.menuGroups.map((group) => (
          <div key={group.key}>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-black)_45%,var(--color-primary))]">
              {group.title[language]}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = item.path === activePath;
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block truncate rounded-xl px-3 py-1.5 text-[13px] leading-6 transition",
                        active
                          ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] font-semibold text-[var(--color-primary)]"
                          : "text-[color-mix(in_srgb,var(--color-black)_65%,var(--color-primary))] hover:bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] hover:text-[var(--color-primary)]",
                      ].join(" ")}
                    >
                      {item.label[language]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

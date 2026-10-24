/**
 * Connected OS — role route documentation helpers.
 *
 * The pages under /dashboard mirror the Shikkha Chat Apps dashboard route tree
 * one-to-one (same role slugs, same module / AI Pathshala / report slugs) and
 * describe, in Bangla and English, the work each route does in that app. Every
 * string comes from `@/lib/role-routes` (generated from the Shikkha Chat Apps
 * source — see the header of that file). Nothing here invents a route.
 */

import {
  ROLE_ACCESS_GUIDES,
  roleRouteCount,
  type RoleAccessGuide,
  type RoleMenuGroup,
  type RoleRouteItem,
} from "@/lib/role-routes";

export { roleRouteCount };

export type RoleRouteMatch = {
  readonly guide: RoleAccessGuide;
  readonly group: RoleMenuGroup;
  readonly item: RoleRouteItem;
};

/** Resolve a role slug (e.g. `ngo-admin`) to its guide. */
export function roleGuideByKey(key: string): RoleAccessGuide | undefined {
  return ROLE_ACCESS_GUIDES.find((guide) => guide.key === key);
}

/**
 * Resolve a full route path (e.g. `/dashboard/admin/reports/safety-events`)
 * to the role, menu group and item it belongs to.
 */
export function findRoleRoute(fullPath: string): RoleRouteMatch | null {
  for (const guide of ROLE_ACCESS_GUIDES) {
    for (const group of guide.menuGroups) {
      const item = group.items.find((entry) => entry.path === fullPath);
      if (item) return { guide, group, item };
    }
  }
  return null;
}

/** `["ai-pathshala", "lessons"]` for `/dashboard/admin/ai-pathshala/lessons`. */
export function roleRouteSegments(fullPath: string): string[] {
  return fullPath.replace(/^\/+/, "").split("/").filter(Boolean);
}

/**
 * Menu groups with the role's own root route removed.
 *
 * A couple of app sidebars (e.g. AI Safety Reviewer) list a "Dashboard" row
 * that points back at the role root, which would render the role as one of its
 * own sub-routes. The rule for this documentation area: a role is shown once,
 * and only its real sub-routes appear underneath it.
 */
export function visibleMenuGroups(guide: RoleAccessGuide): RoleMenuGroup[] {
  return guide.menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.path !== guide.dashboardRoute),
    }))
    .filter((group) => group.items.length > 0);
}

/** Every route of a role, flattened with its group, in sidebar order. */
export function roleRouteEntries(
  guide: RoleAccessGuide,
): { group: RoleMenuGroup; item: RoleRouteItem }[] {
  return visibleMenuGroups(guide).flatMap((group) =>
    group.items.map((item) => ({ group, item })),
  );
}

export function roleRouteTotal(guide: RoleAccessGuide): number {
  return roleRouteEntries(guide).length;
}

export function visibleRouteTotal(guide: RoleAccessGuide): number {
  return roleRouteEntries(guide).length;
}

/**
 * The sub-route currently "on stage" for a role: the focused one when the focus
 * store points at this role, otherwise the role's first sub-route. Both the
 * middle scene and the right rail resolve it through this function, so the
 * centre card and the detail card can never disagree.
 */
export function focusedRouteEntry(
  guide: RoleAccessGuide,
  focus: { roleKey: string; path: string } | null,
): { group: RoleMenuGroup; item: RoleRouteItem } | null {
  const entries = roleRouteEntries(guide);
  if (!entries.length) return null;
  const match =
    focus && focus.roleKey === guide.key
      ? entries.find((entry) => entry.item.path === focus.path)
      : undefined;
  return match ?? entries[0];
}

/** Localized copy for the /dashboard documentation pages. */
export const ROLE_DOC_TEXT = {
  badge: { bn: "ভূমিকা অনুযায়ী ড্যাশবোর্ড", en: "Role-based dashboards" },
  hubTitle: {
    bn: "সব ভূমিকার সম্পূর্ণ রুট তালিকা",
    en: "Every role route, documented",
  },
  hubLead: {
    bn: "Shikkha Chat Apps অ্যাপের প্রতিটি ভূমিকার প্রতিটি রুট এখানে হুবহু একই নামে রাখা হয়েছে — কোনো রুট বাদ যায়নি, নতুন কিছু বানানোও হয়নি। প্রতিটি পেজে অ্যাপে ওই রুটে যে কাজ হয়, তা ব্যাখ্যা করা আছে।",
    en: "Every route of every Shikkha Chat Apps role is mirrored here under the exact same name — nothing is omitted and nothing is invented. Each page explains the work that route does in the app.",
  },
  home: { bn: "হোম", en: "Home" },
  allRoles: { bn: "সব ভূমিকা", en: "All roles" },
  roleLabel: { bn: "ভূমিকা", en: "Role" },
  groupLabel: { bn: "মেনু গ্রুপ", en: "Menu group" },
  fullRoute: { bn: "পূর্ণ রুট", en: "Full route" },
  dashboardRoute: { bn: "ড্যাশবোর্ড রুট", en: "Dashboard route" },
  whatItDoes: {
    bn: "শিক্ষা চ্যাট অ্যাপে এই রুটে যা হয়",
    en: "What this route does in Shikkha Chat",
  },
  routesInRole: { bn: "এই ভূমিকার রুট", en: "Routes in this role" },
  otherRoutes: { bn: "এই ভূমিকার অন্য রুট", en: "Other routes in this role" },
  workflow: { bn: "কাজের ধারা", en: "Workflow" },
  tips: { bn: "টিপস", en: "Tips" },
  signing: { bn: "যে ERP ভূমিকা দেয়", en: "Granted by ERP roles" },
  openRole: { bn: "ভূমিকার সব রুট", en: "All routes of this role" },
  countRoutes: { bn: "রুট", en: "routes" },
  countGroups: { bn: "গ্রুপ", en: "groups" },
  countSteps: { bn: "কাজের ধাপ", en: "steps" },
  current: { bn: "আপনি এখানে আছেন", en: "You are here" },
  provenance: {
    bn: "তথ্যসূত্র: shikkha_chat_apps — dashboard-shell.tsx, dashboard-routes.ts, dashboard-permissions.ts, user-manual.json (bn + en)। Shikkha Chat Apps-এ কোনো পরিবর্তন করা হয়নি।",
    en: "Source: shikkha_chat_apps — dashboard-shell.tsx, dashboard-routes.ts, dashboard-permissions.ts, user-manual.json (bn + en). Nothing in Shikkha Chat Apps was changed.",
  },
  showcaseBack: { bn: "শোকেসে ফিরুন", en: "Back to the showcase" },
} as const;

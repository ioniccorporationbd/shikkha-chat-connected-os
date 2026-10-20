"use client";

import { useQuery } from "@tanstack/react-query";

import { useReloadHandler } from "@/lib/dashboard/reload-registry";

import { getHelpDeskBadges } from "./conversations";
import type { HelpDeskBadgeCounts } from "./types";

export const EMPTY_BADGE_COUNTS: HelpDeskBadgeCounts = {
  open_tickets: 0,
  solved_tickets: 0,
  new_problem: 0,
  solve_problem: 0,
};

export const HELP_DESK_BADGES_KEY = ["help-desk", "badges"] as const;

/**
 * Live unread counts for the Help Desk sections.
 *
 * The numbers come from the ERP (unread `Communication` rows for this session
 * user); this hook only decides *when* to ask again — on mount, on the shell's
 * reload event, on window focus, and every minute while the tab is visible.
 * Reading a thread marks it seen on the server, so the next poll drops it.
 * Errors are swallowed by the fetcher, which keeps the last good counts.
 */
export function useHelpDeskBadges(enabled = true): HelpDeskBadgeCounts {
  const { data, refetch } = useQuery({
    queryKey: HELP_DESK_BADGES_KEY,
    queryFn: getHelpDeskBadges,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  useReloadHandler(refetch);

  return data?.counts ?? EMPTY_BADGE_COUNTS;
}

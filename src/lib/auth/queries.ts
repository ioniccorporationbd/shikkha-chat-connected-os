"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getJson } from "@/lib/api/http";
import type { DashboardPayload, SessionPayload } from "@/lib/auth/types";

/** `GET /api/auth/me` - the single source of truth for portal auth state. */
export function useSessionQuery(): UseQueryResult<SessionPayload, Error> {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => getJson<SessionPayload>("/api/auth/me"),
    staleTime: 60_000,
    retry: false,
  });
}

/** `GET /api/dashboard/overview` - seeded with the server-rendered payload. */
export function useDashboardQuery(initialData?: DashboardPayload) {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => getJson<DashboardPayload>("/api/dashboard/overview"),
    initialData,
    staleTime: 30_000,
  });
}

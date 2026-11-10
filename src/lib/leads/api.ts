"use client";

import { getJson } from "@/lib/api/http";

import type { LeadsPayload } from "./types";

export interface LeadsQuery {
  language: string;
  search?: string;
  status?: string;
  start?: number;
  limit?: number;
}

/** `GET /api/leads` — one page of CRM leads, scoped by the caller's ERP permissions. */
export function fetchLeads(query: LeadsQuery): Promise<LeadsPayload> {
  const params = new URLSearchParams({ language: query.language });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (typeof query.start === "number") params.set("start", String(query.start));
  if (typeof query.limit === "number") params.set("limit", String(query.limit));

  return getJson<LeadsPayload>(`/api/leads?${params.toString()}`);
}

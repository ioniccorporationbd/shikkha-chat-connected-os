"use client";

import { getJson, postJson } from "@/lib/api/http";

import type { LeadDetailPayload, LeadsPayload } from "./types";

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

/** `GET /api/leads/<name>` — one lead with its full desk timeline (activity, e-mails, comments…). */
export function fetchLeadDetail(name: string, language: string): Promise<LeadDetailPayload> {
  const params = new URLSearchParams({ language });
  return getJson<LeadDetailPayload>(`/api/leads/${encodeURIComponent(name)}?${params.toString()}`);
}

/** `POST /api/leads/<name>` — add a comment the way Desk's comment box does. */
export function addLeadComment(
  name: string,
  content: string,
  language: string
): Promise<{ comment: unknown }> {
  return postJson<{ comment: unknown }>(`/api/leads/${encodeURIComponent(name)}`, {
    content,
    language,
  });
}

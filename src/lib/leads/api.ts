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

/** `POST /api/leads/<name>/attachment` — store the paperclip as a Desk `File`. */
export function uploadLeadAttachment(
  name: string,
  file: { file_name: string; content_base64: string },
  language: string
): Promise<{ attachment: unknown }> {
  return postJson<{ attachment: unknown }>(
    `/api/leads/${encodeURIComponent(name)}/attachment`,
    { ...file, language }
  );
}

/** `POST /api/leads/<name>/edit` — save the Data tab's whitelisted field edits. */
export function updateLeadDetail(
  name: string,
  updates: Record<string, string>,
  language: string
): Promise<{ updated: Record<string, string> }> {
  return postJson<{ updated: Record<string, string> }>(
    `/api/leads/${encodeURIComponent(name)}/edit`,
    { updates, language }
  );
}

/**
 * A same-origin URL for an ERP-hosted picture, or "" when there is none.
 *
 * ERP records carry `user_image` values like `/files/sir_shakil_10.jpeg`,
 * which the browser cannot load from the portal's origin — every such avatar
 * renders as a broken image. Timeline pictures therefore stream through
 * `/api/frappe-file`, which forwards the caller's own session cookie.
 */
export function leadFileSrc(value: string | null | undefined): string {
  const url = (value ?? "").trim();
  if (!url) return "";

  if (url.startsWith("data:") || url.startsWith("/api/")) return url;
  if (!url.startsWith("/") && !/^https?:\/\//i.test(url)) return "";

  return `/api/frappe-file?path=${encodeURIComponent(url)}`;
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

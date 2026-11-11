"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  LeadCallCreated,
  LeadCallDraft,
  LeadDetailPayload,
  LeadNoteCreated,
  LeadNoteDetail,
  LeadNoteDraft,
  LeadNoteEdit,
  LeadsPayload,
  LeadTaskCreated,
  LeadTaskDraft,
  LeadTaskEdit,
  LeadTaskOptions,
} from "./types";

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

/**
 * `POST /api/leads/<name>/comment-file` — the comment box's paperclip.
 *
 * The ERP writes a PUBLIC `File` (is_private=0, so `/desk/data/file` shows the
 * box unchecked) attached to the lead and posts the comment with the picture
 * embedded; an empty `content_base64` is a plain text comment.
 */
export function addLeadCommentFile(
  name: string,
  payload: { file_name?: string; content_base64?: string; content?: string },
  language: string
): Promise<{ comment: unknown; file?: unknown; images?: string[] }> {
  return postJson<{ comment: unknown; file?: unknown; images?: string[] }>(
    `/api/leads/${encodeURIComponent(name)}/comment-file`,
    { ...payload, language }
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

/** `GET /api/leads/task-options` — priorities + assignable staff for the New-task form. */
export function fetchLeadTaskOptions(language: string): Promise<LeadTaskOptions> {
  const params = new URLSearchParams({ language });
  return getJson<LeadTaskOptions>(`/api/leads/task-options?${params.toString()}`);
}

/** `POST /api/leads/<name>/task` — create a CRM Task linked to this lead. */
export function addLeadTask(
  name: string,
  task: LeadTaskDraft,
  language: string
): Promise<{ task: LeadTaskCreated; lead: string }> {
  return postJson<{ task: LeadTaskCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/task`,
    { task, language }
  );
}

/**
 * `POST /api/leads/<name>/task/<task>` — save the details popup's edits to one
 * CRM Task. Only the changed keys are forwarded, so nothing is blanked by
 * accident.
 */
export function updateLeadTask(
  name: string,
  taskName: string,
  task: LeadTaskEdit,
  language: string
): Promise<{ task: LeadTaskCreated; lead: string }> {
  return postJson<{ task: LeadTaskCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/task/${encodeURIComponent(taskName)}`,
    { task, language }
  );
}

/**
 * `POST /api/leads/<name>/call` — log a CRM Call Log (Calls tab's Log-a-Call
 * form) linked to this lead; the row lands in /crm/call-logs.
 */
export function addLeadCall(
  name: string,
  call: LeadCallDraft,
  language: string
): Promise<{ call: LeadCallCreated; lead: string }> {
  return postJson<{ call: LeadCallCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/call`,
    { call, language }
  );
}

/**
 * `POST /api/leads/<name>/note` — create a CRM note (FCRM Note) from the
 * Notes tab's New-note form; the row lands in /crm/notes like a Desk note.
 */
export function addLeadNote(
  name: string,
  note: LeadNoteDraft,
  language: string
): Promise<{ note: LeadNoteCreated; lead: string }> {
  return postJson<{ note: LeadNoteCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/note`,
    { note, language }
  );
}

/** `GET /api/leads/<name>/note/<note>` — one note's full HTML for the details popup. */
export function fetchLeadNote(
  name: string,
  noteName: string,
  language: string
): Promise<{ note: LeadNoteDetail; lead: string }> {
  const params = new URLSearchParams({ language });
  return getJson<{ note: LeadNoteDetail; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/note/${encodeURIComponent(noteName)}?${params.toString()}`
  );
}

/**
 * `POST /api/leads/<name>/note/<note>` — save the details popup's edits to one
 * note. Only the changed keys are forwarded, so nothing is blanked by accident.
 */
export function updateLeadNote(
  name: string,
  noteName: string,
  note: LeadNoteEdit,
  language: string
): Promise<{ note: LeadNoteCreated; lead: string }> {
  return postJson<{ note: LeadNoteCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/note/${encodeURIComponent(noteName)}`,
    { note, language }
  );
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

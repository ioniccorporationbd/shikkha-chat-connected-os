"use client";

import { getJson, postJson } from "@/lib/api/http";

import type {
  DealConvertDraft,
  DealConvertResult,
  DealOptions,
  LeadCallCreated,
  LeadCallDraft,
  LeadDetailPayload,
  LeadEmailCreated,
  LeadEmailDraft,
  LeadFormOptions,
  LeadNoteCreated,
  LeadNoteDetail,
  LeadNoteDraft,
  LeadNoteEdit,
  LeadsPayload,
  LeadTaskCreated,
  LeadTaskDraft,
  LeadTaskEdit,
  LeadTaskOptions,
  LeadTasksPayload,
  NewLeadCreated,
  NewLeadDraft,
} from "./types";

export interface LeadsQuery {
  language: string;
  search?: string;
  status?: string;
  start?: number;
  limit?: number;
  /** "My Leads" tab — restrict to leads whose Lead Owner is the caller. */
  mine?: boolean;
}

/** `GET /api/leads` — one page of CRM leads, scoped by the caller's ERP permissions. */
export function fetchLeads(query: LeadsQuery): Promise<LeadsPayload> {
  const params = new URLSearchParams({ language: query.language });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (typeof query.start === "number") params.set("start", String(query.start));
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (query.mine) params.set("mine", "1");

  return getJson<LeadsPayload>(`/api/leads?${params.toString()}`);
}

export interface LeadTasksQuery {
  language: string;
  /** Assigned Tasks tab — only tasks assigned to the caller. */
  mine?: boolean;
  assignee?: string;
  taskType?: string;
  /** "today" | "week" */
  window?: string;
}

/** `GET /api/leads/tasks` — the Leads ▸ Tasks board (global CRM Task list). */
export function fetchLeadTasks(query: LeadTasksQuery): Promise<LeadTasksPayload> {
  const params = new URLSearchParams({ language: query.language });
  if (query.mine) params.set("mine", "1");
  if (query.assignee) params.set("assignee", query.assignee);
  if (query.taskType) params.set("task_type", query.taskType);
  if (query.window) params.set("window", query.window);

  return getJson<LeadTasksPayload>(`/api/leads/tasks?${params.toString()}`);
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

/** `GET /api/leads/tasks/<task>` — one CRM Task's full record for the board popup. */
export function fetchLeadTaskDetail(
  taskName: string,
  language: string
): Promise<{ task: LeadTaskCreated }> {
  const params = new URLSearchParams({ language });
  return getJson<{ task: LeadTaskCreated }>(
    `/api/leads/tasks/${encodeURIComponent(taskName)}?${params.toString()}`
  );
}

/**
 * `POST /api/leads/tasks/<task>` — save the global Tasks board detail popup's
 * edits to one CRM Task (not scoped to a single lead).
 */
export function updateLeadTaskGlobal(
  taskName: string,
  task: LeadTaskEdit,
  language: string
): Promise<{ task: LeadTaskCreated }> {
  return postJson<{ task: LeadTaskCreated }>(
    `/api/leads/tasks/${encodeURIComponent(taskName)}`,
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
 * `POST /api/leads/<name>/email` — send an email to the lead's customer and
 * write the linked Communication the Emails tab reads back (Desk parity).
 */
export function sendLeadEmail(
  name: string,
  email: LeadEmailDraft,
  language: string
): Promise<{ email: LeadEmailCreated; lead: string }> {
  return postJson<{ email: LeadEmailCreated; lead: string }>(
    `/api/leads/${encodeURIComponent(name)}/email`,
    { email, language }
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

/** Raw `lead_form_options` payload (snake_case, straight from the backend). */
interface LeadFormOptionsRaw {
  salutations?: string[];
  genders?: string[];
  statuses?: (string | { value?: string; label?: string; color?: string })[];
  employee_ranges?: string[];
  default_employees?: string;
  default_status?: string;
  lead_owners?: { value?: string; label?: string }[];
  default_owner?: string;
}

/**
 * `GET /api/leads/lead-form-options` — the New-Lead form's dropdowns:
 * salutations, genders, statuses, employee bands and Lead Owners (Active
 * employees mapped to a Desk User).
 */
export async function fetchLeadFormOptions(language: string): Promise<LeadFormOptions> {
  const params = new URLSearchParams({ language });
  const raw = await getJson<LeadFormOptionsRaw>(
    `/api/leads/lead-form-options?${params.toString()}`
  );
  return {
    salutations: raw.salutations ?? [],
    genders: raw.genders ?? [],
    statuses: (raw.statuses ?? [])
      .map((s) =>
        typeof s === "string"
          ? { value: s, label: s }
          : {
              value: String(s.value ?? ""),
              label: String(s.label ?? s.value ?? ""),
              color: s.color ? String(s.color) : undefined,
            }
      )
      .filter((s) => Boolean(s.value)),
    employeeRanges: raw.employee_ranges ?? [],
    defaultEmployees: raw.default_employees ?? "1-10",
    defaultStatus: raw.default_status ?? "New",
    leadOwners: (raw.lead_owners ?? [])
      .filter((o) => Boolean(o && o.value))
      .map((o) => ({ value: String(o.value), label: String(o.label ?? o.value) })),
    defaultOwner: raw.default_owner ?? "",
  };
}

/**
 * `POST /api/leads/create` — create a CRM Lead from the New-Lead form; the row
 * lands in dash.shikkhachat.com/crm/leads/view/list.
 */
export function createLead(
  draft: NewLeadDraft,
  language: string
): Promise<{ lead: NewLeadCreated }> {
  return postJson<{ lead: NewLeadCreated }>("/api/leads/create", {
    lead: {
      salutation: draft.salutation,
      first_name: draft.firstName,
      last_name: draft.lastName,
      email: draft.email,
      mobile_no: draft.mobileNo,
      gender: draft.gender,
      organization: draft.organization,
      website: draft.website,
      no_of_employees: draft.noOfEmployees,
      territory: draft.territory,
      annual_revenue: draft.annualRevenue,
      industry: draft.industry,
      company_description: draft.companyDescription,
      status: draft.status,
      lead_owner: draft.leadOwner,
    },
    language,
  });
}

/** `GET /api/leads/<name>/convert` — Deal-status choices for the popup. */
export function fetchDealOptions(name: string, language: string): Promise<DealOptions> {
  const params = new URLSearchParams({ language });
  return getJson<DealOptions>(`/api/leads/${encodeURIComponent(name)}/convert?${params.toString()}`);
}

/**
 * `POST /api/leads/<name>/convert` — turn this lead into a CRM Deal (plus its
 * Contact and Organization). Only the chosen status is sent; the ERP reads the
 * rest of the record itself.
 */
export function convertLeadToDeal(
  name: string,
  draft: DealConvertDraft,
  language: string
): Promise<DealConvertResult> {
  return postJson<DealConvertResult>(`/api/leads/${encodeURIComponent(name)}/convert`, {
    deal: { status: draft.status },
    language,
  });
}

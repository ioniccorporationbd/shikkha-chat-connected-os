/** One lead row as the ERP list returns it (already permission-scoped). */
export interface LeadRow {
  name: string;
  lead_name: string;
  organization: string;
  email: string;
  mobile: string;
  status: string;
  source: string;
  owner: string;
  created: string;
  modified: string;
}

export interface LeadsPayload {
  /** `CRM Lead` when the CRM app is installed, `Lead` on plain ERPNext, null when neither exists. */
  doctype: string | null;
  available: boolean;
  leads: LeadRow[];
  statuses: string[];
  has_more: boolean;
  start: number;
  limit: number;
}

/** One line of the lead timeline (creation, owner change, comment, note, e-mail, call, task). */
export interface LeadActivity {
  key: string;
  /** created | owner | status | comment | note | email | call | task | attachment | version */
  kind: string;
  /** Display name of whoever caused the entry. */
  actor: string;
  actor_email: string;
  actor_image: string;
  /** The action phrase, e.g. "created this lead" / "added a comment". */
  text: string;
  /** Comment / note text (plain), empty for the other kinds. */
  body: string;
  at: string;
  /** Note rows only: last-saved time (ISO) — the Notes table's "updated" column. */
  updated?: string;
  /** Comment rows only: picture URLs the comment embeds (`/files/…`). */
  images?: string[];
  /** Task rows only: the CRM Task's own fields. */
  /** The CRM Task docname — what the details popup saves against. */
  task?: string;
  /** Call rows only: the CRM Call Log docname + the Desk call-card fields. */
  call?: string;
  type?: string;
  from?: string;
  to?: string;
  duration?: string;
  caller?: string;
  caller_label?: string;
  caller_image?: string;
  receiver?: string;
  receiver_label?: string;
  receiver_image?: string;
  telephony_medium?: string;
  /** Email rows only: the Communication docname + Desk email-thread fields. */
  email_id?: string;
  subject?: string;
  recipients?: string;
  sent_or_received?: string;
  has_attachment?: number;
  /** Note rows only: the CRM Note docname — what the note popup saves against. */
  note?: string;
  /** Note rows only: the `Comment` docname for Desk-style (comment) notes. */
  source?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  assigned_label?: string;
  due_date?: string;
}

/** One row of the Assigned-To dropdown — an HR Employee, with their User when they have one. */
export interface LeadTaskEmployee {
  /** Employee id — what the form submits. */
  value: string;
  label: string;
  designation: string;
  user: string;
  user_image: string;
}

export interface LeadTaskPriority {
  /** "" means No Priority — the CRM Task field stays empty. */
  value: string;
  label: string;
}

/** `GET /api/leads/task-options` — the New-task form's dropdown data. */
export interface LeadTaskOptions {
  priorities: LeadTaskPriority[];
  statuses: LeadTaskPriority[];
  status_default: string;
  employees: LeadTaskEmployee[];
  available: boolean;
}

/** What the New-task form posts; empty strings are simply not saved. */
export interface LeadTaskDraft {
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: string;
  due_date: string;
}

/** What the details popup sends: only the fields the user actually changed. */
export type LeadTaskEdit = Partial<LeadTaskDraft>;

/** What the New-note form sends: a title plus the editor's HTML. */
export interface LeadNoteDraft {
  title: string;
  content: string;
}

/** The note row `add_lead_note` returns, shaped like the Notes tab's rows. */
export interface LeadNoteCreated {
  key: string;
  kind: string;
  actor: string;
  actor_email: string;
  text: string;
  body: string;
  at: string;
  note?: string;
  pinned?: number;
}

/** What the per-note details popup sends: only the fields the user changed. */
export type LeadNoteEdit = Partial<LeadNoteDraft>;

/** One note's full record (`get_lead_note`) for the editable details popup. */
export interface LeadNoteDetail {
  note: string;
  key: string;
  title: string;
  /** The note's stored HTML — what the popup edits. */
  content: string;
  at: string;
  updated: string;
  pinned: number;
  actor: string;
}

export interface LeadTaskCreated {
  key: string;
  /** The CRM Task docname (same value as `key` for task rows). */
  task?: string;
  title: string;
  /** Free-text body; "" when the task has none. */
  description?: string;
  status: string;
  priority: string;
  assigned_to: string;
  assigned_label: string;
  due_date: string;
  at: string;
}

/** What the Log-a-Call form posts to create a CRM Call Log. */
export interface LeadCallDraft {
  /** "Incoming" | "Outgoing". */
  type: string;
  from: string;
  to: string;
  status: string;
  /** Free-text duration ("5:30" or "330"); the ERP stores whole seconds. */
  duration: string;
  /** HR Employee id: the receiver (Incoming) or caller (Outgoing). */
  employee: string;
}

/** The call row `add_lead_call_log` returns, shaped like the Calls tab's rows. */
export interface LeadCallCreated {
  key: string;
  kind: string;
  actor: string;
  actor_email: string;
  text: string;
  body: string;
  at: string;
  status?: string;
  type?: string;
}
export interface LeadEmailDraft {
  /** Recipients — one or many; blank falls back to the lead's own address. */
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  /** Plain text or HTML body of the message. */
  content: string;
}
export interface LeadEmailCreated {
  key: string;
  kind: string;
  subject: string;
  recipients: string;
  sent_or_received: string;
  at: string;
}

export interface LeadAttachment {
  key: string;
  file_name: string;
  file_url: string;
  file_size: number;
  at: string;
}

/** One label/value pair of the Data tab. */
export interface LeadField {
  /** Doctype fieldname — present when the Data tab may edit the row. */
  field?: string;
  label: string;
  value: string;
  /** The ERP endpoint will accept this field in `update_lead`. */
  editable?: boolean;
}

export interface LeadDetail {
  name: string;
  lead_name: string;
  organization: string;
  email: string;
  mobile: string;
  status: string;
  source: string;
  owner: string;
  owner_name: string;
  created: string;
  modified: string;
  image: string;
  fields: LeadField[];
}

export interface LeadDetailPayload {
  doctype: string | null;
  available: boolean;
  lead: LeadDetail | null;
  activity: LeadActivity[];
  emails: LeadActivity[];
  comments: LeadActivity[];
  calls: LeadActivity[];
  tasks: LeadActivity[];
  notes: LeadActivity[];
  attachments: LeadAttachment[];
}

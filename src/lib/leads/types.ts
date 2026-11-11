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
  /** Task rows only: the CRM Task's own fields. */
  title?: string;
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

export interface LeadTaskCreated {
  key: string;
  title: string;
  status: string;
  priority: string;
  assigned_to: string;
  assigned_label: string;
  due_date: string;
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

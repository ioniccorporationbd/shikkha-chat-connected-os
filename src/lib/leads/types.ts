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

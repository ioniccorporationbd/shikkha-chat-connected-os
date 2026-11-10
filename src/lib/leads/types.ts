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

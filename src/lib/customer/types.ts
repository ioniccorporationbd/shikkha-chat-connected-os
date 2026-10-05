/** Shapes for the System-User "Create Customer" surface (ERPNext Customer). */

export interface CustomerFieldMeta {
  fieldname: string;
  label: string;
  /** Frappe fieldtype: Data, Select, Link, Check, Date, Small Text, ... */
  fieldtype: string;
  /** Allowed values for a Select field (empty otherwise). */
  options: string[];
  /** Target DocType for a Link / Dynamic Link field (empty otherwise). */
  link_doctype: string;
  required: boolean;
  read_only: boolean;
  default?: string;
  description?: string;
  placeholder?: string;
  /** Frappe `depends_on` expression (informational; the portal keeps it visible). */
  depends_on?: string;
}

export interface CustomerSection {
  key: string;
  label: string;
  fields: CustomerFieldMeta[];
}

export interface CustomerSchema {
  doctype: string;
  title: string;
  sections: CustomerSection[];
  meta: {
    title_field: string;
    search_fields: string[];
  };
}

export interface CustomerLinkOption {
  value: string;
  label: string;
}

export interface CustomerLinkOptionsPayload {
  doctype: string;
  options: CustomerLinkOption[];
}

export interface CustomerCreateResult {
  /** The document `name` (the created Customer ID). */
  name: string;
  customer_name: string;
  customer_type?: string;
  /** Summary fields mirrored from the created document. */
  customer_group?: string;
  territory?: string;
  /** Frappe audit fields (written by the standard insert flow). */
  owner?: string;
  creation?: string;
  /** Backend self-check: the row exists in the Customer table (frappe.db.exists). */
  verified?: boolean;
}

/** A single form value — text, number, date string, or a Check boolean. */
export type CustomerFieldValue = string | boolean;

export type CustomerFormValues = Record<string, CustomerFieldValue>;

/* ------------------------------------------------------------------ management */

/** One row in the owner-scoped Customer list (from `customer.list_mine`). */
export interface CustomerListRow {
  name: string;
  customer_name?: string;
  customer_type?: string;
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
  creation?: string;
  owner?: string;
}

/** `customer.list_mine` payload — only the signed-in user's own Customers. */
export interface CustomerListPayload {
  doctype: string;
  count: number;
  customers: CustomerListRow[];
  verified?: boolean;
}

/** Prefill for the edit form (from `customer.details`). */
export interface CustomerDetails {
  doctype: string;
  name: string;
  customer_name?: string;
  owner?: string;
  values: Record<string, CustomerFieldValue>;
  verified?: boolean;
}

/** `customer.delete` result. */
export interface CustomerDeleteResult {
  deleted: boolean;
  name: string;
  verified?: boolean;
}

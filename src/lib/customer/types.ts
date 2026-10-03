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
  /** Frappe audit fields (written by the standard insert flow). */
  owner?: string;
  creation?: string;
}

/** A single form value — text, number, date string, or a Check boolean. */
export type CustomerFieldValue = string | boolean;

export type CustomerFormValues = Record<string, CustomerFieldValue>;

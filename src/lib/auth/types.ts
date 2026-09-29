/** Shared shapes for every payload the portal receives from the shikkha_os API. */

export interface SessionUser {
  authenticated: true;
  name: string;
  full_name: string;
  email: string;
  user_image: string;
  time_zone?: string;
  language?: string;
  roles: string[];
  is_admin: boolean;
  designation?: string;
  department?: string;
  last_login?: string;
  /** Frappe `User.user_type`: "System User" (desk) or "Website User" (portal). */
  user_type?: string;
  /** Role-aware landing route decided by the ERP (staff panel vs client dashboard). */
  dashboard_route?: string;
}

export interface SessionPayload {
  authenticated: boolean;
  user: SessionUser | null;
  redirect_to: string;
  session_expiry_seconds: number;
}

export interface DashboardStat {
  key: string;
  label: string;
  value: number;
  icon: string;
  hint: string;
  scope: "personal" | "site";
}

export interface DashboardProfileRow {
  label: string;
  value: string;
}

export interface DashboardActivityRow {
  name: string;
  event: string;
  status: string;
  creation: string;
  client_ip?: string;
  detail?: string;
}

export interface DashboardLink {
  key: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  external: boolean;
}

export interface DashboardSystem {
  app: string;
  version: string;
  api: string;
  base_url: string;
  session_expiry_hours: number;
}

export interface DashboardPayload {
  user: SessionUser;
  stats: DashboardStat[];
  profile: DashboardProfileRow[];
  activity: DashboardActivityRow[];
  quick_links: DashboardLink[];
  system: DashboardSystem;
}

export interface RegisterStartPayload {
  sent: boolean;
  /** Masked destination (never the raw address). */
  email: string;
  mobile: string;
  delivery: { sms: boolean; email: boolean };
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface RegisterResultPayload extends SessionPayload {
  /** Names of the records created server-side (null when a doctype is absent). */
  created?: { user: string | null; customer: string | null };
}

export interface RegisterAvailabilityPayload {
  email_available: boolean;
  mobile_available: boolean;
}

export interface LoginOtpStartPayload {
  sent: boolean;
  /** Masked destination the code went to (email or mobile). */
  target: string;
  email?: string;
  mobile?: string;
  delivery: {
    sms: boolean;
    email: boolean;
    /** Stable per-channel reason code: sent | not_configured | gateway_error | ... */
    sms_code?: string;
    email_code?: string;
  };
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface ResetOtpStartPayload {
  sent: boolean;
  /** Which channel the reset code went to. */
  channel: "email" | "sms";
  /** Masked destination the code went to. */
  target: string;
  delivery: {
    sms: boolean;
    email: boolean;
    sms_code?: string;
    email_code?: string;
  };
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface ResetDonePayload {
  reset: boolean;
  /** Channel the new password was sent on. */
  channel: "email" | "sms";
  /** Masked destination the new password went to. */
  target: string;
  delivery: {
    sms: boolean;
    email: boolean;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  code: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/* ------------------------------------------------------------------ profile */

/** Editable self-service profile (own account), from `profile.details`. */
export interface ProfileDetails {
  name: string;
  full_name: string;
  email: string;
  user_image: string;
  user_type: string;
  roles: string[];
  /** Fieldnames the site's User DocType exposes for editing. */
  editable: string[];
  /** Current value keyed by fieldname (only the editable ones). */
  values: Record<string, string>;
}

export interface ProfileUpdateResult {
  updated: boolean;
  user: SessionUser;
  values: Record<string, string>;
}

export interface ChangePasswordResult {
  changed: boolean;
}

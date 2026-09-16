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

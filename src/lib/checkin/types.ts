/** Shapes for the Employee Check In / Out surface (ERPNext Employee Checkin). */

export interface CheckinEmployee {
  name: string;
  employee_name: string;
}

export interface CheckinRecord {
  name?: string;
  log_type: string;
  time: string;
  device_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geolocation?: string | null;
  creation?: string;
}

export interface CheckinStatus {
  doctype: string;
  /** False when the signed-in user has no Employee record linked. */
  linked: boolean;
  employee: CheckinEmployee | null;
  /** Latest record decides: IN -> "in", OUT (or none) -> "out". */
  state: "in" | "out";
  checked_in: boolean;
  last: CheckinRecord | null;
  last_in: CheckinRecord | null;
  last_out: CheckinRecord | null;
  server_time: string;
}

export interface CheckinPunchResult {
  record: CheckinRecord;
  employee: CheckinEmployee;
  state: "in" | "out";
  checked_in: boolean;
  /** Backend self-check: the row exists in the Employee Checkin table. */
  verified: boolean;
}

/** A captured browser location. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  /** Human-readable "lat, lng" string stored in the ERP's geolocation field. */
  geolocation: string;
}

/* ------------------------------------------------------------------ history */

export interface CheckinPunch {
  /** "IN" | "OUT". */
  log_type: string;
  time: string;
}

/** One calendar day of the employee's own punches. */
export interface CheckinDay {
  /** "YYYY-MM-DD". */
  date: string;
  punches: CheckinPunch[];
  first_in: string | null;
  last_out: string | null;
  in_count: number;
  out_count: number;
  total: number;
}

/** `checkin.history` payload — the last N calendar days, newest day first. */
export interface CheckinHistoryPayload {
  doctype: string;
  linked: boolean;
  employee: CheckinEmployee | null;
  window_days: number;
  days: CheckinDay[];
  from_date: string | null;
  to_date: string | null;
  /** True when an explicit From/To range was applied (not the rolling default). */
  filtered?: boolean;
  /** Largest explicit range the backend accepts (days). */
  max_range_days?: number;
  server_time: string;
}

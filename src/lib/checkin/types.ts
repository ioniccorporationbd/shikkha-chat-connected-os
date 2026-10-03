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

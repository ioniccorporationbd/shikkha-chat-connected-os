/**
 * A stable, per-browser device identifier for Employee Checkin.
 *
 * The portal carried no device-identification mechanism, so this is the minimal
 * one: a random id generated once and kept in `localStorage`. It is deliberately
 * opaque and carries no personal data or fingerprint - it only lets the ERP
 * group check-ins that came from the same browser.
 */

const STORAGE_KEY = "shikkha_os.device_id";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the manual generator
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }

  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Read (or lazily create) this browser's device id. Empty string when unavailable. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = `dev-${randomId()}`;
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "";
  }
}

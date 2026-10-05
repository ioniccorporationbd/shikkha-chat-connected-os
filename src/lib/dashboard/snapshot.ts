import type { DashboardPayload } from "@/lib/auth/types";

/**
 * A stable, order-independent fingerprint of the dashboard payload, used by the
 * Smart Reload button to decide whether anything actually changed.
 *
 * Only the fields a user sees are included, and volatile values that always
 * differ (absolute timestamps, the session-countdown, the base url) are left
 * out — so an untouched dashboard fingerprints identically across reloads and
 * the button takes the lightweight path.
 */
export function dashboardSnapshot(payload?: DashboardPayload | null): string {
  if (!payload) return "";

  const user = payload.user ?? ({} as DashboardPayload["user"]);

  const stable = {
    user: {
      name: user.name,
      full_name: user.full_name,
      email: user.email,
      user_image: user.user_image,
      user_type: user.user_type,
      designation: user.designation,
      department: user.department,
      time_zone: user.time_zone,
      language: user.language,
      // Role order is not meaningful — sort so a reshuffle is not a "change".
      roles: [...(user.roles ?? [])].sort(),
    },
    stats: payload.stats.map((stat) => [stat.key, stat.value]),
    profile: payload.profile.map((row) => [row.label, row.value]),
    activity: payload.activity.map((row) => [row.name, row.event, row.status, row.client_ip]),
    quick_links: payload.quick_links.map((link) => link.key),
    system: [payload.system.api, payload.system.version],
  };

  return JSON.stringify(stable);
}

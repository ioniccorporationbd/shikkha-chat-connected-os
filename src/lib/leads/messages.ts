/** Bilingual copy for the staff **Leads** page (`/userDashboard/leads`). */

export interface LeadsCopy {
  title: string;
  subtitle: string;
  sourceNote: string;
  searchPlaceholder: string;
  allStatuses: string;
  statusLabel: string;
  refresh: string;
  refreshing: string;
  loading: string;
  errorTitle: string;
  retry: string;
  emptyTitle: string;
  emptyHint: string;
  noMatchTitle: string;
  noMatchHint: string;
  unavailableTitle: string;
  unavailableHint: string;
  loadMore: string;
  columns: {
    serial: string;
    lead: string;
    organization: string;
    mobile: string;
    email: string;
    status: string;
    source: string;
    created: string;
  };
  /** CRM status → display label; unknown statuses fall through verbatim. */
  statusLabels: Record<string, string>;
  total: (count: string, more?: boolean) => string;
}

const bn: LeadsCopy = {
  title: "লিডস",
  subtitle: "CRM-এর লিড বোর্ড — ডেস্কের লিড লিস্টের সাথে একই ডেটা",
  sourceNote: "সোর্স: dash.shikkhachat.com/crm/leads/view/list",
  searchPlaceholder: "নাম, প্রতিষ্ঠান, মোবাইল বা ইমেইল দিয়ে খুঁজুন…",
  allStatuses: "সব স্ট্যাটাস",
  statusLabel: "স্ট্যাটাস",
  refresh: "হালনাগাদ",
  refreshing: "হালনাগাদ হচ্ছে…",
  loading: "লিড লোড হচ্ছে…",
  errorTitle: "লিড লোড করা যায়নি",
  retry: "আবার চেষ্টা করুন",
  emptyTitle: "এখনো কোনো লিড নেই",
  emptyHint: "CRM-এ নতুন লিড যোগ হলে এখানে দেখা যাবে।",
  noMatchTitle: "কোনো লিড মেলেনি",
  noMatchHint: "অন্য নাম বা স্ট্যাটাস দিয়ে আবার খুঁজুন।",
  unavailableTitle: "এই সাইটে CRM লিড পাওয়া যায়নি",
  unavailableHint: "Frappe-এ CRM (বা ERPNext) ইনস্টল করে মাইগ্রেট করলে লিড এখানে দেখা যাবে।",
  loadMore: "আরও লিড দেখুন",
  columns: {
    serial: "ক্রমিক",
    lead: "লিড",
    organization: "প্রতিষ্ঠান",
    mobile: "মোবাইল",
    email: "ইমেইল",
    status: "স্ট্যাটাস",
    source: "সোর্স",
    created: "তারিখ",
  },
  statusLabels: {
    New: "নতুন",
    Contacted: "যোগাযোগ হয়েছে",
    Nurturing: "নাটারিং",
    Qualified: "কোয়ালিফাইড",
    Converted: "কনভার্টেড",
    Unqualified: "অযোগ্য",
    Junk: "বাতিল",
    Lost: "হারানো",
    Open: "ওপেন",
    Lead: "লিড",
    Opportunity: "সুযোগ",
    Interested: "আগ্রহী",
    "Do Not Contact": "যোগাযোগ নয়",
  },
  total: (count, more) => `মোট ${count}${more ? "+" : ""}টি লিড`,
};

const en: LeadsCopy = {
  title: "Leads",
  subtitle: "The CRM lead board — same data as the Desk lead list",
  sourceNote: "Source: dash.shikkhachat.com/crm/leads/view/list",
  searchPlaceholder: "Search name, organisation, mobile or email…",
  allStatuses: "All statuses",
  statusLabel: "Status",
  refresh: "Refresh",
  refreshing: "Refreshing…",
  loading: "Loading leads…",
  errorTitle: "The leads could not be loaded",
  retry: "Try again",
  emptyTitle: "No leads yet",
  emptyHint: "Leads added in the CRM will show up here.",
  noMatchTitle: "No lead matched",
  noMatchHint: "Try another name or status.",
  unavailableTitle: "CRM leads are not available on this site",
  unavailableHint: "Install the CRM (or ERPNext) app and migrate to see leads here.",
  loadMore: "Load more leads",
  columns: {
    serial: "#",
    lead: "Lead",
    organization: "Organisation",
    mobile: "Mobile",
    email: "Email",
    status: "Status",
    source: "Source",
    created: "Date",
  },
  statusLabels: {
    New: "New",
    Contacted: "Contacted",
    Nurturing: "Nurturing",
    Qualified: "Qualified",
    Converted: "Converted",
    Unqualified: "Unqualified",
    Junk: "Junk",
    Lost: "Lost",
    Open: "Open",
    Lead: "Lead",
    Opportunity: "Opportunity",
    Interested: "Interested",
    "Do Not Contact": "Do Not Contact",
  },
  total: (count, more) => `${count}${more ? "+" : ""} leads in total`,
};

export function leadsCopyFor(language: string): LeadsCopy {
  return language === "en" ? en : bn;
}

/** Display label for a CRM status, with the raw value as the last resort. */
export function leadStatusLabel(copy: LeadsCopy, status: string): string {
  if (!status) return "";
  return copy.statusLabels[status] ?? status;
}

/** Stable per-status accent so the board is scannable (status → CSS colour pair). */
export function leadStatusTone(status: string): { bg: string; fg: string } {
  const key = status.toLowerCase();
  if (/(converted|won|qualified)/.test(key)) return { bg: "rgba(22,128,84,0.12)", fg: "#168054" };
  if (/(contacted|nurturing|interested|open)/.test(key)) return { bg: "rgba(21,101,192,0.12)", fg: "#1565c0" };
  if (/(lost|junk|unqualified|do not contact)/.test(key)) return { bg: "rgba(180,69,58,0.14)", fg: "#b4453a" };
  return { bg: "rgba(224,5,22,0.10)", fg: "#e00516" };
}

/** Locale-aware count (bn-BD digits for Bengali, en-BD for English). */
export function formatCount(value: number, language: string): string {
  return new Intl.NumberFormat(language === "en" ? "en-BD" : "bn-BD").format(
    Number.isFinite(value) ? value : 0
  );
}

/** Initials for the lead avatar ("Md. Rakib Hasan" → "MR"). */
export function leadInitials(name: string): string {
  const words = String(name || "")
    .replace(/[^\p{L}\p{N}\s.]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !/^[.]+$/.test(word));
  if (!words.length) return "?";
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

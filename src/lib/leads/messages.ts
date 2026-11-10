/** Bilingual copy for the staff **Leads** page (`/userDashboard/leads`). */

/** Copy for the desk-style lead detail panel (`View details`). */
export interface LeadsDetailCopy {
  tabs: {
    activity: string;
    emails: string;
    comments: string;
    data: string;
    calls: string;
    tasks: string;
    notes: string;
    attachments: string;
  };
  activityHeading: string;
  newAction: string;
  close: string;
  loading: string;
  errorTitle: string;
  retry: string;
  reply: string;
  comment: string;
  composerPlaceholder: string;
  send: string;
  sending: string;
  commentAdded: string;
  commentFailed: string;
  attach: string;
  attaching: string;
  attachmentAdded: string;
  attachmentFailed: string;
  attachmentTooLarge: string;
  leadOwner: string;
  edit: string;
  save: string;
  cancel: string;
  saving: string;
  saved: string;
  saveFailed: string;
  empty: {
    activity: string;
    emails: string;
    comments: string;
    data: string;
    calls: string;
    tasks: string;
    notes: string;
    attachments: string;
  };
  justNow: string;
  minuteAgo: (n: string) => string;
  hourAgo: (n: string) => string;
  dayAgo: (n: string) => string;
  weekAgo: (n: string) => string;
  monthAgo: (n: string) => string;
  yearAgo: (n: string) => string;
}

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
    action: string;
  };
  /** "View details" action button in the Action column. */
  viewDetails: string;
  /** The desk-style lead detail panel behind "View details". */
  detail: LeadsDetailCopy;
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
    action: "অ্যাকশন",
  },
  viewDetails: "বিস্তারিত দেখুন",
  detail: {
    tabs: {
      activity: "অ্যাক্টিভিটি",
      emails: "ইমেইল",
      comments: "মন্তব্য",
      data: "ডেটা",
      calls: "কল",
      tasks: "টাস্ক",
      notes: "নোট",
      attachments: "সংযুক্তি",
    },
    activityHeading: "অ্যাক্টিভিটি",
    newAction: "নতুন",
    close: "বন্ধ করুন",
    loading: "লিডের বিস্তারিত লোড হচ্ছে…",
    errorTitle: "লিডের বিস্তারিত লোড করা যায়নি",
    retry: "আবার চেষ্টা করুন",
    reply: "রিপ্লাই",
    comment: "মন্তব্য",
    composerPlaceholder: "একটি মন্তব্য লিখুন…",
    send: "পাঠান",
    sending: "পাঠানো হচ্ছে…",
    commentAdded: "মন্তব্য যোগ হয়েছে",
    commentFailed: "মন্তব্য যোগ করা যায়নি",
    attach: "সংযুক্তি",
    attaching: "সংযুক্তি আপলোড হচ্ছে…",
    attachmentAdded: "সংযুক্তি যোগ হয়েছে — Desk → File-এ সংরক্ষিত",
    attachmentFailed: "সংযুক্তি আপলোড করা যায়নি",
    attachmentTooLarge: "ফাইলটি ৫ MB-এর বেশি হতে পারবে না",
    leadOwner: "লিড ওনার",
    edit: "সম্পাদনা",
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    saving: "সংরক্ষণ হচ্ছে…",
    saved: "লিডের তথ্য সংরক্ষণ হয়েছে",
    saveFailed: "লিডের তথ্য সংরক্ষণ করা যায়নি",
    empty: {
      activity: "এখনো কোনো অ্যাক্টিভিটি নেই।",
      emails: "কোনো ইমেইল নেই।",
      comments: "কোনো মন্তব্য নেই।",
      data: "কোনো তথ্য নেই।",
      calls: "কোনো কল নেই।",
      tasks: "কোনো টাস্ক নেই।",
      notes: "কোনো নোট নেই।",
      attachments: "কোনো সংযুক্তি নেই।",
    },
    justNow: "এইমাত্র",
    minuteAgo: (n) => `${n} মিনিট আগে`,
    hourAgo: (n) => `${n} ঘণ্টা আগে`,
    dayAgo: (n) => `${n} দিন আগে`,
    weekAgo: (n) => `${n} সপ্তাহ আগে`,
    monthAgo: (n) => `${n} মাস আগে`,
    yearAgo: (n) => `${n} বছর আগে`,
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
    action: "Action",
  },
  viewDetails: "View details",
  detail: {
    tabs: {
      activity: "Activity",
      emails: "Emails",
      comments: "Comments",
      data: "Data",
      calls: "Calls",
      tasks: "Tasks",
      notes: "Notes",
      attachments: "Attachments",
    },
    activityHeading: "Activity",
    newAction: "New",
    close: "Close",
    loading: "Loading the lead…",
    errorTitle: "The lead could not be loaded",
    retry: "Try again",
    reply: "Reply",
    comment: "Comment",
    composerPlaceholder: "Write a comment…",
    send: "Send",
    sending: "Sending…",
    commentAdded: "Comment added",
    commentFailed: "The comment could not be added",
    attach: "Attachment",
    attaching: "Uploading…",
    attachmentAdded: "Attachment added — saved to Desk → File",
    attachmentFailed: "The attachment could not be uploaded",
    attachmentTooLarge: "The file cannot be larger than 5 MB",
    leadOwner: "Lead Owner",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving…",
    saved: "The lead has been saved",
    saveFailed: "The lead could not be saved",
    empty: {
      activity: "No activity yet.",
      emails: "No e-mails.",
      comments: "No comments.",
      data: "No fields.",
      calls: "No calls.",
      tasks: "No tasks.",
      notes: "No notes.",
      attachments: "No attachments.",
    },
    justNow: "just now",
    minuteAgo: (n) => `${n} minute${n === "1" ? "" : "s"} ago`,
    hourAgo: (n) => `${n} hour${n === "1" ? "" : "s"} ago`,
    dayAgo: (n) => `${n} day${n === "1" ? "" : "s"} ago`,
    weekAgo: (n) => `${n} week${n === "1" ? "" : "s"} ago`,
    monthAgo: (n) => `${n} month${n === "1" ? "" : "s"} ago`,
    yearAgo: (n) => `${n} year${n === "1" ? "" : "s"} ago`,
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

/**
 * Desk-style relative timestamp ("2 hours ago" / "২ ঘণ্টা আগে"). Digits follow
 * the language, like every other number on the dashboard.
 */
export function leadRelativeTime(copy: LeadsCopy, at: string, language: string): string {
  const then = new Date(String(at).replace(" ", "T")).getTime();
  if (!Number.isFinite(then)) return "";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  const step = (unit: number, format: (n: string) => string) =>
    format(formatCount(Math.max(1, Math.round(seconds / unit)), language));

  const detail = copy.detail;
  if (seconds < 60) return detail.justNow;
  if (seconds < 3600) return step(60, detail.minuteAgo);
  if (seconds < 86_400) return step(3600, detail.hourAgo);
  if (seconds < 7 * 86_400) return step(86_400, detail.dayAgo);
  if (seconds < 30 * 86_400) return step(7 * 86_400, detail.weekAgo);
  if (seconds < 365 * 86_400) return step(30 * 86_400, detail.monthAgo);
  return step(365 * 86_400, detail.yearAgo);
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

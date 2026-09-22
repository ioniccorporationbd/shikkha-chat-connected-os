/** Bilingual copy for the portal dashboard. */

import type { DashboardStat } from "@/lib/auth/types";

export interface DashboardCopy {
  brandSubtitle: string;
  navHeading: string;
  nav: {
    overview: string;
    analytics: string;
    reports: string;
    users: string;
    settings: string;
  };
  soon: string;
  backToSite: string;
  signOut: string;
  signingOut: string;
  refresh: string;
  greeting: string;
  greetingFallback: string;
  subtitle: string;
  /** Subtitle for the customer-facing `/clientDashboard` panel. */
  clientSubtitle: string;
  roleLabel: string;
  metricsHeading: string;
  metricsHint: string;
  scopePersonal: string;
  scopeSite: string;
  activityHeading: string;
  activityHint: string;
  activityEmpty: string;
  profileHeading: string;
  profileHint: string;
  quickLinksHeading: string;
  quickLinksHint: string;
  quickLinksEmpty: string;
  systemHeading: string;
  systemApi: string;
  systemVersion: string;
  systemServer: string;
  systemSession: string;
  hoursSuffix: string;
  loadingTitle: string;
  loadingHint: string;
  errorTitle: string;
  retry: string;
  /** Per-stat presentation, keyed by the API's `stat.key`; unknown keys fall
   *  back to the label/hint the backend sent. */
  stats: Record<string, { label: string; hint: string }>;
  /** Localised quick-link copy, keyed by `link.key`. */
  links: Record<string, { label: string; description: string }>;
  /** Localised profile row labels, keyed by the English label the API sends. */
  profileFields: Record<string, string>;
  events: Record<string, string>;
  statuses: Record<string, string>;
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
}

export const dashboardCopy: Record<"bn" | "en", DashboardCopy> = {
  bn: {
    brandSubtitle: "কানেক্টেড ওএস প্যানেল",
    navHeading: "মেনু",
    nav: {
      overview: "ওভারভিউ",
      analytics: "অ্যানালিটিক্স",
      reports: "রিপোর্ট",
      users: "ইউজার",
      settings: "সেটিংস",
    },
    soon: "শীঘ্রই",
    backToSite: "মূল সাইটে ফিরুন",
    signOut: "লগআউট",
    signingOut: "লগআউট হচ্ছে…",
    refresh: "রিফ্রেশ",
    greeting: "স্বাগতম",
    greetingFallback: "স্বাগতম",
    subtitle: "আপনার ওয়ার্কস্পেসের সর্বশেষ অবস্থা এক নজরে।",
    clientSubtitle: "আপনার অ্যাকাউন্টের সারসংক্ষেপ এক নজরে।",
    roleLabel: "রোল",
    metricsHeading: "মূল সূচক",
    metricsHint: "আপনার অ্যাকাউন্ট ও প্রতিষ্ঠানের সারসংক্ষেপ",
    scopePersonal: "আপনি",
    scopeSite: "প্রতিষ্ঠান",
    activityHeading: "সাম্প্রতিক অ্যাক্টিভিটি",
    activityHint: "আপনার লগইন ও সেশন ইভেন্টের অডিট ট্রেইল",
    activityEmpty: "এখনো কোনো অ্যাক্টিভিটি রেকর্ড হয়নি।",
    profileHeading: "প্রোফাইল",
    profileHint: "ERP অ্যাকাউন্ট থেকে নেওয়া তথ্য",
    quickLinksHeading: "কুইক লিংক",
    quickLinksHint: "ERP ডেস্কে দ্রুত যান",
    quickLinksEmpty: "আপনার অ্যাকাউন্টে ডেস্ক অ্যাক্সেস নেই।",
    systemHeading: "সিস্টেম",
    systemApi: "API",
    systemVersion: "ভার্সন",
    systemServer: "সার্ভার",
    systemSession: "সেশন সময়সীমা",
    hoursSuffix: "ঘণ্টা",
    loadingTitle: "ড্যাশবোর্ড লোড হচ্ছে…",
    loadingHint: "ERP থেকে তথ্য আনা হচ্ছে।",
    errorTitle: "ড্যাশবোর্ড লোড করা যায়নি",
    retry: "আবার চেষ্টা করুন",
    stats: {
      roles: { label: "রোল", hint: "আপনার অ্যাকাউন্টে বরাদ্দ করা রোল" },
      signins: { label: "লগইন (৭ দিন)", hint: "আপনার অ্যাকাউন্টে রেকর্ড করা সফল লগইন" },
      sessions: { label: "সক্রিয় সেশন", hint: "এখন যেসব ডিভাইসে আপনার সেশন চালু আছে" },
      users: { label: "সক্রিয় ইউজার", hint: "এই সাইটে চালু থাকা ইউজার অ্যাকাউন্ট" },
      companies: { label: "প্রতিষ্ঠান", hint: "ERP-তে নিবন্ধিত প্রতিষ্ঠান" },
      customers: { label: "কাস্টমার", hint: "সক্রিয় কাস্টমার রেকর্ড" },
      items: { label: "আইটেম", hint: "সক্রিয় আইটেম মাস্টার রেকর্ড" },
      employees: { label: "কর্মী", hint: "বর্তমানে সক্রিয় কর্মী" },
      invoices: { label: "ইনভয়েস (৩০ দিন)", hint: "শেষ ৩০ দিনে সাবমিট করা ইনভয়েস" },
    },
    links: {
      desk: { label: "ERP ডেস্ক", description: "ERP ডেস্ক খুলুন" },
      users: { label: "ইউজার", description: "ইউজার অ্যাকাউন্ট দেখুন ও পরিচালনা করুন" },
      customers: { label: "কাস্টমার", description: "কাস্টমার মাস্টার রেকর্ড" },
      items: { label: "আইটেম", description: "আইটেম মাস্টার রেকর্ড" },
      invoices: { label: "সেলস ইনভয়েস", description: "সাবমিট করা ইনভয়েস" },
    },
    profileFields: {
      "Full Name": "পূর্ণ নাম",
      Email: "ইমেইল",
      Designation: "পদবি",
      Department: "বিভাগ",
      "Time Zone": "টাইম জোন",
      Language: "ভাষা",
      "Last Login": "সর্বশেষ লগইন",
    },
    events: {
      login_success: "সফল লগইন",
      login_failed: "ব্যর্থ লগইন চেষ্টা",
      logout: "লগআউট",
      session_probe: "সেশন যাচাই",
    },
    statuses: { Success: "সফল", Failed: "ব্যর্থ", Blocked: "ব্লকড" },
    justNow: "এইমাত্র",
    minutesAgo: (n) => `${n} মিনিট আগে`,
    hoursAgo: (n) => `${n} ঘণ্টা আগে`,
    daysAgo: (n) => `${n} দিন আগে`,
  },
  en: {
    brandSubtitle: "Connected OS panel",
    navHeading: "Menu",
    nav: {
      overview: "Overview",
      analytics: "Analytics",
      reports: "Reports",
      users: "Users",
      settings: "Settings",
    },
    soon: "Soon",
    backToSite: "Back to site",
    signOut: "Sign out",
    signingOut: "Signing out…",
    refresh: "Refresh",
    greeting: "Welcome back",
    greetingFallback: "Welcome",
    subtitle: "Here is the latest state of your workspace.",
    clientSubtitle: "A snapshot of your account.",
    roleLabel: "Role",
    metricsHeading: "Key metrics",
    metricsHint: "A summary of your account and your organisation",
    scopePersonal: "You",
    scopeSite: "Organisation",
    activityHeading: "Recent activity",
    activityHint: "Audit trail of your sign-ins and sessions",
    activityEmpty: "No activity recorded yet.",
    profileHeading: "Profile",
    profileHint: "Read from your ERP account",
    quickLinksHeading: "Quick links",
    quickLinksHint: "Jump into the ERP desk",
    quickLinksEmpty: "Your account has no desk access.",
    systemHeading: "System",
    systemApi: "API",
    systemVersion: "Version",
    systemServer: "Server",
    systemSession: "Session window",
    hoursSuffix: "hours",
    loadingTitle: "Loading your dashboard…",
    loadingHint: "Fetching the latest data from the ERP.",
    errorTitle: "The dashboard could not be loaded",
    retry: "Try again",
    stats: {
      roles: { label: "Roles", hint: "Roles assigned to your account" },
      signins: { label: "Sign-ins (7 days)", hint: "Successful sign-ins recorded for your account" },
      sessions: { label: "Active Sessions", hint: "Devices currently holding a session for you" },
      users: { label: "Active Users", hint: "Enabled user accounts on this site" },
      companies: { label: "Companies", hint: "Companies registered in the ERP" },
      customers: { label: "Customers", hint: "Active customer records" },
      items: { label: "Items", hint: "Active item master records" },
      employees: { label: "Employees", hint: "Employees currently active" },
      invoices: { label: "Invoices (30 days)", hint: "Submitted in the last 30 days" },
    },
    links: {},
    profileFields: {},
    events: {
      login_success: "Signed in",
      login_failed: "Failed sign-in attempt",
      logout: "Signed out",
      session_probe: "Session check",
    },
    statuses: { Success: "Success", Failed: "Failed", Blocked: "Blocked" },
    justNow: "just now",
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} h ago`,
    daysAgo: (n) => `${n} d ago`,
  },
};

export function dashboardCopyFor(language: string): DashboardCopy {
  return dashboardCopy[language === "en" ? "en" : "bn"];
}

/** Present a stat in the active language, keeping the API's label as fallback. */
export function localizeStat(stat: DashboardStat, copy: DashboardCopy): DashboardStat {
  const translated = copy.stats[stat.key];

  if (!translated) return stat;

  return { ...stat, label: translated.label, hint: translated.hint };
}

/** Frappe returns "YYYY-MM-DD HH:MM:SS.ffffff" in the site timezone. */
export function relativeTime(value: string, copy: DashboardCopy): string {
  if (!value) return "";

  const iso = value.replace(" ", "T").replace(/\.(\d{3})\d*$/, ".$1");
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) return value;

  const diffMinutes = Math.floor((Date.now() - parsed.getTime()) / 60_000);

  if (diffMinutes < 1) return copy.justNow;
  if (diffMinutes < 60) return copy.minutesAgo(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return copy.hoursAgo(diffHours);

  return copy.daysAgo(Math.floor(diffHours / 24));
}

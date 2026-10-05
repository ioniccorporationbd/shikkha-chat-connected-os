/** Bilingual copy for the portal dashboard. */

import type { DashboardStat } from "@/lib/auth/types";

export interface DashboardCopy {
  brandSubtitle: string;
  navHeading: string;
  nav: {
    overview: string;
    customers: string;
    checkin: string;
    expenseClaim: string;
    /** Customer-facing Payment History link (client scope only). */
    paymentHistory: string;
    /** Customer-facing Service Build (Sales Invoice) link (client scope only). */
    serviceBuild: string;
    /** Public support-centre link. Shown on BOTH panels for every role. */
    helpDesk: string;
    analytics: string;
    reports: string;
    users: string;
    settings: string;
  };
  soon: string;
  backToSite: string;
  /** Prominent "back to home" label for the sidebar action (item 3). */
  backHome: string;
  signOut: string;
  signingOut: string;
  refresh: string;
  greeting: string;
  greetingFallback: string;
  subtitle: string;
  /** Subtitle for the customer-facing `/clientDashboard` panel. */
  clientSubtitle: string;
  roleLabel: string;
  /** Label for the language selector in the rail footer. */
  languageLabel: string;
  /** Label for the login/username row in the profile card. */
  usernameLabel: string;
  /** Roles collapse control in the account summary. */
  moreRoles: (n: number) => string;
  lessRoles: string;
  /** Overview top profile card. */
  accountHeading: string;
  accountHint: string;
  /** Informational cards for the non-overview rail sections. */
  modulesHeading: string;
  modulesHint: string;
  sectionInfo: Record<string, { title: string; hint: string }>;
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
  openMenu: string;
  closeMenu: string;
  reloadDone: string;
  reloadFailed: string;
  /** Smart Reload — nothing changed (lightweight refresh) vs something did (hard reload). */
  reloadNoChanges: string;
  reloadChanged: string;
  /** Login history (redesigned from the account's sign-in audit trail). */
  loginHistoryHeading: string;
  loginHistoryHint: string;
  loginHistoryEmpty: string;
  seeMore: (n: number) => string;
  seeLess: string;
  /** Overview profile-image hover affordance. */
  changePhoto: string;
  /** Logout confirmation modal (opened by every Logout button). */
  logoutConfirmTitle: string;
  logoutConfirmMessage: string;
  logoutConfirmYes: string;
  logoutConfirmNo: string;
  logoutConfirmSigning: string;
  /** Check In / Out quick-access card on the overview. */
  checkinCardHint: string;
  /** Expense Claim quick-access card on the overview. */
  expenseClaimCardHint: string;
  openAction: string;
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
      customers: "কাস্টমার তৈরি করুন",
      checkin: "চেক ইন / আউট",
      expenseClaim: "এক্সপেন্স ক্লেম",
      paymentHistory: "পেমেন্ট ইতিহাস",
      serviceBuild: "সার্ভিস বিল্ড",
      helpDesk: "হেল্প ডেস্ক",
      analytics: "অ্যানালিটিক্স",
      reports: "রিপোর্ট",
      users: "ইউজার",
      settings: "সেটিংস",
    },
    soon: "শীঘ্রই",
    backToSite: "মূল সাইটে ফিরুন",
    backHome: "হোমে ফিরে যান",
    signOut: "লগআউট",
    signingOut: "লগআউট হচ্ছে…",
    refresh: "রিফ্রেশ",
    greeting: "স্বাগতম",
    greetingFallback: "স্বাগতম",
    subtitle: "আপনার ওয়ার্কস্পেসের সর্বশেষ অবস্থা এক নজরে।",
    clientSubtitle: "আপনার অ্যাকাউন্টের সারসংক্ষেপ এক নজরে।",
    roleLabel: "রোল",
    languageLabel: "ভাষা",
    usernameLabel: "ব্যবহারকারী নাম",
    moreRoles: (n) => `+${n} আরও`,
    lessRoles: "কম দেখান",
    accountHeading: "আপনার অ্যাকাউন্ট",
    accountHint: "প্রোফাইল ও অ্যাকাউন্ট-সংক্রান্ত দ্রুত অ্যাকশন",
    modulesHeading: "আপনার ওয়ার্কস্পেস",
    modulesHint: "ড্যাশবোর্ডের বাকি অংশগুলো এক নজরে",
    sectionInfo: {
      analytics: {
        title: "অ্যানালিটিক্স",
        hint: "আপনার অ্যাকাউন্ট-কেন্দ্রিক লগইন, সেশন ও রোল সক্রিয়তার ভিজ্যুয়াল সারসংক্ষেপ।",
      },
      reports: {
        title: "রিপোর্ট",
        hint: "আপনার অ্যাকাউন্ট ও প্রতিষ্ঠানের তথ্য থেকে তৈরি ডাউনলোডযোগ্য সামারি রিপোর্ট।",
      },
      users: {
        title: "ইউজার",
        hint: "ERP ডেস্কে ইউজার অ্যাকাউন্ট ব্যবস্থাপনা — ডেস্ক অ্যাক্সেসসহ স্টাফদের জন্য।",
      },
      settings: {
        title: "সেটিংস",
        hint: "অ্যাকাউন্ট, ভাষা ও সংযোগ-সংক্রান্ত প্রেফারেন্স এক জায়গায়।",
      },
    },
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
    openMenu: "মেনু খুলুন",
    closeMenu: "মেনু বন্ধ করুন",
    reloadDone: "ড্যাশবোর্ডের তথ্য হালনাগাদ হয়েছে।",
    reloadFailed: "রিফ্রেশ করা যায়নি। আবার চেষ্টা করুন।",
    reloadNoChanges: "কোনো নতুন পরিবর্তন নেই। তথ্য হালনাগাদ করা হয়েছে।",
    reloadChanged: "নতুন পরিবর্তন পাওয়া গেছে। ড্যাশবোর্ড পুনরায় লোড হচ্ছে।",
    loginHistoryHeading: "লগইন ইতিহাস",
    loginHistoryHint: "আপনার অ্যাকাউন্টে সাম্প্রতিক সাইন-ইন কার্যক্রম",
    loginHistoryEmpty: "এখনও কোনো লগইন ইতিহাস পাওয়া যায়নি।",
    seeMore: (n) => `আরও দেখুন (${n}টি)`,
    seeLess: "কম দেখুন",
    changePhoto: "ছবি পরিবর্তন করুন",
    logoutConfirmTitle: "লগ আউট",
    logoutConfirmMessage: "আপনি কি লগ আউট করতে চান?",
    logoutConfirmYes: "হ্যাঁ, লগ আউট করুন",
    logoutConfirmNo: "না",
    logoutConfirmSigning: "লগ আউট হচ্ছে…",
    checkinCardHint: "চেক ইন / আউট করুন এবং আপনার দৈনিক উপস্থিতি রেকর্ড করুন।",
    expenseClaimCardHint: "আপনার খরচের দাবি তৈরি করুন এবং বর্তমান অবস্থা দেখুন।",
    openAction: "খুলুন",
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
      Username: "ব্যবহারকারী নাম",
      Mobile: "মোবাইল",
      Email: "ইমেইল",
      Designation: "পদবি",
      Department: "বিভাগ",
      Location: "লোকেশন",
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
      customers: "Create Customer",
      checkin: "Check In / Out",
      expenseClaim: "Expense Claim",
      paymentHistory: "Payment History",
      serviceBuild: "Service Build",
      helpDesk: "Help Desk",
      analytics: "Analytics",
      reports: "Reports",
      users: "Users",
      settings: "Settings",
    },
    soon: "Soon",
    backToSite: "Back to site",
    backHome: "Back to home",
    signOut: "Sign out",
    signingOut: "Signing out…",
    refresh: "Refresh",
    greeting: "Welcome back",
    greetingFallback: "Welcome",
    subtitle: "Here is the latest state of your workspace.",
    clientSubtitle: "A snapshot of your account.",
    roleLabel: "Role",
    languageLabel: "Language",
    usernameLabel: "Username",
    moreRoles: (n) => `+${n} more`,
    lessRoles: "Show less",
    accountHeading: "Your account",
    accountHint: "Profile and account actions at a glance",
    modulesHeading: "Your workspace",
    modulesHint: "The rest of your dashboard at a glance",
    sectionInfo: {
      analytics: {
        title: "Analytics",
        hint: "A visual summary of your account-centric sign-ins, sessions and role activity.",
      },
      reports: {
        title: "Reports",
        hint: "Downloadable summary reports built from your account and organisation data.",
      },
      users: {
        title: "Users",
        hint: "User account management in the ERP desk — for staff with desk access.",
      },
      settings: {
        title: "Settings",
        hint: "Account, language and connection preferences in one place.",
      },
    },
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
    openMenu: "Open menu",
    closeMenu: "Close menu",
    reloadDone: "Dashboard data refreshed.",
    reloadFailed: "Could not refresh. Please try again.",
    reloadNoChanges: "No new changes. Data refreshed.",
    reloadChanged: "New changes found. Reloading the dashboard.",
    loginHistoryHeading: "Login History",
    loginHistoryHint: "Recent sign-in activity on your account",
    loginHistoryEmpty: "No login history yet.",
    seeMore: (n) => `See more (${n})`,
    seeLess: "See less",
    changePhoto: "Change photo",
    logoutConfirmTitle: "Log out",
    logoutConfirmMessage: "Are you sure you want to log out?",
    logoutConfirmYes: "Yes, log out",
    logoutConfirmNo: "No",
    logoutConfirmSigning: "Signing out…",
    checkinCardHint: "Check in or out and record your daily attendance.",
    expenseClaimCardHint: "Create your expense claims and track their current state.",
    openAction: "Open",
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

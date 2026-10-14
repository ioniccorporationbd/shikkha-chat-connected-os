/**
 * Connected OS — customer-facing feature showcase catalog.
 *
 * Purpose
 * -------
 * A single, typed, bilingual source of truth behind the "Explore Shikkha
 * Connected OS" rail rendered by `src/components/showcase/FeatureShowcase.tsx`.
 * It adapts the customer-facing showcase that was originally built inside
 * `shikkha_chat_apps` to Connected OS *without* copying routes that do not
 * exist here.
 *
 * Why the categories are AUDIENCE-based
 * -------------------------------------
 * Connected OS's own left rail already lists every hub section as a
 * collapsible, module-oriented group (Home Connections / Student Achievement /
 * Operational Excellence) via `getSidebarMenu()` in `LeftSidebar.tsx`. Simply
 * re-listing those same sections in a second accordion would duplicate the
 * navigation and read like a pasted-on app. Instead this showcase answers the
 * question a prospective customer actually asks — "what does Connected OS do
 * for *me*?" — by grouping real capabilities by the audience they serve
 * (schools, teachers, students, families) plus the connected staff/customer
 * workspaces. It complements the module nav instead of repeating it, and
 * directly serves the goal of helping school owners, administrators, teachers,
 * parents, NGOs and government stakeholders understand the platform.
 *
 * Design rules honoured by this file
 * ----------------------------------
 * • PURE data + pure helpers — no React, no `next/*`, safe to compile and unit
 *   test on its own (`tsc` / node).
 * • Every destination is REAL in Connected OS:
 *     – public features  → in-page section anchors (`#id`) that the homepage's
 *       scroll-locked engine already understands (`connected-os-scroll-to-section`).
 *     – protected tools  → existing dashboard routes only.
 * • No invented routes, no fabricated features. If a capability from the old
 *   showcase has no counterpart in Connected OS it is deliberately omitted
 *   (see the completion report) rather than linked to a dead URL.
 */

export type ShowcaseLanguage = "bn" | "en";

/** Which dashboard persona a protected tool belongs to ("any" = both). */
export type ShowcasePersona = "any" | "staff" | "client";

/** Public in-page anchors vs. gated dashboard routes. */
export type ShowcaseAccess = "public" | "protected";

/** Logical icon keys, mapped to concrete `react-icons/fi` glyphs in the view. */
export type ShowcaseIconKey =
  | "home"
  | "student"
  | "operational"
  | "tools"
  | "studentInformation"
  | "sis"
  | "enrollment"
  | "specialPrograms"
  | "familyEngagement"
  | "communications"
  | "attendance"
  | "classroom"
  | "lms"
  | "assessment"
  | "curriculum"
  | "intervention"
  | "mtss"
  | "behavior"
  | "cclr"
  | "naviance"
  | "resource"
  | "financial"
  | "erp"
  | "predictive"
  | "talent"
  | "recruiting"
  | "educator"
  | "helpDesk"
  | "payment"
  | "serviceBuild"
  | "expense"
  | "checkin"
  | "customer"
  | "dashboard";

export interface LocalizedText {
  readonly bn: string;
  readonly en: string;
}

export interface ShowcaseFeature {
  readonly id: string;
  readonly icon: ShowcaseIconKey;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  /** `#section-id` for public anchors, `/route` for protected tools. */
  readonly href: string;
  readonly access: ShowcaseAccess;
  /** Only meaningful for `protected` features. */
  readonly persona?: ShowcasePersona;
}

export interface ShowcaseCategory {
  readonly id: string;
  readonly icon: ShowcaseIconKey;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly features: readonly ShowcaseFeature[];
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const FEATURE_SHOWCASE_EYEBROW: LocalizedText = {
  bn: "ঘুরে দেখুন",
  en: "Explore",
};

export const FEATURE_SHOWCASE_HEADING: LocalizedText = {
  bn: "শিক্ষা চ্যাট সংযুক্ত ওএস ঘুরে দেখুন",
  en: "Explore Shikkha Connected OS",
};

export const FEATURE_SHOWCASE_SUBTITLE: LocalizedText = {
  bn: "স্মার্ট স্কুল ম্যানেজমেন্ট ও এআই-চালিত শিক্ষার আমাদের সংযুক্ত ইকোসিস্টেম আবিষ্কার করুন।",
  en: "Discover our connected ecosystem for smarter school management and AI-powered learning.",
};

/* ------------------------------------------------------------------ */
/* Catalog — grouped by who benefits                                   */
/* ------------------------------------------------------------------ */

export const FEATURE_SHOWCASE: readonly ShowcaseCategory[] = [
  {
    id: "for-schools",
    icon: "operational",
    title: { bn: "স্কুল ও প্রতিষ্ঠানের জন্য", en: "For Schools & Institutions" },
    description: {
      bn: "মালিক ও প্রশাসকের জন্য প্রতিষ্ঠান পরিচালনার মূল সক্ষমতা।",
      en: "Core capabilities for owners and administrators running an institution.",
    },
    features: [
      {
        id: "student-information",
        icon: "studentInformation",
        title: { bn: "শিক্ষার্থীর তথ্য", en: "Student Information" },
        description: {
          bn: "প্রতিটি শিক্ষার্থীর প্রোফাইল ও তথ্য এক জায়গায়।",
          en: "Every learner's profile and records in one place.",
        },
        href: "#student-information",
        access: "public",
      },
      {
        id: "sis",
        icon: "sis",
        title: { bn: "শিক্ষার্থী তথ্য ব্যবস্থা", en: "Student Information System" },
        description: {
          bn: "প্রতিটি শিক্ষার্থীর জন্য একটি নির্ভরযোগ্য রেকর্ড।",
          en: "A single, reliable record for every student.",
        },
        href: "#sis",
        access: "public",
      },
      {
        id: "enrollment",
        icon: "enrollment",
        title: { bn: "ভর্তি ব্যবস্থাপনা", en: "Enrollment Management" },
        description: {
          bn: "ভর্তি, শাখা ও প্রক্রিয়া সহজভাবে সামলান।",
          en: "Simplify admissions, sections and enrollment.",
        },
        href: "#enrollment",
        access: "public",
      },
      {
        id: "resource-planning",
        icon: "resource",
        title: { bn: "রিসোর্স পরিকল্পনা", en: "Resource Planning" },
        description: {
          bn: "কর্মী, সময় ও বাজেট সঠিকভাবে বণ্টন করুন।",
          en: "Allocate staff, time and budget wisely.",
        },
        href: "#resource-planning",
        access: "public",
      },
      {
        id: "financial-strategy",
        icon: "financial",
        title: { bn: "আর্থিক কৌশল ব্যবস্থাপনা", en: "Financial Strategy" },
        description: {
          bn: "বাজেট পরিকল্পনা ও ব্যয় নজরে রাখুন।",
          en: "Plan budgets and monitor spending.",
        },
        href: "#financial-strategy-allovue",
        access: "public",
      },
      {
        id: "erp-systems",
        icon: "erp",
        title: { bn: "ইআরপি সিস্টেম", en: "ERP Systems" },
        description: {
          bn: "অর্থ, মানবসম্পদ ও অপারেশন এক প্ল্যাটফর্মে।",
          en: "Connect finance, HR and operations.",
        },
        href: "#erp-systems",
        access: "public",
      },
      {
        id: "predictive-enrollment",
        icon: "predictive",
        title: { bn: "পূর্বাভাসভিত্তিক ভর্তি", en: "Predictive Enrollment" },
        description: {
          bn: "ভর্তি পূর্বাভাস দিয়ে সক্ষমতা পরিকল্পনা করুন।",
          en: "Forecast enrollment and plan capacity.",
        },
        href: "#predictive-enrollment",
        access: "public",
      },
      {
        id: "talent-management",
        icon: "talent",
        title: { bn: "প্রতিভা ব্যবস্থাপনা", en: "Talent Management" },
        description: {
          bn: "দক্ষ শিক্ষক গড়ে তুলুন ও ধরে রাখুন।",
          en: "Develop and keep great educators.",
        },
        href: "#talent-management",
        access: "public",
      },
      {
        id: "recruiting-hr",
        icon: "recruiting",
        title: { bn: "নিয়োগ ও মানবসম্পদ", en: "Recruiting & HR" },
        description: {
          bn: "নিয়োগ, অনবোর্ডিং ও ব্যবস্থাপনা এক জায়গায়।",
          en: "Hire, onboard and manage people.",
        },
        href: "#recruiting-and-hr",
        access: "public",
      },
    ],
  },
  {
    id: "for-teachers",
    icon: "classroom",
    title: { bn: "শিক্ষকদের জন্য", en: "For Teachers & Educators" },
    description: {
      bn: "শ্রেণিকক্ষে পাঠদান, শেখা ও মূল্যায়নের সহায়ক টুল।",
      en: "Teaching, learning and assessment tools for the classroom.",
    },
    features: [
      {
        id: "classroom-solutions",
        icon: "classroom",
        title: { bn: "শ্রেণিকক্ষ সমাধান", en: "Classroom Solutions" },
        description: {
          bn: "শ্রেণিকক্ষ পরিচালনার সহায়ক টুল।",
          en: "Tools that help teachers run the classroom.",
        },
        href: "#classroom-solutions",
        access: "public",
      },
      {
        id: "learning-management",
        icon: "lms",
        title: { bn: "লার্নিং ব্যবস্থাপনা", en: "Learning Management" },
        description: {
          bn: "পাঠ, উপকরণ ও কার্যক্রম অনলাইনে দিন।",
          en: "Deliver lessons, materials and activities online.",
        },
        href: "#learning-management-schoology",
        access: "public",
      },
      {
        id: "curriculum-instruction",
        icon: "curriculum",
        title: { bn: "কারিকুলাম ও পাঠদান", en: "Curriculum & Instruction" },
        description: {
          bn: "সুসংগত কারিকুলাম পরিকল্পনা ও পাঠদান।",
          en: "Plan and deliver a consistent curriculum.",
        },
        href: "#curriculum-instruction",
        access: "public",
      },
      {
        id: "assessment-performance",
        icon: "assessment",
        title: { bn: "মূল্যায়ন ও পারফরম্যান্স", en: "Assessment & Performance" },
        description: {
          bn: "শিক্ষার অগ্রগতি মাপুন ও প্রবণতা দেখুন।",
          en: "Measure learning and spot trends.",
        },
        href: "#assessment-performance-matters",
        access: "public",
      },
      {
        id: "educator-support",
        icon: "educator",
        title: { bn: "শিক্ষক সহায়তা", en: "Educator Support" },
        description: {
          bn: "শিক্ষকদের প্রশিক্ষণ ও সহায়ক টুল দিন।",
          en: "Equip teachers with training and tools.",
        },
        href: "#educator-support",
        access: "public",
      },
    ],
  },
  {
    id: "for-students",
    icon: "student",
    title: { bn: "শিক্ষার্থী সহায়তা", en: "Student Support" },
    description: {
      bn: "প্রতিটি শিক্ষার্থীর সাফল্যের জন্য সহায়তা।",
      en: "Support for every learner's success.",
    },
    features: [
      {
        id: "special-programs",
        icon: "specialPrograms",
        title: { bn: "বিশেষ কার্যক্রম", en: "Special Programs" },
        description: {
          bn: "শিক্ষার্থীদের প্রয়োজনীয় কার্যক্রম সমন্বয় করুন।",
          en: "Coordinate the programs students rely on.",
        },
        href: "#special-programs",
        access: "public",
      },
      {
        id: "student-intervention",
        icon: "intervention",
        title: { bn: "শিক্ষার্থী সহায়তা", en: "Student Intervention" },
        description: {
          bn: "সহায়তা প্রয়োজন এমন শিক্ষার্থী চিহ্নিত করুন।",
          en: "Spot and support students who need help.",
        },
        href: "#student-intervention",
        access: "public",
      },
      {
        id: "mtss",
        icon: "mtss",
        title: { bn: "বহুস্তরীয় সহায়তা", en: "Multi-Tiered Supports" },
        description: {
          bn: "স্তরভিত্তিক একাডেমিক ও আচরণগত সহায়তা।",
          en: "Coordinate tiered academic and behavioral support.",
        },
        href: "#mtss",
        access: "public",
      },
      {
        id: "behavior-support",
        icon: "behavior",
        title: { bn: "আচরণগত সহায়তা", en: "Behavior Support" },
        description: {
          bn: "সুনির্দিষ্ট কাঠামোয় ইতিবাচক আচরণ উৎসাহিত করুন।",
          en: "Encourage positive behavior with structure.",
        },
        href: "#behavior-support",
        access: "public",
      },
      {
        id: "college-career-readiness",
        icon: "cclr",
        title: { bn: "কলেজ, ক্যারিয়ার ও জীবন প্রস্তুতি", en: "College, Career & Life Readiness" },
        description: {
          bn: "স্কুলের পরে জীবনের জন্য প্রস্তুত করুন।",
          en: "Prepare students for life after school.",
        },
        href: "#college-career-life-readiness",
        access: "public",
      },
      {
        id: "career-guidance",
        icon: "naviance",
        title: { bn: "ক্যারিয়ার ও জীবন নির্দেশনা", en: "Career & Life Guidance" },
        description: {
          bn: "পরিকল্পনা টুল দিয়ে শিক্ষার্থীর পথ নির্দেশ করুন।",
          en: "Guide student choices with planning tools.",
        },
        href: "#cclr-naviance",
        access: "public",
      },
    ],
  },
  {
    id: "for-families",
    icon: "familyEngagement",
    title: { bn: "পরিবার ও যোগাযোগ", en: "Families & Communication" },
    description: {
      bn: "পরিবারকে সম্পৃক্ত রাখুন ও স্পষ্ট তথ্য দিন।",
      en: "Keep families engaged and clearly informed.",
    },
    features: [
      {
        id: "family-engagement",
        icon: "familyEngagement",
        title: { bn: "পরিবারের সম্পৃক্ততা", en: "Family Engagement" },
        description: {
          bn: "পরিবারকে তথ্য দিয়ে সম্পৃক্ত রাখুন।",
          en: "Keep families informed and involved.",
        },
        href: "#family-engagement",
        access: "public",
      },
      {
        id: "communications",
        icon: "communications",
        title: { bn: "যোগাযোগ ব্যবস্থা", en: "Communications" },
        description: {
          bn: "কর্মী, শিক্ষার্থী ও পরিবারে স্পষ্ট বার্তা পাঠান।",
          en: "Reach staff, students and families clearly.",
        },
        href: "#communications",
        access: "public",
      },
      {
        id: "attendance-support",
        icon: "attendance",
        title: { bn: "উপস্থিতি সহায়তা", en: "Attendance Support" },
        description: {
          bn: "উপস্থিতি দেখুন ও আগেভাগে ব্যবস্থা নিন।",
          en: "Track attendance and act early.",
        },
        href: "#attendance-support",
        access: "public",
      },
    ],
  },
  {
    id: "connected-tools",
    icon: "tools",
    title: { bn: "সংযুক্ত কর্মক্ষেত্র", en: "Connected Workspaces" },
    description: {
      bn: "কর্মী ও গ্রাহকের দৈনন্দিন কর্মক্ষেত্র। খুলতে সাইন ইন করুন।",
      en: "Everyday workspaces for staff and customers. Sign in to open.",
    },
    features: [
      {
        id: "help-desk",
        icon: "helpDesk",
        title: { bn: "হেল্প ডেস্ক", en: "Help Desk" },
        description: {
          bn: "সাপোর্ট টিকেট তৈরি করুন ও ট্র্যাক করুন।",
          en: "Raise and track support tickets.",
        },
        href: "/help-desk",
        access: "protected",
        persona: "any",
      },
      {
        id: "payment-entry",
        icon: "payment",
        title: { bn: "পেমেন্ট এন্ট্রি", en: "Payment Entry" },
        description: {
          bn: "আপনার অ্যাকাউন্টে পেমেন্ট রেকর্ড ও পর্যালোচনা।",
          en: "Record and review payments on your account.",
        },
        href: "/clientDashboard/payment-entry",
        access: "protected",
        persona: "client",
      },
      {
        id: "service-build",
        icon: "serviceBuild",
        title: { bn: "সার্ভিস বিল্ড", en: "Service Build" },
        description: {
          bn: "আপনার জন্য তৈরি সেবা অনুরোধ ও ব্যবস্থাপনা।",
          en: "Request and manage a bespoke service.",
        },
        href: "/clientDashboard/service-build",
        access: "protected",
        persona: "client",
      },
      {
        id: "expense-claim",
        icon: "expense",
        title: { bn: "খরচের দাবি", en: "Expense Claim" },
        description: {
          bn: "খরচের দাবি জমা দিন ও ট্র্যাক করুন।",
          en: "Submit and track reimbursement claims.",
        },
        href: "/userDashboard/expense-claim",
        access: "protected",
        persona: "staff",
      },
      {
        id: "check-in-out",
        icon: "checkin",
        title: { bn: "চেক ইন / আউট", en: "Check In / Out" },
        description: {
          bn: "কর্মী ও টিমের দৈনিক উপস্থিতি চিহ্নিত করুন।",
          en: "Mark daily attendance for staff and teams.",
        },
        href: "/userDashboard/check-in-out",
        access: "protected",
        persona: "staff",
      },
      {
        id: "create-customer",
        icon: "customer",
        title: { bn: "গ্রাহক তৈরি", en: "Create Customer" },
        description: {
          bn: "কয়েক সেকেন্ডে নতুন গ্রাহক নিবন্ধন করুন।",
          en: "Register new customers in seconds.",
        },
        href: "/userDashboard/create-customer",
        access: "protected",
        persona: "staff",
      },
    ],
  },
];

export const FEATURE_SHOWCASE_CATEGORY_COUNT = FEATURE_SHOWCASE.length;

export const FEATURE_SHOWCASE_FEATURE_COUNT = FEATURE_SHOWCASE.reduce(
  (total, category) => total + category.features.length,
  0,
);

/* ------------------------------------------------------------------ */
/* Pure link-resolution helpers (browser-free, unit-testable)          */
/* ------------------------------------------------------------------ */

export interface ShowcaseResolveContext {
  status: "loading" | "authenticated" | "guest";
  /** The visitor's own dashboard persona. */
  persona: ShowcasePersona;
  /** Where an unauthenticated click should go (login). */
  loginHref: string;
  /** Where an authenticated-but-mismatched click should go. */
  dashboardHref: string;
}

/** True when a protected feature is gated behind sign-in for this visitor. */
export function isShowcaseLinkLocked(
  feature: ShowcaseFeature,
  context: Pick<ShowcaseResolveContext, "status">,
): boolean {
  return feature.access === "protected" && context.status !== "authenticated";
}

/**
 * Resolve the effective destination for a feature:
 * • public  → its anchor, always.
 * • protected + guest/loading → the login route (never a protected dashboard).
 * • protected + authed + persona mismatch → the visitor's own dashboard.
 * • protected + authed + persona match → the real tool route.
 */
export function resolveShowcaseHref(
  feature: ShowcaseFeature,
  context: ShowcaseResolveContext,
): string {
  if (feature.access === "public") return feature.href;

  if (context.status !== "authenticated") return context.loginHref;

  const persona = feature.persona ?? "any";
  if (persona !== "any" && persona !== context.persona) {
    return context.dashboardHref;
  }

  return feature.href;
}

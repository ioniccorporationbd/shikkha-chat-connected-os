/**
 * Connected OS — "Explore Shikkha Connected OS" feature showcase catalog.
 *
 * This is a PORT of the customer-facing showcase that lives in the separate
 * `shikkha_chat_apps` project (source commit 72ae624, branch
 * feature/customer-project-showcase-sidebar). It carries the COMPLETE, verified
 * Shikkha Chat Apps route catalog — 15 categories / 87 feature entries — into
 * the Connected OS homepage sidebar so prospective customers can understand the
 * whole platform from one place.
 *
 * Route policy (IMPORTANT — read before editing)
 * -----------------------------------------------
 * Shikkha Chat Apps and Shikkha Chat Connected OS are SEPARATE applications.
 * The 87 routes below belong to the source app; they do NOT exist inside
 * Connected OS. Copying a route string such as `/dashboard/admin/students` into
 * a Connected OS `<Link>` would produce a 404. Therefore:
 *
 *   • every `route` value is kept as INFORMATIONAL METADATA (shown in the
 *     feature-detail view), never used to build a local `href`;
 *   • the showcase opens an inline feature-detail panel instead of navigating;
 *   • no feature links to a nonexistent Connected OS page, and no source-app URL
 *     is fabricated (no verified public deployment URL is assumed).
 *
 * To keep a feature navigable in the future, add an `href` to it AND only after a
 * destination has been verified — the view only renders an anchor when `href` is
 * present. Until then the metadata + description satisfy the "customer
 * understanding over forced navigation" requirement.
 *
 * Data fidelity: category names, category order, feature order, titles,
 * descriptions (bn + en), routes, icons, roles/access and per-feature
 * availability are preserved from the source catalog unchanged.
 */

export type ShowcaseLanguage = "bn" | "en";

export type LocalizedText = { readonly bn: string; readonly en: string };

/** Logical icon keys — mapped to concrete `react-icons/fi` glyphs in the view. */
export type ShowcaseIconKey =
  | "school"
  | "sparkles"
  | "graduation"
  | "parents"
  | "shield"
  | "landmark"
  | "globe"
  | "layout"
  | "users"
  | "userCheck"
  | "calendar"
  | "clipboard"
  | "chart"
  | "book"
  | "brain"
  | "notebook"
  | "quiz"
  | "target"
  | "messages"
  | "insight"
  | "shieldAlert"
  | "policy"
  | "history"
  | "building"
  | "outcome"
  | "district"
  | "equity"
  | "enrollment"
  | "home"
  | "notice"
  | "syllabus"
  | "homework"
  | "fees"
  | "gallery"
  | "facility"
  | "contact"
  | "admission"
  | "info";

/** Dashboard roles used by the source app (mirrors its AppRole union). */
export type ShowcaseRole =
  | "admin"
  | "teacher"
  | "parent"
  | "content-reviewer"
  | "ai-safety-reviewer"
  | "ngo-admin"
  | "government-officer";

export type ShowcaseAccessKind = "public" | "any-role" | "role";

export type ShowcaseAccess =
  | { readonly kind: "public" }
  | { readonly kind: "any-role" }
  | { readonly kind: "role"; readonly roles: readonly ShowcaseRole[] };

/** Per-feature availability flag ("live" | "demo"), as in the source. */
export type ShowcaseStatus = "live" | "demo";

export type ShowcaseFeature = {
  readonly id: string;
  readonly icon: ShowcaseIconKey;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  /** Source-app route — INFORMATIONAL METADATA only (may contain "{role}"). */
  readonly route: string;
  readonly access: ShowcaseAccess;
  readonly availability?: ShowcaseStatus;
  /** Optional VERIFIED destination. Present only when a real URL is confirmed. */
  readonly href?: string;
};

export type ShowcaseCategory = {
  readonly id: string;
  readonly icon: ShowcaseIconKey;
  readonly title: LocalizedText;
  readonly features: readonly ShowcaseFeature[];
};

/* ------------------------------------------------------------------ */
/* Access helpers (identical to the source access model)               */
/* ------------------------------------------------------------------ */

const ADMIN: ShowcaseAccess = { kind: "role", roles: ["admin"] };
const TEACHER: ShowcaseAccess = { kind: "role", roles: ["teacher"] };
const PARENT: ShowcaseAccess = { kind: "role", roles: ["parent"] };
const CONTENT_REVIEWER: ShowcaseAccess = { kind: "role", roles: ["content-reviewer"] };
const AI_SAFETY: ShowcaseAccess = { kind: "role", roles: ["ai-safety-reviewer"] };
const NGO: ShowcaseAccess = { kind: "role", roles: ["ngo-admin"] };
const GOV: ShowcaseAccess = { kind: "role", roles: ["government-officer"] };
const OVERSIGHT: ShowcaseAccess = {
  kind: "role",
  roles: ["ngo-admin", "government-officer"],
};
const PUBLIC: ShowcaseAccess = { kind: "public" };
const ANY_ROLE: ShowcaseAccess = { kind: "any-role" };

const roleLessons = "/dashboard/{role}/ai-pathshala/lessons";
const roleAiTutor = "/dashboard/{role}/ai-pathshala/ai-tutor";
const roleLessonPlanner = "/dashboard/{role}/ai-pathshala/lesson-planner";
const roleQuizzes = "/dashboard/{role}/ai-pathshala/quizzes";
const roleAssessments = "/dashboard/{role}/ai-pathshala/assessments";
const roleProgress = "/dashboard/{role}/ai-pathshala/progress";
const roleStudyPlan = "/dashboard/{role}/ai-pathshala/study-plan";

/* ------------------------------------------------------------------ */
/* Localized copy (chrome + detail-view labels + role names)           */
/* ------------------------------------------------------------------ */

export const SHOWCASE_TEXT = {
  eyebrow: { bn: "প্ল্যাটফর্ম ট্যুর", en: "Platform tour" },
  heading: {
    bn: "Shikkha Connected OS অন্বেষণ করুন",
    en: "Explore Shikkha Connected OS",
  },
  subtitle: {
    bn: "একটি সংযুক্ত প্ল্যাটফর্ম কীভাবে স্কুল ব্যবস্থাপনা, এআই শিক্ষা, শিক্ষক, শিক্ষার্থী ও অভিভাবকদের একসাথে আনতে পারে তা জানুন।",
    en: "Discover how one connected platform brings school administration, AI learning, teachers, students and parents together.",
  },
  catalogNote: {
    bn: "Shikkha Chat Apps প্ল্যাটফর্মের সম্পূর্ণ বৈশিষ্ট্য-তালিকা। প্রতিটি বৈশিষ্ট্য দেখতে ট্যাপ করুন।",
    en: "The complete feature catalog of the Shikkha Chat Apps platform. Tap any feature to learn more.",
  },
  searchPlaceholder: { bn: "বৈশিষ্ট্য খুঁজুন…", en: "Search features…" },
  searchClear: { bn: "খোঁজ মুছুন", en: "Clear search" },
  noResults: { bn: "কোনো বৈশিষ্ট্য মেলেনি।", en: "No matching features." },
  whoCanUse: { bn: "কাদের জন্য", en: "Who can use" },
  sourceRoute: { bn: "সোর্স রুট", en: "Source route" },
  statusLabel: { bn: "স্ট্যাটাস", en: "Status" },
  statusPublic: { bn: "ওপেন পেজ", en: "Open page" },
  statusProtected: { bn: "সুরক্ষিত ড্যাশবোর্ড", en: "Protected dashboard" },
  statusDemo: { bn: "ডেমো", en: "Demo" },
  infoNote: {
    bn: "এই বৈশিষ্ট্যগুলো Shikkha Chat Apps অ্যাপে চলে; এখানে ক্রেতাদের সুবিধার জন্য তথ্য আকারে দেখানো হয়েছে।",
    en: "These features run in the Shikkha Chat Apps application; shown here as information for customers.",
  },
  rolePublic: { bn: "সবার জন্য উন্মুক্ত", en: "Everyone" },
  roleAnyRole: { bn: "লগইন করা যেকোনো ব্যবহারকারী", en: "Any signed-in user" },
  roleAdmin: { bn: "স্কুল অ্যাডমিনিস্ট্রেটর", en: "School Administrator" },
  roleTeacher: { bn: "শিক্ষক", en: "Teacher" },
  roleParent: { bn: "অভিভাবক / গার্ডিয়ান", en: "Parent / Guardian" },
  roleContentReviewer: { bn: "কনটেন্ট রিভিউয়ার", en: "Content Reviewer" },
  roleAiSafety: { bn: "এআই নিরাপত্তা রিভিউয়ার", en: "AI Safety Reviewer" },
  roleNgo: { bn: "এনজিও অ্যাডমিন", en: "NGO Administrator" },
  roleGov: { bn: "সরকারি কর্মকর্তা", en: "Government Officer" },
} as const;

/** Localized label for a single dashboard role. */
export function showcaseRoleName(role: ShowcaseRole, language: ShowcaseLanguage): string {
  switch (role) {
    case "admin":
      return SHOWCASE_TEXT.roleAdmin[language];
    case "teacher":
      return SHOWCASE_TEXT.roleTeacher[language];
    case "parent":
      return SHOWCASE_TEXT.roleParent[language];
    case "content-reviewer":
      return SHOWCASE_TEXT.roleContentReviewer[language];
    case "ai-safety-reviewer":
      return SHOWCASE_TEXT.roleAiSafety[language];
    case "ngo-admin":
      return SHOWCASE_TEXT.roleNgo[language];
    case "government-officer":
      return SHOWCASE_TEXT.roleGov[language];
  }
}

/** Localized "who can use" summary for a feature's access model. */
export function showcaseAccessLabel(
  access: ShowcaseAccess,
  language: ShowcaseLanguage,
): string {
  if (access.kind === "public") return SHOWCASE_TEXT.rolePublic[language];
  if (access.kind === "any-role") return SHOWCASE_TEXT.roleAnyRole[language];
  return access.roles.map((role) => showcaseRoleName(role, language)).join(", ");
}

/** Localized status label (protected dashboard vs open page, + demo). */
export function showcaseStatusLabel(
  feature: ShowcaseFeature,
  language: ShowcaseLanguage,
): string {
  if (feature.availability === "demo") return SHOWCASE_TEXT.statusDemo[language];
  return feature.access.kind === "public"
    ? SHOWCASE_TEXT.statusPublic[language]
    : SHOWCASE_TEXT.statusProtected[language];
}

/* ------------------------------------------------------------------ */
/* Catalog — 15 categories / 87 features (source order preserved)      */
/* ------------------------------------------------------------------ */

export const FEATURE_SHOWCASE: readonly ShowcaseCategory[] = [
  {
    id: "school-management",
    icon: "school",
    title: { bn: "স্কুল ও প্রতিষ্ঠান ব্যবস্থাপনা", en: "School & Institution Management" },
    features: [
      {
        id: "admin-dashboard",
        icon: "layout",
        title: { bn: "অ্যাডমিন ড্যাশবোর্ড", en: "Admin Dashboard" },
        description: {
          bn: "প্রতিষ্ঠানের সার্বিক কার্যক্রমের কেন্দ্রীয় ওভারভিউ ও নিয়ন্ত্রণ প্যানেল।",
          en: "Central overview of institution activity and administration.",
        },
        route: "/dashboard/admin",
        access: ADMIN,
      },
      {
        id: "student-management",
        icon: "users",
        title: { bn: "শিক্ষার্থী ব্যবস্থাপনা", en: "Student Management" },
        description: {
          bn: "শিক্ষার্থীর তথ্য, একাডেমিক রেকর্ড ও ভর্তি সংক্রান্ত কাজ এক জায়গায়।",
          en: "Organise student information, academic records and admissions.",
        },
        route: "/dashboard/admin/students",
        access: ADMIN,
      },
      {
        id: "teacher-management",
        icon: "userCheck",
        title: { bn: "শিক্ষক ব্যবস্থাপনা", en: "Teacher Management" },
        description: {
          bn: "শিক্ষকদের তথ্য ও একাডেমিক দায়িত্ব সংগঠিতভাবে পরিচালনা করুন।",
          en: "Manage teaching staff and their academic responsibilities.",
        },
        route: "/dashboard/admin/teachers",
        access: ADMIN,
      },
      {
        id: "teacher-class-assignments",
        icon: "clipboard",
        title: { bn: "শিক্ষক ক্লাস অ্যাসাইনমেন্ট", en: "Teacher Class Assignments" },
        description: {
          bn: "শিক্ষকদের সাথে শ্রেণি ও বিষয়ের দায়িত্ব যুক্ত করুন।",
          en: "Assign teachers to classes and subjects.",
        },
        route: "/dashboard/admin/teacher-class-assignments",
        access: ADMIN,
      },
      {
        id: "classes-sections",
        icon: "school",
        title: { bn: "শ্রেণি ও শাখা", en: "Classes & Sections" },
        description: {
          bn: "শ্রেণি, গ্রুপ ও শাখা সহজে তৈরি করুন ও পরিচালনা করুন।",
          en: "Manage classes, groups and sections in one place.",
        },
        route: "/dashboard/admin/classes",
        access: ADMIN,
      },
      {
        id: "attendance-overview",
        icon: "calendar",
        title: { bn: "উপস্থিতি ব্যবস্থাপনা", en: "Attendance Management" },
        description: {
          bn: "শিক্ষার্থীদের উপস্থিতির তথ্য দেখুন ও রেকর্ড পরিচালনা করুন।",
          en: "Access and manage student attendance records.",
        },
        route: "/dashboard/admin/attendance",
        access: ADMIN,
      },
      {
        id: "academic-calendar",
        icon: "calendar",
        title: { bn: "একাডেমিক ক্যালেন্ডার", en: "Academic Calendar" },
        description: {
          bn: "সেশনের গুরুত্বপূর্ণ তারিখ ও একাডেমিক সময়সূচি সাজান।",
          en: "Organise academic schedules and key session dates.",
        },
        route: "/dashboard/admin/academic-calendar",
        access: ADMIN,
      },
      {
        id: "curriculum-subjects",
        icon: "syllabus",
        title: { bn: "কারিকুলাম ও বিষয়", en: "Curriculum & Subjects" },
        description: {
          bn: "কোর্স, বিষয় ও পাঠ্যক্রমের রেকর্ড দেখুন ও পরিচালনা করুন।",
          en: "Access courses, subjects and curriculum records.",
        },
        route: "/dashboard/admin/curriculum",
        access: ADMIN,
      },
      {
        id: "school-analytics",
        icon: "chart",
        title: { bn: "স্কুল অ্যানালিটিক্স", en: "School Analytics" },
        description: {
          bn: "প্রতিষ্ঠানের পারফরম্যান্স সূচক দেখে সিদ্ধান্ত নিন।",
          en: "Understand institutional activity through dashboard metrics.",
        },
        route: "/dashboard/admin/analytics",
        access: ADMIN,
      },
    ],
  },
  {
    id: "ai-pathshala",
    icon: "sparkles",
    title: { bn: "এআই শিক্ষা — এআই পাঠশালা", en: "AI-Powered Learning — AI Pathshala" },
    features: [
      {
        id: "ai-tutor",
        icon: "brain",
        title: { bn: "এআই টিউটর", en: "AI Tutor" },
        description: {
          bn: "বিষয়ভিত্তিক ধাপে ধাপে ব্যাখ্যা ও ইন্টারঅ্যাকটিভ শেখার সহায়তা।",
          en: "Guided explanations and interactive learning assistance.",
        },
        route: roleAiTutor,
        access: ANY_ROLE,
      },
      {
        id: "smart-lessons",
        icon: "book",
        title: { bn: "স্মার্ট লেসন", en: "Smart Lessons" },
        description: {
          bn: "প্রকাশিত শেখার উপকরণ ও পাঠ সহজে অ্যাক্সেস করুন।",
          en: "Access published learning materials and lessons.",
        },
        route: roleLessons,
        access: ANY_ROLE,
      },
      {
        id: "lesson-planner",
        icon: "notebook",
        title: { bn: "লেসন প্ল্যানার", en: "Lesson Planner" },
        description: {
          bn: "পাঠ ও শিক্ষা উপকরণ পরিকল্পনা করে সংগঠিতভাবে সাজান।",
          en: "Organise lessons and teaching materials with ease.",
        },
        route: roleLessonPlanner,
        access: ANY_ROLE,
      },
      {
        id: "online-quizzes",
        icon: "quiz",
        title: { bn: "অনলাইন কুইজ", en: "Online Quizzes" },
        description: {
          bn: "উপলব্ধ কুইজ ও হোমওয়ার্কে অংশ নিন ও অনুশীলন করুন।",
          en: "Participate in available quizzes and homework.",
        },
        route: roleQuizzes,
        access: ANY_ROLE,
      },
      {
        id: "assessments",
        icon: "clipboard",
        title: { bn: "মূল্যায়ন", en: "Assessments" },
        description: {
          bn: "মূল্যায়নের ফলাফল ও ফিডব্যাক পর্যালোচনা করুন।",
          en: "Review assessment outcomes and feedback.",
        },
        route: roleAssessments,
        access: ANY_ROLE,
      },
      {
        id: "learning-progress",
        icon: "insight",
        title: { bn: "শেখার অগ্রগতি", en: "Learning Progress" },
        description: {
          bn: "বিষয়ভিত্তিক শেখার অগ্রগতি অনুসরণ করুন।",
          en: "Follow subject-based learning development.",
        },
        route: roleProgress,
        access: ANY_ROLE,
      },
      {
        id: "study-plan",
        icon: "target",
        title: { bn: "ব্যক্তিগত পড়ার পরিকল্পনা", en: "Personalised Study Plan" },
        description: {
          bn: "প্রস্তাবিত শেখার কার্যক্রম ও পড়ার পরিকল্পনা দেখুন।",
          en: "Explore recommended learning activities and plans.",
        },
        route: roleStudyPlan,
        access: ANY_ROLE,
      },
    ],
  },
  {
    id: "teacher-tools",
    icon: "graduation",
    title: { bn: "শিক্ষক টুলস", en: "Teacher Tools" },
    features: [
      {
        id: "teacher-dashboard",
        icon: "layout",
        title: { bn: "শিক্ষক ড্যাশবোর্ড", en: "Teacher Dashboard" },
        description: {
          bn: "শ্রেণি, শিক্ষার্থী ও দৈনন্দিন ক্লাসের কাজের কেন্দ্রীয় প্যানেল।",
          en: "Central panel for classes, students and daily teaching work.",
        },
        route: "/dashboard/teacher",
        access: TEACHER,
      },
      {
        id: "assigned-students",
        icon: "users",
        title: { bn: "নির্ধারিত শিক্ষার্থী", en: "Assigned Students" },
        description: {
          bn: "আপনার শ্রেণির শিক্ষার্থীদের তালিকা ও তথ্য একসাথে দেখুন।",
          en: "View the students assigned to your classes.",
        },
        route: "/dashboard/teacher/students",
        access: TEACHER,
      },
      {
        id: "class-attendance",
        icon: "calendar",
        title: { bn: "ক্লাস উপস্থিতি", en: "Class Attendance" },
        description: {
          bn: "শ্রেণিভিত্তিক উপস্থিতি রেকর্ড করুন ও পর্যালোচনা করুন।",
          en: "Record and review class-wise attendance.",
        },
        route: "/dashboard/teacher/attendance",
        access: TEACHER,
      },
      {
        id: "teaching-analytics",
        icon: "chart",
        title: { bn: "শিক্ষণ অ্যানালিটিক্স", en: "Teaching Analytics" },
        description: {
          bn: "শেখানোর কার্যক্রম ও শ্রেণির পারফরম্যান্স বিশ্লেষণ করুন।",
          en: "Analyse teaching activity and class performance.",
        },
        route: "/dashboard/teacher/analytics",
        access: TEACHER,
      },
      {
        id: "teaching-assignments",
        icon: "clipboard",
        title: { bn: "ক্লাস অ্যাসাইনমেন্ট", en: "Teaching Assignments" },
        description: {
          bn: "শিক্ষক-শ্রেণি নির্ধারণ ও বিষয়ভিত্তিক দায়িত্ব ব্যবস্থাপনা।",
          en: "Manage teacher-class assignments and subject duties.",
        },
        route: "/dashboard/teacher/ai-pathshala/assignments",
        access: TEACHER,
      },
      {
        id: "lesson-content",
        icon: "book",
        title: { bn: "লেসন কনটেন্ট", en: "Lesson Content Management" },
        description: {
          bn: "পাঠের কনটেন্ট তৈরি, সংগঠিত ও প্রকাশ করুন।",
          en: "Create, organise and publish lesson content.",
        },
        route: "/dashboard/teacher/ai-pathshala/content",
        access: TEACHER,
      },
      {
        id: "tutor-dataset",
        icon: "brain",
        title: { bn: "এআই টিউটর ডেটাসেট", en: "AI Tutor Dataset Management" },
        description: {
          bn: "এআই টিউটরের জন্য শেখার ডেটাসেট ব্যবস্থাপনা করুন।",
          en: "Manage the datasets that power the AI tutor.",
        },
        route: "/dashboard/teacher/ai-pathshala/tutor-dataset",
        access: TEACHER,
      },
      {
        id: "interventions",
        icon: "target",
        title: { bn: "শেখার হস্তক্ষেপ", en: "Student Learning Interventions" },
        description: {
          bn: "প্রয়োজনীয় শিক্ষার্থীদের জন্য হস্তক্ষেপ পরিকল্পনা সাজান।",
          en: "Plan interventions to support students who need help.",
        },
        route: "/dashboard/teacher/ai-pathshala/interventions",
        access: TEACHER,
      },
    ],
  },
  {
    id: "parent-portal",
    icon: "parents",
    title: { bn: "অভিভাবক ও গার্ডিয়ান পোর্টাল", en: "Parent & Guardian Portal" },
    features: [
      {
        id: "parent-dashboard",
        icon: "layout",
        title: { bn: "অভিভাবক ড্যাশবোর্ড", en: "Parent Dashboard" },
        description: {
          bn: "সন্তানের শিক্ষা ও কার্যক্রমের কেন্দ্রীয় ওভারভিউ।",
          en: "A central overview of your child's education and activity.",
        },
        route: "/dashboard/parent",
        access: PARENT,
      },
      {
        id: "children",
        icon: "graduation",
        title: { bn: "সন্তানের তালিকা", en: "Children" },
        description: {
          bn: "আপনার সন্তানদের তালিকা ও তাদের তথ্য এক জায়গায়।",
          en: "See all your children and their details in one place.",
        },
        route: "/dashboard/parent/children",
        access: PARENT,
      },
      {
        id: "link-child",
        icon: "userCheck",
        title: { bn: "সন্তান সংযুক্ত করুন", en: "Child Linking" },
        description: {
          bn: "সন্তানের অ্যাকাউন্ট ও তথ্য আপনার প্রোফাইলে যুক্ত করুন।",
          en: "Connect your child's record to your own account.",
        },
        route: "/dashboard/parent/link-child",
        access: PARENT,
      },
      {
        id: "attendance-tracking",
        icon: "calendar",
        title: { bn: "উপস্থিতি ট্র্যাকিং", en: "Student Attendance Tracking" },
        description: {
          bn: "সন্তানের উপস্থিতি ও অনুপস্থিতি সহজে অনুসরণ করুন।",
          en: "Follow your child's attendance and absences.",
        },
        route: "/dashboard/parent/attendance",
        access: PARENT,
      },
      {
        id: "assessment-results",
        icon: "clipboard",
        title: { bn: "মূল্যায়নের ফলাফল", en: "Assessment Results" },
        description: {
          bn: "সন্তানের মূল্যায়ন ও পরীক্ষার ফলাফল দেখুন।",
          en: "Review your child's assessment outcomes.",
        },
        route: "/dashboard/parent/ai-pathshala/assessment-results",
        access: PARENT,
      },
      {
        id: "parent-insights",
        icon: "insight",
        title: { bn: "সাপ্তাহিক শেখার অন্তর্দৃষ্টি", en: "Weekly Learning Insights" },
        description: {
          bn: "সন্তানের অগ্রগতির সাপ্তাহিক অন্তর্দৃষ্টি ও সারাংশ।",
          en: "Weekly insights and summaries of your child's progress.",
        },
        route: "/dashboard/parent/parent-insights",
        access: PARENT,
      },
      {
        id: "teacher-messages",
        icon: "messages",
        title: { bn: "শিক্ষকের বার্তা", en: "Teacher Messages" },
        description: {
          bn: "সন্তানের শিক্ষকদের সাথে যোগাযোগ ও বার্তা আদান-প্রদান।",
          en: "Stay in touch with your child's teachers.",
        },
        route: "/dashboard/parent/teacher-messages",
        access: PARENT,
      },
      {
        id: "study-activity",
        icon: "book",
        title: { bn: "পড়ার কার্যক্রম মনিটরিং", en: "Study Activity Monitoring" },
        description: {
          bn: "সন্তানের পড়াশোনা ও শেখার কার্যক্রম মনিটর করুন।",
          en: "Monitor your child's study and learning activity.",
        },
        route: "/dashboard/parent/ai-pathshala/study-activity",
        access: PARENT,
      },
    ],
  },
  {
    id: "content-safety",
    icon: "shield",
    title: { bn: "কনটেন্ট গুণমান ও এআই নিরাপত্তা", en: "Content Quality & AI Safety" },
    features: [
      {
        id: "content-review-queue",
        icon: "clipboard",
        title: { bn: "কনটেন্ট রিভিউ কিউ", en: "Content Review Queue" },
        description: {
          bn: "শিক্ষামূলক কনটেন্ট রিভিউ ও অনুমোদন প্রবাহ পরিচালনা করুন।",
          en: "Work through structured content review and approval.",
        },
        route: "/dashboard/content-reviewer/review-queue",
        access: CONTENT_REVIEWER,
      },
      {
        id: "approved-content",
        icon: "policy",
        title: { bn: "অনুমোদিত শেখার কনটেন্ট", en: "Approved Learning Content" },
        description: {
          bn: "অনুমোদিত ও প্রকাশযোগ্য শেখার কনটেন্ট দেখুন।",
          en: "Browse published and approved learning content.",
        },
        route: "/dashboard/content-reviewer/approved",
        access: CONTENT_REVIEWER,
      },
      {
        id: "review-history",
        icon: "history",
        title: { bn: "রিভিউ ইতিহাস", en: "Review History" },
        description: {
          bn: "পূর্বের রিভিউ ও সিদ্ধান্তের ইতিহাস পর্যালোচনা করুন।",
          en: "Audit past reviews and decisions.",
        },
        route: "/dashboard/content-reviewer/review-history",
        access: CONTENT_REVIEWER,
      },
      {
        id: "ai-safety-dashboard",
        icon: "shield",
        title: { bn: "এআই নিরাপত্তা ড্যাশবোর্ড", en: "AI Safety Dashboard" },
        description: {
          bn: "এআই ব্যবহার ও নিরাপত্তা কার্যক্রমের কেন্দ্রীয় ভিউ।",
          en: "Central view of AI safety activity and usage.",
        },
        route: "/dashboard/ai-safety-reviewer",
        access: AI_SAFETY,
      },
      {
        id: "flagged-ai-content",
        icon: "shieldAlert",
        title: { bn: "ফ্ল্যাগড এআই কনটেন্ট", en: "Flagged AI Content" },
        description: {
          bn: "ফ্ল্যাগ করা এআই বার্তা ও কনটেন্ট পর্যালোচনা করুন।",
          en: "Review flagged AI messages and content.",
        },
        route: "/dashboard/ai-safety-reviewer/flagged-content",
        access: AI_SAFETY,
      },
      {
        id: "ai-safety-events",
        icon: "shieldAlert",
        title: { bn: "এআই নিরাপত্তা ইভেন্ট", en: "AI Safety Events" },
        description: {
          bn: "নিরাপত্তা সংক্রান্ত ঘটনা ও এস্কেলেশন ট্র্যাক করুন।",
          en: "Track safety events and escalations over time.",
        },
        route: "/dashboard/ai-safety-reviewer/safety-events",
        access: AI_SAFETY,
      },
      {
        id: "ai-safety-policies",
        icon: "policy",
        title: { bn: "এআই নিরাপত্তা নীতিমালা", en: "AI Safety Policies" },
        description: {
          bn: "দায়িত্বশীল এআই ব্যবহারের নীতিমালা ও কোড দেখুন।",
          en: "Browse the policies behind responsible AI use.",
        },
        route: "/dashboard/ai-safety-reviewer/policies",
        access: AI_SAFETY,
      },
    ],
  },
  {
    id: "monitoring",
    icon: "landmark",
    title: { bn: "এনজিও ও সরকারি নজরদারি", en: "NGO & Government Oversight" },
    features: [
      {
        id: "ngo-programs",
        icon: "clipboard",
        title: { bn: "এনজিও প্রোগ্রাম ব্যবস্থাপনা", en: "NGO Program Management" },
        description: {
          bn: "শিক্ষা প্রোগ্রাম তৈরি, পরিবীক্ষণ ও ব্যবস্থাপনা করুন।",
          en: "Create, monitor and manage education programmes.",
        },
        route: "/dashboard/ngo-admin/programs",
        access: NGO,
      },
      {
        id: "institution-monitoring",
        icon: "building",
        title: { bn: "প্রতিষ্ঠান পর্যবেক্ষণ", en: "Institution Monitoring" },
        description: {
          bn: "নিবন্ধিত প্রতিষ্ঠানসমূহের কার্যক্রম নজরে রাখুন।",
          en: "Keep an eye on registered institutions.",
        },
        route: "/dashboard/ngo-admin/institutions",
        access: NGO,
      },
      {
        id: "learning-outcomes",
        icon: "outcome",
        title: { bn: "শেখার ফলাফল", en: "Learning Outcomes" },
        description: {
          bn: "প্রোগ্রামভিত্তিক শেখার ফলাফল ও অগ্রগতি দেখুন।",
          en: "Review learning outcomes across programmes.",
        },
        route: "/dashboard/{role}/learning-outcomes",
        access: OVERSIGHT,
      },
      {
        id: "impact-analytics",
        icon: "chart",
        title: { bn: "ইমপ্যাক্ট অ্যানালিটিক্স", en: "Impact Analytics" },
        description: {
          bn: "শিক্ষা কার্যক্রমের প্রভাব ও ফলাফল বিশ্লেষণ করুন।",
          en: "Analyse the reach and impact of your programmes.",
        },
        route: "/dashboard/ngo-admin/impact-analytics",
        access: NGO,
      },
      {
        id: "district-oversight",
        icon: "district",
        title: { bn: "জেলা পর্যায়ের নজরদারি", en: "District-Level Oversight" },
        description: {
          bn: "জেলা অনুযায়ী শিক্ষা কার্যক্রম পর্যবেক্ষণ করুন।",
          en: "Monitor education activity across districts.",
        },
        route: "/dashboard/government-officer/districts",
        access: GOV,
      },
      {
        id: "enrollment-analytics",
        icon: "enrollment",
        title: { bn: "ভর্তি অ্যানালিটিক্স", en: "Enrollment Analytics" },
        description: {
          bn: "শিক্ষার্থী ভর্তির ধারা ও সংখ্যা বিশ্লেষণ করুন।",
          en: "Analyse enrolment trends and numbers.",
        },
        route: "/dashboard/government-officer/enrollment",
        access: GOV,
      },
      {
        id: "equity-indicators",
        icon: "equity",
        title: { bn: "সমন্বয় সূচক", en: "Equity Indicators" },
        description: {
          bn: "শিক্ষায় অন্তর্ভুক্তি ও সমতার সূচক দেখুন।",
          en: "Track inclusion and equity indicators in education.",
        },
        route: "/dashboard/government-officer/equity-indicators",
        access: GOV,
      },
      {
        id: "aggregated-reports",
        icon: "policy",
        title: { bn: "সমন্বিত রিপোর্ট", en: "Aggregated Reports" },
        description: {
          bn: "নজরদারির জন্য সমন্বিত রিপোর্ট তৈরি ও ডাউনলোড করুন।",
          en: "Generate aggregated reports for oversight.",
        },
        route: "/dashboard/{role}/reports",
        access: OVERSIGHT,
      },
    ],
  },
  {
    id: "site-home",
    icon: "home",
    title: { bn: "হোম", en: "Home" },
    features: [
      {
        id: "nav-home",
        icon: "home",
        title: { bn: "স্কুল হোম পেজ", en: "School Home Page" },
        description: {
          bn: "প্রতিষ্ঠানের পাবলিক হোম পেজ — ভিজিটরদের প্রথম অভিজ্ঞতা।",
          en: "The public home page of the institution.",
        },
        route: "/",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-about",
    icon: "school",
    title: { bn: "আমাদের সম্পর্কে", en: "About Us" },
    features: [
      {
        id: "nav-chairman",
        icon: "messages",
        title: { bn: "চেয়ারম্যানের বাণী", en: "Message from Chairman" },
        description: {
          bn: "পরিচালনা পরিষদের চেয়ারম্যানের বাণী।",
          en: "A message from the chairman.",
        },
        route: "/message-from-chairman",
        access: PUBLIC,
      },
      {
        id: "nav-principal",
        icon: "messages",
        title: { bn: "প্রিন্সিপালের বাণী", en: "Message from Principal" },
        description: {
          bn: "প্রিন্সিপালের পক্ষ থেকে বার্তা।",
          en: "A message from the principal.",
        },
        route: "/message-from-principal",
        access: PUBLIC,
      },
      {
        id: "nav-governing",
        icon: "users",
        title: { bn: "গভর্নিং বডি", en: "Governing Body" },
        description: {
          bn: "প্রতিষ্ঠান পরিচালনাকারী পরিষদ।",
          en: "The body that governs the institution.",
        },
        route: "/governing-body",
        access: PUBLIC,
      },
      {
        id: "nav-master-plan",
        icon: "layout",
        title: { bn: "মাস্টার প্ল্যান", en: "Master Plan" },
        description: {
          bn: "প্রতিষ্ঠানের ভবিষ্যৎ পরিকল্পনা।",
          en: "The institution's development plan.",
        },
        route: "/master-plan",
        access: PUBLIC,
      },
      {
        id: "nav-history",
        icon: "history",
        title: { bn: "ইতিহাস", en: "History" },
        description: {
          bn: "প্রতিষ্ঠানের প্রতিষ্ঠা ও ইতিহাস।",
          en: "The founding and history of the institution.",
        },
        route: "/history",
        access: PUBLIC,
      },
      {
        id: "nav-courses",
        icon: "graduation",
        title: { bn: "কোর্স", en: "Courses" },
        description: {
          bn: "প্রতিষ্ঠানে অফার করা কোর্সসমূহ।",
          en: "Courses offered by the institution.",
        },
        route: "/courses",
        access: PUBLIC,
      },
      {
        id: "nav-vision",
        icon: "target",
        title: { bn: "লক্ষ্য ও উদ্দেশ্য", en: "Vision and Objectives" },
        description: {
          bn: "প্রতিষ্ঠানের লক্ষ্য, উদ্দেশ্য ও মূল্যবোধ।",
          en: "The vision, objectives and values.",
        },
        route: "/vision-and-objectives",
        access: PUBLIC,
      },
      {
        id: "nav-infrastructure",
        icon: "building",
        title: { bn: "অবকাঠামো", en: "Infrastructure" },
        description: {
          bn: "ক্যাম্পাস ও অবকাঠামোর পরিচিতি।",
          en: "Overview of the campus and infrastructure.",
        },
        route: "/infrastructure",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-academic",
    icon: "graduation",
    title: { bn: "একাডেমিক", en: "Academic" },
    features: [
      {
        id: "nav-code-of-conduct",
        icon: "policy",
        title: { bn: "আচরণবিধি", en: "Code of Conduct" },
        description: {
          bn: "শিক্ষার্থী ও অভিভাবকদের আচরণবিধি।",
          en: "Conduct rules for students and guardians.",
        },
        route: "/code-of-conducts",
        access: PUBLIC,
      },
      {
        id: "nav-parent-guideline",
        icon: "parents",
        title: { bn: "অভিভাবকদের নির্দেশিকা", en: "Guideline for Parents" },
        description: {
          bn: "অভিভাবকদের জন্য প্রয়োজনীয় নির্দেশনা।",
          en: "Guidance meant for parents.",
        },
        route: "/guideline-for-parents",
        access: PUBLIC,
      },
      {
        id: "nav-dress-code",
        icon: "info",
        title: { bn: "ড্রেস কোড", en: "Dress Code" },
        description: {
          bn: "প্রতিষ্ঠানের পোশাক নীতিমালা।",
          en: "The institution's dress code policy.",
        },
        route: "/dress-code",
        access: PUBLIC,
      },
      {
        id: "nav-homework",
        icon: "homework",
        title: { bn: "বাড়ির কাজ ও লেকচার", en: "Homework and Lecture" },
        description: {
          bn: "হোমওয়ার্ক ও লেকচার সংক্রান্ত তথ্য।",
          en: "Homework and lecture information.",
        },
        route: "/homework-&-lecture",
        access: PUBLIC,
      },
      {
        id: "nav-lesson-plan",
        icon: "notebook",
        title: { bn: "পাঠ পরিকল্পনা", en: "Lesson Plan" },
        description: {
          bn: "পাঠদানের পরিকল্পনা ও রূপরেখা।",
          en: "Teaching lesson plans and outlines.",
        },
        route: "/lesson-plan",
        access: PUBLIC,
      },
      {
        id: "nav-academic-calendar",
        icon: "calendar",
        title: { bn: "একাডেমিক ক্যালেন্ডার", en: "Academic Calendar" },
        description: {
          bn: "সেশনের গুরুত্বপূর্ণ তারিখ ও সময়সূচি।",
          en: "Key session dates and the academic schedule.",
        },
        route: "/academic-calendar",
        access: PUBLIC,
      },
      {
        id: "nav-syllabus",
        icon: "syllabus",
        title: { bn: "সিলেবাস", en: "Syllabus" },
        description: {
          bn: "বিষয়ভিত্তিক সিলেবাস ও পাঠ্যক্রম।",
          en: "Subject-wise syllabus and curriculum.",
        },
        route: "/syllabus",
        access: PUBLIC,
      },
      {
        id: "nav-class-routine",
        icon: "calendar",
        title: { bn: "ক্লাস রুটিন", en: "Class Routine" },
        description: {
          bn: "শ্রেণিভিত্তিক ক্লাসের সময়সূচি।",
          en: "Class-wise timetables and routines.",
        },
        route: "/class-routine",
        access: PUBLIC,
      },
      {
        id: "nav-co-curricular",
        icon: "sparkles",
        title: { bn: "সহ-শিক্ষা কার্যক্রম", en: "Co-curricular Activities" },
        description: {
          bn: "সহ-শিক্ষা ও সাংস্কৃতিক কার্যক্রম।",
          en: "Co-curricular and cultural activities.",
        },
        route: "/co-curricular-activities",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-information",
    icon: "info",
    title: { bn: "তথ্য", en: "Information" },
    features: [
      {
        id: "nav-notice-board",
        icon: "notice",
        title: { bn: "নোটিশ বোর্ড", en: "Notice Board" },
        description: {
          bn: "প্রতিষ্ঠানের সর্বশেষ নোটিশ ও ঘোষণা।",
          en: "Latest notices and announcements.",
        },
        route: "/notice-board",
        access: PUBLIC,
      },
      {
        id: "nav-payment-procedure",
        icon: "fees",
        title: { bn: "পেমেন্ট পদ্ধতি", en: "Payment Procedure" },
        description: {
          bn: "ফি পরিশোধের নিয়ম ও পদ্ধতি।",
          en: "How fees are to be paid.",
        },
        route: "/payment-procedure",
        access: PUBLIC,
      },
      {
        id: "nav-facilities",
        icon: "facility",
        title: { bn: "সুযোগ-সুবিধা", en: "Facilities" },
        description: {
          bn: "প্রতিষ্ঠানের সুযোগ-সুবিধাসমূহ।",
          en: "Facilities offered by the institution.",
        },
        route: "/facilities",
        access: PUBLIC,
      },
      {
        id: "nav-news-events",
        icon: "notice",
        title: { bn: "সংবাদ ও অনুষ্ঠান", en: "News and Events" },
        description: {
          bn: "সর্বশেষ সংবাদ ও অনুষ্ঠানের তথ্য।",
          en: "Latest news and events.",
        },
        route: "/news-and-events",
        access: PUBLIC,
      },
      {
        id: "nav-achievements",
        icon: "outcome",
        title: { bn: "আমাদের অর্জনসমূহ", en: "Achievements" },
        description: {
          bn: "প্রতিষ্ঠানের অর্জন ও সাফল্য।",
          en: "The institution's achievements and milestones.",
        },
        route: "/our-achievements",
        access: PUBLIC,
      },
      {
        id: "nav-holiday-list",
        icon: "calendar",
        title: { bn: "ছুটির তালিকা", en: "Holiday List" },
        description: {
          bn: "বছরের ছুটি ও অবকাশের তালিকা।",
          en: "The yearly holiday list.",
        },
        route: "/list-of-holidays",
        access: PUBLIC,
      },
      {
        id: "nav-teachers-info",
        icon: "userCheck",
        title: { bn: "শিক্ষকদের তথ্য", en: "Teachers Info" },
        description: {
          bn: "শিক্ষকদের পরিচিতি ও তথ্য।",
          en: "Information about the teachers.",
        },
        route: "/teachers-info",
        access: PUBLIC,
      },
      {
        id: "nav-student-info",
        icon: "users",
        title: { bn: "শিক্ষার্থীদের তথ্য", en: "Students Info" },
        description: {
          bn: "শিক্ষার্থীদের তথ্য ও নির্দেশনা।",
          en: "Information and guidance for students.",
        },
        route: "/student-info",
        access: PUBLIC,
      },
      {
        id: "nav-policies",
        icon: "policy",
        title: { bn: "নীতিমালা ও নির্দেশিকা", en: "Policies and Guidelines" },
        description: {
          bn: "প্রতিষ্ঠানের নীতিমালা ও নির্দেশিকা।",
          en: "The institution's policies and guidelines.",
        },
        route: "/policies-and-guidelines",
        access: PUBLIC,
      },
      {
        id: "nav-library",
        icon: "book",
        title: { bn: "লাইব্রেরি", en: "Library" },
        description: {
          bn: "গ্রন্থাগার ও লাইব্রেরি সংক্রান্ত তথ্য।",
          en: "Library information and resources.",
        },
        route: "/library",
        access: PUBLIC,
      },
      {
        id: "nav-health",
        icon: "shield",
        title: { bn: "স্বাস্থ্য সচেতনতা", en: "Health Awareness" },
        description: {
          bn: "স্বাস্থ্য ও পরিবেশ সচেতনতার তথ্য।",
          en: "Health and environmental awareness.",
        },
        route: "/health-and-environmental-awareness-info",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-admission",
    icon: "admission",
    title: { bn: "ভর্তি", en: "Admission" },
    features: [
      {
        id: "nav-apply-now",
        icon: "admission",
        title: { bn: "এখনই আবেদন করুন", en: "Apply Now" },
        description: {
          bn: "অনলাইন ভর্তির আবেদন করুন।",
          en: "Apply for admission online.",
        },
        route: "/apply-now",
        access: PUBLIC,
      },
      {
        id: "nav-fast-facts",
        icon: "info",
        title: { bn: "এক নজরে মূল তথ্য", en: "Fast Facts" },
        description: {
          bn: "ভর্তির মূল তথ্য এক নজরে।",
          en: "Admission facts at a glance.",
        },
        route: "/fast-facts",
        access: PUBLIC,
      },
      {
        id: "nav-fees-payment",
        icon: "fees",
        title: { bn: "ফি এবং পেমেন্ট", en: "Fees and Payment" },
        description: {
          bn: "ভর্তি ফি ও পরিশোধ সংক্রান্ত তথ্য।",
          en: "Fees and payment details.",
        },
        route: "/fees-and-payment",
        access: PUBLIC,
      },
      {
        id: "nav-scholarships",
        icon: "outcome",
        title: { bn: "বৃত্তি ও আর্থিক সহায়তা", en: "Scholarships and Aid" },
        description: {
          bn: "বৃত্তি ও আর্থিক সহায়তার তথ্য।",
          en: "Scholarships and financial aid.",
        },
        route: "/scholarships",
        access: PUBLIC,
      },
      {
        id: "nav-transfer",
        icon: "building",
        title: { bn: "স্থানান্তর প্রক্রিয়া", en: "Transfer Procedure" },
        description: {
          bn: "শিক্ষার্থী স্থানান্তরের প্রক্রিয়া।",
          en: "The student transfer process.",
        },
        route: "/transfer-procedures",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-media",
    icon: "gallery",
    title: { bn: "মিডিয়া", en: "Media" },
    features: [
      {
        id: "nav-gallery",
        icon: "gallery",
        title: { bn: "মিডিয়া গ্যালারি", en: "Media Gallery" },
        description: {
          bn: "প্রতিষ্ঠানের ছবি ও ভিডিও গ্যালারি।",
          en: "Photo and video gallery of the institution.",
        },
        route: "/gallery",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-employment",
    icon: "building",
    title: { bn: "কর্মসংস্থান", en: "Employment" },
    features: [
      {
        id: "nav-at-a-glance",
        icon: "info",
        title: { bn: "এক নজরে", en: "At a Glance" },
        description: {
          bn: "কর্মসংস্থান সংক্রান্ত এক নজরে তথ্য।",
          en: "Employment information at a glance.",
        },
        route: "/at-a-glance",
        access: PUBLIC,
      },
      {
        id: "nav-circulars",
        icon: "notice",
        title: { bn: "নিয়োগ বিজ্ঞপ্তি", en: "Employment Circulars" },
        description: {
          bn: "সর্বশেষ নিয়োগ বিজ্ঞপ্তিসমূহ।",
          en: "The latest employment circulars.",
        },
        route: "/employment-circulars",
        access: PUBLIC,
      },
      {
        id: "nav-recruitment-results",
        icon: "clipboard",
        title: { bn: "নিয়োগ পরীক্ষার ফলাফল", en: "Recruitment Exam Results" },
        description: {
          bn: "নিয়োগ পরীক্ষার ফলাফল ও তথ্য।",
          en: "Recruitment exam results and information.",
        },
        route: "/recruitment-exam-results",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-contact",
    icon: "contact",
    title: { bn: "যোগাযোগ", en: "Contact" },
    features: [
      {
        id: "nav-contact",
        icon: "contact",
        title: { bn: "যোগাযোগ", en: "Contact" },
        description: {
          bn: "প্রতিষ্ঠানের যোগাযোগের ঠিকানা ও তথ্য।",
          en: "Address and contact details of the institution.",
        },
        route: "/contact",
        access: PUBLIC,
      },
    ],
  },
  {
    id: "site-freedom",
    icon: "landmark",
    title: { bn: "স্বাধীনতা কর্নার", en: "Freedom Corner" },
    features: [
      {
        id: "nav-notices",
        icon: "notice",
        title: { bn: "নোটিশ", en: "Notices" },
        description: {
          bn: "স্বাধীনতা কর্নারের নোটিশ ও ঘোষণা।",
          en: "Notices and announcements in the freedom corner.",
        },
        route: "/notices",
        access: PUBLIC,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Derived counts (for tests / reporting)                              */
/* ------------------------------------------------------------------ */

export const FEATURE_SHOWCASE_CATEGORY_COUNT = FEATURE_SHOWCASE.length;

export const FEATURE_SHOWCASE_FEATURE_COUNT = FEATURE_SHOWCASE.reduce(
  (total, category) => total + category.features.length,
  0,
);

/**
 * Connected OS — role-based access showcase data.
 *
 * GENERATED from the Shikkha Chat Apps source (see the anchor note below); do not
 * hand-edit the route rows — regenerate from the source instead. Every route below
 * is a REAL route of the Shikkha Chat Apps dashboard, copied from that app's own
 * sidebar definition, so nothing here is invented:
 *
 *   shikkha_chat_apps/src/components/dashboard/dashboard-shell.tsx
 *     roleModuleItems / aiPathshalaItems / roleAiPathshalaItems / roleReportItems
 *   shikkha_chat_apps/src/lib/dashboard-routes.ts        (roleDashboardRoutes)
 *   shikkha_chat_apps/src/lib/dashboard-permissions.ts   (rolePermissionMap)
 *   shikkha_chat_apps/src/lib/user-manual.json           (title / who / steps / tips, bn + en)
 *
 * Route shapes (identical to dashboardActionHref in the source):
 *   module        /dashboard/<role>/<slug>
 *   AI Pathshala  /dashboard/<role>/ai-pathshala/<slug>
 *   report        /dashboard/<role>/reports/<slug>
 *
 * Every path below is ALSO a real page of Connected OS (see
 * src/app/dashboard/**): the /dashboard hub, a page per role and a page per
 * route, each explaining the work the route does in Shikkha Chat Apps. The
 * strings here stay identical to the app's own routes.
 */

import type { LocalizedText } from "@/lib/feature-showcase";

/** The eight dashboard roles of the Shikkha Chat Apps platform. */
export type RoleAccessKey =
  | "admin"
  | "student"
  | "teacher"
  | "parent"
  | "content-reviewer"
  | "ai-safety-reviewer"
  | "ngo-admin"
  | "government-officer";

export type RoleRouteItem = {
  readonly slug: string;
  readonly path: string;
  readonly label: LocalizedText;
  readonly description: LocalizedText;
};

export type RoleMenuGroupKey = "modules" | "ai-pathshala" | "reports";

export type RoleMenuGroup = {
  readonly key: RoleMenuGroupKey;
  readonly title: LocalizedText;
  readonly items: readonly RoleRouteItem[];
};

export type RoleWorkflow = {
  readonly title: LocalizedText;
  readonly body: LocalizedText;
};

export type RoleAccessGuide = {
  readonly key: RoleAccessKey;
  /** The role's dashboard root, e.g. /dashboard/ngo-admin. */
  readonly dashboardRoute: string;
  /** ERP role names that grant this dashboard (dashboard-permissions.ts). */
  readonly signingRoles: readonly string[];
  readonly title: LocalizedText;
  readonly who: LocalizedText;
  readonly roleNames: LocalizedText;
  /** Source files this role's data was read from (shown in the panel). */
  readonly sourceFiles: readonly string[];
  readonly menuGroups: readonly RoleMenuGroup[];
  readonly workflows: readonly RoleWorkflow[];
  readonly tips: readonly LocalizedText[];
};

export const ROLE_ACCESS_GUIDES: readonly RoleAccessGuide[] = [
  {
    key: "admin",
    dashboardRoute: "/dashboard/admin",
    signingRoles: ["Shikkha Admin", "School Admin", "Academics User", "Accounts Manager", "Accounts User"],
    title: { bn: "প্রশাসক / স্কুল অ্যাডমিন", en: "Administrator / School admin" },
    who: { bn: "প্রতিষ্ঠানের দায়িত্বপ্রাপ্ত ব্যক্তি। শিক্ষার্থী, শিক্ষক, ক্লাস, রুটিন, উপস্থিতি, ফি, ইউজার ও অনুমতি — সব আপনার হাতে।", en: "The person in charge of the institution: students, teachers, classes, routine, attendance, fees, users and permissions." },
    roleNames: { bn: "Administrator, System Manager, System Admin, Shikkha Admin, School Admin, Institute Owner, Education Manager, Academics Manager, Education Officer", en: "Administrator, System Manager, System Admin, Shikkha Admin, School Admin, Institute Owner, Education Manager, Academics Manager, Education Officer" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.admin", "role-dashboard-content.tsx › AdminPanel", "dashboard-routes.ts"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "students", path: "/dashboard/admin/students", label: { bn: "শিক্ষার্থী (Students)", en: "Students" }, description: { bn: "শিক্ষার্থী রেকর্ড: ভর্তি নম্বর, ক্লাস, সেকশন, রোল ও অভিভাবক; সেভ করলেই শিক্ষার্থীর লগইন তৈরি হয়।", en: "Student records: admission number, class, section, roll and guardian; saving creates the learner's login." } },
      { slug: "teachers", path: "/dashboard/admin/teachers", label: { bn: "শিক্ষক (Teachers)", en: "Teachers" }, description: { bn: "বিষয়, ক্লাস বরাদ্দ ও যোগাযোগসহ শিক্ষক রেকর্ড।", en: "Instructor records with subject, class assignment and contact details." } },
      { slug: "teacher-class-assignments", path: "/dashboard/admin/teacher-class-assignments", label: { bn: "শিক্ষক-ক্লাস অ্যাসাইনমেন্ট (Teacher Class Assignment)", en: "Teacher Class Assignment" }, description: { bn: "কোন শিক্ষক কোন ক্লাস ও বিষয় নেবেন তা ঠিক করে — এতেই শিক্ষকের ‘শিক্ষার্থী’ তালিকা তৈরি হয়।", en: "Fixes which teacher takes which class and subject — this fills the teacher's Students list." } },
      { slug: "classes", path: "/dashboard/admin/classes", label: { bn: "ক্লাস (Classes)", en: "Classes" }, description: { bn: "এই শিক্ষককে বরাদ্দ করা ক্লাস ও সেকশন।", en: "The classes and sections this teacher is assigned to." } },
      { slug: "sections", path: "/dashboard/admin/sections", label: { bn: "সেকশন (Sections)", en: "Sections" }, description: { bn: "প্রতিটি ক্লাসের ভেতরের সেকশন, ধারণক্ষমতা ও ক্লাস টিচারসহ।", en: "Sections inside each class, with capacity and class teacher." } },
      { slug: "subjects", path: "/dashboard/admin/subjects", label: { bn: "বিষয় (Subjects)", en: "Subjects" }, description: { bn: "রুটিন, কারিকুলাম ও অ্যাসেসমেন্টে ব্যবহৃত বিষয় তালিকা।", en: "Subject master list used by routine, curriculum and assessments." } },
      { slug: "curriculum", path: "/dashboard/admin/curriculum", label: { bn: "কারিকুলাম (Curriculum)", en: "Curriculum" }, description: { bn: "কোন ক্লাসে কোন বিষয়, কোন ক্রমে পড়ানো হবে।", en: "Which subject is taught in which class, in what order." } },
      { slug: "attendance", path: "/dashboard/admin/attendance", label: { bn: "উপস্থিতি (Attendance)", en: "Attendance" }, description: { bn: "ক্লাসভিত্তিক হাজিরা খাতা — স্কুল নিজেই নেয় ও সংশোধন করে।", en: "Class-wise attendance registers, taken and corrected by the school." } },
      { slug: "academic-calendar", path: "/dashboard/admin/academic-calendar", label: { bn: "অ্যাকাডেমিক ক্যালেন্ডার (Academic Calendar)", en: "Academic Calendar" }, description: { bn: "সেশনের ছুটি, পরীক্ষা, অনুষ্ঠান ও কর্মদিবস।", en: "Holidays, exams, events and working days for the session." } },
      { slug: "analytics", path: "/dashboard/admin/analytics", label: { bn: "অ্যানালিটিক্স (Analytics)", en: "Analytics" }, description: { bn: "ভর্তি, উপস্থিতি ও মাস্টারি জুড়ে প্রতিষ্ঠানের সর্বাঙ্গীণ বিশ্লেষণ।", en: "Institution-wide analytics across enrollment, attendance and mastery." } },
      { slug: "users", path: "/dashboard/admin/users", label: { bn: "ইউজার (Users)", en: "Users" }, description: { bn: "লগইন তৈরি বা বন্ধ করুন এবং প্রত্যেকের ভূমিকা দেখুন।", en: "Create or disable logins and see which roles each person holds." } },
      { slug: "roles", path: "/dashboard/admin/roles", label: { bn: "রোল (Roles)", en: "Roles" }, description: { bn: "ভূমিকা ও অনুমতি বণ্টন: কে কী দেখতে ও করতে পারবে।", en: "Role and permission assignment: who may see and do what." } },
      { slug: "notifications", path: "/dashboard/admin/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "settings", path: "/dashboard/admin/settings", label: { bn: "সেটিংস (Settings)", en: "Settings" }, description: { bn: "প্রতিষ্ঠানের সেটিংস: পরিচিতি, সেশন, গ্রেডিং ও যোগাযোগ।", en: "Institution settings: identity, session, grading and contact details." } },
      { slug: "profile", path: "/dashboard/admin/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "লগইন করা ব্যক্তির নিজের অ্যাকাউন্ট তথ্য, সম্পাদনার সুযোগসহ।", en: "The signed-in person's own account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/admin/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/admin/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/admin/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/admin/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/admin/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/admin/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/admin/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "institution-analytics", path: "/dashboard/admin/reports/institution-analytics", label: { bn: "প্রতিষ্ঠান অ্যানালিটিক্স (Institution Analytics)", en: "Institution Analytics" }, description: { bn: "নির্বাচিত সময়ে পুরো প্রতিষ্ঠানের প্রবণতা প্রতিবেদন।", en: "Trend report for the whole institution over the selected period." } },
      { slug: "teacher-activity", path: "/dashboard/admin/reports/teacher-activity", label: { bn: "শিক্ষক কার্যক্রম (Teacher Activity)", en: "Teacher Activity" }, description: { bn: "প্রতিটি শিক্ষক প্ল্যাটফর্ম কতটা সক্রিয়ভাবে ব্যবহার করেছেন।", en: "How actively each teacher used the platform." } },
      { slug: "parent-reach", path: "/dashboard/admin/reports/parent-reach", label: { bn: "অভিভাবক সংযোগ (Parent Reach)", en: "Parent Reach" }, description: { bn: "কতজন অভিভাবক যুক্ত এবং অন্তর্দৃষ্টি পড়ছেন।", en: "How many guardians are linked and reading insights." } },
      { slug: "safety-events", path: "/dashboard/admin/reports/safety-events", label: { bn: "সেফটি ইভেন্ট (Safety Events)", en: "Safety Events" }, description: { bn: "রেকর্ড করা প্রতিটি এআই নিরাপত্তা ঘটনা, নতুনটি আগে।", en: "Every recorded AI safety event, newest first." } },
      { slug: "mastery-records", path: "/dashboard/admin/reports/mastery-records", label: { bn: "মাস্টারি রেকর্ড (Mastery Records)", en: "Mastery Records" }, description: { bn: "প্রত্যেক শিক্ষার্থীর টপিক-ভিত্তিক মাস্টারি রেকর্ড।", en: "Topic-level mastery records for every learner." } },
      { slug: "intervention-plans", path: "/dashboard/admin/reports/intervention-plans", label: { bn: "ইন্টারভেনশন প্ল্যান (Intervention Plans)", en: "Intervention Plans" }, description: { bn: "খোলা, চলমান ও সমাপ্ত সহায়তা পরিকল্পনা।", en: "Intervention plans opened, running and closed." } },
      { slug: "parent-weekly-insights", path: "/dashboard/admin/reports/parent-weekly-insights", label: { bn: "সাপ্তাহিক অভিভাবক ইনসাইট (Parent Weekly Insights)", en: "Parent Weekly Insights" }, description: { bn: "প্রত্যেক অভিভাবক যে সাপ্তাহিক অন্তর্দৃষ্টি পেয়েছেন।", en: "The weekly insight each guardian received." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "ক্লাস, সেকশন ও বিষয় সাজান", en: "Set up classes, sections and subjects" }, body: { bn: "প্রথমে ‘Classes’ ও ‘Sections’, তারপর ‘Subjects’, শেষে ‘Curriculum’ — এই ক্রমে বানালে পরের সব কাজ সহজ হয়।", en: "Classes and Sections first, then Subjects, then Curriculum — this order keeps everything else simple." } },
      { title: { bn: "শিক্ষার্থী যোগ করুন", en: "Add students" }, body: { bn: "‘শিক্ষার্থী’ → ‘New Student’ → নাম, ক্লাস/সেকশন, রোল, অভিভাবকের যোগাযোগ ও ছবি দিন → সেভ। সেভ করলেই শিক্ষার্থীর নিজের লগইন তৈরি হয়: ঠিকানা হয় নাম + মোবাইল + ডোমেইন (যেমন nadiaakter01712345678@shikkhachat.com) এবং সেটি শিক্ষার্থী রেকর্ডের ‘user’ ঘরে যুক্ত হয়। ফর্মে লেখা ইমেইল হলো স্কুলের যোগাযোগের ঠিকানা, লগইন নয় — শিক্ষার্থী রেকর্ড সেটি হুবহু রেখে দেয়। ডিফল্ট পাসওয়ার্ড 123456 দিয়ে শিক্ষার্থী প্রথমবার লগইন করবে — তাকে ঠিকানা ও পাসওয়ার্ডটি জানিয়ে প্রথম লগইনেই পাসওয়ার্ড বদলাতে বলুন। লগইন ঠিকানাটি সেভ করার আগেই ফর্মের নিচে দেখা যায়।", en: "Students → New Student → name, class/section, roll, guardian contact, photo → save. Saving creates the learner's own login: the address is built from their name + mobile + domain (nadiaakter01712345678@shikkhachat.com) and it is linked to the student record's user field. The email typed in the form is the school's contact address, not the login — the student record keeps it exactly as typed. The learner signs in the first time with the default password 123456: give them the address and the password, and ask them to change it at that first sign-in. The login address is shown at the bottom of the form before you save." } },
      { title: { bn: "শিক্ষক যোগ ও ক্লাস বণ্টন", en: "Add teachers and assign classes" }, body: { bn: "‘শিক্ষক’ থেকে নতুন রেকর্ড বানান; তারপর ‘Teacher Class Assignment’ থেকে কোন শিক্ষক কোন ক্লাস ও বিষয় নেবেন ঠিক করুন — এটিই শিক্ষকের ‘শিক্ষার্থী’ তালিকা তৈরি করে।", en: "Create the record under Teachers, then use Teacher Class Assignment to fix which class and subject each teacher takes — that is what fills the teacher's Students list." } },
      { title: { bn: "ইউজার ও ভূমিকা দিন", en: "Users and roles" }, body: { bn: "‘Users’ থেকে লগইন তৈরি বা বন্ধ করুন; ‘Roles’ থেকে ঠিক করুন কে কী দেখতে ও করতে পারবে। নতুন অনুমতি দেওয়ার পর সেই ব্যক্তিকে একবার লগআউট-লগইন করতে বলুন।", en: "Create or disable logins under Users; decide who may see and do what under Roles. After granting a new role, ask the person to sign out and in once." } },
      { title: { bn: "উপস্থিতি ও ক্যালেন্ডার", en: "Attendance and calendar" }, body: { bn: "‘Attendance’ থেকে ক্লাসভিত্তিক হাজিরা দেখুন; ‘Academic Calendar’ থেকে ছুটি, পরীক্ষা ও অনুষ্ঠানের তারিখ ঠিক করুন — অভিভাবক ও শিক্ষার্থী সেটি দেখতে পাবেন।", en: "Review class attendance under Attendance; fix holidays, exams and events in Academic Calendar — parents and students see them." } },
      { title: { bn: "বিশ্লেষণ ও রিপোর্ট", en: "Analytics and reports" }, body: { bn: "‘Analytics’ দিয়ে সামগ্রিক চিত্র দেখুন, তারপর রিপোর্ট তালিকা (Institution Analytics, Teacher Activity, Parent Reach, Safety Events, Mastery Records, Intervention Plans, Parent Weekly Insights) থেকে যেটি দরকার খুলুন।", en: "Get the overall picture in Analytics, then open the report you need (institution analytics, teacher activity, parent reach, safety events, mastery records, intervention plans, parent weekly insights)." } },
    ],
    tips: [
      { bn: "আপনি সব কিছুই মুছে ফেলতে পারেন — ডিলিট করার আগে রেকর্ড নম্বরটি লিখে রাখুন, পরে লগে পাওয়া যাবে।", en: "You can delete almost anything — note the record number first, it is recoverable in the logs." },
      { bn: "কেউ ‘পাতা খুঁজে পাচ্ছি না’ বললে তার ভূমিকা (Roles) পরীক্ষা করুন — সমস্যা প্রায় সবসময় অনুমতিতে হয়।", en: "When someone cannot find a page, check their role — the cause is almost always permission." },
    ],
  },
  {
    key: "student",
    dashboardRoute: "/dashboard/student",
    signingRoles: ["Shikkha Student", "Student", "LMS Student"],
    title: { bn: "শিক্ষার্থী", en: "Student" },
    who: { bn: "আপনি পড়বেন, অনুশীলন করবেন, কুইজ দেবেন এবং নিজের অগ্রগতি দেখবেন।", en: "You study, practise, take quizzes and follow your own progress." },
    roleNames: { bn: "Student / Shikkha Student / LMS Student", en: "Student / Shikkha Student / LMS Student" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.student", "student-route-panel.tsx", "aiPathshalaItems"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "notifications", path: "/dashboard/student/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "profile", path: "/dashboard/student/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "শিক্ষার্থী রেকর্ডে লেখা হয় এমন শিক্ষার্থী প্রোফাইল।", en: "Student profile written back to the student record." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/student/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/student/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/student/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/student/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/student/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/student/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/student/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "my-ai-sessions", path: "/dashboard/student/reports/my-ai-sessions", label: { bn: "আমার AI সেশন (My AI Sessions)", en: "My AI Sessions" }, description: { bn: "শিক্ষার্থীর নিজের এআই টিউটর সেশন।", en: "The learner's own AI Tutor sessions." } },
      { slug: "my-quiz-attempts", path: "/dashboard/student/reports/my-quiz-attempts", label: { bn: "আমার কুইজ চেষ্টা (My Quiz Attempts)", en: "My Quiz Attempts" }, description: { bn: "স্কোর ও সময়সহ প্রতিটি কুইজ চেষ্টা।", en: "Every quiz attempt with score and time." } },
      { slug: "weak-topics", path: "/dashboard/student/reports/weak-topics", label: { bn: "দুর্বল টপিক (Weak Topics)", en: "Weak Topics" }, description: { bn: "এই শিক্ষার্থীর যেসব টপিক আবার অনুশীলন করা উচিত।", en: "Topics this learner should practise again." } },
      { slug: "mastery-progress", path: "/dashboard/student/reports/mastery-progress", label: { bn: "মাস্টারি অগ্রগতি (Mastery Progress)", en: "Mastery Progress" }, description: { bn: "টার্ম জুড়ে মাস্টারি অগ্রগতি।", en: "Mastery progress over the term." } },
      { slug: "recommended-practice", path: "/dashboard/student/reports/recommended-practice", label: { bn: "প্রস্তাবিত অনুশীলন (Recommended Practice)", en: "Recommended Practice" }, description: { bn: "শিক্ষার্থীর জন্য প্রস্তাবিত পরবর্তী অনুশীলন।", en: "The next practice items suggested to the learner." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "পাঠ পড়া", en: "Read your lessons" }, body: { bn: "AI Pathshala → ‘Lessons’ — আপনার ক্লাসের জন্য প্রকাশিত পাঠগুলো এখানে। নিচে সময়/অধ্যায় দেখে ক্রম অনুযায়ী পড়ুন।", en: "AI Pathshala → Lessons holds what has been published for your class. Follow them in order, checking the time/chapter shown." } },
      { title: { bn: "AI Tutor-কে জিজ্ঞাসা", en: "Ask the AI Tutor" }, body: { bn: "‘AI Tutor’-এ নিজের ভাষায় প্রশ্ন লিখুন — পড়া বুঝতে সাহায্য করবে। মনে রাখবেন, কথোপকথন শিক্ষক ও অভিভাবক দেখতে পারেন; তাই ব্যক্তিগত তথ্য লিখবেন না।", en: "Ask in AI Tutor in your own words when a lesson is unclear. Remember a teacher or parent may review the conversation — do not type personal details." } },
      { title: { bn: "কুইজ ও মূল্যায়ন", en: "Quizzes and assessments" }, body: { bn: "‘Quizzes’ ও ‘Assessments’-এ সময় শেষ হওয়ার আগেই জমা দিন; জমা দেওয়ার পর ফলাফল ‘Progress’-এ যোগ হয়।", en: "Submit Quizzes and Assessments before the time runs out; the result appears in Progress afterwards." } },
      { title: { bn: "নিজের রুটিন বানান", en: "Build your study routine" }, body: { bn: "‘Study Plan’-এ কবে কী পড়বেন লিখে রাখুন; কোন বিষয়ে দুর্বল তা ‘Progress’ ও কুইজের ফল থেকে দেখুন।", en: "Write what to study when in Study Plan; Progress and quiz results show which subject needs more work." } },
      { title: { bn: "নিজের তথ্য হালনাগাদ", en: "Keep your details current" }, body: { bn: "‘Profile’ থেকে মোবাইল/ঠিকানা বদলান — আপনার শিক্ষার্থী রেকর্ডেও সেটি সেভ হয়, তাই অফিসে আলাদা করে জানাতে হয় না।", en: "Update your phone or address in Profile — it saves into your student record too, so the office needs no separate notice." } },
    ],
    tips: [
      { bn: "পাঠ না দেখালে বোঝা যাবে আপনার ক্লাসের জন্য এখনো কিছু প্রকাশ হয়নি — শিক্ষককে জিজ্ঞাসা করুন।", en: "If no lesson appears, nothing has been published for your class yet — ask your teacher." },
      { bn: "পরীক্ষার সময় পর্দা বদলালে সময় চলতে থাকে; কুইজ শেষ করে জমা না দিলে ফল শূন্য হবে।", en: "The clock keeps running if you switch screens; an unsubmitted quiz counts as zero." },
    ],
  },
  {
    key: "teacher",
    dashboardRoute: "/dashboard/teacher",
    signingRoles: ["Shikkha Teacher", "Teacher", "Instructor"],
    title: { bn: "শিক্ষক", en: "Teacher" },
    who: { bn: "আপনার ক্লাসের শিক্ষার্থী, হাজিরা, পাঠ ও অগ্রগতির দায়িত্ব আপনার।", en: "You own your class's students, attendance, lessons and progress." },
    roleNames: { bn: "Teacher / Instructor / Shikkha Teacher", en: "Teacher / Instructor / Shikkha Teacher" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.teacher", "teacher-route-panel.tsx", "roleAiPathshalaItems.teacher"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "students", path: "/dashboard/teacher/students", label: { bn: "শিক্ষার্থী (Students)", en: "Students" }, description: { bn: "এই শিক্ষকের বরাদ্দকৃত ক্লাসের শিক্ষার্থী।", en: "Students in the classes assigned to this teacher." } },
      { slug: "attendance", path: "/dashboard/teacher/attendance", label: { bn: "উপস্থিতি (Attendance)", en: "Attendance" }, description: { bn: "বরাদ্দকৃত ক্লাসের হাজিরা নিন ও দেখুন।", en: "Take and review attendance for the assigned classes." } },
      { slug: "analytics", path: "/dashboard/teacher/analytics", label: { bn: "অ্যানালিটিক্স (Analytics)", en: "Analytics" }, description: { bn: "এই শিক্ষকের ক্লাসে সীমিত বিশ্লেষণ।", en: "Analytics limited to this teacher's classes." } },
      { slug: "notifications", path: "/dashboard/teacher/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "profile", path: "/dashboard/teacher/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "ইনস্ট্রাক্টর রেকর্ডে লেখা হয় এমন শিক্ষক প্রোফাইল।", en: "Teacher profile written back to the Instructor record." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/teacher/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/teacher/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/teacher/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/teacher/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/teacher/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/teacher/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/teacher/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      { slug: "classes", path: "/dashboard/teacher/ai-pathshala/classes", label: { bn: "ক্লাস (Classes)", en: "Classes" }, description: { bn: "এই শিক্ষককে বরাদ্দ করা ক্লাস ও সেকশন।", en: "The classes and sections this teacher is assigned to." } },
      { slug: "assignments", path: "/dashboard/teacher/ai-pathshala/assignments", label: { bn: "অ্যাসাইনমেন্ট (Assignments)", en: "Assignments" }, description: { bn: "বরাদ্দকৃত ক্লাসের জন্য দেওয়া হোমওয়ার্ক ও অ্যাসাইনমেন্ট।", en: "Homework and assignments set for the assigned classes." } },
      { slug: "content", path: "/dashboard/teacher/ai-pathshala/content", label: { bn: "কনটেন্ট (Content)", en: "Content" }, description: { bn: "শিক্ষক যে লেসন কনটেন্ট ব্যবহার বা ক্লাসে যুক্ত করতে পারেন।", en: "Lesson content the teacher may use or attach to a class." } },
      { slug: "tutor-dataset", path: "/dashboard/teacher/ai-pathshala/tutor-dataset", label: { bn: "AI Tutor Dataset (AI Tutor Dataset)", en: "AI Tutor Dataset" }, description: { bn: "শিক্ষকের দৃষ্টিতে এআই টিউটর যে ডেটাসেট থেকে উত্তর দেয়।", en: "The dataset the AI tutor answers from, as the teacher sees it." } },
      { slug: "interventions", path: "/dashboard/teacher/ai-pathshala/interventions", label: { bn: "ইন্টারভেনশন (Interventions)", en: "Interventions" }, description: { bn: "পিছিয়ে পড়া শিক্ষার্থীর জন্য সহায়তা পরিকল্পনা।", en: "Support plans for students who fell behind." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "assigned-classes", path: "/dashboard/teacher/reports/assigned-classes", label: { bn: "নির্ধারিত ক্লাস (Assigned Classes)", en: "Assigned Classes" }, description: { bn: "এই শিক্ষককে বরাদ্দ করা ক্লাস, সংখ্যাসহ।", en: "The classes assigned to this teacher, with counts." } },
      { slug: "quiz-completion", path: "/dashboard/teacher/reports/quiz-completion", label: { bn: "কুইজ সম্পন্ন (Quiz Completion)", en: "Quiz Completion" }, description: { bn: "কতজন শিক্ষার্থী কুইজ শেষ করেছে।", en: "How many students finished their quizzes." } },
      { slug: "weak-topic-report", path: "/dashboard/teacher/reports/weak-topic-report", label: { bn: "দুর্বল টপিক রিপোর্ট (Weak Topic Report)", en: "Weak Topic Report" }, description: { bn: "ক্লাস সবচেয়ে বেশি যেসব টপিকে সমস্যায় পড়েছে।", en: "Topics the class struggled with most." } },
      { slug: "student-mastery", path: "/dashboard/teacher/reports/student-mastery", label: { bn: "শিক্ষার্থী মাস্টারি (Student Mastery)", en: "Student Mastery" }, description: { bn: "ক্লাসের প্রত্যেক শিক্ষার্থীর মাস্টারি অবস্থা।", en: "Mastery standing of every student in the class." } },
      { slug: "intervention-plans", path: "/dashboard/teacher/reports/intervention-plans", label: { bn: "ইন্টারভেনশন প্ল্যান (Intervention Plans)", en: "Intervention Plans" }, description: { bn: "খোলা, চলমান ও সমাপ্ত সহায়তা পরিকল্পনা।", en: "Intervention plans opened, running and closed." } },
      { slug: "ai-tutor-sessions", path: "/dashboard/teacher/reports/ai-tutor-sessions", label: { bn: "AI টিউটর সেশন (AI Tutor Sessions)", en: "AI Tutor Sessions" }, description: { bn: "এই শিক্ষকের শিক্ষার্থীদের সাথে হওয়া এআই টিউটর সেশন।", en: "AI Tutor sessions held with this teacher's students." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "নিজের ক্লাস দেখুন", en: "See your class" }, body: { bn: "‘শিক্ষার্থী’ খুলে আপনার ক্লাসের তালিকা দেখুন। খালি থাকলে প্রশাসকের কাছে আপনার ক্লাস বণ্টন (Teacher Class Assignment) ঠিক করার অনুরোধ করুন।", en: "Open Students for your class list. If it is empty, ask the administrator to fix your Teacher Class Assignment." } },
      { title: { bn: "হাজিরা দিন", en: "Mark attendance" }, body: { bn: "‘উপস্থিতি’ → তারিখ ও ক্লাস বেছে নিন → প্রত্যেককে উপস্থিত/অনুপস্থিত/ছুটি চিহ্নিত করুন → সেভ। সেভ করা মাত্র অভিভাবক ও প্রশাসক সেটি দেখতে পান।", en: "Attendance → pick date and class → mark each learner present/absent/leave → save. Parents and the administrator see it right away." } },
      { title: { bn: "পাঠ ও কুইজ তৈরি করুন", en: "Publish lessons and quizzes" }, body: { bn: "AI Pathshala → ‘Lessons’ থেকে পাঠ যোগ করুন, ‘Quizzes’ ও ‘Assessments’ থেকে পরীক্ষা; ‘Lesson Planner’ দিয়ে পুরো সপ্তাহের পরিকল্পনা সাজান। প্রকাশ করার আগে দেখে নিন ক্লাস ঠিক আছে কি না।", en: "In AI Pathshala add lessons under Lessons, set tests under Quizzes and Assessments, and plan the week with Lesson Planner. Check the class before publishing." } },
      { title: { bn: "শিক্ষার্থীর দুর্বলতা খুঁজুন", en: "Find who needs help" }, body: { bn: "‘Progress’, কুইজের ফল ও ‘Analytics’ দেখে যারা পিছিয়ে পড়ছে তাদের চিহ্নিত করুন, তারপর ‘Interventions’ থেকে সহায়তার পরিকল্পনা লিখুন — অভিভাবক এটি দেখতে পারেন।", en: "Use Progress, quiz results and Analytics to spot learners who are behind, then record the support plan in Interventions — parents can see it." } },
      { title: { bn: "অভিভাবকের সাথে যোগাযোগ", en: "Talk to parents" }, body: { bn: "অভিভাবকের পাঠানো বার্তা তার ‘Teacher Messages’ থেকে আসে; উত্তর দিন সংক্ষেপে ও সম্মানজনক ভাষায় — বার্তা সংরক্ষিত থাকে।", en: "Parent messages arrive through their Teacher Messages panel; reply briefly and politely — the thread is kept." } },
    ],
    tips: [
      { bn: "শ্রেণিকক্ষে ফোনে হাজিরা দিলে সেভ বোতামটি দুবার চাপবেন না — একবার চাপলেই জমা হয়।", en: "Marking attendance on a phone: press save once, it submits immediately." },
      { bn: "শিক্ষার্থীর ব্যক্তিগত সমস্যা কখনো পাঠের বর্ণনায় লিখবেন না — শুধু পড়ার জন্য প্রযোজ্য তথ্য লিখুন।", en: "Never put a learner's personal problems into lesson text — keep it learning-focused." },
    ],
  },
  {
    key: "parent",
    dashboardRoute: "/dashboard/parent",
    signingRoles: ["Shikkha Parent", "Parent", "Guardian"],
    title: { bn: "অভিভাবক", en: "Parent / Guardian" },
    who: { bn: "আপনি সন্তানের উপস্থিতি, ফলাফল, পড়ার সক্রিয়তা ও শিক্ষকের বার্তা দেখতে পাবেন।", en: "You follow your child's attendance, results, study activity and teacher messages." },
    roleNames: { bn: "Guardian / Parent / Shikkha Parent", en: "Guardian / Parent / Shikkha Parent" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.parent", "parent-route-panel.tsx", "roleAiPathshalaItems.parent"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "children", path: "/dashboard/parent/children", label: { bn: "সন্তান (Children)", en: "Children" }, description: { bn: "এই অভিভাবক অ্যাকাউন্টের সাথে যুক্ত সন্তান।", en: "The children linked to this guardian account." } },
      { slug: "link-child", path: "/dashboard/parent/link-child", label: { bn: "সন্তান লিংক (Link Child)", en: "Link Child" }, description: { bn: "স্কুলের দেওয়া কোড দিয়ে অ্যাকাউন্টে আরেক সন্তান যুক্ত করুন।", en: "Link another child to the account with the school-issued code." } },
      { slug: "attendance", path: "/dashboard/parent/attendance", label: { bn: "উপস্থিতি (Attendance)", en: "Attendance" }, description: { bn: "সংযুক্ত সন্তানের উপস্থিতি রেকর্ড।", en: "Attendance record of the linked child." } },
      { slug: "tutor-data", path: "/dashboard/parent/tutor-data", label: { bn: "টিউটর ডেটা (Tutor Data)", en: "Tutor Data" }, description: { bn: "এআই টিউটর এই সন্তান সম্পর্কে কী পড়েছে এবং কেন।", en: "What the AI tutor has read about this child and why." } },
      { slug: "parent-insights", path: "/dashboard/parent/parent-insights", label: { bn: "অভিভাবক ইনসাইট (Parent Insights)", en: "Parent Insights" }, description: { bn: "সন্তানের পড়াশোনা নিয়ে সাপ্তাহিক সহজ ভাষার অন্তর্দৃষ্টি।", en: "Weekly plain-language insight about the child's learning." } },
      { slug: "teacher-messages", path: "/dashboard/parent/teacher-messages", label: { bn: "শিক্ষক মেসেজ (Teacher Messages)", en: "Teacher Messages" }, description: { bn: "সন্তানের শিক্ষকদের সাথে আদান-প্রদান করা বার্তা।", en: "Messages exchanged with the child's teachers." } },
      { slug: "notifications", path: "/dashboard/parent/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "support", path: "/dashboard/parent/support", label: { bn: "সহায়তা (Support)", en: "Support" }, description: { bn: "স্কুলে সমস্যা জানান এবং তার উত্তর অনুসরণ করুন।", en: "Raise a problem with the school and follow its answer." } },
      { slug: "profile", path: "/dashboard/parent/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "অভিভাবক অ্যাকাউন্টের তথ্য, সম্পাদনার সুযোগসহ।", en: "Guardian account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/parent/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/parent/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/parent/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/parent/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/parent/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/parent/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/parent/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      { slug: "assessment-results", path: "/dashboard/parent/ai-pathshala/assessment-results", label: { bn: "অ্যাসেসমেন্ট ফলাফল (Assessment Results)", en: "Assessment Results" }, description: { bn: "সংযুক্ত সন্তানের অ্যাসেসমেন্ট ফলাফল।", en: "Assessment results for the linked child." } },
      { slug: "study-activity", path: "/dashboard/parent/ai-pathshala/study-activity", label: { bn: "স্টাডি অ্যাক্টিভিটি (Study Activity)", en: "Study Activity" }, description: { bn: "সন্তান প্রতিদিন কত ও কতবার পড়েছে।", en: "How much and how often the child studied, per day." } },
      { slug: "reports", path: "/dashboard/parent/ai-pathshala/reports", label: { bn: "রিপোর্ট (Reports)", en: "Reports" }, description: { bn: "এআই পাঠশালা গ্রুপের ভেতরের রিপোর্ট।", en: "Reports inside the AI Pathshala group." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "linked-child-progress", path: "/dashboard/parent/reports/linked-child-progress", label: { bn: "যুক্ত সন্তানের অগ্রগতি (Linked Child Progress)", en: "Linked Child Progress" }, description: { bn: "সংযুক্ত সন্তানের অগ্রগতি, এক স্ক্রিনে।", en: "Progress of the linked child, one screen." } },
      { slug: "attendance-summary", path: "/dashboard/parent/reports/attendance-summary", label: { bn: "উপস্থিতি সারাংশ (Attendance Summary)", en: "Attendance Summary" }, description: { bn: "সংযুক্ত সন্তানের উপস্থিতির সারসংক্ষেপ।", en: "Attendance summary for the linked child." } },
      { slug: "weekly-parent-insight", path: "/dashboard/parent/reports/weekly-parent-insight", label: { bn: "সাপ্তাহিক অভিভাবক ইনসাইট (Weekly Parent Insight)", en: "Weekly Parent Insight" }, description: { bn: "এই সপ্তাহের সন্তান-বিষয়ক অন্তর্দৃষ্টি।", en: "This week's insight about the child." } },
      { slug: "weak-topic-alerts", path: "/dashboard/parent/reports/weak-topic-alerts", label: { bn: "দুর্বল টপিক সতর্কতা (Weak Topic Alerts)", en: "Weak Topic Alerts" }, description: { bn: "সন্তান কোনো টপিকে পিছিয়ে পড়লে সতর্কবার্তা।", en: "Alerts when the child struggles with a topic." } },
      { slug: "teacher-interventions", path: "/dashboard/parent/reports/teacher-interventions", label: { bn: "শিক্ষকের ইন্টারভেনশন (Teacher Interventions)", en: "Teacher Interventions" }, description: { bn: "শিক্ষক সন্তানের জন্য যে সহায়তা পরিকল্পনা খুলেছেন।", en: "Interventions the teacher has opened for the child." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "সন্তান যুক্ত করুন", en: "Link your child" }, body: { bn: "‘Link Child’ → সন্তানের আইডি (Student ID) বা ইমেইল দিয়ে সংযোগ করুন। একাধিক সন্তান থাকলে সবাইকে আলাদা করে যোগ করা যায়; তালিকা দেখতে ‘Children’ খুলুন।", en: "Link Child → connect with your child's Student ID or email. Add each child separately; see them all under Children." } },
      { title: { bn: "উপস্থিতি", en: "Attendance" }, body: { bn: "‘Attendance’-এ দিন-ভিত্তিক উপস্থিতি দেখুন। টানা অনুপস্থিতি দেখলে শিক্ষকের সাথে যোগাযোগ করুন।", en: "Attendance shows day-by-day presence. If absences repeat, contact the teacher." } },
      { title: { bn: "ফলাফল", en: "Results" }, body: { bn: "AI Pathshala → ‘Assessment Results’-এ কুইজ ও মূল্যায়নের ফলাফল; ‘Reports’ থেকে সারসংক্ষেপ।", en: "Assessment Results in AI Pathshala shows quiz and assessment marks; Reports gives the summary." } },
      { title: { bn: "পড়ার সক্রিয়তা", en: "Study activity" }, body: { bn: "‘Study Activity’ দেখায় সন্তান কতটুকু পড়েছে/অনুশীলন করেছে; ‘Tutor Data’ দেখায় সহায়ক শিক্ষক ব্যবহারের ধরন; ‘Parent Insights’ দেয় সাপ্তাহিক ধারণা।", en: "Study Activity shows how much your child studied, Tutor Data how they use the AI tutor, and Parent Insights the weekly picture." } },
      { title: { bn: "শিক্ষককে বার্তা ও সহায়তা", en: "Message the teacher, get support" }, body: { bn: "‘Teacher Messages’ থেকে বার্তা পাঠান (সংক্ষেপে, সন্তানের নাম ও ক্লাস লিখে)। অন্য যেকোনো সমস্যায় ‘Support’ ব্যবহার করুন।", en: "Send messages from Teacher Messages (briefly, with your child's name and class). Use Support for anything else." } },
    ],
    tips: [
      { bn: "সন্তান যুক্ত না হলে আইডিটি অফিসে যাচাই করে নিন — বানান এক অক্ষর আলাদা হলেই সংযোগ হয় না।", en: "If linking fails, verify the ID with the office — one wrong letter is enough to block it." },
      { bn: "সাপ্তাহিক ‘Parent Insights’ একবার পড়ে নিলেই সন্তানের দুর্বল বিষয় পরিষ্কার বোঝা যায়।", en: "One weekly look at Parent Insights makes the weak subjects clear." },
    ],
  },
  {
    key: "content-reviewer",
    dashboardRoute: "/dashboard/content-reviewer",
    signingRoles: ["Shikkha Content Reviewer", "Content Reviewer", "Shikkha Content Creator", "Content Creator"],
    title: { bn: "কনটেন্ট রিভিউয়ার", en: "Content reviewer" },
    who: { bn: "AI Pathshala-র পাঠ, প্রশ্ন ও উপকরণ যাচাই করে অনুমোদন বা ফেরত পাঠানো আপনার কাজ।", en: "You check lessons, questions and material for AI Pathshala and either approve them or send them back." },
    roleNames: { bn: "Content Reviewer / Shikkha Content Reviewer", en: "Content Reviewer / Shikkha Content Reviewer" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.content-reviewer", "role-dashboard-content.tsx › ContentReviewerPanel"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "review-queue", path: "/dashboard/content-reviewer/review-queue", label: { bn: "রিভিউ কিউ (Review Queue)", en: "Review Queue" }, description: { bn: "গুণমান পর্যালোচনার জন্য জমা দেওয়া নতুন কনটেন্ট।", en: "New content submitted for quality review." } },
      { slug: "content-datasets", path: "/dashboard/content-reviewer/content-datasets", label: { bn: "AI Tutor Datasets (AI Tutor Datasets)", en: "AI Tutor Datasets" }, description: { bn: "AI টিউটর প্রশিক্ষণের জন্য দেওয়া লেসন ডেটাসেট, ব্যবহারের আগে পর্যালোচনা করা হয়।", en: "Lesson datasets supplied for AI Tutor training, reviewed before use." } },
      { slug: "approved", path: "/dashboard/content-reviewer/approved", label: { bn: "অনুমোদিত (Approved)", en: "Approved" }, description: { bn: "যা ইতিমধ্যে অনুমোদিত ও শিক্ষার্থীদের জন্য চালু।", en: "Everything already approved and live for learners." } },
      { slug: "rejected", path: "/dashboard/content-reviewer/rejected", label: { bn: "রিজেক্টেড (Rejected)", en: "Rejected" }, description: { bn: "পর্যালোচকের কারণসহ বাতিল হওয়া আইটেম, সংশোধনের জন্য প্রস্তুত।", en: "Rejected items with the reviewer's reason, ready to be corrected." } },
      { slug: "revision-requests", path: "/dashboard/content-reviewer/revision-requests", label: { bn: "রিভিশন অনুরোধ (Revision Requests)", en: "Revision Requests" }, description: { bn: "লেখককে সংশোধন করে পুনরায় জমা দিতে বলা চলমান অনুরোধ।", en: "Open requests asking the author to change and resubmit." } },
      { slug: "review-history", path: "/dashboard/content-reviewer/review-history", label: { bn: "রিভিউ ইতিহাস (Review History)", en: "Review History" }, description: { bn: "প্রতিটি পর্যালোচনা সিদ্ধান্তের সময় ও পর্যালোচকসহ পূর্ণ ইতিহাস।", en: "Full audit trail of every review decision with time and reviewer." } },
      { slug: "guidelines", path: "/dashboard/content-reviewer/guidelines", label: { bn: "গাইডলাইন (Guidelines)", en: "Guidelines" }, description: { bn: "এই ভূমিকার পর্যালোচনা মান ও গুণমান-চেকলিস্ট।", en: "The review standards and quality checklist for this role." } },
      { slug: "notifications", path: "/dashboard/content-reviewer/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "নতুন জমা ও সংশোধনের কার্যক্রম।", en: "New submissions and revision activity." } },
      { slug: "profile", path: "/dashboard/content-reviewer/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "লগইন করা ব্যক্তির নিজের অ্যাকাউন্ট তথ্য, সম্পাদনার সুযোগসহ।", en: "The signed-in person's own account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/content-reviewer/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/content-reviewer/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/content-reviewer/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/content-reviewer/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/content-reviewer/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/content-reviewer/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/content-reviewer/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "অপেক্ষমাণ কাজ দেখা", en: "See what is waiting" }, body: { bn: "‘Review Queue’ খুললে যাচাইয়ের অপেক্ষায় থাকা আইটেমগুলো ক্রম অনুযায়ী আসে।", en: "Review Queue lists the items waiting for a decision, oldest first." } },
      { title: { bn: "অনুমোদন বা বাতিল", en: "Approve or reject" }, body: { bn: "পড়ে ‘Approve’ দিন অথবা ‘Reject’ করে কারণ লিখুন। কারণটি শিক্ষক হুবহু দেখতে পান, তাই স্পষ্ট ও ভদ্র ভাষায় লিখুন।", en: "Read it, then Approve, or Reject with a reason. The teacher sees that reason word for word — be clear and polite." } },
      { title: { bn: "সংশোধন চাওয়া", en: "Ask for a revision" }, body: { bn: "বাতিল না করে ছোট পরিবর্তন দরকার হলে ‘Revision Requests’ ব্যবহার করুন — শিক্ষক ঠিক করে আবার জমা দিতে পারেন।", en: "For a small fix use Revision Requests instead of rejecting — the teacher corrects and resubmits." } },
      { title: { bn: "নিয়ম মেনে চলা", en: "Follow the guidelines" }, body: { bn: "‘Guidelines’-এ লেখা নীতি মেনে চলুন: ভাষার মান, বয়স-উপযোগী বিষয় এবং ব্যক্তিগত তথ্য না থাকা।", en: "Work to Guidelines: language quality, age-appropriate content and no personal data." } },
      { title: { bn: "নিজের সিদ্ধান্ত দেখা", en: "See your decisions" }, body: { bn: "আগের সিদ্ধান্ত ‘Review History’-তে এবং অনুমোদিত/বাতিল তালিকা ‘Approved’ ও ‘Rejected’-এ থাকে।", en: "Past decisions live in Review History; approved and rejected lists are under Approved and Rejected." } },
    ],
    tips: [
      { bn: "সন্দেহ হলে বাতিল না করে প্রশ্ন করুন — কম সময়ে বেশি কাজ হয়।", en: "When unsure, ask instead of rejecting — it saves everyone time." },
      { bn: "শিক্ষার্থীর নাম, ছবি বা ফোন নম্বর কোথাও থাকলে সাথে সাথে বাতিল করুন।", en: "Reject immediately if a learner's name, photo or phone number appears anywhere." },
    ],
  },
  {
    key: "ai-safety-reviewer",
    dashboardRoute: "/dashboard/ai-safety-reviewer",
    signingRoles: ["AI Safety Reviewer"],
    title: { bn: "AI নিরাপত্তা রিভিউয়ার", en: "AI safety reviewer" },
    who: { bn: "AI Tutor-এর ঝুঁকিপূর্ণ ব্যবহার, সতর্কবার্তা, তদন্ত ও নীতি দেখা আপনার দায়িত্ব।", en: "You watch risky AI usage, safety events, investigations and policy." },
    roleNames: { bn: "AI Safety Reviewer", en: "AI Safety Reviewer" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.ai-safety-reviewer", "ai-safety-reviewer-panel.tsx"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "dashboard", path: "/dashboard/ai-safety-reviewer", label: { bn: "ড্যাশবোর্ড (Dashboard)", en: "Dashboard" }, description: { bn: "এআই নিরাপত্তা ওভারভিউ: চলমান ঘটনা, এসক্যালেশন ও সাম্প্রতিক সিদ্ধান্ত।", en: "AI safety overview: open events, escalations and recent decisions." } },
      { slug: "local-data", path: "/dashboard/ai-safety-reviewer/local-data", label: { bn: "লোকাল ডেটা (Local Data)", en: "Local Data" }, description: { bn: "এআই যে স্কুল-স্থানীয় ডেটা পড়তে পারে।", en: "The school-local data the AI is allowed to read." } },
      { slug: "ai-data", path: "/dashboard/ai-safety-reviewer/ai-data", label: { bn: "AI ডেটা (AI Data)", en: "AI Data" }, description: { bn: "এআই-সাইড ডেটাসেট ও সেশনগুলোতে তার ব্যবহার।", en: "AI-side datasets and how they were used in sessions." } },
      { slug: "review-queue", path: "/dashboard/ai-safety-reviewer/review-queue", label: { bn: "AI রিভিউ কিউ (AI Review Queue)", en: "AI Review Queue" }, description: { bn: "নিরাপত্তা সিদ্ধান্তের অপেক্ষায় থাকা এআই কনটেন্ট।", en: "AI content waiting for a safety decision." } },
      { slug: "safety-events", path: "/dashboard/ai-safety-reviewer/safety-events", label: { bn: "AI সেফটি ইভেন্ট (AI Safety Events)", en: "AI Safety Events" }, description: { bn: "রেকর্ড করা প্রতিটি এআই নিরাপত্তা ঘটনা, নতুনটি আগে।", en: "Every recorded AI safety event, newest first." } },
      { slug: "flagged-content", path: "/dashboard/ai-safety-reviewer/flagged-content", label: { bn: "ফ্ল্যাগড AI মেসেজ (Flagged AI Messages)", en: "Flagged AI Messages" }, description: { bn: "পর্যালোচনার জন্য ফ্ল্যাগ করা এআই বার্তা ও উত্তর।", en: "AI messages and replies that were flagged for review." } },
      { slug: "tutor-sessions", path: "/dashboard/ai-safety-reviewer/tutor-sessions", label: { bn: "AI টিউটর সেশন (AI Tutor Sessions)", en: "AI Tutor Sessions" }, description: { bn: "AI টিউটরের কথোপকথন, শিক্ষার্থী-সেশন ধরে খোলা যায়।", en: "AI Tutor conversations, openable per student session." } },
      { slug: "escalations", path: "/dashboard/ai-safety-reviewer/escalations", label: { bn: "এসক্যালেশন (Escalations)", en: "Escalations" }, description: { bn: "কারণসহ ঊর্ধ্বতন পর্যালোচকের কাছে পাঠানো ঘটনা।", en: "Events escalated to a higher reviewer, with the reason." } },
      { slug: "investigations", path: "/dashboard/ai-safety-reviewer/investigations", label: { bn: "ইনভেস্টিগেশন (Investigations)", en: "Investigations" }, description: { bn: "দায়িত্বপ্রাপ্ত ও ফলাফলসহ চলমান তদন্ত।", en: "Active investigations with owners and findings." } },
      { slug: "resolved", path: "/dashboard/ai-safety-reviewer/resolved", label: { bn: "রিজলভড AI কেস (Resolved AI Cases)", en: "Resolved AI Cases" }, description: { bn: "যে পদক্ষেপে সমাধান হয়েছে তা সহ বন্ধ হওয়া এআই কেস।", en: "Closed AI cases with the action that resolved them." } },
      { slug: "policies", path: "/dashboard/ai-safety-reviewer/policies", label: { bn: "AI সেফটি পলিসি (AI Safety Policies)", en: "AI Safety Policies" }, description: { bn: "পর্যালোচনা সিদ্ধান্ত যে এআই নিরাপত্তা নীতিমালা অনুসরণ করে।", en: "The AI safety policy set the review decisions follow." } },
      { slug: "audit-history", path: "/dashboard/ai-safety-reviewer/audit-history", label: { bn: "AI অডিট ইতিহাস (AI Audit History)", en: "AI Audit History" }, description: { bn: "এআই নিরাপত্তা পদক্ষেপ ও পর্যালোচকদের কালানুক্রমিক অডিট।", en: "Chronological audit of AI safety actions and reviewers." } },
      { slug: "reports", path: "/dashboard/ai-safety-reviewer/reports", label: { bn: "AI রিপোর্ট (AI Reports)", en: "AI Reports" }, description: { bn: "এআই নিরাপত্তা রিপোর্ট: ঘটনা, এসক্যালেশন ও নীতিমালার ব্যবহার।", en: "AI safety reports: events, escalations and policy use." } },
      { slug: "notifications", path: "/dashboard/ai-safety-reviewer/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "নিরাপত্তা সতর্কবার্তা ও কেস নোটিফিকেশন।", en: "Safety alerts and case notifications." } },
      { slug: "profile", path: "/dashboard/ai-safety-reviewer/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "লগইন করা ব্যক্তির নিজের অ্যাকাউন্ট তথ্য, সম্পাদনার সুযোগসহ।", en: "The signed-in person's own account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/ai-safety-reviewer/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/ai-safety-reviewer/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/ai-safety-reviewer/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/ai-safety-reviewer/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/ai-safety-reviewer/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/ai-safety-reviewer/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/ai-safety-reviewer/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "open-safety-events", path: "/dashboard/ai-safety-reviewer/reports/open-safety-events", label: { bn: "ওপেন সেফটি ইভেন্ট (Open Safety Events)", en: "Open Safety Events" }, description: { bn: "এখনো খোলা থাকা নিরাপত্তা ঘটনা, পুরনোটি আগে।", en: "Safety events still open, oldest first." } },
      { slug: "escalation-trend", path: "/dashboard/ai-safety-reviewer/reports/escalation-trend", label: { bn: "এসক্যালেশন ট্রেন্ড (Escalation Trend)", en: "Escalation Trend" }, description: { bn: "সময়ের সাথে এসক্যালেশনের গতি।", en: "How escalations moved over time." } },
      { slug: "policy-codes", path: "/dashboard/ai-safety-reviewer/reports/policy-codes", label: { bn: "পলিসি কোড (Policy Codes)", en: "Policy Codes" }, description: { bn: "প্রতিটি সিদ্ধান্তে উল্লেখ করা নীতিমালা কোড।", en: "Which policy code each decision cited." } },
      { slug: "audit-history", path: "/dashboard/ai-safety-reviewer/reports/audit-history", label: { bn: "অডিট ইতিহাস (Audit History)", en: "Audit History" }, description: { bn: "এআই নিরাপত্তা পদক্ষেপ ও পর্যালোচকদের কালানুক্রমিক অডিট।", en: "Chronological audit of AI safety actions and reviewers." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "দ্রুত চিত্র নিন", en: "Get the quick picture" }, body: { bn: "‘Dashboard’ থেকে সারসংক্ষেপ দেখুন, তারপর ‘AI Review Queue’ ও ‘Flagged AI Messages’-এ যান।", en: "Read the Dashboard summary, then open AI Review Queue and Flagged AI Messages." } },
      { title: { bn: "জরুরি আগে", en: "Urgent first" }, body: { bn: "‘AI Safety Events’ ও ‘Escalations’ সবচেয়ে আগে দেখুন — শিশুর নিরাপত্তা সংক্রান্ত বিষয় সবসময় অগ্রাধিকার পায়।", en: "Handle AI Safety Events and Escalations first — anything touching a child's safety takes priority." } },
      { title: { bn: "তদন্ত চালানো", en: "Run an investigation" }, body: { bn: "‘Investigations’-এ নতুন তদন্ত খুলে যা পেয়েছেন তা ধাপে ধাপে লিখুন (তারিখ, সময়, কী ঘটেছে) — পরে দল সেটি পড়ে সিদ্ধান্ত নেয়।", en: "Open a record in Investigations and write what you found, step by step (date, time, what happened) — the team reads it later." } },
      { title: { bn: "নিষ্পত্তি করা", en: "Close the case" }, body: { bn: "সমাধান হলে ‘Resolved AI Cases’-এ বন্ধ করুন; সমাধানের সংক্ষিপ্ত কারণ লিখুন যাতে পরে কেউ বুঝতে পারে।", en: "When settled, close it in Resolved AI Cases with a short reason so the next person understands." } },
      { title: { bn: "নীতি ও ইতিহাস", en: "Policy and audit trail" }, body: { bn: "‘AI Safety Policies’-এ নিয়ম, ‘AI Audit History’-তে কে কী করেছে তার ইতিহাস এবং ‘AI Reports’-এ সামগ্রিক প্রতিবেদন।", en: "AI Safety Policies holds the rules, AI Audit History who did what, AI Reports the summary." } },
    ],
    tips: [
      { bn: "রিপোর্টে শিক্ষার্থীর নাম, ছবি বা কথোপকথন হুবহু কপি করবেন না — রেকর্ড নম্বর দিয়ে উল্লেখ করুন।", en: "Never paste a learner's name, photo or full conversation into a report — cite the record number." },
      { bn: "একই ঘটনা দুইবার দেখলে আগের তদন্তের সাথে সংযুক্ত করুন, নতুন করে খুলবেন না।", en: "If you see the same incident twice, link it to the earlier investigation instead of opening a new one." },
    ],
  },
  {
    key: "ngo-admin",
    dashboardRoute: "/dashboard/ngo-admin",
    signingRoles: ["NGO Admin"],
    title: { bn: "এনজিও অ্যাডমিন", en: "NGO admin" },
    who: { bn: "একাধিক প্রতিষ্ঠান নিয়ে চলা শিক্ষা প্রকল্পের তত্ত্বাবধান আপনার হাতে।", en: "You oversee an education programme that runs across several institutions." },
    roleNames: { bn: "NGO Admin", en: "NGO Admin" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.ngo-admin", "ngo-admin-panel.tsx"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "programs", path: "/dashboard/ngo-admin/programs", label: { bn: "প্রোগ্রাম (Programs)", en: "Programs" }, description: { bn: "এনজিওর পরিচালিত শিক্ষা কর্মসূচি, স্কুল ও লক্ষ্যমাত্রাসহ।", en: "Education programmes run by the NGO, with schools and targets." } },
      { slug: "institutions", path: "/dashboard/ngo-admin/institutions", label: { bn: "প্রতিষ্ঠান (Institutions)", en: "Institutions" }, description: { bn: "এনজিও পরিচালিত ও পার্টনার প্রতিষ্ঠান।", en: "NGO-run and partner institutions in the portfolio." } },
      { slug: "schools", path: "/dashboard/ngo-admin/schools", label: { bn: "স্কুল (Schools)", en: "Schools" }, description: { bn: "প্রতিটি কর্মসূচির আওতাভুক্ত স্কুল, অবস্থান ও অবস্থাসহ।", en: "Schools covered by each programme, with location and status." } },
      { slug: "learners", path: "/dashboard/ngo-admin/learners", label: { bn: "লার্নার (Learners)", en: "Learners" }, description: { bn: "কর্মসূচিতে অন্তর্ভুক্ত শিক্ষার্থী, কোহোর্ট ও অগ্রগতিসহ।", en: "Learners reached by the programme, with cohort and progress." } },
      { slug: "teachers", path: "/dashboard/ngo-admin/teachers", label: { bn: "শিক্ষক (Teachers)", en: "Teachers" }, description: { bn: "কর্মসূচির প্রতিষ্ঠানে কর্মরত শিক্ষক।", en: "Teachers working inside programme institutions." } },
      { slug: "interventions", path: "/dashboard/ngo-admin/interventions", label: { bn: "ইন্টারভেনশন (Interventions)", en: "Interventions" }, description: { bn: "পিছিয়ে পড়া শিক্ষার্থীর জন্য সহায়তা পরিকল্পনা।", en: "Support plans for students who fell behind." } },
      { slug: "learning-outcomes", path: "/dashboard/ngo-admin/learning-outcomes", label: { bn: "লার্নিং আউটকাম (Learning Outcomes)", en: "Learning Outcomes" }, description: { bn: "কর্মসূচি ও কোহোর্টভিত্তিক ফলাফল।", en: "Outcome results per programme and cohort." } },
      { slug: "impact-analytics", path: "/dashboard/ngo-admin/impact-analytics", label: { bn: "ইমপ্যাক্ট অ্যানালিটিক্স (Impact Analytics)", en: "Impact Analytics" }, description: { bn: "সব কর্মসূচি ও জেলা জুড়ে প্রভাব-বিশ্লেষণ।", en: "Impact analytics across all programmes and districts." } },
      { slug: "reports", path: "/dashboard/ngo-admin/reports", label: { bn: "রিপোর্ট (Reports)", en: "Reports" }, description: { bn: "দাতাদের জন্য কর্মসূচি ও প্রতিষ্ঠান রিপোর্ট।", en: "Programme and institution reports for donors." } },
      { slug: "data-exports", path: "/dashboard/ngo-admin/data-exports", label: { bn: "ডেটা এক্সপোর্ট (Data Exports)", en: "Data Exports" }, description: { bn: "দাতা ও অভ্যন্তরীণ প্রতিবেদনের জন্য কর্মসূচির ডেটা ডাউনলোড।", en: "Download programme data for donors and internal reporting." } },
      { slug: "notifications", path: "/dashboard/ngo-admin/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "settings", path: "/dashboard/ngo-admin/settings", label: { bn: "সেটিংস (Settings)", en: "Settings" }, description: { bn: "প্রতিষ্ঠানের সেটিংস: পরিচিতি, সেশন, গ্রেডিং ও যোগাযোগ।", en: "Institution settings: identity, session, grading and contact details." } },
      { slug: "profile", path: "/dashboard/ngo-admin/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "লগইন করা ব্যক্তির নিজের অ্যাকাউন্ট তথ্য, সম্পাদনার সুযোগসহ।", en: "The signed-in person's own account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/ngo-admin/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/ngo-admin/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/ngo-admin/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/ngo-admin/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/ngo-admin/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/ngo-admin/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/ngo-admin/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "program-impact", path: "/dashboard/ngo-admin/reports/program-impact", label: { bn: "প্রোগ্রাম ইমপ্যাক্ট (Program Impact)", en: "Program Impact" }, description: { bn: "কর্মসূচি ধরে ধরে প্রভাবের সারসংক্ষেপ।", en: "Programme-by-programme impact summary." } },
      { slug: "institution-coverage", path: "/dashboard/ngo-admin/reports/institution-coverage", label: { bn: "প্রতিষ্ঠান কাভারেজ (Institution Coverage)", en: "Institution Coverage" }, description: { bn: "প্রতিটি কর্মসূচি কত প্রতিষ্ঠানে পৌঁছেছে।", en: "How many institutions each programme reaches." } },
      { slug: "learning-outcomes", path: "/dashboard/ngo-admin/reports/learning-outcomes", label: { bn: "লার্নিং আউটকাম (Learning Outcomes)", en: "Learning Outcomes" }, description: { bn: "কর্মসূচি ও কোহোর্টভিত্তিক ফলাফল।", en: "Outcome results per programme and cohort." } },
      { slug: "beneficiary-reach", path: "/dashboard/ngo-admin/reports/beneficiary-reach", label: { bn: "উপকারভোগী রিচ (Beneficiary Reach)", en: "Beneficiary Reach" }, description: { bn: "জেলা ধরে পৌঁছানো শিক্ষার্থী ও স্কুল।", en: "Learners and schools reached, per district." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "প্রকল্প তৈরি করুন", en: "Create the programme" }, body: { bn: "‘Programs’ → নতুন প্রকল্প (নাম, সময়কাল, লক্ষ্য) → সেভ।", en: "Programs → new programme (name, period, target) → save." } },
      { title: { bn: "প্রতিষ্ঠান যোগ করুন", en: "Add institutions" }, body: { bn: "‘Institutions’ ও ‘Schools’-এ অংশগ্রহণকারী প্রতিষ্ঠানগুলো যোগ করুন, তারপর ‘Learners’ ও ‘Teachers’ যুক্ত করুন।", en: "Add participating institutions under Institutions and Schools, then add Learners and Teachers." } },
      { title: { bn: "উদ্যোগ ও ফলাফল", en: "Interventions and outcomes" }, body: { bn: "‘Interventions’-এ সহায়তার কাজ লিখুন, ‘Learning Outcomes’-এ ফলাফল মাপুন — এ দুটিই প্রকল্পের প্রমাণ।", en: "Record the support work in Interventions and measure results in Learning Outcomes — together they are your evidence." } },
      { title: { bn: "প্রভাব দেখুন", en: "See the impact" }, body: { bn: "‘Impact Analytics’ ও রিপোর্ট তালিকা (Program Impact, Institution Coverage, Learning Outcomes, Beneficiary Reach) দিয়ে অগ্রগতি দেখুন।", en: "Use Impact Analytics and the reports (program impact, institution coverage, learning outcomes, beneficiary reach)." } },
      { title: { bn: "তথ্য রপ্তানি", en: "Export data" }, body: { bn: "‘Data Exports’ থেকে ফাইল নামিয়ে নিন — প্রতিবেদন বা দাতার কাছে পাঠানোর জন্য।", en: "Download files from Data Exports for reports or donors." } },
    ],
    tips: [
      { bn: "রপ্তানি করা ফাইলে ব্যক্তিগত তথ্য থাকে — শেয়ার করার আগে অনুমতি ও গোপনীয়তার শর্ত মেনে চলুন।", en: "Exports carry personal data — follow your consent and privacy rules before sharing." },
      { bn: "প্রতিষ্ঠান যোগ করার আগে নামের বানান একই রাখুন, নাহলে একই স্কুল দুইবার যুক্ত হতে পারে।", en: "Keep institution names spelled the same, or the same school ends up listed twice." },
    ],
  },
  {
    key: "government-officer",
    dashboardRoute: "/dashboard/government-officer",
    signingRoles: ["Government Officer"],
    title: { bn: "সরকারি কর্মকর্তা", en: "Government officer" },
    who: { bn: "জেলা/উপজেলাভিত্তিক শিক্ষার চিত্র — ভর্তি, উপস্থিতি, ফলাফল, সমতা ও নিরাপত্তা দেখা আপনার কাজ।", en: "You review the district-level picture: enrolment, attendance, outcomes, equity and safety." },
    roleNames: { bn: "Government Officer", en: "Government Officer" },
    sourceFiles: ["dashboard-shell.tsx › roleModuleItems.government-officer", "government-officer-panel.tsx"],
    menuGroups: [
    {
      key: "modules",
      title: { bn: "সাইডবার মডিউল", en: "Sidebar modules" },
      items: [
      { slug: "institutions", path: "/dashboard/government-officer/institutions", label: { bn: "প্রতিষ্ঠান (Institutions)", en: "Institutions" }, description: { bn: "জেলা ও অবস্থাসহ সব পর্যবেক্ষণাধীন প্রতিষ্ঠান।", en: "All monitored institutions with district and status." } },
      { slug: "districts", path: "/dashboard/government-officer/districts", label: { bn: "জেলা (Districts)", en: "Districts" }, description: { bn: "জেলাভিত্তিক প্রতিষ্ঠান, ভর্তি ও ফলাফলের দৃশ্য।", en: "District-wise view of institutions, enrollment and results." } },
      { slug: "programs", path: "/dashboard/government-officer/programs", label: { bn: "প্রোগ্রাম (Programs)", en: "Programs" }, description: { bn: "সরকারি শিক্ষা কর্মসূচি ও তাদের লক্ষ্যমাত্রা।", en: "Government education programmes and their targets." } },
      { slug: "enrollment", path: "/dashboard/government-officer/enrollment", label: { bn: "এনরোলমেন্ট (Enrollment)", en: "Enrollment" }, description: { bn: "প্রতিষ্ঠান ও জেলাভিত্তিক ভর্তির সংখ্যা ও প্রবণতা।", en: "Enrollment counts and trends per institution and district." } },
      { slug: "attendance", path: "/dashboard/government-officer/attendance", label: { bn: "উপস্থিতি (Attendance)", en: "Attendance" }, description: { bn: "পর্যবেক্ষণাধীন প্রতিষ্ঠান জুড়ে উপস্থিতির হার।", en: "Attendance rates across monitored institutions." } },
      { slug: "learning-outcomes", path: "/dashboard/government-officer/learning-outcomes", label: { bn: "লার্নিং আউটকাম (Learning Outcomes)", en: "Learning Outcomes" }, description: { bn: "কর্মসূচি ও কোহোর্টভিত্তিক ফলাফল।", en: "Outcome results per programme and cohort." } },
      { slug: "equity-indicators", path: "/dashboard/government-officer/equity-indicators", label: { bn: "ইকুইটি ইন্ডিকেটর (Equity Indicators)", en: "Equity Indicators" }, description: { bn: "সমতা সূচক: লিঙ্গ, অবস্থান ও প্রবেশগত বৈষম্য।", en: "Equity indicators: gender, location and access gaps." } },
      { slug: "safety-overview", path: "/dashboard/government-officer/safety-overview", label: { bn: "সেফটি ওভারভিউ (Safety Overview)", en: "Safety Overview" }, description: { bn: "পর্যবেক্ষণাধীন প্রতিষ্ঠান জুড়ে সমন্বিত এআই নিরাপত্তা চিত্র।", en: "Aggregate AI safety picture across monitored institutions." } },
      { slug: "analytics", path: "/dashboard/government-officer/analytics", label: { bn: "অ্যানালিটিক্স (Analytics)", en: "Analytics" }, description: { bn: "তত্ত্বাবধানের সিদ্ধান্তের জন্য জেলা-স্তরের বিশ্লেষণ।", en: "District-level analytics for oversight decisions." } },
      { slug: "reports", path: "/dashboard/government-officer/reports", label: { bn: "রিপোর্ট (Reports)", en: "Reports" }, description: { bn: "এই ভূমিকার পরিধির সমন্বিত রিপোর্ট।", en: "Consolidated reports for this role's scope." } },
      { slug: "data-exports", path: "/dashboard/government-officer/data-exports", label: { bn: "ডেটা এক্সপোর্ট (Data Exports)", en: "Data Exports" }, description: { bn: "দাতা ও অভ্যন্তরীণ প্রতিবেদনের জন্য কর্মসূচির ডেটা ডাউনলোড।", en: "Download programme data for donors and internal reporting." } },
      { slug: "notifications", path: "/dashboard/government-officer/notifications", label: { bn: "নোটিফিকেশন (Notifications)", en: "Notifications" }, description: { bn: "এই ভূমিকার জন্য ঘোষণা ও সতর্কবার্তা।", en: "Announcements and alerts raised for this role." } },
      { slug: "profile", path: "/dashboard/government-officer/profile", label: { bn: "প্রোফাইল (Profile)", en: "Profile" }, description: { bn: "লগইন করা ব্যক্তির নিজের অ্যাকাউন্ট তথ্য, সম্পাদনার সুযোগসহ।", en: "The signed-in person's own account details, with an edit option." } },
      ],
    },
    {
      key: "ai-pathshala",
      title: { bn: "এআই পাঠশালা গ্রুপ", en: "AI Pathshala group" },
      items: [
      { slug: "lessons", path: "/dashboard/government-officer/ai-pathshala/lessons", label: { bn: "আমার লেসন (Lessons)", en: "Lessons" }, description: { bn: "ক্লাস ও বিষয়ভিত্তিক কাঠামোবদ্ধ এআই লেসন।", en: "Structured AI lessons per class and subject." } },
      { slug: "ai-tutor", path: "/dashboard/government-officer/ai-pathshala/ai-tutor", label: { bn: "AI টিউটর (AI Tutor)", en: "AI Tutor" }, description: { bn: "শুধু অনুমোদিত লেসন কনটেন্ট থেকে উত্তর দেওয়া চ্যাট টিউটর।", en: "Chat tutor that answers only from the approved lesson content." } },
      { slug: "lesson-planner", path: "/dashboard/government-officer/ai-pathshala/lesson-planner", label: { bn: "লেসন প্ল্যানার (Lesson Planner)", en: "Lesson Planner" }, description: { bn: "শিক্ষক ক্লাসে অনুসরণ করতে পারেন এমন দিন-ভিত্তিক লেসন প্ল্যান।", en: "Day-by-day lesson plans the teacher can follow in class." } },
      { slug: "quizzes", path: "/dashboard/government-officer/ai-pathshala/quizzes", label: { bn: "কুইজ (Quizzes)", en: "Quizzes" }, description: { bn: "এআই-জেনারেটেড কুইজ, শিক্ষার্থী জমা দিলেই যাচাই।", en: "AI-generated quizzes, checked the moment a student submits." } },
      { slug: "assessments", path: "/dashboard/government-officer/ai-pathshala/assessments", label: { bn: "অ্যাসেসমেন্ট (Assessments)", en: "Assessments" }, description: { bn: "অ্যাসেসমেন্ট ও প্রত্যেক শিক্ষার্থীর প্রাপ্ত নম্বর।", en: "Assessments and the score each student earned." } },
      { slug: "progress", path: "/dashboard/government-officer/ai-pathshala/progress", label: { bn: "অগ্রগতি (Progress)", en: "Progress" }, description: { bn: "টপিক ধরে মাস্টারি অগ্রগতি, লগইন করা ব্যবহারকারীর জন্য।", en: "Mastery progress topic by topic, for the signed-in user." } },
      { slug: "study-plan", path: "/dashboard/government-officer/ai-pathshala/study-plan", label: { bn: "স্টাডি প্ল্যান (Study Plan)", en: "Study Plan" }, description: { bn: "সবচেয়ে দুর্বল টপিক থেকে তৈরি ব্যক্তিগত স্টাডি প্ল্যান।", en: "A personal study plan built from the weakest topics." } },
      ],
    },
    {
      key: "reports",
      title: { bn: "রিপোর্ট মেনু", en: "Reports menu" },
      items: [
      { slug: "district-oversight", path: "/dashboard/government-officer/reports/district-oversight", label: { bn: "জেলা তদারকি (District Oversight)", en: "District Oversight" }, description: { bn: "কর্মকর্তার পরিদর্শনের জন্য জেলা তত্ত্বাবধান দৃশ্য।", en: "District supervision view for officer inspection." } },
      { slug: "enrollment-trend", path: "/dashboard/government-officer/reports/enrollment-trend", label: { bn: "এনরোলমেন্ট ট্রেন্ড (Enrollment Trend)", en: "Enrollment Trend" }, description: { bn: "নির্বাচিত সময়ে ভর্তির পরিবর্তন।", en: "Enrollment change over the selected period." } },
      { slug: "equity-indicators", path: "/dashboard/government-officer/reports/equity-indicators", label: { bn: "ইকুইটি ইন্ডিকেটর (Equity Indicators)", en: "Equity Indicators" }, description: { bn: "সমতা সূচক: লিঙ্গ, অবস্থান ও প্রবেশগত বৈষম্য।", en: "Equity indicators: gender, location and access gaps." } },
      { slug: "safety-overview", path: "/dashboard/government-officer/reports/safety-overview", label: { bn: "সেফটি ওভারভিউ (Safety Overview)", en: "Safety Overview" }, description: { bn: "পর্যবেক্ষণাধীন প্রতিষ্ঠান জুড়ে সমন্বিত এআই নিরাপত্তা চিত্র।", en: "Aggregate AI safety picture across monitored institutions." } },
      ],
    },
    ],
    workflows: [
      { title: { bn: "এলাকা বেছে নিন", en: "Choose the area" }, body: { bn: "‘Districts’ থেকে জেলা, তারপর ‘Institutions’-এ প্রতিষ্ঠান দেখুন।", en: "Pick the district under Districts, then its institutions under Institutions." } },
      { title: { bn: "ভর্তি ও উপস্থিতি", en: "Enrolment and attendance" }, body: { bn: "‘Enrollment’ ও ‘Attendance’-এ প্রবণতা দেখুন — কোন এলাকায় কমছে, দ্রুত বোঝা যায়।", en: "Enrollment and Attendance show the trend — where it is falling becomes obvious." } },
      { title: { bn: "ফলাফল ও সমতা", en: "Outcomes and equity" }, body: { bn: "‘Learning Outcomes’-এ ফল, ‘Equity Indicators’-এ কোন গোষ্ঠী পিছিয়ে আছে তা দেখুন (মেয়ে শিক্ষার্থী, প্রত্যন্ত এলাকা, বিশেষ চাহিদা)।", en: "Learning Outcomes shows results; Equity Indicators shows which groups lag (girls, remote areas, special needs)." } },
      { title: { bn: "নিরাপত্তা", en: "Safety" }, body: { bn: "‘Safety Overview’-এ ঘটনার সারসংক্ষেপ ও রিপোর্ট দেখুন; কিছু উদ্বেগজনক দেখলে সংশ্লিষ্ট প্রতিষ্ঠানকে জানান।", en: "Safety Overview shows incident summaries and reports; raise anything worrying with the institution." } },
      { title: { bn: "প্রতিবেদন তৈরি", en: "Produce the report" }, body: { bn: "‘Analytics’ ও ‘Reports’ থেকে প্রতিবেদন দেখুন, ‘Data Exports’ দিয়ে নামিয়ে নিন।", en: "Read the reports under Analytics and Reports, and download them from Data Exports." } },
    ],
    tips: [
      { bn: "এই ড্যাশবোর্ড মূলত পড়ার জন্য — তথ্য বদলাতে হলে সংশ্লিষ্ট প্রতিষ্ঠানের অ্যাডমিনের সাথে যোগাযোগ করুন।", en: "This dashboard is mainly read-only — for a correction, contact the institution's administrator." },
      { bn: "একই সূচক দুই এলাকার মধ্যে তুলনা করার সময় সময়কাল একই রাখুন, নাহলে সিদ্ধান্ত ভুল হয়।", en: "Keep the same period when comparing two areas, otherwise the conclusion misleads." },
    ],
  },
];

/** Guide for one role key. */
export function roleAccessGuide(key: RoleAccessKey): RoleAccessGuide | undefined {
  return ROLE_ACCESS_GUIDES.find((guide) => guide.key === key);
}

/** Total number of verified routes for one role. */
export function roleRouteCount(guide: RoleAccessGuide): number {
  return guide.menuGroups.reduce((total, group) => total + group.items.length, 0);
}

/** Total verified routes across every role (deduplicated path count). */
export const ROLE_ACCESS_ROUTE_TOTAL = new Set(
  ROLE_ACCESS_GUIDES.flatMap((guide) =>
    guide.menuGroups.flatMap((group) => group.items.map((item) => item.path)),
  ),
).size;

/** Localized chrome copy for the role showcase. */
export const ROLE_ACCESS_TEXT = {
  eyebrow: { bn: "ভূমিকা অনুযায়ী অ্যাক্সেস", en: "Role-based access" },
  heading: {
    bn: "আটটি ভূমিকা, একই সংযুক্ত ওএস",
    en: "Eight roles, one connected OS",
  },
  lead: {
    bn: "Shikkha Chat Apps-এ প্রতিটি ভূমিকা তার নিজের ড্যাশবোর্ড পান — সাইডবার মডিউল, এআই পাঠশালা গ্রুপ ও রিপোর্ট মেনু ভূমিকা অনুযায়ী আলাদা। নিচের প্রতিটি ভূমিকা বেছে নিয়ে তার প্রকৃত রুট, মেনু ও কাজের ধারা দেখুন।",
    en: "In Shikkha Chat Apps every role gets its own dashboard — sidebar modules, the AI Pathshala group and the reports menu differ per role. Pick a role below to see its real routes, menus and workflow.",
  },
  dashboardLabel: { bn: "ড্যাশবোর্ড রুট", en: "Dashboard route" },
  signingLabel: { bn: "যে ERP ভূমিকা দেয়", en: "Granted by ERP roles" },
  routeCountLabel: { bn: "রুট", en: "routes" },
  routesLabel: { bn: "সাইডবার ও রুট", en: "Sidebar & routes" },
  workflowLabel: { bn: "কাজের ধারা", en: "Workflow" },
  tipsLabel: { bn: "টিপস", en: "Tips" },
  sourceLabel: { bn: "সোর্স ফাইল", en: "Source files" },
  groupLabel: { bn: "গ্রুপ", en: "Groups" },
  accessLabel: { bn: "ড্যাশবোর্ড ও অ্যাক্সেস", en: "Dashboard & access" },
  note: {
    bn: "এই রুটগুলো Shikkha Chat Apps অ্যাপের নিজস্ব ড্যাশবোর্ডের — Connected OS-এ হুবহু একই নামে খোলা যায়, প্রতিটি পেজে অ্যাপে ওই রুটের কাজ ব্যাখ্যা করা আছে।",
    en: "These are Shikkha Chat Apps dashboard routes — connected OS opens them under the exact same names, and every page explains the work the route does in the app.",
  },
  openRoute: { bn: "এই রুট খুলুন", en: "Open this route" },
  allRoutes: { bn: "সব ভূমিকার সব রুট", en: "All roles, all routes" },
  roleTabLabel: { bn: "ভূমিকা বেছে নিন", en: "Choose a role" },
} as const;

/** Localized label for one role in the showcase. */
export function roleAccessLabel(guide: RoleAccessGuide, language: "bn" | "en"): string {
  return guide.title[language];
}

/**
 * Per-section enrichment for the Shikkha Chat Apps catalog rail.
 *
 * Additive data only: every string here is derived from the SOURCE Shikkha Chat
 * Apps project (shikkha_chat_apps) — the dashboard role guide
 * (`src/lib/user-manual.json` → roleGuide.items) for the dashboard sections, and
 * the real section pages under `src/app/*` for the public site sections. Nothing
 * is invented; the English text is a faithful translation of the Bengali source.
 *
 * Keyed by catalog category id (`FEATURE_SHOWCASE[].id`). The right-rail panel
 * (`CatalogFeaturePanel`) reads a category's entry and renders it on EVERY card
 * of that section, so each section now carries several times more real
 * information than the previous title + description + 3 meta rows.
 */
import { FEATURE_SHOWCASE } from "@/lib/feature-showcase";

export type LocalizedText = { readonly bn: string; readonly en: string };

export type CatalogSectionDetail = {
  /** One factual paragraph about the section (from the source). */
  readonly supporting: LocalizedText;
  /** Key capabilities / real items of the section (5-6, from the source). */
  readonly capabilities: readonly LocalizedText[];
  /** Who the section is for (from the source roles / public access). */
  readonly audience: LocalizedText;
};

export const CATALOG_SECTION_DETAILS: Record<string, CatalogSectionDetail> = {
  /* ---------------- Dashboard sections (source: user-manual.json) ---------------- */
  "school-management": {
    supporting: {
      bn: "প্রতিষ্ঠানের দায়িত্বপ্রাপ্ত ব্যক্তির হাতে থাকে শিক্ষার্থী, শিক্ষক, ক্লাস, রুটিন, উপস্থিতি, ফি, ইউজার ও অনুমতি — সবকিছুর কেন্দ্রীয় নিয়ন্ত্রণ।",
      en: "The institution administrator holds central control of students, teachers, classes, routines, attendance, fees, users and permissions.",
    },
    capabilities: [
      {
        bn: "ক্লাস, সেকশন ও বিষয় সাজান — Classes, Sections, Subjects ও Curriculum ক্রমে তৈরি করুন",
        en: "Set up classes, sections and subjects — build Classes, Sections, Subjects and Curriculum in order",
      },
      {
        bn: "শিক্ষার্থী যোগ করুন — নাম, ক্লাস/ব্যাচ, রোল, অভিভাবকের যোগাযোগ ও ছবিসহ New Student তৈরি করুন",
        en: "Add students — create a New Student with name, class/batch, roll, guardian contact and photo",
      },
      {
        bn: "শিক্ষক যোগ ও ক্লাস বণ্টন — Teacher Class Assignment থেকে কোন শিক্ষক কোন ক্লাস ও বিষয় নেবেন ঠিক করুন",
        en: "Add teachers and assign classes — set which teacher takes which class and subject via Teacher Class Assignment",
      },
      {
        bn: "ইউজার ও ভূমিকা দিন — Users থেকে লগইন তৈরি/বন্ধ করুন এবং Roles থেকে অনুমতি নির্ধারণ করুন",
        en: "Create users and roles — manage logins in Users and set permissions in Roles",
      },
      {
        bn: "উপস্থিতি, ফি ও রুটিন ব্যবস্থাপনা — দৈনন্দিন উপস্থিতি, ফি সংগ্রহ ও শ্রেণি রুটিন পরিচালনা করুন",
        en: "Manage attendance, fees and routines — run daily attendance, fee collection and class routines",
      },
      {
        bn: "কেন্দ্রীয় ড্যাশবোর্ড — প্রতিষ্ঠানের সার্বিক কার্যক্রম এক নজরে দেখুন",
        en: "Admin dashboard — a single-glance overview of all institution activity",
      },
    ],
    audience: {
      bn: "স্কুল অ্যাডমিনিস্ট্রেটর, ইনস্টিটিউট ওনার, একাডেমিকস ম্যানেজার, সিস্টেম অ্যাডমিন",
      en: "School administrator, institute owner, academics manager, system admin",
    },
  },

  "ai-pathshala": {
    supporting: {
      bn: "AI সহায়তায় পাঠ, অনুশীলন, মূল্যায়ন ও অগ্রগতি — শিক্ষার্থীর সম্পূর্ণ ডিজিটাল শেখার যাত্রা।",
      en: "AI-assisted lessons, practice, assessment and progress — the student's complete digital learning journey.",
    },
    capabilities: [
      { bn: "AI Tutor — নিজের ভাষায় প্রশ্ন করে পড়া বুঝে নিন", en: "AI Tutor — ask questions in your own language to understand lessons" },
      { bn: "পাঠ (Lessons) — ক্লাস ও অধ্যায়ভিত্তিক পাঠ ক্রম অনুযায়ী পড়া", en: "Lessons — read class- and chapter-wise lessons in order" },
      { bn: "কুইজ ও মূল্যায়ন — Quizzes ও Assessments-এ সময় শেষ হওয়ার আগে জমা দিন", en: "Quizzes and assessments — submit before time runs out" },
      { bn: "লেসন প্ল্যানার — পুরো সপ্তাহের পাঠ পরিকল্পনা সাজান", en: "Lesson planner — plan a whole week of lessons" },
      { bn: "অগ্রগতি ও অ্যানালিটিক্স — Progress ও Analytics-এ শেখার চিত্র", en: "Progress and analytics — track learning in Progress and Analytics" },
      { bn: "AI সমৃদ্ধ প্রশ্ন ও উপকরণ — বয়স-উপযোগী, রিভিউ-অনুমোদিত কনটেন্ট", en: "AI-rich questions and materials — age-appropriate, review-approved content" },
    ],
    audience: { bn: "শিক্ষক ও শিক্ষার্থী", en: "Teachers and students" },
  },

  "teacher-tools": {
    supporting: {
      bn: "আপনার ক্লাসের শিক্ষার্থী, হাজিরা, পাঠ ও অগ্রগতির দায়িত্ব আপনার হাতে — সব প্রয়োজনীয় টুল এক জায়গায়।",
      en: "Your class's students, attendance, lessons and progress are in your hands — all the tools you need in one place.",
    },
    capabilities: [
      { bn: "নিজের ক্লাস দেখুন — শিক্ষার্থী তালিকা ও ক্লাস বণ্টন দেখুন", en: "See your classes — view the student list and class assignments" },
      { bn: "হাজিরা দিন — উপস্থিতি, অনুপস্থিতি বা ছুটি চিহ্নিত করে সেভ করুন", en: "Take attendance — mark present, absent or leave and save" },
      { bn: "পাঠ ও কুইজ তৈরি করুন — Lessons, Quizzes, Assessments ও Lesson Planner", en: "Create lessons and quizzes — Lessons, Quizzes, Assessments and Lesson Planner" },
      { bn: "শিক্ষার্থীর দুর্বলতা খুঁজুন — Progress, কুইজ ফল ও Analytics থেকে শনাক্ত করুন", en: "Spot student weaknesses — identify from Progress, quiz results and Analytics" },
      { bn: "পদক্ষেপ নিন — Interventions থেকে সহায়তার পরিকল্পনা করুন", en: "Take action — plan support from Interventions" },
      { bn: "শিক্ষক-ক্লাস অ্যাসাইনমেন্ট — কোন ক্লাস ও বিষয় আপনার", en: "Teacher class assignment — which class and subject are yours" },
    ],
    audience: { bn: "শিক্ষক / ইনস্ট্রাক্টর", en: "Teacher / Instructor" },
  },

  "parent-portal": {
    supporting: {
      bn: "সন্তানের উপস্থিতি, ফলাফল, পড়ার সক্রিয়তা ও শিক্ষকের বার্তা — অভিভাবকের সম্পূর্ণ দৃষ্টি।",
      en: "Your child's attendance, results, study activity and teacher messages — the parent's complete view.",
    },
    capabilities: [
      { bn: "সন্তান যুক্ত করুন — Link Child-এ Student ID বা ইমেইল দিয়ে সংযোগ", en: "Link your child — connect with Student ID or email in Link Child" },
      { bn: "উপস্থিতি দেখুন — Attendance-এ দিন-ভিত্তিক উপস্থিতি", en: "See attendance — day-wise attendance in Attendance" },
      { bn: "ফলাফল দেখুন — Assessment Results ও Reports থেকে সারসংক্ষেপ", en: "See results — summaries from Assessment Results and Reports" },
      { bn: "পড়ার সক্রিয়তা — Study Activity দেখায় সন্তান কতটুকু পড়েছে", en: "Study activity — Study Activity shows how much the child studied" },
      { bn: "Tutor Data — AI টিউটর কীভাবে ব্যবহৃত হচ্ছে", en: "Tutor data — how the AI tutor is being used" },
      { bn: "একাধিক সন্তান — সবাইকে আলাদা করে যোগ করা যায়", en: "Multiple children — each child can be linked separately" },
    ],
    audience: { bn: "অভিভাবক / গার্ডিয়ান", en: "Parent / Guardian" },
  },

  "content-safety": {
    supporting: {
      bn: "AI Pathshala-র পাঠ, প্রশ্ন ও উপকরণ যাচাই, এবং AI Tutor-এর ঝুঁকিপূর্ণ ব্যবহার পর্যবেক্ষণ ও নিরাপত্তা নিশ্চিতকরণ।",
      en: "Review of AI Pathshala lessons, questions and materials, plus monitoring of risky AI Tutor use and safety enforcement.",
    },
    capabilities: [
      { bn: "Review Queue — যাচাইয়ের অপেক্ষায় থাকা আইটেম ক্রম অনুযায়ী", en: "Review queue — pending items in order" },
      { bn: "Approve / Reject — কারণসহ অনুমোদন বা বাতিল", en: "Approve / reject — approve or reject with a reason" },
      { bn: "Revision Requests — ছোট পরিবর্তন দরকার হলে সংশোধন চাওয়া", en: "Revision requests — ask for corrections for small changes" },
      { bn: "Guidelines — ভাষার মান, বয়স-উপযোগী বিষয়, ব্যক্তিগত তথ্য নয়", en: "Guidelines — language quality, age-appropriate content, no personal data" },
      { bn: "AI Review Queue ও Flagged AI Messages — সতর্কবার্তা দেখা", en: "AI review queue and flagged AI messages — review alerts" },
      { bn: "AI Safety Events ও Escalations — শিশুর নিরাপত্তা সংক্রান্ত বিষয় সর্বোচ্চ অগ্রাধিকার পায়", en: "AI safety events and escalations — child-safety matters come first" },
    ],
    audience: { bn: "কনটেন্ট রিভিউয়ার ও AI নিরাপত্তা রিভিউয়ার", en: "Content reviewer and AI safety reviewer" },
  },

  monitoring: {
    supporting: {
      bn: "একাধিক প্রতিষ্ঠান ও জেলা/উপজেলাভিত্তিক শিক্ষার চিত্র — ভর্তি, উপস্থিতি, ফলাফল, সমতা ও নিরাপত্তা।",
      en: "A multi-institution and district/upazila view of education — enrolment, attendance, outcomes, equity and safety.",
    },
    capabilities: [
      { bn: "প্রকল্প তৈরি — Programs-এ নাম, সময়কাল ও লক্ষ্যসহ প্রকল্প", en: "Create programs — programs with name, duration and goal in Programs" },
      { bn: "প্রতিষ্ঠান যোগ — Institutions, Schools, Learners ও Teachers যুক্ত করুন", en: "Add institutions — add Institutions, Schools, Learners and Teachers" },
      { bn: "উদ্যোগ ও ফলাফল — Interventions ও Learning Outcomes-এ প্রমাণ রাখুন", en: "Interventions and outcomes — keep evidence in Interventions and Learning Outcomes" },
      { bn: "জেলা ও এলাকা — Districts থেকে জেলা, তারপর প্রতিষ্ঠান", en: "Districts and regions — pick a district, then institutions" },
      { bn: "ভর্তি ও উপস্থিতি প্রবণতা — Enrollment ও Attendance-এ দ্রুত বোঝা যায়", en: "Enrolment and attendance trends — spot quickly in Enrollment and Attendance" },
      { bn: "সমতা ও নিরাপত্তা — Equity Indicators ও Safety Overview", en: "Equity and safety — Equity Indicators and Safety Overview" },
    ],
    audience: { bn: "এনজিও অ্যাডমিন ও সরকারি কর্মকর্তা", en: "NGO administrator and government officer" },
  },

  /* ---------------- Public site sections (source: src/app/* pages) ---------------- */
  "site-home": {
    supporting: {
      bn: "বিদ্যালয়ের প্রধান পোর্টাল — নোটিশ, ইভেন্ট, গ্যালারি, পরিচিতি ও ভর্তি তথ্য এক জায়গায়।",
      en: "The school's main portal — notices, events, gallery, about and admission information in one place.",
    },
    capabilities: [
      { bn: "নোটিশ বোর্ড — সর্বশেষ ঘোষণা ও আপডেট", en: "Notice board — latest announcements and updates" },
      { bn: "খবর ও ইভেন্ট — আসন্ন অনুষ্ঠান ও সাম্প্রতিক আপডেট", en: "News and events — upcoming events and recent updates" },
      { bn: "ফটো ও ভিডিও গ্যালারি — অনুষ্ঠান ও ক্যাম্পাসের মুহূর্ত", en: "Photo and video gallery — moments from events and campus" },
      { bn: "পরিচিতি — ইতিহাস, দৃষ্টিভঙ্গি ও পরিচালনা পর্ষদ", en: "About — history, vision and governing body" },
      { bn: "একাডেমিক তথ্য — সিলেবাস, রুটিন ও পাঠ পরিকল্পনা", en: "Academic info — syllabus, routine and lesson plans" },
      { bn: "ভর্তি ও যোগাযোগ — অনলাইন ভর্তি ও অফিস যোগাযোগ", en: "Admission and contact — online admission and office contact" },
    ],
    audience: { bn: "শিক্ষার্থী, অভিভাবক ও দর্শনার্থী (উন্মুক্ত)", en: "Students, parents and visitors (public)" },
  },

  "site-about": {
    supporting: {
      bn: "আমাদের বিদ্যালয়ের ইতিহাস, দৃষ্টিভঙ্গি, পরিচালনা পর্ষদ, মাস্টার প্ল্যান ও অবকাঠামোর পূর্ণ পরিচয়।",
      en: "A complete introduction to our school — history, vision, governing body, master plan and infrastructure.",
    },
    capabilities: [
      { bn: "চেয়ারম্যানের বাণী — প্রতিষ্ঠানের স্বপ্ন ও লক্ষ্য", en: "Message from the chairman — the institution's vision and goals" },
      { bn: "প্রধান শিক্ষকের বাণী — শিক্ষাদর্শ ও অঙ্গীকার", en: "Message from the principal — teaching philosophy and commitment" },
      { bn: "পরিচালনা পর্ষদ — চেয়ারম্যান, ভাইস চেয়ারম্যান, এমডি ও পরিচালকবৃন্দ", en: "Governing body — chairman, vice chairman, MD and directors" },
      { bn: "বিদ্যালয়ের ইতিহাস — প্রতিষ্ঠার শুরু থেকে আজ পর্যন্ত অগ্রযাত্রা", en: "School history — the journey from founding to today" },
      { bn: "দৃষ্টিভঙ্গি ও উদ্দেশ্য — নিরাপদ পরিবেশ, মানসম্মত শিক্ষা, নৈতিকতা", en: "Vision and objectives — safe environment, quality education, ethics" },
      { bn: "মাস্টার প্ল্যান ও অবকাঠামো — শ্রেণিকক্ষ, ল্যাব, লাইব্রেরি ও নিরাপত্তা", en: "Master plan and infrastructure — classrooms, labs, library and safety" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },

  "site-academic": {
    supporting: {
      bn: "শ্রেণিভিত্তিক সিলেবাস, ক্লাস রুটিন, পাঠ পরিকল্পনা, হোমওয়ার্ক ও মূল্যায়ন সংক্রান্ত একাডেমিক তথ্য।",
      en: "Academic information — class-wise syllabus, class routine, lesson plans, homework and assessment.",
    },
    capabilities: [
      { bn: "সিলেবাস — প্রথম থেকে পঞ্চম শ্রেণির বিষয়ভিত্তিক পাঠ", en: "Syllabus — class-wise subjects from class one to five" },
      { bn: "ক্লাস রুটিন — প্রভাতি শাখার শ্রেণিভিত্তিক সময়সূচি", en: "Class routine — class-wise schedule of the morning shift" },
      { bn: "পাঠ পরিকল্পনা (Lesson Plan) — শ্রেণিভিত্তিক পাঠের পরিকল্পনা", en: "Lesson plan — class-wise lesson planning" },
      { bn: "হোমওয়ার্ক ও লেকচার — শ্রেণিভিত্তিক হোমওয়ার্ক ও ক্লাস লেকচার", en: "Homework and lecture — class-wise homework and class lectures" },
      { bn: "একাডেমিক ক্যালেন্ডার — কার্যদিবস, মূল্যায়ন ও অনুষ্ঠানের সময়সূচি", en: "Academic calendar — working days, assessment dates and events" },
      { bn: "সহপাঠ কার্যক্রম — ক্রীড়া, সাংস্কৃতিক, বিতর্ক ও বিজ্ঞান মেলা", en: "Co-curricular activities — sports, cultural, debate and science fair" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },

  "site-information": {
    supporting: {
      bn: "নোটিশ, ফি পরিশোধ, সুবিধা, খবর, অর্জন ও ছুটির তালিকাসহ তথ্যভিত্তিক সব সেবা।",
      en: "All information services — notices, fee payment, facilities, news, achievements and holiday list.",
    },
    capabilities: [
      { bn: "নোটিশ বোর্ড — সাধারণ ও পরীক্ষা সংক্রান্ত নোটিশ", en: "Notice board — general and exam-related notices" },
      { bn: "পেমেন্ট পদ্ধতি — নগদ, ব্যাংক, মোবাইল ব্যাংকিং ও অনলাইন", en: "Payment methods — cash, bank, mobile banking and online" },
      { bn: "সুবিধা — আধুনিক শ্রেণিকক্ষ, লাইব্রেরি, বিজ্ঞান ও কম্পিউটার ল্যাব", en: "Facilities — modern classrooms, library, science and computer labs" },
      { bn: "খবর ও ইভেন্ট — আসন্ন অনুষ্ঠান, অর্জন ও সাম্প্রতিক আপডেট", en: "News and events — upcoming events, achievements and recent updates" },
      { bn: "শিক্ষক ও শিক্ষার্থী তথ্য — বিষয়ভিত্তিক শিক্ষক পরিচিতি ও শ্রেণিভিত্তিক শিক্ষার্থী", en: "Teacher and student info — subject-wise teachers and class-wise students" },
      { bn: "নীতিমালা ও ছুটির তালিকা — একাডেমিক, পরীক্ষা, নিরাপত্তা নীতি ও ছুটি", en: "Policies and holiday list — academic, exam, safety policies and holidays" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },

  "site-admission": {
    supporting: {
      bn: "নতুন শিক্ষাবর্ষের অনলাইন ভর্তি, ফি, বৃত্তি ও স্থানান্তর প্রক্রিয়ার সম্পূর্ণ তথ্য।",
      en: "Complete information for the new academic year — online admission, fees, scholarships and transfer.",
    },
    capabilities: [
      { bn: "অনলাইন ভর্তি — শিক্ষার্থী ও অভিভাবকের জন্য আলাদা তথ্য ফরম", en: "Online admission — separate info forms for student and guardian" },
      { bn: "এক নজরে মূল তথ্য — প্রতিষ্ঠার সাল, শিক্ষার্থী, শ্রেণি ও পরীক্ষার ধরন", en: "Fast facts — founding year, students, classes and exam types" },
      { bn: "ফি ও পেমেন্ট — ভর্তি, মাসিক টিউশন, পরীক্ষা, সেশন, লাইব্রেরি/ল্যাব ফি", en: "Fees and payment — admission, monthly tuition, exam, session, library/lab fees" },
      { bn: "বৃত্তি — মেধা, প্রয়োজনভিত্তিক, উপস্থিতি, ক্রীড়া ও সাংস্কৃতিক বৃত্তি", en: "Scholarships — merit, need-based, attendance, sports and cultural scholarships" },
      { bn: "স্থানান্তর ও ছাড়পত্র — টিসি, ডকুমেন্ট যাচাই ও অফিস অনুমোদন", en: "Transfer and certificates — TC, document verification and office approval" },
      { bn: "সহায়তা — ভর্তি সংক্রান্ত সহায়তার জন্য বিদ্যালয় অফিসে যোগাযোগ", en: "Support — contact the school office for admission help" },
    ],
    audience: { bn: "অভিভাবক ও শিক্ষার্থী (উন্মুক্ত)", en: "Parents and students (public)" },
  },

  "site-media": {
    supporting: {
      bn: "বিদ্যালয়ের অনুষ্ঠান ও কার্যক্রমের বছরভিত্তিক ছবি ও ভিডিও অ্যালবাম।",
      en: "Year-wise photo and video albums of the school's events and activities.",
    },
    capabilities: [
      { bn: "বার্ষিক সাংস্কৃতিক অনুষ্ঠান — পরিবেশনার মুহূর্ত", en: "Annual cultural program — moments of performances" },
      { bn: "বার্ষিক ক্রীড়া দিবস — প্রতিযোগিতার বিশেষ মুহূর্ত", en: "Annual sports day — special moments of the competition" },
      { bn: "বিজ্ঞান মেলা — শিক্ষার্থীদের উপস্থাপনা", en: "Science fair — students' presentations" },
      { bn: "ক্যাম্পাস কার্যক্রমের ভিডিও — দৈনন্দিন জীবনের ঝলক", en: "Campus activity videos — glimpses of daily life" },
      { bn: "শ্রেণিকক্ষের শেখার মুহূর্ত — ক্লাসের সক্রিয় অংশগ্রহণ", en: "Classroom learning moments — active class participation" },
      { bn: "বছরভিত্তিক অ্যালবাম — ফটো ও ভিডিও অ্যালবাম", en: "Year-wise albums — photo and video albums" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },

  "site-employment": {
    supporting: {
      bn: "প্রতিষ্ঠানের সামগ্রিক চিত্র, চলমান নিয়োগ বিজ্ঞপ্তি ও নিয়োগ পরীক্ষার ফলাফল।",
      en: "The institution at a glance, current recruitment circulars and recruitment exam results.",
    },
    capabilities: [
      { bn: "এক নজরে — প্রতিষ্ঠার সাল, মোট শিক্ষার্থী ও লাইব্রেরির বই", en: "At a glance — founding year, total students and library books" },
      { bn: "নিয়োগ বিজ্ঞপ্তি — শিক্ষক ও প্রশাসনিক পদে চলমান পদ", en: "Employment circulars — current teacher and admin posts" },
      { bn: "আবেদন পদ্ধতি — নির্ধারিত ফরম পূরণ করে অফিসে জমা", en: "How to apply — fill the prescribed form and submit at the office" },
      { bn: "নির্বাচন প্রক্রিয়া — লিখিত, ডেমো ক্লাস/ব্যবহারিক ও সাক্ষাৎকার", en: "Selection process — written, demo class/practical and interview" },
      { bn: "পদসমূহ — সহকারী শিক্ষক, ল্যাব সহকারী, গ্রন্থাগারিক ও অফিস সহকারী", en: "Posts — assistant teacher, lab assistant, librarian and office assistant" },
      { bn: "নিয়োগ পরীক্ষার ফলাফল — লিখিত, মৌখিক ও চূড়ান্ত নির্বাচন", en: "Recruitment exam results — written, oral and final selection" },
    ],
    audience: { bn: "চাকরিপ্রার্থী (উন্মুক্ত)", en: "Job seekers (public)" },
  },

  "site-contact": {
    supporting: {
      bn: "রমনা, ঢাকা-১০০০ — অফিস সময়ে সরাসরি, ফোন বা ইমেইলে যোগাযোগ করুন।",
      en: "Ramna, Dhaka-1000 — reach us in person, by phone or email during office hours.",
    },
    capabilities: [
      { bn: "ঠিকানা — রমনা, ঢাকা-১০০০", en: "Address — Ramna, Dhaka-1000" },
      { bn: "অফিস সময় — শনিবার থেকে বৃহস্পতিবার, সকাল ৯টা – বিকাল ৪টা", en: "Office hours — Saturday to Thursday, 9:00 am – 4:00 pm" },
      { bn: "ভর্তি সহায়তা — সকাল ১০টা – দুপুর ২টা", en: "Admission support — 10:00 am – 2:00 pm" },
      { bn: "একাডেমিক সহায়তা — ক্লাসের দিনসমূহে শ্রেণি শিক্ষক ও অফিসের মাধ্যমে", en: "Academic support — via class teacher and office on class days" },
      { bn: "ফোন — অফিস সময়ে ফোন করে তথ্য জানুন", en: "Phone — call during office hours for information" },
      { bn: "ইমেইল — ভর্তি, একাডেমিক বা প্রশাসনিক বিষয়ে ইমেইল", en: "Email — for admission, academic or administrative matters" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },

  "site-freedom": {
    supporting: {
      bn: "একাডেমিক, পরীক্ষা, ভর্তি, ফি ও ছুটি সংক্রান্ত সব নোটিশের কেন্দ্র।",
      en: "The hub for all notices — academic, exam, admission, fees and holidays.",
    },
    capabilities: [
      { bn: "একাডেমিক নোটিশ — ক্লাস রুটিন, পাঠ পরিকল্পনা ও শ্রেণিভিত্তিক আপডেট", en: "Academic notices — class routine, lesson plans and class-wise updates" },
      { bn: "পরীক্ষার নোটিশ — তারিখ, সিলেবাস, আসন বিন্যাস, প্রবেশপত্র ও ফলাফল", en: "Exam notices — dates, syllabus, seating, admit cards and results" },
      { bn: "ভর্তির নোটিশ — আবেদন, সময়সীমা, ডকুমেন্ট ও ভর্তি পরীক্ষা", en: "Admission notices — application, deadlines, documents and admission test" },
      { bn: "ফি সংক্রান্ত নোটিশ — মাসিক ফি, পরীক্ষার ফি, সময়সীমা ও রশিদ", en: "Fee notices — monthly fees, exam fees, deadlines and receipts" },
      { bn: "ছুটি ও বিরতি — সরকারি ও বিদ্যালয় ঘোষিত ছুটি ও একাডেমিক বিরতি", en: "Holidays and breaks — government and school-declared holidays and academic breaks" },
      { bn: "ডাউনলোড ফাইল — পিডিএফ, বিজ্ঞপ্তি ও প্রয়োজনীয় ফাইল", en: "Download files — PDFs, circulars and important files" },
    ],
    audience: { bn: "সবার জন্য উন্মুক্ত (পাবলিক)", en: "Open to everyone (public)" },
  },
  /* ---------------- Role access (source: app roles + rolePermissionMap) ---------------- */
  "role-access": {
    supporting: {
      bn: "শিক্ষা চ্যাট অ্যাপসে একই প্ল্যাটফর্মে আটটি ড্যাশবোর্ড ভূমিকা চলে — অ্যাডমিন, শিক্ষার্থী, শিক্ষক, অভিভাবক, কনটেন্ট রিভিউয়ার, এআই নিরাপত্তা রিভিউয়ার, এনজিও অ্যাডমিন ও সরকারি কর্মকর্তা। প্রত্যেকের সাইডবার মডিউল, এআই পাঠশালা গ্রুপ ও রিপোর্ট মেনু আলাদা, আর কোন ভূমিকা কী দেখবে তা ERP ভূমিকা (rolePermissionMap) দিয়ে নিয়ন্ত্রিত হয়।",
      en: "Shikkha Chat Apps ships eight dashboard roles on one platform — admin, student, teacher, parent, content reviewer, AI safety reviewer, NGO admin and government officer. Each role has its own sidebar modules, AI Pathshala group and reports menu, and what a role may see is gated by ERP roles (rolePermissionMap).",
    },
    capabilities: [
      {
        bn: "প্রত্যেক ভূমিকার আলাদা ড্যাশবোর্ড রুট — /dashboard/<role>",
        en: "A separate dashboard route for every role — /dashboard/<role>",
      },
      {
        bn: "ভূমিকা অনুযায়ী সাইডবার মডিউল, এআই পাঠশালা গ্রুপ ও রিপোর্ট মেনু",
        en: "Role-specific sidebar modules, AI Pathshala group and reports menu",
      },
      {
        bn: "কোন ভূমিকা কোন ড্যাশবোর্ড পাবে তা ERP ভূমিকা দিয়ে নিয়ন্ত্রিত",
        en: "Which role gets which dashboard is gated by ERP roles",
      },
      {
        bn: "প্রতিটি ভূমিকার নিজস্ব কাজের ধারা, ধাপে ধাপে ডকুমেন্টেড",
        en: "Every role ships its own workflow, documented step by step",
      },
      {
        bn: "সব রুট ও মেনু সরাসরি শিক্ষা চ্যাট অ্যাপসের সোর্স থেকে নেওয়া",
        en: "Every route and menu is taken straight from the Shikkha Chat Apps source",
      },
    ],
    audience: {
      bn: "আটটি ড্যাশবোর্ড ভূমিকা",
      en: "The eight dashboard roles",
    },
  },
};

/** Number of catalog categories (for the "section i / n" position line). */
export const CATALOG_CATEGORY_COUNT = FEATURE_SHOWCASE.length;

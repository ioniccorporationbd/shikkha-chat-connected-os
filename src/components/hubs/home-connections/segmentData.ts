import type { IconType } from "react-icons";
import {
  FiFileText,
  FiMessageSquare,
  FiLock,
  FiSettings,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiCreditCard,
  FiHeadphones,
  FiDatabase,
  FiGrid,
  FiUserCheck,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";

/**
 * Homepage segment between Video Banner 1 and Video Banner 2.
 *
 * The eight anchor ids are intentionally kept identical to the previous
 * structure so the fixed left sidebar, the landing banner and the product
 * router keep resolving their scroll targets (no broken routes). Only the
 * chapter *meaning* and copy change — into a coherent Shikkha Chat marketing
 * story: Problem -> Connected Solution -> Core Operations -> More Capabilities
 * -> Role-Based Experience -> ERP Foundation -> Why It Matters -> Request a Demo.
 */
export type SegmentId =
  | "home-connections-panel"
  | "student-information"
  | "sis"
  | "enrollment"
  | "special-programs"
  | "family-engagement"
  | "communications"
  | "attendance-support";

export const segmentOrder: SegmentId[] = [
  "home-connections-panel",
  "student-information",
  "sis",
  "enrollment",
  "special-programs",
  "family-engagement",
  "communications",
  "attendance-support",
];

export type SegmentCard = { title: string; body: string; icon: IconType };
export type SegmentRole = { name: string; body: string; icon: IconType };
export type SegmentLayer = { label: string; note: string };
export type SegmentNode = { label: string; icon: IconType };

export type SegmentChapter = {
  id: SegmentId;
  eyebrow: { bn: string; en: string };
  title: { bn: string; en: string };
  body: { bn: string; en: string };
  cards?: { bn: SegmentCard[]; en: SegmentCard[] };
  roles?: { bn: SegmentRole[]; en: SegmentRole[] };
  layers?: { bn: SegmentLayer[]; en: SegmentLayer[] };
  bullets?: { bn: string[]; en: string[] };
  nodes?: SegmentNode[];
  cta?: { bn: { primary: string; secondary: string }; en: { primary: string; secondary: string } };
};

const nodes: SegmentNode[] = [
  { label: "Administration", icon: FiSettings },
  { label: "Employee", icon: FiUser },
  { label: "User", icon: FiUsers },
  { label: "Attendance", icon: FiCheckCircle },
  { label: "Payment", icon: FiCreditCard },
  { label: "Help Desk", icon: FiHeadphones },
  { label: "Data", icon: FiDatabase },
];

export const segmentChapters: SegmentChapter[] = [
  {
    id: "home-connections-panel",
    eyebrow: { bn: "সমস্যাটি", en: "The Problem" },
    title: {
      bn: "আপনার প্রতিষ্ঠানের কাজ কি এখনো বিভিন্ন জায়গায় ছড়িয়ে আছে?",
      en: "Is your institution's work still scattered across different places?",
    },
    body: {
      bn: "ব্যবহারকারীর তথ্য, কর্মীর উপস্থিতি, নোটিশ, পেমেন্ট, অনুমোদন এবং operational records আলাদা আলাদা সিস্টেম বা manual process-এ থাকলে ম্যানেজমেন্ট জটিল হয়ে যায়।",
      en: "When user information, employee attendance, notices, payments, approvals and operational records live in separate systems or manual processes, management becomes complex.",
    },
    cards: {
      bn: [
        { title: "বিচ্ছিন্ন তথ্য", body: "তথ্য বিভিন্ন জায়গায় থাকায় consistent view পাওয়া কঠিন।", icon: FiFileText },
        { title: "Manual Process", body: "কাগজ/Excel নির্ভরতা operational সময় বাড়ায়।", icon: FiGrid },
        { title: "Communication Gap", body: "গুরুত্বপূর্ণ আপডেট বিভিন্ন চ্যানেলে ছড়িয়ে যায়।", icon: FiMessageSquare },
        { title: "Access Control", body: "সব ব্যবহারকারীর জন্য একই access প্রতিষ্ঠান পরিচালনায় practical নয়।", icon: FiLock },
      ],
      en: [
        { title: "Scattered data", body: "Information in different places makes a consistent view hard.", icon: FiFileText },
        { title: "Manual process", body: "Paper and spreadsheet dependency slows operations down.", icon: FiGrid },
        { title: "Communication gap", body: "Important updates spread across different channels.", icon: FiMessageSquare },
        { title: "Access control", body: "One shared level of access is not practical to run an institution.", icon: FiLock },
      ],
    },
  },
  {
    id: "student-information",
    eyebrow: { bn: "সংযুক্ত সমাধান", en: "Connected Solution" },
    title: {
      bn: "একটি প্রতিষ্ঠান। একটি সংযুক্ত ব্যবস্থাপনা প্ল্যাটফর্ম।",
      en: "One Institution. One Connected System.",
    },
    body: {
      bn: "শিক্ষা চ্যাট হলো সেই সেতু — যেখানে administration, employee, user, attendance, payment এবং support একটি কেন্দ্রীয় প্ল্যাটফর্মে যুক্ত হয়।",
      en: "Shikkha Chat is the bridge — where administration, employees, users, attendance, payments and support connect on one central platform.",
    },
    nodes,
  },
  {
    id: "sis",
    eyebrow: { bn: "মূল অপারেশন", en: "Core Operations" },
    title: {
      bn: "প্রতিষ্ঠানের মূল কাজ এক প্ল্যাটফর্ম থেকে",
      en: "Run core operations from one platform",
    },
    body: {
      bn: "যেসব মডিউল ইতিমধ্যেই বাস্তবায়িত, সেগুলো একটি connected dashboard থেকে পরিচালনা করুন।",
      en: "Manage the modules already in place from one connected dashboard.",
    },
    cards: {
      bn: [
        { title: "Dashboard", body: "গুরুত্বপূর্ণ তথ্য ও কাজ এক জায়গায়।", icon: FiGrid },
        { title: "Employee Check-In / Check-Out", body: "ডিজিটাল উপস্থিতি ও history।", icon: FiUserCheck },
        { title: "Customer / User Management", body: "প্রয়োজনীয় user/customer create, edit ও manage করুন।", icon: FiUsers },
      ],
      en: [
        { title: "Dashboard", body: "Important information and actions in one place.", icon: FiGrid },
        { title: "Employee Check-In / Check-Out", body: "Digital attendance workflow and history.", icon: FiUserCheck },
        { title: "Customer / User Management", body: "Create, edit and manage relevant users and customers.", icon: FiUsers },
      ],
    },
  },
  {
    id: "enrollment",
    eyebrow: { bn: "আরও সক্ষমতা", en: "More Capabilities" },
    title: { bn: "আরও যা পরিচালনা করা যায়", en: "What else you can manage" },
    body: {
      bn: "ERPNext-নির্ভর workflow দিয়ে খরচ, পেমেন্ট ও সাপোর্ট পরিচালনা করুন।",
      en: "Run expenses, payments and support through an ERPNext-backed workflow.",
    },
    cards: {
      bn: [
        { title: "Expense Claim", body: "কর্মীর খরচ জমা ও status tracking।", icon: FiDollarSign },
        { title: "Payment Entry", body: "গ্রাহকের পেমেন্ট ERPNext Payment Entry-এর সঙ্গে যুক্ত।", icon: FiCreditCard },
        { title: "Help Desk", body: "স্ট্রাকচার্ড support ও ticket অভিজ্ঞতা।", icon: FiHeadphones },
      ],
      en: [
        { title: "Expense Claim", body: "Employee expense submission and status tracking.", icon: FiDollarSign },
        { title: "Payment Entry", body: "Customer payments connected with ERPNext Payment Entry.", icon: FiCreditCard },
        { title: "Help Desk", body: "A structured support and ticket experience.", icon: FiHeadphones },
      ],
    },
  },
  {
    id: "special-programs",
    eyebrow: { bn: "রোল-ভিত্তিক অভিজ্ঞতা", en: "Role-Based Experience" },
    title: { bn: "ভিন্ন ব্যবহারকারী, উপযুক্ত অ্যাক্সেস", en: "Different users, appropriate access" },
    body: {
      bn: "সবাই একই জিনিস দেখে না — প্রতিটি role তার প্রয়োজন অনুযায়ী অভিজ্ঞতা পায়।",
      en: "Not everyone sees the same thing — each role gets the experience it needs.",
    },
    roles: {
      bn: [
        { name: "System User", body: "Operational tools ও management access।", icon: FiShield },
        { name: "Employee", body: "Check-In/Out, Expense Claim ও Profile।", icon: FiUser },
        { name: "Customer / Website User", body: "Payment Entry, Help Desk ও customer-facing services।", icon: FiUsers },
      ],
      en: [
        { name: "System User", body: "Operational tools and management access.", icon: FiShield },
        { name: "Employee", body: "Check-In / Check-Out, Expense Claim and Profile.", icon: FiUser },
        { name: "Customer / Website User", body: "Payment Entry, Help Desk and customer-facing services.", icon: FiUsers },
      ],
    },
  },
  {
    id: "family-engagement",
    eyebrow: { bn: "ERP ভিত্তি", en: "ERP Foundation" },
    title: { bn: "শুধু একটি ওয়েবসাইট নয় — ERP-backed foundation", en: "Not just a website — an ERP-backed foundation" },
    body: {
      bn: "শিক্ষা চ্যাট Frappe / ERPNext architecture-এর সঙ্গে কাজ করে, যা একটি শক্তিশালী operational ভিত্তি তৈরি করে।",
      en: "Shikkha Chat works with Frappe / ERPNext architecture to create a stronger operational foundation.",
    },
    layers: {
      bn: [
        { label: "User Experience", note: "পরিচ্ছন্ন, role-aware interface" },
        { label: "Shikkha Chat", note: "সংযুক্ত ব্যবস্থাপনা প্ল্যাটফর্ম" },
        { label: "Frappe API", note: "নিরাপদ, permission-aware access" },
        { label: "ERPNext Data & Operations", note: "কেন্দ্রীয় documents ও records" },
      ],
      en: [
        { label: "User Experience", note: "Clean, role-aware interface" },
        { label: "Shikkha Chat", note: "Connected management platform" },
        { label: "Frappe API", note: "Secure, permission-aware access" },
        { label: "ERPNext Data & Operations", note: "Centralized documents and records" },
      ],
    },
    bullets: {
      bn: ["কেন্দ্রীয় records", "permission-aware operations", "auditable processes", "standardized documents", "API integration", "scalable customization"],
      en: ["Centralized records", "Permission-aware operations", "Auditable processes", "Standardized documents", "API integration", "Scalable customization"],
    },
  },
  {
    id: "communications",
    eyebrow: { bn: "কেন গুরুত্বপূর্ণ", en: "Why It Matters" },
    title: { bn: "কেন এই ভিত্তিটা গুরুত্বপূর্ণ", en: "Why this foundation matters" },
    body: {
      bn: "একটি কেন্দ্রীয়, নিয়ন্ত্রিত ও স্কেলযোগ্য ব্যবস্থা প্রতিষ্ঠান পরিচালনাকে সহজ করে।",
      en: "A centralized, controlled and scalable system keeps running an institution simple.",
    },
    bullets: {
      bn: ["এক জায়গা থেকে নিয়ন্ত্রণ", "নিরাপদ ও audit-ready", "ধীরে ধীরে expandable", "প্রয়োজন অনুযায়ী customizable", "API-first integration", "বাংলাদেশ-ভিত্তিক সাপোর্ট — IONIC Corporation"],
      en: ["Control from one place", "Secure and audit-ready", "Gradually expandable", "Customizable to your needs", "API-first integration", "Bangladesh-focused support by IONIC Corporation"],
    },
  },
  {
    id: "attendance-support",
    eyebrow: { bn: "পরবর্তী ধাপ", en: "Next Step" },
    title: {
      bn: "আপনার প্রতিষ্ঠানের workflow আরও connected করতে প্রস্তুত?",
      en: "Ready to make your institution's workflow more connected?",
    },
    body: {
      bn: "আপনার প্রতিষ্ঠানের প্রয়োজন অনুযায়ী শিক্ষা চ্যাট কেমন কাজ করবে তা দেখতে একটি demo অনুরোধ করুন।",
      en: "Request a demo to see how Shikkha Chat can work for your institution.",
    },
    cta: {
      bn: { primary: "ডেমো অনুরোধ করুন", secondary: "ফিচার দেখুন" },
      en: { primary: "Request a Demo", secondary: "Explore Features" },
    },
  },
];

export function getChapter(id: SegmentId): SegmentChapter {
  return segmentChapters.find((chapter) => chapter.id === id) ?? segmentChapters[0];
}

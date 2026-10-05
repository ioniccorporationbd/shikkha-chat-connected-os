/**
 * Help Desk — DEMO / static test data.
 *
 * This module is the ONLY home of the demo dataset and is deliberately kept
 * separate from the service layer so it can be deleted without touching any UI.
 *
 * It feeds the browser-only mock store while no Help Desk backend exists. Once a
 * real Frappe/ERPNext "Help Desk Ticket" API is wired, set
 * `NEXT_PUBLIC_HELPDESK_DEMO=false` (or remove this file + the seed call) and the
 * app stops fabricating tickets — a real API response always wins and is never
 * overwritten by demo data.
 */

import type { Ticket, TicketCategoryId, TicketPriority } from "./types";

/** Demo mode is ON by default (no backend yet); a real deploy turns it off. */
export function isHelpDeskDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_HELPDESK_DEMO !== "false";
}

/** Departments used by the demo tickets + the form's optional department field. */
export const HELPDESK_DEPARTMENTS = [
  "Technical Support",
  "Accounts",
  "Support",
  "Billing",
] as const;
export type HelpDeskDepartment = (typeof HELPDESK_DEPARTMENTS)[number];

/** Pre-filled sample values for exercising the New Ticket form (never auto-submitted). */
export interface DemoFormSample {
  subject: string;
  category: TicketCategoryId;
  priority: TicketPriority;
  department: HelpDeskDepartment;
  description: string;
  relatedRoute: string;
}

/** A couple of ready-made examples the form can fill on demand (dev/test aid). */
export const DEMO_FORM_SAMPLES: readonly DemoFormSample[] = [
  {
    subject: "লগইন সমস্যা",
    category: "login",
    priority: "high",
    department: "Technical Support",
    description: "লগইন করার সময় বারবার ত্রুটি আসছে, তাই অ্যাকাউন্টে ঢুকতে পারছি না।",
    relatedRoute: "/login",
  },
  {
    subject: "সার্ভিস বিল সংক্রান্ত প্রশ্ন",
    category: "payment",
    priority: "medium",
    department: "Billing",
    description: "আমার সর্বশেষ সার্ভিস বিলের পরিমাণ ও স্ট্যাটাস নিয়ে জানতে চাই।",
    relatedRoute: "/clientDashboard/service-build",
  },
];

function iso(minutesBack: number): string {
  return new Date(Date.now() - minutesBack * 60_000).toISOString();
}
const mins = (m: number) => iso(m);
const hours = (h: number) => iso(h * 60);
const days = (d: number) => iso(d * 24 * 60);

const reporter = {
  name: "ডেমো রিপোর্টার",
  email: "customer@example.com",
  mobile: "01600000000",
  preferredContact: "email" as const,
};

/**
 * The demo ticket set — clearly marked and chosen to cover EVERY status,
 * priority and department so the list, filters, badges, details, conversation
 * timeline and overview summary can all be exercised end to end. NOT production
 * data.
 */
export function buildDemoTickets(): Ticket[] {
  return [
    {
      id: "HD-2026-00001",
      subject: "লগইন সমস্যা",
      category: "login",
      priority: "high",
      department: "Technical Support",
      description: "লগইন করার সময় মোবাইলে OTP আসছে না, তাই অ্যাকাউন্টে ঢুকতে পারছি না।",
      status: "open",
      contact: { ...reporter },
      relatedRoute: "/login",
      attachments: [],
      messages: [
        { id: "m-01-1", author: "user", body: "আমি OTP পাচ্ছি না।", createdAt: days(2), statusChange: "open" },
        {
          id: "m-01-2",
          author: "support",
          authorName: "রুমানা আক্তার",
          body: "আমরা আপনার নম্বর যাচাই করছি, অনুগ্রহ করে অপেক্ষা করুন।",
          createdAt: hours(30),
          statusChange: "in_progress",
        },
        {
          id: "m-01-3",
          author: "support",
          authorName: "রুমানা আক্তার",
          body: "অনুগ্রহ করে নিচের ধাপগুলো অনুসরণ করে আবার চেষ্টা করুন।",
          steps: ["Logout করুন", "Browser cache clear করুন", "আবার login করুন"],
          createdAt: hours(20),
          statusChange: "open",
        },
      ],
      createdAt: days(2),
      updatedAt: hours(20),
      assignedAgent: "রুমানা আক্তার",
    },
    {
      id: "HD-2026-00002",
      subject: "পেমেন্ট দেখাচ্ছে না",
      category: "payment",
      priority: "medium",
      department: "Accounts",
      description: "পেমেন্ট সম্পন্ন করেছি কিন্তু পেমেন্ট হিস্ট্রিতে কোনো এন্ট্রি দেখা যাচ্ছে না।",
      status: "waiting_for_user",
      contact: { ...reporter },
      relatedRoute: "/clientDashboard/payment-entry",
      attachments: [],
      messages: [
        { id: "m-02-1", author: "user", body: "পেমেন্ট সফল হয়েছে কিন্তু হিস্ট্রিতে দেখা যাচ্ছে না।", createdAt: days(1), statusChange: "open" },
        {
          id: "m-02-2",
          author: "support",
          authorName: "সাপোর্ট টিম",
          body: "আমরা আপনার পেমেন্ট রেকর্ড যাচাই করছি। অনুগ্রহ করে পেমেন্টের স্ক্রিনশট শেয়ার করতে পারবেন?",
          createdAt: hours(5),
          statusChange: "waiting_for_user",
        },
      ],
      createdAt: days(1),
      updatedAt: hours(5),
      assignedAgent: "সাপোর্ট টিম",
    },
    {
      id: "HD-2026-00003",
      subject: "প্রোফাইল আপডেট অনুরোধ",
      category: "account",
      priority: "low",
      department: "Support",
      description: "আমার প্রোফাইলে নাম ও প্রতিষ্ঠানের তথ্য আপডেট করা প্রয়োজন।",
      status: "resolved",
      contact: { ...reporter },
      relatedRoute: "/clientDashboard",
      attachments: [],
      messages: [
        { id: "m-03-1", author: "user", body: "প্রোফাইলে প্রতিষ্ঠানের তথ্য আপডেট করতে চাই।", createdAt: days(4), statusChange: "open" },
        {
          id: "m-03-2",
          author: "support",
          authorName: "সাপোর্ট টিম",
          body: "আপনার প্রোফাইল আপডেট করা হয়েছে।",
          createdAt: days(3),
          statusChange: "resolved",
        },
      ],
      createdAt: days(4),
      updatedAt: days(3),
      resolvedAt: days(3),
      resolutionSummary: "প্রোফাইলের নাম ও প্রতিষ্ঠানের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      assignedAgent: "সাপোর্ট টিম",
    },
    {
      id: "HD-2026-00004",
      subject: "সার্ভিস বিল সংক্রান্ত প্রশ্ন",
      category: "technical",
      priority: "medium",
      department: "Billing",
      description: "আমার সর্বশেষ সার্ভিস বিলের পরিমাণ ও স্ট্যাটাস নিয়ে জানতে চাই।",
      status: "open",
      contact: { ...reporter },
      relatedRoute: "/clientDashboard/service-build",
      attachments: [],
      messages: [
        { id: "m-04-1", author: "user", body: "সর্বশেষ সার্ভিস বিলের বিস্তারিত জানতে চাই।", createdAt: hours(6), statusChange: "open" },
      ],
      createdAt: hours(6),
      updatedAt: hours(6),
    },
    {
      id: "HD-2026-00005",
      subject: "এক্সপেন্স ক্লেইম জমা দিতে পারছি না",
      category: "expense_claim",
      priority: "urgent",
      department: "Technical Support",
      description: "এক্সপেন্স ক্লেইম ফর্মে জমা দিলে ত্রুটি দেখাচ্ছে, তাই খরচের দাবি পাঠাতে পারছি না।",
      status: "in_progress",
      contact: { ...reporter },
      relatedRoute: "/userDashboard/expense-claim/new",
      attachments: [],
      messages: [
        { id: "m-05-1", author: "user", body: "এক্সপেন্স ক্লেইম জমা দিতে গেলে ত্রুটি আসছে।", createdAt: mins(180), statusChange: "open" },
        {
          id: "m-05-2",
          author: "support",
          authorName: "সাপোর্ট টিম",
          body: "আমরা ত্রুটিটি যাচাই করছি, দ্রুত সমাধান করা হবে।",
          createdAt: mins(90),
          statusChange: "in_progress",
        },
      ],
      createdAt: mins(180),
      updatedAt: mins(90),
      assignedAgent: "সাপোর্ট টিম",
    },
    {
      id: "HD-2026-00006",
      subject: "পুরোনো রেজিস্ট্রেশন সমস্যা",
      category: "registration",
      priority: "low",
      department: "Support",
      description: "রেজিস্ট্রেশনের একটি পুরোনো সমস্যা, যা এখন আর নেই।",
      status: "closed",
      contact: { ...reporter },
      attachments: [],
      messages: [
        { id: "m-06-1", author: "user", body: "রেজিস্ট্রেশনের সমস্যাটি এখন আর নেই।", createdAt: days(10), statusChange: "open" },
        {
          id: "m-06-2",
          author: "support",
          authorName: "সাপোর্ট টিম",
          body: "আপনার সম্মতিতে টিকিটটি বন্ধ করা হলো।",
          createdAt: days(9),
          statusChange: "closed",
        },
      ],
      createdAt: days(10),
      updatedAt: days(9),
      resolvedAt: days(9),
      resolutionSummary: "সমস্যাটি স্বয়ংক্রিয়ভাবে সমাধান হয়েছে; টিকিট বন্ধ করা হয়েছে।",
      assignedAgent: "সাপোর্ট টিম",
    },
  ];
}

/**
 * Help Desk — bilingual copy (bn + en).
 *
 * Every user-visible string lives here so the UI can be rendered in either
 * language by reading `helpDeskCopyFor(language)`. This mirrors the existing
 * `serviceBuildCopy` / `authCopyFor` convention used across the portal instead
 * of scattering hard-coded Bangla strings through components.
 */

import type {
  TicketCategoryId,
  TicketPriority,
  TicketStatus,
} from "./types";

export interface HelpDeskCopy {
  brand: string; // "Shikkha Chat"
  title: string; // হেল্প ডেস্ক
  titleEn: string; // Help Desk
  subtitle: string;

  // Nav / chrome
  navHome: string;
  navHelpDesk: string;
  navNewTicket: string;
  navMyTickets: string;
  navDashboard: string;
  navLogin: string;

  // Landing
  landingBadge: string;
  landingCreate: string;
  landingCreateHint: string;
  landingBrowse: string;
  landingBrowseHint: string;
  landingGuestTitle: string;
  landingGuestHint: string;
  landingMyTickets: string;
  landingMyTicketsEmpty: string;
  landingViewAll: string;
  landingTopicsTitle: string;
  landingTopicsHint: string;
  landingStepsTitle: string;
  landingStep1: string;
  landingStep2: string;
  landingStep3: string;
  landingStep4: string;

  // Create form
  createTitle: string;
  createSubtitle: string;
  sectionBasic: string;
  sectionTicket: string;
  sectionOptional: string;
  fieldName: string;
  fieldEmail: string;
  fieldMobile: string;
  fieldSubject: string;
  fieldCategory: string;
  fieldPriority: string;
  fieldDescription: string;
  fieldRelatedRoute: string;
  fieldPreferredContact: string;
  fieldDepartment: string;
  phName: string;
  phEmail: string;
  phMobile: string;
  phSubject: string;
  phDescription: string;
  phRelatedRoute: string;
  selectCategory: string;
  selectPriority: string;
  preferredEmail: string;
  preferredMobile: string;
  attachTitle: string;
  attachHint: string;
  attachChoose: string;
  attachReplace: string;
  attachRemove: string;
  attachNote: string;
  submit: string;
  submitting: string;
  cancel: string;
  // ERP-driven options + form chrome (all values come from the ERP)
  optionsLoading: string;
  optionsFailed: string;
  optionsRetry: string;
  optionsEmptyType: string;
  optionsEmptyPriority: string;
  optionsEmptyTeam: string;
  sectionBasicHint: string;
  sectionTicketHint: string;
  sectionOptionalHint: string;
  stepLabel: string;
  liveBadge: string;
  attachDrop: string;
  attachMax: string;
  toastOptionsFailed: string;
  toastAttachAdded: string;
  toastAttachRemoved: string;
  toastAttachLimit: string;
  summaryTitle: string;
  summaryCategory: string;
  summaryPriority: string;
  summaryFiles: string;
  summaryNone: string;
  nextTitle: string;
  nextStep1: string;
  nextStep2: string;
  nextStep3: string;

  // Success
  successTitle: string;
  successHint: string;
  successTicketId: string;
  successSubject: string;
  successStatus: string;
  successCreated: string;
  successPriority: string;
  successContact: string;
  successView: string;
  successAnother: string;

  // List
  listTitle: string;
  listSubtitle: string;
  /** Solved (closed) tickets section — identical design to the open list. */
  solvedTitle: string;
  solvedSubtitle: string;
  solvedOnlyNote: string;
  solvedEmptyTitle: string;
  solvedEmptyHint: string;
  searchPlaceholder: string;
  filterAll: string;
  colSl: string;
  back: string;
  openOnlyNote: string;
  colTicketId: string;
  colSubject: string;
  colCategory: string;
  colPriority: string;
  colStatus: string;
  colUpdated: string;
  colAction: string;
  viewDetails: string;
  listGuestTitle: string;
  listGuestHint: string;
  listGuestCta: string;

  // Empty / error / loading
  emptyTitle: string;
  emptyHint: string;
  emptyCta: string;
  loadingTickets: string;
  loadingTicket: string;
  loadFailedTitle: string;
  loadFailedHint: string;
  retry: string;
  notFoundTitle: string;
  notFoundHint: string;
  backToList: string;

  // Details
  detailsTitle: string;
  detailsProblem: string;
  detailsAttachments: string;
  detailsNoAttachments: string;
  detailsInfo: string;
  detailsConversation: string;
  detailsTimeline: string;
  detailsCreated: string;
  detailsUpdated: string;
  detailsAgent: string;
  detailsUnassigned: string;
  detailsRelatedRoute: string;
  detailsDepartment: string;

  // Conversation
  you: string;
  support: string;
  system: string;
  timelineCreated: string;
  timelineStatusTo: string;

  // Reply
  replyTitle: string;
  replyPlaceholder: string;
  replyStepsPlaceholder: string;
  replySend: string;
  replySending: string;
  replySent: string;
  replyValidation: string;

  // Customer-care simulation (demo affordance)
  simTitle: string;
  simHint: string;
  simAgentName: string;
  simMessage: string;
  simStepsHint: string;
  simStatusLabel: string;
  simStatusNone: string;
  simResolutionPlaceholder: string;
  simSend: string;
  simSending: string;
  simSent: string;

  // Resolved block
  resolvedTitle: string;
  resolvedSummary: string;
  resolvedAt: string;
  reopened: string;
  reopenStillBroken: string;
  reopenHint: string;
  reopenAction: string;
  reopenDone: string;

  // Guest tracking
  guestTitle: string;
  guestHint: string;
  guestTicketId: string;
  guestContact: string;
  guestPhTicketId: string;
  guestPhContact: string;
  guestTrack: string;
  guestTracking: string;
  guestNotFound: string;
  guestFoundHint: string;

  // Toasts
  toastCreated: string; // "আপনার টিকিট সফলভাবে তৈরি হয়েছে — {id}"
  toastLoadFailed: string;
  toastReplySent: string;
  toastReopened: string;
  toastValidation: string;
  toastValidationDescription: string;
  toastValidationSubject: string;
  toastValidationContact: string;
  toastValidationEmail: string;
  toastValidationTicketId: string;
  toastInfoReview: string;
  toastSimSent: string;

  // Validation inline
  errRequired: string;
  errEmail: string;
  errDescriptionShort: string;

  // Categories / priorities / statuses
  categories: Record<TicketCategoryId, string>;
  priorities: Record<TicketPriority, string>;
  statuses: Record<TicketStatus, string>;

  // Dashboard (smart overview) — shown inside the dashboard shell
  overviewTitle: string;
  overviewSubtitle: string;
  summaryHeading: string;
  summaryTotal: string;
  quickActions: string;
  quickOpenTickets: string;
  quickResolvedTickets: string;
  quickSearchTickets: string;
  recentActivity: string;
  recentEmpty: string;
  newReplyBadge: string;
  unresolvedHeading: string;
  unresolvedEmpty: string;
  breadcrumbDashboard: string;

  // Demo data affordances (mock phase only)
  demoBadge: string;
  demoFill: string;
}

/** Minimum meaningful description length. */
export const MIN_DESCRIPTION_LENGTH = 15;

const bn: HelpDeskCopy = {
  brand: "শিক্ষা চ্যাট",
  title: "হেল্প ডেস্ক",
  titleEn: "Help Desk",
  subtitle: "আপনার সমস্যার জন্য টিকিট তৈরি করুন এবং সমাধানের অগ্রগতি দেখুন।",

  navHome: "হোম",
  navHelpDesk: "হেল্প ডেস্ক",
  navNewTicket: "নতুন টিকিট",
  navMyTickets: "আমার টিকিট",
  navDashboard: "ড্যাশবোর্ড",
  navLogin: "লগইন",

  landingBadge: "সাপোর্ট সেন্টার",
  landingCreate: "নতুন টিকিট তৈরি করুন",
  landingCreateHint: "সমস্যা লিখে সাপোর্ট টিমের কাছে পাঠান।",
  landingBrowse: "আমার টিকিট দেখুন",
  landingBrowseHint: "আপনার করা টিকিটের অবস্থা ও উত্তর দেখুন।",
  landingGuestTitle: "গেস্ট ট্র্যাকিং",
  landingGuestHint: "লগইন ছাড়াই টিকিট আইডি ও ইমেইল/মোবাইল দিয়ে টিকিট খুঁজুন।",
  landingMyTickets: "সাম্প্রতিক টিকিট",
  landingMyTicketsEmpty: "আপনার এখনো কোনো টিকিট নেই।",
  landingViewAll: "সব টিকিট দেখুন",
  landingTopicsTitle: "যেসব বিষয়ে সহায়তা পাবেন",
  landingTopicsHint: "আপনার সমস্যার ধরন বেছে নিন — টিকিট তৈরি করা সহজ হবে।",
  landingStepsTitle: "কীভাবে কাজ করে",
  landingStep1: "নতুন টিকিট তৈরি করুন",
  landingStep2: "সমস্যা বিস্তারিত লিখুন",
  landingStep3: "টিকিট আইডি সংরক্ষণ করুন",
  landingStep4: "সাপোর্টের উত্তর ও অগ্রগতি দেখুন",

  createTitle: "নতুন টিকিট তৈরি করুন",
  createSubtitle: "আপনার সমস্যা বিস্তারিত লিখুন, সাপোর্ট টিম যত দ্রুত সম্ভব উত্তর দেবে।",
  sectionBasic: "মূল তথ্য",
  sectionTicket: "টিকিট তথ্য",
  sectionOptional: "অতিরিক্ত (ঐচ্ছিক)",
  fieldName: "আপনার নাম",
  fieldEmail: "ইমেইল",
  fieldMobile: "মোবাইল নম্বর",
  fieldSubject: "বিষয়",
  fieldCategory: "ক্যাটাগরি",
  fieldPriority: "প্রায়োরিটি",
  fieldDescription: "সমস্যার বিবরণ",
  fieldRelatedRoute: "যে পেজে সমস্যা হয়েছে",
  fieldPreferredContact: "যোগাযোগের পছন্দের মাধ্যম",
  fieldDepartment: "বিভাগ (ঐচ্ছিক)",
  phName: "যেমন: আপনার পূর্ণ নাম",
  phEmail: "you@example.com",
  phMobile: "01XXXXXXXXX",
  phSubject: "সমস্যাটি সংক্ষেপে লিখুন",
  phDescription: "কীভাবে সমস্যাটি দেখছেন, কখন হয়, কী প্রত্যাশা করছেন — বিস্তারিত লিখুন।",
  phRelatedRoute: "যেমন: /login বা /clientDashboard",
  selectCategory: "ক্যাটাগরি বেছে নিন",
  selectPriority: "প্রায়োরিটি বেছে নিন",
  preferredEmail: "ইমেইল",
  preferredMobile: "মোবাইল",
  attachTitle: "স্ক্রিনশট / সংযুক্তি",
  attachHint: "ছবি বা PDF যোগ করে সমস্যা বোঝাতে সাহায্য করুন।",
  attachChoose: "ফাইল বাছুন",
  attachReplace: "ফাইল বদলান",
  attachRemove: "সরান",
  attachNote: "এখন ফাইল শুধু কাছাকাছি সময়ের জন্য দেখানো হচ্ছে; স্থায়ী আপলোড পরবর্তী ছাড়ে যোগ হবে।",
  submit: "টিকিট জমা দিন",
  submitting: "জমা হচ্ছে…",
  cancel: "বাতিল করুন",
  optionsLoading: "অপশন লোড হচ্ছে…",
  optionsFailed: "হেল্প ডেস্কের অপশন লোড করা যায়নি।",
  optionsRetry: "আবার চেষ্টা করুন",
  optionsEmptyType: "সিস্টেমে এখন কোনো টিকিট ক্যাটাগরি কনফিগার করা নেই — বিষয় ও বিবরণ দিয়েই টিকিট পাঠাতে পারবেন।",
  optionsEmptyPriority: "কোনো প্রায়োরিটি কনফিগার করা নেই — ডিফল্ট প্রায়োরিটি ব্যবহার হবে।",
  optionsEmptyTeam: "কোনো টিম কনফিগার করা নেই",
  sectionBasicHint: "আপনার সাথে কীভাবে যোগাযোগ করা যাবে জানিয়ে দিন।",
  sectionTicketHint: "সমস্যাটি নির্দিষ্ট করে লিখুন — যত স্পষ্ট, তত দ্রুত সমাধান।",
  sectionOptionalHint: "প্রয়োজনে টিম, লিংক বা ফাইল যোগ করুন।",
  stepLabel: "ধাপ {n}",
  liveBadge: "ERP থেকে লাইভ",
  attachDrop: "ফাইল এখানে টেনে ছাড়ুন বা ক্লিক করুন",
  attachMax: "সর্বোচ্চ {count}টি ফাইল",
  toastOptionsFailed: "লাইভ হেল্প ডেস্ক অপশন পাওয়া যায়নি — ‘আবার চেষ্টা করুন’ চাপুন।",
  toastAttachAdded: "ফাইল সংযুক্ত হয়েছে।",
  toastAttachRemoved: "ফাইল সরানো হয়েছে।",
  toastAttachLimit: "সর্বোচ্চ {count}টি ফাইল সংযুক্ত করা যাবে।",
  summaryTitle: "সারসংক্ষেপ",
  summaryCategory: "ক্যাটাগরি",
  summaryPriority: "প্রায়োরিটি",
  summaryFiles: "সংযুক্তি",
  summaryNone: "এখনো বাছা হয়নি",
  nextTitle: "এরপর কী হবে?",
  nextStep1: "টিকিট সাথে সাথে ERP হেল্প ডেস্কে তৈরি হবে — একটি টিকিট আইডি পাবেন।",
  nextStep2: "সাপোর্ট টিম আপনার দেওয়া যোগাযোগ মাধ্যমেই উত্তর দেবে।",
  nextStep3: "সব আপডেট ‘আমার টিকিট’ তালিকায় লাইভ দেখা যাবে।",

  successTitle: "টিকিট সফলভাবে তৈরি হয়েছে",
  successHint: "টিকিট আইডি সংরক্ষণ করুন — এটি দিয়ে আপনি অবস্থা দেখতে পারবেন।",
  successTicketId: "টিকিট আইডি",
  successSubject: "বিষয়",
  successStatus: "স্ট্যাটাস",
  successCreated: "তৈরির সময়",
  successPriority: "প্রায়োরিটি",
  successContact: "যোগাযোগ",
  successView: "টিকিট দেখুন",
  successAnother: "আরেকটি টিকিট তৈরি করুন",

  listTitle: "আমার টিকিট",
  listSubtitle: "আপনার তৈরি করা টিকিটের অবস্থা ও অগ্রগতি।",
  solvedTitle: "সমাধান হওয়া টিকিট",
  solvedSubtitle: "যেসব টিকিট সমাধান হয়ে বন্ধ হয়েছে সেগুলোর তালিকা।",
  solvedOnlyNote: "শুধু ক্লোজড স্ট্যাটাসের টিকিট দেখানো হচ্ছে",
  solvedEmptyTitle: "এখনও কোনো বন্ধ হওয়া টিকিট নেই।",
  solvedEmptyHint: "টিকিট সমাধান হয়ে বন্ধ হলে সেটি এখানে দেখা যাবে।",
  searchPlaceholder: "টিকিট আইডি বা বিষয় দিয়ে খুঁজুন",
  filterAll: "সব",
  colSl: "ক্রম",
  back: "পেছনে যান",
  openOnlyNote: "শুধু ওপেন স্ট্যাটাসের টিকিট দেখানো হচ্ছে",
  colTicketId: "টিকিট আইডি",
  colSubject: "বিষয়",
  colCategory: "ক্যাটাগরি",
  colPriority: "প্রায়োরিটি",
  colStatus: "স্ট্যাটাস",
  colUpdated: "সর্বশেষ হালনাগাদ",
  colAction: "অ্যাকশন",
  viewDetails: "বিস্তারিত দেখুন",
  listGuestTitle: "আপনি লগইন করেননি",
  listGuestHint: "নিজের টিকিটের তালিকা দেখতে লগইন করুন, অথবা গেস্ট ট্র্যাকিং দিয়ে টিকিট খুঁজুন।",
  listGuestCta: "গেস্ট ট্র্যাকিং",

  emptyTitle: "এখনও কোনো টিকিট তৈরি করা হয়নি।",
  emptyHint: "কোনো সমস্যা হলে নতুন টিকিট তৈরি করুন — সাপোর্ট টিম সাহায্য করবে।",
  emptyCta: "নতুন টিকিট তৈরি করুন",
  loadingTickets: "টিকিট লোড হচ্ছে…",
  loadingTicket: "টিকিট লোড হচ্ছে…",
  loadFailedTitle: "টিকিট লোড করা যাচ্ছে না।",
  loadFailedHint: "একটু পরে আবার চেষ্টা করুন।",
  retry: "আবার চেষ্টা করুন",
  notFoundTitle: "এই টিকিটটি পাওয়া যায়নি।",
  notFoundHint: "টিকিট আইডি সঠিক কিনা যাচাই করুন অথবা তালিকায় ফিরে যান।",
  backToList: "তালিকায় ফিরুন",

  detailsTitle: "টিকিট বিস্তারিত",
  detailsProblem: "সমস্যার বিবরণ",
  detailsAttachments: "সংযুক্তি",
  detailsNoAttachments: "কোনো সংযুক্তি নেই।",
  detailsInfo: "তথ্য",
  detailsConversation: "কথোপকথন",
  detailsTimeline: "কার্যক্রমের সময়রেখা",
  detailsCreated: "তৈরি",
  detailsUpdated: "হালনাগাদ",
  detailsAgent: "দায়িত্বপ্রাপ্ত এজেন্ট",
  detailsUnassigned: "এখনো বরাদ্দ হয়নি",
  detailsRelatedRoute: "সমস্যার পেজ",
  detailsDepartment: "বিভাগ",

  you: "আপনি",
  support: "কাস্টমার কেয়ার",
  system: "সিস্টেম",
  timelineCreated: "টিকিট তৈরি হয়েছে",
  timelineStatusTo: "স্ট্যাটাস পরিবর্তন",

  replyTitle: "উত্তর লিখুন",
  replyPlaceholder: "আপনার মন্তব্য বা অতিরিক্ত তথ্য লিখুন…",
  replyStepsPlaceholder: "প্রতি লাইনে একটি ধাপ (ঐচ্ছিক)",
  replySend: "উত্তর পাঠান",
  replySending: "পাঠানো হচ্ছে…",
  replySent: "আপনার উত্তর যোগ হয়েছে।",
  replyValidation: "উত্তর খালি রাখা যাবে না।",

  simTitle: "কাস্টমার কেয়ার প্রতিক্রিয়া (ডেমো)",
  simHint: "ব্যবহারকারীর অভিজ্ঞতা পরীক্ষা করতে সাপোর্ট এজেন্টের উত্তর অনুকরণ করুন।",
  simAgentName: "এজেন্টের নাম",
  simMessage: "সাপোর্ট বার্তা",
  simStepsHint: "সমাধানের ধাপ (ঐচ্ছিক, প্রতি লাইনে একটি)",
  simStatusLabel: "স্ট্যাটাস",
  simStatusNone: "পরিবর্তন নয়",
  simResolutionPlaceholder: "সমাধানের সারসংক্ষেপ (ডানে স্ট্যাটাস Resolved হলে)",
  simSend: "প্রতিক্রিয়া পাঠান",
  simSending: "পাঠানো হচ্ছে…",
  simSent: "ডেমো প্রতিক্রিয়া যোগ হয়েছে।",

  resolvedTitle: "সমস্যা সমাধান হয়েছে",
  resolvedSummary: "সমাধানের সারসংক্ষেপ",
  resolvedAt: "সমাধানের সময়",
  reopened: "টিকিট আবার খোলা হয়েছে।",
  reopenStillBroken: "সমস্যা এখনো আছে?",
  reopenHint: "সমস্যা এখনো থাকলে টিকিট আবার খুলে দিতে পারেন, সাপোর্ট টিম পুনরায় দেখবে।",
  reopenAction: "সমস্যা এখনো আছে",
  reopenDone: "টিকিট পুনরায় খোলা হয়েছে।",

  guestTitle: "গেস্ট টিকিট ট্র্যাকিং",
  guestHint: "টিকিট আইডি এবং যে ইমেইল/মোবাইল দিয়ে তৈরি করেছিলেন তা দিয়ে খুঁজুন।",
  guestTicketId: "টিকিট আইডি",
  guestContact: "ইমেইল অথবা মোবাইল",
  guestPhTicketId: "HD-2026-00001",
  guestPhContact: "you@example.com বা 01XXXXXXXXX",
  guestTrack: "টিকিট খুঁজুন",
  guestTracking: "খোঁজা হচ্ছে…",
  guestNotFound: "এই তথ্য দিয়ে কোনো টিকিট পাওয়া যায়নি।",
  guestFoundHint: "আপনার টিকিট পাওয়া গেছে:",

  toastCreated: "আপনার টিকিট সফলভাবে তৈরি হয়েছে — {id}",
  toastLoadFailed: "টিকিট লোড করা যাচ্ছে না।",
  toastReplySent: "আপনার উত্তর পাঠানো হয়েছে।",
  toastReopened: "টিকিট পুনরায় খোলা হয়েছে।",
  toastValidation: "ফর্মটি সম্পূর্ণ করুন।",
  toastValidationDescription: "সমস্যার বিবরণ লিখুন।",
  toastValidationSubject: "টিকিটের বিষয় লিখুন।",
  toastValidationContact: "নাম ও ইমেইল দিন।",
  toastValidationEmail: "সঠিক ইমেইল দিন।",
  toastValidationTicketId: "টিকিট আইডি ও ইমেইল/মোবাইল দিন।",
  toastInfoReview: "কাস্টমার কেয়ার আপনার টিকিটটি পর্যালোচনা করছে।",
  toastSimSent: "কাস্টমার কেয়ার প্রতিক্রিয়া যোগ হয়েছে।",

  errRequired: "এই ঘরটি পূরণ করুন।",
  errEmail: "সঠিক ইমেইল দিন।",
  errDescriptionShort: "অনুগ্রহ করে অন্তত কয়েক শব্দে সমস্যাটি লিখুন।",

  categories: {
    login: "লগইন সমস্যা",
    account: "অ্যাকাউন্ট সমস্যা",
    payment: "পেমেন্ট সমস্যা",
    registration: "রেজিস্ট্রেশন সমস্যা",
    dashboard: "ড্যাশবোর্ড সমস্যা",
    expense_claim: "এক্সপেন্স ক্লেইম সমস্যা",
    customer_creation: "কাস্টমার তৈরি সমস্যা",
    technical: "টেকনিক্যাল সমস্যা",
    other: "অন্যান্য",
  },
  priorities: {
    low: "কম",
    medium: "মাঝারি",
    high: "উচ্চ",
    urgent: "জরুরি",
  },
  statuses: {
    open: "খোলা",
    in_progress: "চলমান",
    waiting_for_user: "আপনার উত্তরের অপেক্ষায়",
    resolved: "সমাধান হয়েছে",
    closed: "বন্ধ",
  },

  overviewTitle: "সাপোর্ট ড্যাশবোর্ড",
  overviewSubtitle: "আপনার টিকিটের সারসংক্ষেপ, দ্রুত অ্যাকশন ও সাম্প্রতিক কার্যক্রম এক জায়গায়।",
  summaryHeading: "টিকিট সারসংক্ষেপ",
  summaryTotal: "মোট টিকিট",
  quickActions: "দ্রুত অ্যাকশন",
  quickOpenTickets: "খোলা টিকিট",
  quickResolvedTickets: "সমাধান হওয়া টিকিট",
  quickSearchTickets: "টিকিট খুঁজুন",
  recentActivity: "সাম্প্রতিক কার্যক্রম",
  recentEmpty: "এখনো কোনো সাম্প্রতিক কার্যক্রম নেই।",
  newReplyBadge: "নতুন উত্তর",
  unresolvedHeading: "অসমাধিত টিকিট",
  unresolvedEmpty: "সব টিকিট সমাধান হয়েছে।",
  breadcrumbDashboard: "ড্যাশবোর্ড",
  demoBadge: "ডেমো ডেটা",
  demoFill: "ডেমো ডেটা দিন",
};

const en: HelpDeskCopy = {
  brand: "Shikkha Chat",
  title: "Help Desk",
  titleEn: "Help Desk",
  subtitle: "Create a ticket for your problem and follow the progress toward a solution.",

  navHome: "Home",
  navHelpDesk: "Help Desk",
  navNewTicket: "New ticket",
  navMyTickets: "My tickets",
  navDashboard: "Dashboard",
  navLogin: "Log in",

  landingBadge: "Support Center",
  landingCreate: "Create a new ticket",
  landingCreateHint: "Describe your problem and send it to the support team.",
  landingBrowse: "View my tickets",
  landingBrowseHint: "See the status and replies of the tickets you filed.",
  landingGuestTitle: "Guest tracking",
  landingGuestHint: "Look up a ticket with its ID and your email/mobile — no login needed.",
  landingMyTickets: "Recent tickets",
  landingMyTicketsEmpty: "You have no tickets yet.",
  landingViewAll: "View all tickets",
  landingTopicsTitle: "What we can help you with",
  landingTopicsHint: "Pick the kind of problem you have — filing a ticket gets easier.",
  landingStepsTitle: "How it works",
  landingStep1: "Create a new ticket",
  landingStep2: "Describe the problem in detail",
  landingStep3: "Save your ticket ID",
  landingStep4: "Follow support replies and progress",

  createTitle: "Create a new ticket",
  createSubtitle: "Describe your problem in detail; the support team will reply as soon as possible.",
  sectionBasic: "Basic information",
  sectionTicket: "Ticket information",
  sectionOptional: "Additional (optional)",
  fieldName: "Your name",
  fieldEmail: "Email",
  fieldMobile: "Mobile number",
  fieldSubject: "Subject",
  fieldCategory: "Category",
  fieldPriority: "Priority",
  fieldDescription: "Problem description",
  fieldRelatedRoute: "Page where it happened",
  fieldPreferredContact: "Preferred contact method",
  fieldDepartment: "Department (optional)",
  phName: "e.g. your full name",
  phEmail: "you@example.com",
  phMobile: "01XXXXXXXXX",
  phSubject: "Summarise the problem",
  phDescription: "What you see, when it happens, what you expect — the more detail the better.",
  phRelatedRoute: "e.g. /login or /clientDashboard",
  selectCategory: "Choose a category",
  selectPriority: "Choose a priority",
  preferredEmail: "Email",
  preferredMobile: "Mobile",
  attachTitle: "Screenshot / attachment",
  attachHint: "Attach an image or PDF to help explain the problem.",
  attachChoose: "Choose file",
  attachReplace: "Replace file",
  attachRemove: "Remove",
  attachNote: "Files are only previewed locally for now; real upload arrives with the backend.",
  submit: "Submit ticket",
  submitting: "Submitting…",
  cancel: "Cancel",
  optionsLoading: "Loading options…",
  optionsFailed: "Could not load the Help Desk options.",
  optionsRetry: "Try again",
  optionsEmptyType: "No ticket categories are configured yet — you can still send a ticket with a subject and description.",
  optionsEmptyPriority: "No priorities are configured — the default priority will be used.",
  optionsEmptyTeam: "No teams configured",
  sectionBasicHint: "Tell us how to reach you about this ticket.",
  sectionTicketHint: "Describe the issue precisely — clearer reports get faster fixes.",
  sectionOptionalHint: "Optionally add a team, a related link or files.",
  stepLabel: "Step {n}",
  liveBadge: "Live from ERP",
  attachDrop: "Drag files here or click to browse",
  attachMax: "Up to {count} files",
  toastOptionsFailed: "Live Help Desk options are unavailable — press “Try again”.",
  toastAttachAdded: "File attached.",
  toastAttachRemoved: "File removed.",
  toastAttachLimit: "You can attach at most {count} files.",
  summaryTitle: "Summary",
  summaryCategory: "Category",
  summaryPriority: "Priority",
  summaryFiles: "Attachments",
  summaryNone: "Not selected yet",
  nextTitle: "What happens next?",
  nextStep1: "Your ticket is created in the ERP Help Desk immediately — you get a ticket ID.",
  nextStep2: "The support team replies on the contact channel you chose.",
  nextStep3: "Every update appears live in “My tickets”.",

  successTitle: "Ticket created successfully",
  successHint: "Keep your ticket ID — you can use it to track the status.",
  successTicketId: "Ticket ID",
  successSubject: "Subject",
  successStatus: "Status",
  successCreated: "Created",
  successPriority: "Priority",
  successContact: "Contact",
  successView: "View ticket",
  successAnother: "Create another ticket",

  listTitle: "My tickets",
  listSubtitle: "Status and progress of the tickets you filed.",
  solvedTitle: "Solved tickets",
  solvedSubtitle: "Every ticket that has been resolved and closed.",
  solvedOnlyNote: "Showing closed tickets only",
  solvedEmptyTitle: "No closed tickets yet.",
  solvedEmptyHint: "A ticket shows up here once it is resolved and closed.",
  searchPlaceholder: "Search by ticket ID or subject",
  filterAll: "All",
  colSl: "SL",
  back: "Go back",
  openOnlyNote: "Showing open tickets only",
  colTicketId: "Ticket ID",
  colSubject: "Subject",
  colCategory: "Category",
  colPriority: "Priority",
  colStatus: "Status",
  colUpdated: "Last updated",
  colAction: "Action",
  viewDetails: "View details",
  listGuestTitle: "You are not signed in",
  listGuestHint: "Log in to see your tickets, or use guest tracking to look one up.",
  listGuestCta: "Guest tracking",

  emptyTitle: "No tickets created yet.",
  emptyHint: "If something goes wrong, create a new ticket — the support team will help.",
  emptyCta: "Create a new ticket",
  loadingTickets: "Loading tickets…",
  loadingTicket: "Loading ticket…",
  loadFailedTitle: "The tickets could not be loaded.",
  loadFailedHint: "Please try again in a moment.",
  retry: "Try again",
  notFoundTitle: "That ticket could not be found.",
  notFoundHint: "Check the ticket ID or go back to the list.",
  backToList: "Back to list",

  detailsTitle: "Ticket details",
  detailsProblem: "Problem description",
  detailsAttachments: "Attachments",
  detailsNoAttachments: "No attachments.",
  detailsInfo: "Information",
  detailsConversation: "Conversation",
  detailsTimeline: "Activity timeline",
  detailsCreated: "Created",
  detailsUpdated: "Updated",
  detailsAgent: "Assigned agent",
  detailsUnassigned: "Not assigned yet",
  detailsRelatedRoute: "Page",
  detailsDepartment: "Department",

  you: "You",
  support: "Customer Care",
  system: "System",
  timelineCreated: "Ticket created",
  timelineStatusTo: "Status changed",

  replyTitle: "Write a reply",
  replyPlaceholder: "Add a comment or extra information…",
  replyStepsPlaceholder: "One step per line (optional)",
  replySend: "Send reply",
  replySending: "Sending…",
  replySent: "Your reply was added.",
  replyValidation: "A reply cannot be empty.",

  simTitle: "Customer care response (demo)",
  simHint: "Simulate a support agent reply to exercise the full user experience.",
  simAgentName: "Agent name",
  simMessage: "Support message",
  simStepsHint: "Resolution steps (optional, one per line)",
  simStatusLabel: "Status",
  simStatusNone: "No change",
  simResolutionPlaceholder: "Resolution summary (when you set the status to Resolved)",
  simSend: "Send response",
  simSending: "Sending…",
  simSent: "Demo response added.",

  resolvedTitle: "The problem has been resolved",
  resolvedSummary: "Resolution summary",
  resolvedAt: "Resolved at",
  reopened: "The ticket has been reopened.",
  reopenStillBroken: "Still not fixed?",
  reopenHint: "If the problem persists you can reopen the ticket and support will look again.",
  reopenAction: "The problem is still there",
  reopenDone: "The ticket has been reopened.",

  guestTitle: "Guest ticket tracking",
  guestHint: "Look up a ticket with its ID and the email/mobile you used to file it.",
  guestTicketId: "Ticket ID",
  guestContact: "Email or mobile",
  guestPhTicketId: "HD-2026-00001",
  guestPhContact: "you@example.com or 01XXXXXXXXX",
  guestTrack: "Find ticket",
  guestTracking: "Searching…",
  guestNotFound: "No ticket was found with that information.",
  guestFoundHint: "We found your ticket:",

  toastCreated: "Your ticket was created successfully — {id}",
  toastLoadFailed: "The tickets could not be loaded.",
  toastReplySent: "Your reply was sent.",
  toastReopened: "The ticket was reopened.",
  toastValidation: "Please complete the form.",
  toastValidationDescription: "Please describe the problem.",
  toastValidationSubject: "Please enter a ticket subject.",
  toastValidationContact: "Please provide your name and email.",
  toastValidationEmail: "Please enter a valid email.",
  toastValidationTicketId: "Please provide a ticket ID and email/mobile.",
  toastInfoReview: "Customer care is reviewing your ticket.",
  toastSimSent: "The customer care response was added.",

  errRequired: "This field is required.",
  errEmail: "Please enter a valid email.",
  errDescriptionShort: "Please describe the problem in at least a few words.",

  categories: {
    login: "Login problem",
    account: "Account problem",
    payment: "Payment problem",
    registration: "Registration problem",
    dashboard: "Dashboard problem",
    expense_claim: "Expense claim problem",
    customer_creation: "Customer creation problem",
    technical: "Technical problem",
    other: "Other",
  },
  priorities: {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  },
  statuses: {
    open: "Open",
    in_progress: "In progress",
    waiting_for_user: "Waiting for you",
    resolved: "Resolved",
    closed: "Closed",
  },

  overviewTitle: "Support dashboard",
  overviewSubtitle: "Your ticket summary, quick actions and recent activity — all in one place.",
  summaryHeading: "Ticket summary",
  summaryTotal: "Total tickets",
  quickActions: "Quick actions",
  quickOpenTickets: "Open tickets",
  quickResolvedTickets: "Resolved tickets",
  quickSearchTickets: "Search tickets",
  recentActivity: "Recent activity",
  recentEmpty: "No recent activity yet.",
  newReplyBadge: "New reply",
  unresolvedHeading: "Unresolved tickets",
  unresolvedEmpty: "All tickets are resolved.",
  breadcrumbDashboard: "Dashboard",
  demoBadge: "Demo data",
  demoFill: "Fill demo data",
};

export const helpDeskCopy: Record<"bn" | "en", HelpDeskCopy> = { bn, en };

export function helpDeskCopyFor(language: string): HelpDeskCopy {
  return helpDeskCopy[language === "en" ? "en" : "bn"];
}

/**
 * Help Desk — copy for the Messages / Problems / conversation surfaces.
 *
 * Kept apart from `messages.ts` (the ticket list + form copy) so the existing
 * screens keep a stable contract. Every string the new surfaces render lives
 * here, in Bangla first with an English mirror, matching the rest of the portal.
 */

import type { TicketCategoryId, TicketPriority, TicketStatus } from "./types";

export interface ConversationCopy {
  /* ---- shared navigation ---- */
  back: string;
  /** Label of the persistent "go to Help Desk overview" nav button. */
  helpDeskHome: string;
  /** Date-range + title filters shared by every Help Desk table. */
  filtersFrom: string;
  filtersTo: string;
  filtersTitle: string;
  filtersTitlePlaceholder: string;
  filtersClear: string;
  filtersActive: string;
  viewMessages: string;
  viewProblem: string;

  /* ---- Messages listing ---- */
  messagesTitle: string;
  messagesSubtitle: string;
  messagesSubtitleSupport: string;
  messagesSearch: string;
  messagesEmptyTitle: string;
  messagesEmptyHint: string;
  messagesErrorTitle: string;
  messagesErrorHint: string;
  messagesRetry: string;
  messagesUnreadTotal: (count: number) => string;

  /* ---- listing table ---- */
  colSl: string;
  colTicket: string;
  colSubject: string;
  colLastMessage: string;
  colSender: string;
  colUpdated: string;
  colUnread: string;
  colAction: string;
  colCustomer: string;
  colPriority: string;
  colStatus: string;
  colCategory: string;
  colSubmitted: string;
  /** Solve Problem queue header: date/time of the row (closed when closed). */
  colClosedAt: string;
  /** Short chip label in front of a Solve Problem row's closed stamp. */
  stampClosed: string;
  colDate: string;
  actionOpen: string;
  actionView: string;
  unreadBadge: (count: number) => string;
  noUnread: string;

  /* ---- problem information ---- */
  problemTitle: string;
  problemDescription: string;
  problemCategory: string;
  problemPriority: string;
  problemStatus: string;
  problemSubmitted: string;
  problemAssigned: string;
  problemDepartment: string;
  customerContactTitle: string;
  customerEmail: string;
  customerPhone: string;
  solutionTitle: string;
  solutionBy: string;
  problemCustomer: string;
  problemAttachments: string;
  problemNoAttachments: string;
  problemId: string;

  /* ---- requirements ---- */
  requirementsTitle: string;
  requirementsHint: string;
  requirementsEmpty: string;
  requirementBadge: string;

  /* ---- conversation ---- */
  conversationTitle: string;
  allConversations: string;
  conversationLoading: string;
  conversationErrorTitle: string;
  conversationErrorHint: string;
  conversationRetry: string;
  conversationEmpty: string;
  conversationYou: string;
  conversationSupport: string;
  conversationCustomer: string;
  conversationNewMessages: string;
  conversationClosed: string;
  conversationClosedHint: string;
  conversationReopen: string;
  conversationReopening: string;
  conversationReopened: string;
  conversationReopenFailed: string;

  /* ---- composer ---- */
  composerPlaceholder: string;
  composerSend: string;
  composerSending: string;
  replyAction: string;
  composerReplyTo: (name: string) => string;
  composerCancelReply: string;
  composerAttach: string;
  composerRemoveFile: string;
  composerAttaching: string;
  composerValidation: string;
  composerSent: string;
  composerFailed: string;
  /** Shown when the portal session ended mid-conversation (dead sid cookie). */
  sessionExpired: string;
  /** Action label on the ended-session card. */
  signInAgain: string;
  composerClosed: string;
  composerRequirementPlaceholder: string;
  composerRequirementSend: string;
  composerRequirementSent: string;
  composerRequirementHint: string;
  composerRecordVoice: string;
  composerRecording: string;
  composerStopRecording: string;
  composerMicDenied: string;
  composerAttachmentOnly: string;
  composerVoiceNote: string;
  jumpToQuoted: string;

  /* ---- chat header + message actions + media ---- */
  /** Header identity line shown to a customer: their supporter. */
  chatSupportName: string;
  /** Header identity line shown to support: the customer who filed it. */
  chatCustomerName: string;
  chatStatusPrefix: string;
  pinAction: string;
  unpinAction: string;
  pinnedBar: string;
  pinFailed: string;
  pinToast: string;
  unpinToast: string;
  chatEventOpened: string;
  menuAria: string;
  menuOpen: string;
  forwardAction: string;
  selectAction: string;
  deleteAction: string;
  deleteTitle: string;
  deleteBody: string;
  deleteConfirm: string;
  deleteCancel: string;
  deleteDone: string;
  deleteFailed: string;
  forwardTitle: string;
  forwardHint: string;
  forwardEmpty: string;
  forwardDone: string;
  forwardFailed: string;
  forwardPrefix: string;
  selectHint: string;
  selectCount: string;
  selectCopy: string;
  selectDelete: string;
  selectCancel: string;
  copyEmpty: string;
  copyAction: string;
  copied: string;
  imageOpen: string;
  imageClose: string;
  imageDownload: string;
  voicePreview: string;

  /* ---- employee: problems + status ---- */
  problemsTitle: string;
  problemsSubtitle: string;
  problemsEmptyTitle: string;
  problemsEmptyHint: string;
  problemsSearch: string;
  statusTitle: string;
  statusHint: string;
  statusSelect: string;
  statusResolution: string;
  statusResolutionPlaceholder: string;
  statusUpdate: string;
  statusUpdating: string;
  statusUpdated: string;
  statusFailed: string;
  resolutionMark: string;
  resolutionBadge: string;

  /* ---- employee queues: New Problem / Solve Problem ---- */
  navNewProblem: string;
  navSolveProblem: string;
  queueNewTitle: string;
  queueNewSubtitle: string;
  queueSolveTitle: string;
  queueSolveSubtitle: string;
  queueNewEmptyTitle: string;
  queueNewEmptyHint: string;
  queueSolveEmptyTitle: string;
  queueSolveEmptyHint: string;
  queueViewDetails: string;
  queueCount: (count: number) => string;
  detailCardTitle: string;
  detailCardClose: string;
  detailCardLoading: string;

  /* ---- ticket detail (customer) ---- */
  detailConversationLink: string;
  detailRequirementButton: string;

  /* ---- detail page: full timeline ---- */
  timelineTitle: string;
  timelineHint: string;
  timelineEmpty: string;
  timelineCreated: string;
  timelineMessage: string;
  timelineReplyCustomer: string;
  timelineRequirement: string;
  timelineResolution: string;
  timelineStatus: string;
  timelineSupport: string;
  timelineYou: string;
  timelineAttachments: (count: number) => string;
  timelineCount: (count: number) => string;
}

const bn: ConversationCopy = {
  back: "পেছনে যান",
  helpDeskHome: "হেল্প ডেস্ক",
  filtersFrom: "শুরুর তারিখ",
  filtersTo: "শেষ তারিখ",
  filtersTitle: "শিরোনাম",
  filtersTitlePlaceholder: "সমস্যার শিরোনাম দিয়ে খুঁজুন",
  filtersClear: "ফিল্টার মুছুন",
  filtersActive: "ফিল্টার চালু",
  viewMessages: "মেসেজ দেখুন",
  viewProblem: "সমস্যা দেখুন",

  messagesTitle: "মেসেজ",
  messagesSubtitle: "আপনার প্রতিটি টিকিটের সাথে চলমান আলাপ এখানে দেখা যায়।",
  messagesSubtitleSupport: "গ্রাহকদের সাথে চলমান প্রতিটি আলাপ, টিকিট অনুযায়ী সাজানো।",
  messagesSearch: "টিকিট আইডি বা বিষয় দিয়ে খুঁজুন",
  messagesEmptyTitle: "এখনও কোনো কথা হয়নি",
  messagesEmptyHint: "টিকিট তৈরি করার পর সাপোর্ট টিম উত্তর দিলে আলাপ এখানে দেখা যাবে।",
  messagesErrorTitle: "কথোপকথন লোড করা যায়নি",
  messagesErrorHint: "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
  messagesRetry: "আবার চেষ্টা করুন",
  messagesUnreadTotal: (count) => (count > 0 ? `${count}টি অপঠিত বার্তা` : "সব বার্তা পড়া হয়েছে"),

  colSl: "ক্রম",
  colTicket: "টিকিট আইডি",
  colSubject: "সমস্যার শিরোনাম",
  colLastMessage: "সর্বশেষ বার্তা",
  colSender: "প্রেরক",
  colUpdated: "সর্বশেষ হালনাগাদ",
  colUnread: "অপঠিত",
  colAction: "কার্যক্রম",
  colCustomer: "গ্রাহক",
  colPriority: "গুরুত্ব",
  colStatus: "স্ট্যাটাস",
  colCategory: "ক্যাটাগরি",
  colSubmitted: "জমার সময়",
  colClosedAt: "তারিখ ও সময়",
  stampClosed: "ক্লোজ",
  colDate: "তারিখ ও সময়",
  actionOpen: "খুলুন",
  actionView: "দেখুন",
  unreadBadge: (count) => `${count} নতুন`,
  noUnread: "—",

  problemTitle: "সমস্যার তথ্য",
  problemDescription: "সমস্যার বিবরণ",
  problemCategory: "ক্যাটাগরি",
  problemPriority: "গুরুত্ব",
  problemStatus: "স্ট্যাটাস",
  problemSubmitted: "জমা দেওয়ার সময়",
  problemAssigned: "দায়িত্বপ্রাপ্ত কর্মী",
  problemDepartment: "বিভাগ / টিম",
  customerContactTitle: "গ্রাহকের তথ্য",
  customerEmail: "ইমেইল",
  customerPhone: "মোবাইল",
  solutionTitle: "সমাধান",
  solutionBy: "সমাধান দিয়েছেন",
  problemCustomer: "গ্রাহক",
  problemAttachments: "সংযুক্তি",
  problemNoAttachments: "কোনো সংযুক্তি নেই",
  problemId: "টিকিট আইডি",

  requirementsTitle: "অতিরিক্ত রিকোয়ারমেন্ট",
  requirementsHint: "টিকিট খোলা থাকা অবস্থায় আপনি যেসব অতিরিক্ত তথ্য দিয়েছেন।",
  requirementsEmpty: "এখনও কোনো অতিরিক্ত রিকোয়ারমেন্ট যোগ করা হয়নি।",
  requirementBadge: "অতিরিক্ত রিকোয়ারমেন্ট",

  conversationTitle: "কথোপকথন",
  allConversations: "সব কনভারসেশন",
  conversationLoading: "কথোপকথন লোড হচ্ছে…",
  conversationErrorTitle: "কথোপকথন লোড করা যায়নি",
  conversationErrorHint: "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
  conversationRetry: "আবার চেষ্টা করুন",
  conversationEmpty: "এখনও কোনো বার্তা নেই। প্রথম বার্তাটি আপনিই পাঠাতে পারেন।",
  conversationYou: "আপনি",
  conversationSupport: "সাপোর্ট টিম",
  conversationCustomer: "গ্রাহক",
  conversationNewMessages: "নতুন বার্তা এসেছে — নিচে যান",
  conversationClosed: "টিকিটটি ক্লোজড",
  conversationClosedHint: "ইআরপি নিয়ম অনুযায়ী ক্লোজড টিকিটে নতুন বার্তা পাঠানো যায় না। টিকিট রিওপেন করলে কথোপকথন আবার চালু হবে — স্ট্যাটাস নিজে থেকে বদলানো হয় না।",
  conversationReopen: "টিকিট রিওপেন করুন",
  conversationReopening: "রিওপেন হচ্ছে…",
  conversationReopened: "টিকিট রিওপেন হয়েছে — এখন আপনি উত্তর দিতে পারবেন।",
  conversationReopenFailed: "টিকিট রিওপেন করা যায়নি।",

  replyAction: "উত্তর দিন",
  composerPlaceholder: "আপনার বার্তা লিখুন…",
  composerSend: "পাঠান",
  composerSending: "পাঠানো হচ্ছে…",
  composerReplyTo: (name) => `${name} এর বার্তার উত্তর দিচ্ছেন`,
  composerCancelReply: "উত্তর বাতিল করুন",
  composerAttach: "ফাইল সংযুক্ত করুন",
  composerRemoveFile: "ফাইল সরান",
  composerAttaching: "সংযুক্ত হচ্ছে…",
  composerValidation: "আগে একটি বার্তা লিখুন।",
  composerSent: "বার্তা পাঠানো হয়েছে।",
  composerFailed: "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।",
  sessionExpired: "আপনার সেশন শেষ হয়েছে। আবার সাইন ইন করুন।",
  signInAgain: "সাইন ইন করুন",
  composerClosed: "ক্লোজড টিকিটে বার্তা পাঠানো যাবে না।",
  composerRequirementPlaceholder: "অতিরিক্ত রিকোয়ারমেন্ট লিখুন…",
  composerRequirementSend: "রিকোয়ারমেন্ট যোগ করুন",
  composerRequirementSent: "অতিরিক্ত রিকোয়ারমেন্ট যোগ হয়েছে।",
  composerRequirementHint: "টিকিট খোলা থাকা অবস্থায়ই অতিরিক্ত রিকোয়ারমেন্ট যোগ করা যায়।",
  composerRecordVoice: "ভয়েস রেকর্ড করুন",
  composerRecording: "রেকর্ড হচ্ছে",
  composerStopRecording: "রেকর্ডিং থামান",
  composerMicDenied: "মাইক্রোফোন ব্যবহার করা যায়নি। ব্রাউজারের অনুমতি দিন।",
  composerAttachmentOnly: "সংযুক্তি",
  composerVoiceNote: "ভয়েস বার্তা",
  jumpToQuoted: "মূল বার্তায় যান",
  chatSupportName: "শিক্ষা চ্যাট সাপোর্ট",
  chatCustomerName: "গ্রাহক",
  chatStatusPrefix: "স্ট্যাটাস",
  pinAction: "পিন করুন",
  unpinAction: "পিন সরান",
  pinnedBar: "পিন করা বার্তা",
  pinFailed: "বার্তাটি পিন করা যায়নি। আবার চেষ্টা করুন।",
  pinToast: "বার্তাটি পিন করা হয়েছে।",
  unpinToast: "বার্তার পিন সরানো হয়েছে।",
  chatEventOpened: "টিকিট খোলা হয়েছে",
  menuAria: "বার্তার অপশন",
  menuOpen: "বার্তার অপশন খুলুন",
  forwardAction: "ফরওয়ার্ড",
  selectAction: "সিলেক্ট",
  deleteAction: "ডিলিট",
  deleteTitle: "বার্তাটি ডিলিট করবেন?",
  deleteBody: "বার্তাটি সবার জন্য স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না।",
  deleteConfirm: "ডিলিট করুন",
  deleteCancel: "বাতিল",
  deleteDone: "বার্তা ডিলিট হয়েছে।",
  deleteFailed: "বার্তা ডিলিট করা যায়নি।",
  forwardTitle: "বার্তাটি ফরওয়ার্ড করুন",
  forwardHint: "যে টিকিটে পাঠাবেন সেটি বেছে নিন",
  forwardEmpty: "ফরওয়ার্ড করার জন্য অন্য কোনো টিকিট নেই।",
  forwardDone: "বার্তা ফরওয়ার্ড হয়েছে।",
  forwardFailed: "ফরওয়ার্ড করা যায়নি।",
  forwardPrefix: "ফরওয়ার্ড করা হয়েছে:\n",
  selectHint: "বার্তা নির্বাচন করুন",
  selectCount: "টি বার্তা নির্বাচিত",
  selectCopy: "কপি করুন",
  selectDelete: "ডিলিট",
  selectCancel: "বাতিল",
  copyEmpty: "এই বার্তায় কপি করার মতো লেখা নেই।",
  copyAction: "কপি",
  copied: "কপি হয়েছে",
  imageOpen: "ছবিটি বড় করে দেখুন",
  imageClose: "বন্ধ করুন",
  imageDownload: "ডাউনলোড",
  voicePreview: "ভয়েস নোট প্রিভিউ",

  problemsTitle: "সমস্যা ব্যবস্থাপনা",
  problemsSubtitle: "গ্রাহকের জমা দেওয়া সমস্যাগুলো এখানে তদন্ত করুন ও সমাধান দিন।",
  problemsEmptyTitle: "কোনো সমস্যা নেই",
  problemsEmptyHint: "সাপোর্ট টিমে নতুন সমস্যা এলে এখানে দেখা যাবে।",
  problemsSearch: "টিকিট আইডি, বিষয় বা গ্রাহক দিয়ে খুঁজুন",
  statusTitle: "সমাধান ও স্ট্যাটাস",
  statusHint: "তদন্ত শেষে সমাধান লিখে স্ট্যাটাস হালনাগাদ করুন — গ্রাহক তখনই এটি দেখতে পাবেন।",
  statusSelect: "স্ট্যাটাস নির্বাচন করুন",
  statusResolution: "সমাধানের বিবরণ",
  statusResolutionPlaceholder: "কীভাবে সমস্যাটি সমাধান হয়েছে লিখুন…",
  statusUpdate: "স্ট্যাটাস হালনাগাদ করুন",
  statusUpdating: "হালনাগাদ হচ্ছে…",
  statusUpdated: "স্ট্যাটাস হালনাগাদ হয়েছে।",
  statusFailed: "স্ট্যাটাস হালনাগাদ করা যায়নি।",
  resolutionMark: "সমাধান হিসেবে চিহ্নিত করুন",
  resolutionBadge: "সমাধান",

  navNewProblem: "নিউ প্রবলেম",
  navSolveProblem: "সলভ প্রবলেম",
  queueNewTitle: "নিউ প্রবলেম",
  queueNewSubtitle: "গ্রাহকের পাঠানো নতুন সমস্যা — স্ট্যাটাস এখনও খোলা। টেবিল থেকে বিস্তারিত দেখুন, উত্তর দিন বা স্ট্যাটাস বদলান।",
  queueSolveTitle: "সলভ প্রবলেম",
  queueSolveSubtitle: "যেসব সমস্যায় ইতিমধ্যে কাজ শুরু হয়েছে, গ্রাহকের উত্তরের অপেক্ষায় আছে বা সমাধান হয়ে গেছে।",
  queueNewEmptyTitle: "নতুন কোনো সমস্যা নেই",
  queueNewEmptyHint: "গ্রাহক নতুন সমস্যা পাঠালে সেটি সাথে সাথে এখানে দেখা যাবে।",
  queueSolveEmptyTitle: "সমাধানের তালিকা এখন খালি",
  queueSolveEmptyHint: "কোনো সমস্যায় কাজ শুরু করলে সেটি নিউ প্রবলেম থেকে এখানে চলে আসবে।",
  queueViewDetails: "ভিউ ডিটেইলস",
  queueCount: (count) => `${count}টি সমস্যা`,
  detailCardTitle: "সমস্যার বিস্তারিত",
  detailCardClose: "বন্ধ করুন",
  detailCardLoading: "বিস্তারিত লোড হচ্ছে…",

  detailConversationLink: "সম্পূর্ণ কথোপকথন দেখুন",
  detailRequirementButton: "রিকোয়ারমেন্ট যোগ করুন",

  timelineTitle: "সম্পূর্ণ কথোপকথন টাইমলাইন",
  timelineHint: "টিকিট তৈরি থেকে এখন পর্যন্ত প্রতিটি বার্তা, রিকোয়ারমেন্ট, সমাধান ও স্ট্যাটাস পরিবর্তন — সময় অনুযায়ী সাজানো।",
  timelineEmpty: "এখনও কোনো কার্যক্রম নেই।",
  timelineCreated: "টিকিট তৈরি",
  timelineMessage: "বার্তা",
  timelineReplyCustomer: "গ্রাহকের বার্তা",
  timelineRequirement: "অতিরিক্ত রিকোয়ারমেন্ট",
  timelineResolution: "সমাধান",
  timelineStatus: "স্ট্যাটাস পরিবর্তন",
  timelineSupport: "সাপোর্ট টিম",
  timelineYou: "আপনি",
  timelineAttachments: (count) => `${count}টি সংযুক্তি`,
  timelineCount: (count) => `${count}টি কার্যক্রম`,
};

const en: ConversationCopy = {
  back: "Go back",
  helpDeskHome: "Help Desk",
  filtersFrom: "From date",
  filtersTo: "To date",
  filtersTitle: "Title",
  filtersTitlePlaceholder: "Filter by problem title",
  filtersClear: "Clear filters",
  filtersActive: "Filters active",
  viewMessages: "View messages",
  viewProblem: "View problem",

  messagesTitle: "Messages",
  messagesSubtitle: "Every conversation you have with support, tied to its ticket.",
  messagesSubtitleSupport: "All customer conversations, grouped by their ticket.",
  messagesSearch: "Search by ticket ID or subject",
  messagesEmptyTitle: "No conversations yet",
  messagesEmptyHint: "Once you raise a ticket and support replies, the conversation appears here.",
  messagesErrorTitle: "The conversations could not be loaded",
  messagesErrorHint: "Something went wrong with the connection. Please try again.",
  messagesRetry: "Try again",
  messagesUnreadTotal: (count) => (count > 0 ? `${count} unread message(s)` : "All messages read"),

  colSl: "SL",
  colTicket: "Ticket ID",
  colSubject: "Problem title",
  colLastMessage: "Last message",
  colSender: "Sender",
  colUpdated: "Updated",
  colUnread: "Unread",
  colAction: "Action",
  colCustomer: "Customer",
  colPriority: "Priority",
  colStatus: "Status",
  colCategory: "Category",
  colSubmitted: "Submitted at",
  colClosedAt: "Date & time",
  stampClosed: "Closed",
  colDate: "Date & time",
  actionOpen: "Open",
  actionView: "View",
  unreadBadge: (count) => `${count} new`,
  noUnread: "—",

  problemTitle: "Problem information",
  problemDescription: "Description",
  problemCategory: "Category",
  problemPriority: "Priority",
  problemStatus: "Status",
  problemSubmitted: "Submitted",
  problemAssigned: "Assigned employee",
  problemDepartment: "Department / team",
  customerContactTitle: "Customer information",
  customerEmail: "Email",
  customerPhone: "Mobile",
  solutionTitle: "Solution",
  solutionBy: "Resolved by",
  problemCustomer: "Customer",
  problemAttachments: "Attachments",
  problemNoAttachments: "No attachments",
  problemId: "Ticket ID",

  requirementsTitle: "Additional requirements",
  requirementsHint: "Everything you added while the ticket stayed open.",
  requirementsEmpty: "No additional requirement has been added yet.",
  requirementBadge: "Additional requirement",

  conversationTitle: "Conversation",
  allConversations: "All conversations",
  conversationLoading: "Loading the conversation…",
  conversationErrorTitle: "The conversation could not be loaded",
  conversationErrorHint: "Something went wrong with the connection. Please try again.",
  conversationRetry: "Try again",
  conversationEmpty: "No messages yet. You can send the first one.",
  conversationYou: "You",
  conversationSupport: "Support team",
  conversationCustomer: "Customer",
  conversationNewMessages: "New message arrived — jump to it",
  conversationClosed: "This ticket is closed",
  conversationClosedHint: "The ERP does not accept new messages on a closed ticket. Reopening it resumes the conversation — the status is never changed silently.",
  conversationReopen: "Reopen ticket",
  conversationReopening: "Reopening…",
  conversationReopened: "Ticket reopened — you can reply again.",
  conversationReopenFailed: "The ticket could not be reopened.",

  replyAction: "Reply",
  composerPlaceholder: "Write your message…",
  composerSend: "Send",
  composerSending: "Sending…",
  composerReplyTo: (name) => `Replying to ${name}`,
  composerCancelReply: "Cancel reply",
  composerAttach: "Attach a file",
  composerRemoveFile: "Remove file",
  composerAttaching: "Attaching…",
  composerValidation: "Write a message first.",
  composerSent: "Message sent.",
  composerFailed: "The message could not be sent. Please try again.",
  sessionExpired: "Your session has expired. Please sign in again.",
  signInAgain: "Sign in",
  composerClosed: "Messages cannot be sent on a closed ticket.",
  composerRequirementPlaceholder: "Describe the additional requirement…",
  composerRequirementSend: "Add requirement",
  composerRequirementSent: "Additional requirement added.",
  composerRequirementHint: "Additional requirements can only be added while the ticket is open.",
  composerRecordVoice: "Record a voice note",
  composerRecording: "Recording",
  composerStopRecording: "Stop recording",
  composerMicDenied: "The microphone is unavailable. Allow it in the browser.",
  composerAttachmentOnly: "Attachment",
  composerVoiceNote: "Voice message",
  jumpToQuoted: "Go to the original message",
  chatSupportName: "Shikkha Chat Support",
  chatCustomerName: "Customer",
  chatStatusPrefix: "Status",
  pinAction: "Pin",
  unpinAction: "Unpin",
  pinnedBar: "Pinned message",
  pinFailed: "Couldn't pin that message. Try again.",
  pinToast: "Message pinned.",
  unpinToast: "Pin removed.",
  chatEventOpened: "Ticket opened",
  menuAria: "Message options",
  menuOpen: "Open message options",
  forwardAction: "Forward",
  selectAction: "Select",
  deleteAction: "Delete",
  deleteTitle: "Delete this message?",
  deleteBody: "It will be removed for everyone. This cannot be undone.",
  deleteConfirm: "Delete",
  deleteCancel: "Cancel",
  deleteDone: "Message deleted.",
  deleteFailed: "Couldn't delete the message.",
  forwardTitle: "Forward message",
  forwardHint: "Choose the ticket to forward it to",
  forwardEmpty: "There is no other ticket to forward to.",
  forwardDone: "Message forwarded.",
  forwardFailed: "Couldn't forward the message.",
  forwardPrefix: "Forwarded:\n",
  selectHint: "Select messages",
  selectCount: "selected",
  selectCopy: "Copy",
  selectDelete: "Delete",
  selectCancel: "Cancel",
  copyEmpty: "This message has no text to copy.",
  copyAction: "Copy",
  copied: "Copied",
  imageOpen: "Open image",
  imageClose: "Close",
  imageDownload: "Download",
  voicePreview: "Voice note preview",

  problemsTitle: "Problem management",
  problemsSubtitle: "Investigate the problems customers submit and post the solution.",
  problemsEmptyTitle: "No problems",
  problemsEmptyHint: "Customer problems assigned to support appear here.",
  problemsSearch: "Search by ticket ID, subject or customer",
  statusTitle: "Solution and status",
  statusHint: "Add the solution and update the status — the customer sees it immediately.",
  statusSelect: "Choose a status",
  statusResolution: "Solution details",
  statusResolutionPlaceholder: "Describe how the problem was solved…",
  statusUpdate: "Update status",
  statusUpdating: "Updating…",
  statusUpdated: "Status updated.",
  statusFailed: "The status could not be updated.",
  resolutionMark: "Mark as the solution",
  resolutionBadge: "Solution",

  navNewProblem: "New problems",
  navSolveProblem: "Solve problems",
  queueNewTitle: "New problems",
  queueNewSubtitle: "Every customer problem still in the Open state — open it, read the details, reply and change its status.",
  queueSolveTitle: "Solve problems",
  queueSolveSubtitle: "Problems already in progress, waiting for the customer, resolved or closed.",
  queueNewEmptyTitle: "No new problems",
  queueNewEmptyHint: "A problem appears here the moment a customer submits it.",
  queueSolveEmptyTitle: "Nothing to solve yet",
  queueSolveEmptyHint: "Start working on a problem and it moves here from New problems.",
  queueViewDetails: "View details",
  queueCount: (count) => `${count} problem${count === 1 ? "" : "s"}`,
  detailCardTitle: "Problem details",
  detailCardClose: "Close",
  detailCardLoading: "Loading the details…",

  detailConversationLink: "Open the full conversation",
  detailRequirementButton: "Add requirement",

  timelineTitle: "Full conversation timeline",
  timelineHint: "Every message, requirement, solution and status change from the moment the ticket was created — ordered by time.",
  timelineEmpty: "No activity yet.",
  timelineCreated: "Ticket created",
  timelineMessage: "Message",
  timelineReplyCustomer: "Customer message",
  timelineRequirement: "Additional requirement",
  timelineResolution: "Solution",
  timelineStatus: "Status change",
  timelineSupport: "Support team",
  timelineYou: "You",
  timelineAttachments: (count) => `${count} attachment${count === 1 ? "" : "s"}`,
  timelineCount: (count) => `${count} event${count === 1 ? "" : "s"}`,
};

export const conversationCopy: Record<"bn" | "en", ConversationCopy> = { bn, en };

/** Copy for a UI language; anything that is not English reads Bangla. */
export function conversationCopyFor(language: string): ConversationCopy {
  return conversationCopy[language === "en" ? "en" : "bn"];
}

/** Status/category/priority labels for the conversation surfaces. */
export const conversationStatusLabel: Record<TicketStatus, { bn: string; en: string }> = {
  open: { bn: "খোলা", en: "Open" },
  in_progress: { bn: "চলমান", en: "In progress" },
  waiting_for_user: { bn: "গ্রাহকের উত্তরের অপেক্ষায়", en: "Waiting for customer" },
  resolved: { bn: "সমাধান হয়েছে", en: "Resolved" },
  closed: { bn: "ক্লোজড", en: "Closed" },
};

export const conversationPriorityLabel: Record<TicketPriority, { bn: string; en: string }> = {
  low: { bn: "কম", en: "Low" },
  medium: { bn: "মধ্যম", en: "Medium" },
  high: { bn: "উচ্চ", en: "High" },
  urgent: { bn: "জরুরি", en: "Urgent" },
};

export const conversationCategoryLabel: Record<TicketCategoryId, { bn: string; en: string }> = {
  login: { bn: "লগইন", en: "Login" },
  account: { bn: "অ্যাকাউন্ট", en: "Account" },
  payment: { bn: "পেমেন্ট", en: "Payment" },
  registration: { bn: "রেজিস্ট্রেশন", en: "Registration" },
  dashboard: { bn: "ড্যাশবোর্ড", en: "Dashboard" },
  expense_claim: { bn: "খরচের দাবি", en: "Expense claim" },
  customer_creation: { bn: "কাস্টমার তৈরি", en: "Customer creation" },
  technical: { bn: "টেকনিক্যাল", en: "Technical" },
  other: { bn: "অন্যান্য", en: "Other" },
};

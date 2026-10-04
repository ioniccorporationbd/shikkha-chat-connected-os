/** Bilingual copy for the customer Payment History panel. */

import type { PaymentEntryStatusKey } from "./types";

export interface PaymentEntryCopy {
  heading: string;
  subtitle: string;
  loading: string;
  loadFailed: string;
  retry: string;
  refresh: string;
  refreshing: string;
  refreshed: string;
  back: string;
  signInAgain: string;
  sessionExpiredTitle: string;

  permissionTitle: string;
  permissionHint: string;

  /** Shown when the account has no linked Customer record (spec item 16 calm). */
  noCustomerTitle: string;
  noCustomerHint: string;

  summaryHeading: string;
  summaryHint: string;
  summaryTotal: string;
  summaryAmount: string;
  summaryMonth: string;
  summaryLatest: string;
  summaryNone: string;

  listHeading: string;
  emptyTitle: string;
  emptyHint: string;

  colId: string;
  colDate: string;
  colType: string;
  colAmount: string;
  colMode: string;
  colReference: string;
  colReferenceDate: string;
  colStatus: string;
  colAction: string;
  viewDetails: string;

  detailsHeading: string;
  detailsLoading: string;
  close: string;
  dParty: string;
  dPostingDate: string;
  dPaymentType: string;
  dAmount: string;
  dCurrency: string;
  dMode: string;
  dReferenceNo: string;
  dReferenceDate: string;
  dCompany: string;
  dRemark: string;

  referencesHeading: string;
  referencesEmpty: string;
  rDocType: string;
  rReference: string;
  rDue: string;
  rTotal: string;
  rOutstanding: string;
  rAllocated: string;

  /** Status chip labels, keyed by the server-derived `display_status`. */
  statuses: Record<PaymentEntryStatusKey, string>;
  /** Payment type labels (Receive / Pay / Internal Transfer). */
  paymentTypes: Record<string, string>;
}

export const paymentEntryCopy: Record<"bn" | "en", PaymentEntryCopy> = {
  bn: {
    heading: "পেমেন্ট ইতিহাস",
    subtitle: "আপনার জমা হওয়া পেমেন্টগুলোর তথ্য দেখুন।",
    loading: "পেমেন্ট তথ্য লোড হচ্ছে…",
    loadFailed: "পেমেন্ট তথ্য লোড করা যাচ্ছে না।",
    retry: "আবার চেষ্টা করুন",
    refresh: "রিফ্রেশ",
    refreshing: "রিফ্রেশ হচ্ছে…",
    refreshed: "পেমেন্ট তথ্য হালনাগাদ হয়েছে।",
    back: "ড্যাশবোর্ডে ফিরুন",
    signInAgain: "আবার সাইন ইন করুন",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ হয়েছে",

    permissionTitle: "এই পেমেন্ট দেখার অনুমতি আপনার নেই",
    permissionHint: "আপনার অ্যাকাউন্টের সাথে সংযুক্ত কাস্টমার রেকর্ড পাওয়া যায়নি অথবা অনুমতি নেই।",

    noCustomerTitle: "কোনো কাস্টমার রেকর্ড সংযুক্ত নেই",
    noCustomerHint: "আপনার অ্যাকাউন্টের সাথে কোনো Customer রেকর্ড সংযুক্ত নেই, তাই পেমেন্ট দেখানো যাচ্ছে না।",

    summaryHeading: "পেমেন্ট সারসংক্ষেপ",
    summaryHint: "শুধু আপনার সাবমিট করা পেমেন্ট থেকে",
    summaryTotal: "মোট পেমেন্ট",
    summaryAmount: "মোট পরিমাণ",
    summaryMonth: "এই মাসের পেমেন্ট",
    summaryLatest: "সর্বশেষ পেমেন্ট",
    summaryNone: "—",

    listHeading: "পেমেন্ট তালিকা",
    emptyTitle: "এখনও কোনো পেমেন্ট পাওয়া যায়নি।",
    emptyHint: "আপনার অ্যাকাউন্টে এখনো কোনো সাবমিট করা পেমেন্ট রেকর্ড হয়নি। নতুন পেমেন্ট এলে এখানে দেখা যাবে।",

    colId: "পেমেন্ট আইডি",
    colDate: "পোস্টিং তারিখ",
    colType: "পেমেন্ট টাইপ",
    colAmount: "পরিমাণ",
    colMode: "মাধ্যম",
    colReference: "রেফারেন্স নম্বর",
    colReferenceDate: "রেফারেন্স তারিখ",
    colStatus: "স্ট্যাটাস",
    colAction: "অ্যাকশন",
    viewDetails: "বিস্তারিত দেখুন",

    detailsHeading: "পেমেন্ট বিস্তারিত",
    detailsLoading: "বিস্তারিত লোড হচ্ছে…",
    close: "বন্ধ করুন",
    dParty: "কাস্টমার",
    dPostingDate: "পোস্টিং তারিখ",
    dPaymentType: "পেমেন্ট টাইপ",
    dAmount: "পরিমাণ",
    dCurrency: "মুদ্রা",
    dMode: "পরিশোধের মাধ্যম",
    dReferenceNo: "রেফারেন্স নম্বর",
    dReferenceDate: "রেফারেন্স তারিখ",
    dCompany: "প্রতিষ্ঠান",
    dRemark: "মন্তব্য",

    referencesHeading: "রেফারেন্স সারি",
    referencesEmpty: "কোনো রেফারেন্স সংযুক্ত নেই।",
    rDocType: "ডকটাইপ",
    rReference: "রেফারেন্স",
    rDue: "মেয়াদ",
    rTotal: "মোট",
    rOutstanding: "বাকি",
    rAllocated: "বরাদ্দ",

    statuses: {
      submitted: "সাবমিটেড",
      reconciled: "রিকনসাইলড",
      paid: "পরিশোধিত",
      received: "গৃহীত",
      draft: "ড্রাফট",
      cancelled: "বাতিল",
    },
    paymentTypes: {
      Receive: "প্রাপ্তি",
      Pay: "পরিশোধ",
      "Internal Transfer": "অভ্যন্তরীণ স্থানান্তর",
    },
  },
  en: {
    heading: "Payment History",
    subtitle: "View the payments recorded against your account.",
    loading: "Loading your payments…",
    loadFailed: "The payment information could not be loaded.",
    retry: "Try again",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    refreshed: "Payment information refreshed.",
    back: "Back to dashboard",
    signInAgain: "Sign in again",
    sessionExpiredTitle: "Your session has expired",

    permissionTitle: "You are not permitted to view these payments",
    permissionHint: "No customer record is linked to your account, or the permission is missing.",

    noCustomerTitle: "No customer record is linked",
    noCustomerHint: "No Customer record is linked to your account, so payments cannot be shown.",

    summaryHeading: "Payment summary",
    summaryHint: "From your submitted payments only",
    summaryTotal: "Total payments",
    summaryAmount: "Total amount",
    summaryMonth: "This month",
    summaryLatest: "Latest payment",
    summaryNone: "—",

    listHeading: "Payment list",
    emptyTitle: "No payments received yet.",
    emptyHint: "No submitted payment has been recorded against your account yet. New payments will appear here.",

    colId: "Payment ID",
    colDate: "Posting Date",
    colType: "Payment Type",
    colAmount: "Amount",
    colMode: "Mode of Payment",
    colReference: "Reference No",
    colReferenceDate: "Reference Date",
    colStatus: "Status",
    colAction: "Action",
    viewDetails: "View details",

    detailsHeading: "Payment details",
    detailsLoading: "Loading details…",
    close: "Close",
    dParty: "Customer",
    dPostingDate: "Posting Date",
    dPaymentType: "Payment Type",
    dAmount: "Amount",
    dCurrency: "Currency",
    dMode: "Mode of Payment",
    dReferenceNo: "Reference No",
    dReferenceDate: "Reference Date",
    dCompany: "Company",
    dRemark: "Remarks",

    referencesHeading: "Reference rows",
    referencesEmpty: "No reference rows linked.",
    rDocType: "DocType",
    rReference: "Reference",
    rDue: "Due Date",
    rTotal: "Total",
    rOutstanding: "Outstanding",
    rAllocated: "Allocated",

    statuses: {
      submitted: "Submitted",
      reconciled: "Reconciled",
      paid: "Paid",
      received: "Received",
      draft: "Draft",
      cancelled: "Cancelled",
    },
    paymentTypes: {
      Receive: "Receive",
      Pay: "Pay",
      "Internal Transfer": "Internal Transfer",
    },
  },
};

export function paymentEntryCopyFor(language: string): PaymentEntryCopy {
  return paymentEntryCopy[language === "en" ? "en" : "bn"];
}

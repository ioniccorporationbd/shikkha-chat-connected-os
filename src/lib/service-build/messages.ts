/** Bilingual copy for the customer Service Build (Sales Invoice) panel. */

import type { SalesInvoiceStatusKey } from "./types";

export interface ServiceBuildCopy {
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

  /** Shown when the account has no linked Customer record. */
  noCustomerTitle: string;
  noCustomerHint: string;

  // ---- Summary + chart (synced to the active filters) ----
  chartHeading: string;
  chartHint: string;
  chartEmpty: string;
  chartTotal: string;
  chartShowing: string;
  chartFilteredAmount: string;
  chartOutstanding: string;
  chartStatusBreakdown: string;
  summaryMonth: string;
  summaryLatest: string;
  summaryNone: string;

  listHeading: string;
  emptyTitle: string;
  emptyHint: string;

  colSl: string;
  colId: string;
  colDate: string;
  colDue: string;
  colAmount: string;
  colOutstanding: string;
  colStatus: string;
  colAction: string;
  viewDetails: string;

  // ---- Filters ----
  filterHeading: string;
  filterHint: string;
  filterStatusLabel: string;
  filterStatusAll: string;
  filterAmountLabel: string;
  filterAmountAny: string;
  filterAmountExact: string;
  filterAmountRange: string;
  filterAmountExactPlaceholder: string;
  filterMinPlaceholder: string;
  filterMaxPlaceholder: string;
  filterFromLabel: string;
  filterToLabel: string;
  filterApply: string;
  filterClear: string;
  filterInvalidAmount: string;
  filterInvalidAmountRange: string;
  filterInvalidDateRange: string;

  // ---- Rows per page + pagination ----
  rowsPerPageShow: string;
  rowsPerPageSuffix: string;
  pagePrev: string;
  pageNext: string;
  pageLabel: string;
  pageOf: string;
  paginationRangeLabel: string;
  ofLabel: string;

  noMatchTitle: string;
  noMatchHint: string;
  clearFilters: string;

  // ---- Smart Reload ----
  reloadNoChanges: string;
  reloadChanged: string;
  reloadFailed: string;

  // ---- Details popup ----
  detailsHeading: string;
  detailsLoading: string;
  close: string;
  dSubtitle: string;
  dSecInfo: string;
  dSecAmount: string;
  dSecReference: string;
  dBillId: string;
  dPostingDate: string;
  dDueDate: string;
  dStatus: string;
  dCompany: string;
  dAmountTotal: string;
  dNetTotal: string;
  dTaxes: string;
  dDiscount: string;
  dPaid: string;
  dOutstanding: string;
  dPoNo: string;
  dProject: string;
  dReturnAgainst: string;
  dContactPerson: string;
  dContactEmail: string;
  dRemark: string;
  /** Backend proof the invoice really exists (verified chip). */
  verified: string;

  itemsHeading: string;
  itemsEmpty: string;
  iItem: string;
  iQty: string;
  iRate: string;
  iAmount: string;

  /** Status chip labels, keyed by the document's own `status`. */
  statuses: Record<SalesInvoiceStatusKey, string>;
}

export const serviceBuildCopy: Record<"bn" | "en", ServiceBuildCopy> = {
  bn: {
    heading: "সার্ভিস বিল",
    subtitle: "আপনার অ্যাকাউন্টে ইস্যু করা ইনভয়েস/বিলের তথ্য দেখুন।",
    loading: "ইনভয়েস তথ্য লোড হচ্ছে…",
    loadFailed: "ইনভয়েস তথ্য লোড করা যাচ্ছে না।",
    retry: "আবার চেষ্টা করুন",
    refresh: "রিফ্রেশ",
    refreshing: "রিফ্রেশ হচ্ছে…",
    refreshed: "ইনভয়েস তথ্য হালনাগাদ হয়েছে।",
    back: "ড্যাশবোর্ডে ফিরুন",
    signInAgain: "আবার সাইন ইন করুন",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ হয়েছে",

    permissionTitle: "এই ইনভয়েস দেখার অনুমতি আপনার নেই",
    permissionHint: "আপনার অ্যাকাউন্টের সাথে সংযুক্ত কাস্টমার রেকর্ড পাওয়া যায়নি অথবা অনুমতি নেই।",

    noCustomerTitle: "কোনো কাস্টমার রেকর্ড সংযুক্ত নেই",
    noCustomerHint: "আপনার অ্যাকাউন্টের সাথে কোনো Customer রেকর্ড সংযুক্ত নেই, তাই ইনভয়েস দেখানো যাচ্ছে না।",

    chartHeading: "ইনভয়েস সারসংক্ষেপ",
    chartHint: "ফিল্টার অনুযায়ী চলমান",
    chartEmpty: "এই ফিল্টারে কোনো ইনভয়েস নেই।",
    chartTotal: "মোট সার্ভিস বিল",
    chartShowing: "দেখানো হচ্ছে",
    chartFilteredAmount: "মোট পরিমাণ",
    chartOutstanding: "মোট বাকি",
    chartStatusBreakdown: "স্ট্যাটাস অনুযায়ী বিভাজন",
    summaryMonth: "এই মাসের ইনভয়েস",
    summaryLatest: "সর্বশেষ ইনভয়েস",
    summaryNone: "—",

    listHeading: "ইনভয়েস তালিকা",
    emptyTitle: "এখনও কোনো ইনভয়েস পাওয়া যায়নি।",
    emptyHint: "আপনার অ্যাকাউন্টে এখনো কোনো ইনভয়েস রেকর্ড হয়নি। নতুন ইনভয়েস এলে এখানে দেখা যাবে।",

    colSl: "ক্রম",
    colId: "ইনভয়েস আইডি",
    colDate: "পোস্টিং তারিখ",
    colDue: "মেয়াদ",
    colAmount: "মোট",
    colOutstanding: "বাকি",
    colStatus: "স্ট্যাটাস",
    colAction: "অ্যাকশন",
    viewDetails: "বিস্তারিত দেখুন",

    filterHeading: "ফিল্টার",
    filterHint: "আপনার ইনভয়েস সহজে খুঁজে বের করুন।",
    filterStatusLabel: "স্ট্যাটাস",
    filterStatusAll: "সব",
    filterAmountLabel: "পরিমাণ",
    filterAmountAny: "যেকোনো",
    filterAmountExact: "সঠিক পরিমাণ",
    filterAmountRange: "পরিসীমা",
    filterAmountExactPlaceholder: "যেমন ৫০০",
    filterMinPlaceholder: "সর্বনিম্ন",
    filterMaxPlaceholder: "সর্বোচ্চ",
    filterFromLabel: "শুরুর তারিখ",
    filterToLabel: "শেষ তারিখ",
    filterApply: "ফিল্টার প্রয়োগ করুন",
    filterClear: "রিসেট করুন",
    filterInvalidAmount: "সঠিক একটি সংখ্যা লিখুন।",
    filterInvalidAmountRange: "সর্বনিম্ন পরিমাণ সর্বোচ্চ পরিমাণের চেয়ে বেশি হতে পারে না।",
    filterInvalidDateRange: "শুরুর তারিখ শেষ তারিখের চেয়ে পরে হতে পারে না।",

    rowsPerPageShow: "দেখান",
    rowsPerPageSuffix: "টি ইনভয়েস",
    pagePrev: "আগের",
    pageNext: "পরের",
    pageLabel: "পৃষ্ঠা",
    pageOf: "/",
    paginationRangeLabel: "দেখানো হচ্ছে",
    ofLabel: "মোট",

    noMatchTitle: "এই ফিল্টারে কোনো ইনভয়েস মেলেনি।",
    noMatchHint: "ফিল্টার পরিবর্তন করুন বা রিসেট করে আবার দেখুন।",
    clearFilters: "ফিল্টার মুছুন",

    reloadNoChanges: "কোনো নতুন পরিবর্তন নেই। তথ্য হালনাগাদ করা হয়েছে।",
    reloadChanged: "নতুন পরিবর্তন পাওয়া গেছে। পেজ পুনরায় লোড হচ্ছে।",
    reloadFailed: "রিফ্রেশ করা যায়নি। আবার চেষ্টা করুন।",

    detailsHeading: "ইনভয়েস বিস্তারিত",
    detailsLoading: "বিস্তারিত লোড হচ্ছে…",
    close: "বন্ধ করুন",
    dSubtitle: "আপনার অ্যাকাউন্টের ইনভয়েস তথ্য",
    dSecInfo: "বিল তথ্য",
    dSecAmount: "পরিমাণ তথ্য",
    dSecReference: "রেফারেন্স তথ্য",
    dBillId: "বিল আইডি",
    dPostingDate: "পোস্টিং তারিখ",
    dDueDate: "মেয়াদ",
    dStatus: "স্ট্যাটাস",
    dCompany: "প্রতিষ্ঠান",
    dAmountTotal: "মোট পরিমাণ",
    dNetTotal: "নেট মোট",
    dTaxes: "কর/চার্জ",
    dDiscount: "ডিসকাউন্ট",
    dPaid: "পরিশোধিত পরিমাণ",
    dOutstanding: "বাকি পরিমাণ",
    dPoNo: "পিও নম্বর",
    dProject: "প্রজেক্ট",
    dReturnAgainst: "ফেরত (রেফারেন্স)",
    dContactPerson: "যোগাযোগ ব্যক্তি",
    dContactEmail: "যোগাযোগ ইমেইল",
    dRemark: "মন্তব্য",
    verified: "যাচাইকৃত",

    itemsHeading: "আইটেম সারি",
    itemsEmpty: "কোনো আইটেম সারি নেই।",
    iItem: "আইটেম",
    iQty: "পরিমাণ",
    iRate: "রেট",
    iAmount: "মোট",

    statuses: {
      draft: "ড্রাফট",
      submitted: "সাবমিটেড",
      unpaid: "অপরিশোধিত",
      paid: "পরিশোধিত",
      "partly paid": "আংশিক পরিশোধিত",
      overdue: "মেয়াদোত্তীর্ণ",
      return: "ফেরত",
      cancelled: "বাতিল",
    },
  },
  en: {
    heading: "Service Build",
    subtitle: "View the invoices recorded against your account.",
    loading: "Loading your invoices…",
    loadFailed: "The invoice information could not be loaded.",
    retry: "Try again",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    refreshed: "Invoice information refreshed.",
    back: "Back to dashboard",
    signInAgain: "Sign in again",
    sessionExpiredTitle: "Your session has expired",

    permissionTitle: "You are not permitted to view these invoices",
    permissionHint: "No customer record is linked to your account, or the permission is missing.",

    noCustomerTitle: "No customer record is linked",
    noCustomerHint: "No Customer record is linked to your account, so invoices cannot be shown.",

    chartHeading: "Invoice summary",
    chartHint: "Live with your filters",
    chartEmpty: "No invoices match this filter.",
    chartTotal: "Total service bills",
    chartShowing: "Showing",
    chartFilteredAmount: "Total amount",
    chartOutstanding: "Total outstanding",
    chartStatusBreakdown: "Status breakdown",
    summaryMonth: "This month",
    summaryLatest: "Latest invoice",
    summaryNone: "—",

    listHeading: "Invoice list",
    emptyTitle: "No invoices yet.",
    emptyHint: "No invoice has been recorded against your account yet. New invoices will appear here.",

    colSl: "SL",
    colId: "Invoice ID",
    colDate: "Posting Date",
    colDue: "Due Date",
    colAmount: "Total",
    colOutstanding: "Outstanding",
    colStatus: "Status",
    colAction: "Action",
    viewDetails: "View details",

    filterHeading: "Filters",
    filterHint: "Narrow down your invoices.",
    filterStatusLabel: "Status",
    filterStatusAll: "All",
    filterAmountLabel: "Amount",
    filterAmountAny: "Any",
    filterAmountExact: "Exact amount",
    filterAmountRange: "Range",
    filterAmountExactPlaceholder: "e.g. 500",
    filterMinPlaceholder: "Min",
    filterMaxPlaceholder: "Max",
    filterFromLabel: "From date",
    filterToLabel: "To date",
    filterApply: "Apply filter",
    filterClear: "Reset",
    filterInvalidAmount: "Enter a valid number.",
    filterInvalidAmountRange: "Min amount cannot be greater than max amount.",
    filterInvalidDateRange: "The from date cannot be after the to date.",

    rowsPerPageShow: "Show",
    rowsPerPageSuffix: "invoices",
    pagePrev: "Prev",
    pageNext: "Next",
    pageLabel: "Page",
    pageOf: "of",
    paginationRangeLabel: "Showing",
    ofLabel: "of",

    noMatchTitle: "No invoices match these filters.",
    noMatchHint: "Adjust or reset the filters and try again.",
    clearFilters: "Clear filters",

    reloadNoChanges: "No new changes. Data refreshed.",
    reloadChanged: "New changes found. Reloading the page.",
    reloadFailed: "Could not refresh. Please try again.",

    detailsHeading: "Invoice details",
    detailsLoading: "Loading details…",
    close: "Close",
    dSubtitle: "Invoice information for your account",
    dSecInfo: "Bill information",
    dSecAmount: "Amount information",
    dSecReference: "Reference information",
    dBillId: "Bill ID",
    dPostingDate: "Posting Date",
    dDueDate: "Due Date",
    dStatus: "Status",
    dCompany: "Company",
    dAmountTotal: "Total Amount",
    dNetTotal: "Net Total",
    dTaxes: "Taxes & Charges",
    dDiscount: "Discount",
    dPaid: "Paid Amount",
    dOutstanding: "Outstanding Amount",
    dPoNo: "PO No",
    dProject: "Project",
    dReturnAgainst: "Return Against",
    dContactPerson: "Contact Person",
    dContactEmail: "Contact Email",
    dRemark: "Remarks",
    verified: "Verified",

    itemsHeading: "Item rows",
    itemsEmpty: "No item rows.",
    iItem: "Item",
    iQty: "Qty",
    iRate: "Rate",
    iAmount: "Amount",

    statuses: {
      draft: "Draft",
      submitted: "Submitted",
      unpaid: "Unpaid",
      paid: "Paid",
      "partly paid": "Partly Paid",
      overdue: "Overdue",
      return: "Return",
      cancelled: "Cancelled",
    },
  },
};

export function serviceBuildCopyFor(language: string): ServiceBuildCopy {
  return serviceBuildCopy[language === "en" ? "en" : "bn"];
}

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

  summaryHeading: string;
  summaryHint: string;
  summaryTotal: string;
  summaryAmount: string;
  summaryOutstanding: string;
  summaryMonth: string;
  summaryLatest: string;
  summaryNone: string;

  listHeading: string;
  emptyTitle: string;
  emptyHint: string;

  colId: string;
  colDate: string;
  colDue: string;
  colAmount: string;
  colOutstanding: string;
  colStatus: string;
  colAction: string;
  viewDetails: string;

  detailsHeading: string;
  detailsLoading: string;
  close: string;
  dCustomer: string;
  dPostingDate: string;
  dDueDate: string;
  dAmount: string;
  dCurrency: string;
  dOutstanding: string;
  dNetTotal: string;
  dTaxes: string;
  dDiscount: string;
  dCompany: string;
  dPoNo: string;
  dProject: string;
  dReturnAgainst: string;
  dContactPerson: string;
  dContactEmail: string;
  dRemark: string;

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
    heading: "সার্ভিস বিল্ড",
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

    summaryHeading: "ইনভয়েস সারসংক্ষেপ",
    summaryHint: "শুধু আপনার ইনভয়েস থেকে",
    summaryTotal: "মোট ইনভয়েস",
    summaryAmount: "মোট পরিমাণ",
    summaryOutstanding: "মোট বাকি",
    summaryMonth: "এই মাসের ইনভয়েস",
    summaryLatest: "সর্বশেষ ইনভয়েস",
    summaryNone: "—",

    listHeading: "ইনভয়েস তালিকা",
    emptyTitle: "এখনও কোনো ইনভয়েস পাওয়া যায়নি।",
    emptyHint: "আপনার অ্যাকাউন্টে এখনো কোনো ইনভয়েস রেকর্ড হয়নি। নতুন ইনভয়েস এলে এখানে দেখা যাবে।",

    colId: "ইনভয়েস আইডি",
    colDate: "পোস্টিং তারিখ",
    colDue: "মেয়াদ",
    colAmount: "মোট",
    colOutstanding: "বাকি",
    colStatus: "স্ট্যাটাস",
    colAction: "অ্যাকশন",
    viewDetails: "বিস্তারিত দেখুন",

    detailsHeading: "ইনভয়েস বিস্তারিত",
    detailsLoading: "বিস্তারিত লোড হচ্ছে…",
    close: "বন্ধ করুন",
    dCustomer: "কাস্টমার",
    dPostingDate: "পোস্টিং তারিখ",
    dDueDate: "মেয়াদ",
    dAmount: "মোট",
    dCurrency: "মুদ্রা",
    dOutstanding: "বাকি",
    dNetTotal: "নেট মোট",
    dTaxes: "কর/চার্জ",
    dDiscount: "ডিসকাউন্ট",
    dCompany: "প্রতিষ্ঠান",
    dPoNo: "পিও নম্বর",
    dProject: "প্রজেক্ট",
    dReturnAgainst: "ফেরত (রেফারেন্স)",
    dContactPerson: "যোগাযোগ ব্যক্তি",
    dContactEmail: "যোগাযোগ ইমেইল",
    dRemark: "মন্তব্য",

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

    summaryHeading: "Invoice summary",
    summaryHint: "From your invoices only",
    summaryTotal: "Total invoices",
    summaryAmount: "Total amount",
    summaryOutstanding: "Total outstanding",
    summaryMonth: "This month",
    summaryLatest: "Latest invoice",
    summaryNone: "—",

    listHeading: "Invoice list",
    emptyTitle: "No invoices yet.",
    emptyHint: "No invoice has been recorded against your account yet. New invoices will appear here.",

    colId: "Invoice ID",
    colDate: "Posting Date",
    colDue: "Due Date",
    colAmount: "Total",
    colOutstanding: "Outstanding",
    colStatus: "Status",
    colAction: "Action",
    viewDetails: "View details",

    detailsHeading: "Invoice details",
    detailsLoading: "Loading details…",
    close: "Close",
    dCustomer: "Customer",
    dPostingDate: "Posting Date",
    dDueDate: "Due Date",
    dAmount: "Total",
    dCurrency: "Currency",
    dOutstanding: "Outstanding",
    dNetTotal: "Net Total",
    dTaxes: "Taxes & Charges",
    dDiscount: "Discount",
    dCompany: "Company",
    dPoNo: "PO No",
    dProject: "Project",
    dReturnAgainst: "Return Against",
    dContactPerson: "Contact Person",
    dContactEmail: "Contact Email",
    dRemark: "Remarks",

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

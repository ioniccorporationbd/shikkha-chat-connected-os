/**
 * Copy for the staff Journal Entry history table (`/userDashboard/journal-entry`,
 * right-side "জার্নাল এন্ট্রি তালিকা" panel). Mirrors the payment-entry list
 * wording so every list panel's filter/pagination footer reads identically, plus
 * the labels unique to the journal-entry table + its details popup.
 */
import type { ListFilterCopy, ListPaginationCopy } from "@/lib/dashboard/list-controls";

export interface JournalListCopy extends ListFilterCopy, ListPaginationCopy {
  heading: string;
  subtitle: string;
  loading: string;
  loadFailed: string;
  retry: string;
  emptyTitle: string;
  emptyHint: string;
  listHeading: string;
  noMatchTitle: string;
  noMatchHint: string;
  clearFilters: string;
  viewDetails: string;
  close: string;
  detailsHeading: string;
  filterInvalidAmount: string;
  filterInvalidAmountRange: string;
  filterInvalidDateRange: string;
  colSl: string;
  colId: string;
  colDate: string;
  colType: string;
  colTitle: string;
  colDebit: string;
  colCredit: string;
  colStatus: string;
  colAction: string;
  statuses: { draft: string; submitted: string; cancelled: string };
  dSecInfo: string;
  dSecAmount: string;
  dSecReference: string;
  dName: string;
  dPostingDate: string;
  dVoucherType: string;
  dTitle: string;
  dCompany: string;
  dStatus: string;
  dDebit: string;
  dCredit: string;
  dRemark: string;
  dCheque: string;
  dBill: string;
  dPartySection: string;
  dPartyType: string;
  dParty: string;
  detailLoading: string;
  detailError: string;
}

const BN: JournalListCopy = {
  heading: "জার্নাল এন্ট্রি তালিকা",
  subtitle: "আপনার তৈরি করা জার্নাল এন্ট্রি",
  loading: "লোড হচ্ছে…",
  loadFailed: "জার্নাল এন্ট্রি লোড করা যায়নি।",
  retry: "আবার চেষ্টা",
  emptyTitle: "কোনো জার্নাল এন্ট্রি নেই",
  emptyHint: "এখনো কোনো জার্নাল এন্ট্রি তৈরি হয়নি।",
  listHeading: "জার্নাল এন্ট্রি তালিকা",
  noMatchTitle: "কোনো মিল নেই",
  noMatchHint: "ফিল্টার অনুযায়ী কোনো জার্নাল এন্ট্রি পাওয়া যায়নি।",
  clearFilters: "ফিল্টার মুছুন",
  viewDetails: "বিস্তারিত দেখুন",
  close: "বন্ধ করুন",
  detailsHeading: "জার্নাল এন্ট্রি বিবরণ",
  filterInvalidAmount: "সঠিক পরিমাণ দিন।",
  filterInvalidAmountRange: "সর্বনিম্ন পরিমাণ সর্বোচ্চের চেয়ে বেশি হতে পারবে না।",
  filterInvalidDateRange: "শুরুর তারিখ শেষের তারিখের পরে হতে পারবে না।",
  colSl: "ক্রম",
  colId: "আইডি",
  colDate: "তারিখ",
  colType: "ভাউচার টাইপ",
  colTitle: "শিরোনাম",
  colDebit: "ডেবিট",
  colCredit: "ক্রেডিট",
  colStatus: "স্ট্যাটাস",
  colAction: "অ্যাকশন",
  statuses: { draft: "খসড়া", submitted: "জমাকৃত", cancelled: "বাতিল" },
  filterHeading: "ফিল্টার",
  filterHint: "তালিকা সংকুচিত করতে ফিল্টার ব্যবহার করুন",
  filterSearchLabel: "অনুসন্ধান",
  filterSearchPlaceholder: "আইডি, ভাউচার টাইপ, শিরোনাম…",
  filterStatusLabel: "স্ট্যাটাস",
  filterStatusAll: "সব",
  filterAmountLabel: "পরিমাণ",
  filterAmountAny: "যেকোনো",
  filterAmountExact: "সঠিক",
  filterAmountRange: "রেঞ্জ",
  filterAmountExactPlaceholder: "পরিমাণ",
  filterMinPlaceholder: "সর্বনিম্ন",
  filterMaxPlaceholder: "সর্বোচ্চ",
  filterFromLabel: "শুরুর তারিখ",
  filterToLabel: "শেষের তারিখ",
  filterApply: "প্রয়োগ করুন",
  filterClear: "রিসেট",
  totalRecordsLabel: "মোট রেকর্ড",
  rowsPerPageShow: "দেখান",
  rowsPerPageSuffix: "টি",
  pagePrev: "আগের",
  pageNext: "পরের",
  pageLabel: "পৃষ্ঠা",
  pageOf: "/",
  paginationRangeLabel: "দেখানো হচ্ছে",
  ofLabel: "মোট",
  dSecInfo: "সাধারণ তথ্য",
  dSecAmount: "পরিমাণ",
  dSecReference: "রেফারেন্স",
  dName: "আইডি",
  dPostingDate: "পোস্টিং তারিখ",
  dVoucherType: "ভাউচার টাইপ",
  dTitle: "শিরোনাম",
  dCompany: "কোম্পানি",
  dStatus: "স্ট্যাটাস",
  dDebit: "মোট ডেবিট",
  dCredit: "মোট ক্রেডিট",
  dRemark: "মন্তব্য",
  dCheque: "চেক নম্বর",
  dBill: "বিল নম্বর",
  dPartySection: "পক্ষ",
  dPartyType: "পক্ষের ধরন",
  dParty: "পক্ষ",
  detailLoading: "বিস্তারিত লোড হচ্ছে…",
  detailError: "বিস্তারিত লোড করা যায়নি।",
};

const EN: JournalListCopy = {
  heading: "Journal Entries",
  subtitle: "Journal entries you created",
  loading: "Loading…",
  loadFailed: "Could not load the journal entries.",
  retry: "Retry",
  emptyTitle: "No journal entries yet",
  emptyHint: "No journal entry has been created yet.",
  listHeading: "Journal entries",
  noMatchTitle: "No matches",
  noMatchHint: "No journal entry matches the current filters.",
  clearFilters: "Clear filters",
  viewDetails: "View details",
  close: "Close",
  detailsHeading: "Journal entry details",
  filterInvalidAmount: "Enter a valid amount.",
  filterInvalidAmountRange: "Minimum amount cannot exceed the maximum.",
  filterInvalidDateRange: "The start date cannot be after the end date.",
  colSl: "Sl",
  colId: "ID",
  colDate: "Date",
  colType: "Voucher type",
  colTitle: "Title",
  colDebit: "Debit",
  colCredit: "Credit",
  colStatus: "Status",
  colAction: "Action",
  statuses: { draft: "Draft", submitted: "Submitted", cancelled: "Cancelled" },
  filterHeading: "Filter",
  filterHint: "Use the filters to narrow the list",
  filterSearchLabel: "Search",
  filterSearchPlaceholder: "ID, voucher type, title…",
  filterStatusLabel: "Status",
  filterStatusAll: "All",
  filterAmountLabel: "Amount",
  filterAmountAny: "Any",
  filterAmountExact: "Exact",
  filterAmountRange: "Range",
  filterAmountExactPlaceholder: "Amount",
  filterMinPlaceholder: "Min",
  filterMaxPlaceholder: "Max",
  filterFromLabel: "From date",
  filterToLabel: "To date",
  filterApply: "Apply",
  filterClear: "Reset",
  totalRecordsLabel: "Total Records",
  rowsPerPageShow: "Show",
  rowsPerPageSuffix: "rows",
  pagePrev: "Prev",
  pageNext: "Next",
  pageLabel: "Page",
  pageOf: "of",
  paginationRangeLabel: "Showing",
  ofLabel: "of",
  dSecInfo: "General information",
  dSecAmount: "Amount",
  dSecReference: "Reference",
  dName: "ID",
  dPostingDate: "Posting date",
  dVoucherType: "Voucher type",
  dTitle: "Title",
  dCompany: "Company",
  dStatus: "Status",
  dDebit: "Total debit",
  dCredit: "Total credit",
  dRemark: "Remark",
  dCheque: "Cheque no",
  dBill: "Bill no",
  dPartySection: "Party",
  dPartyType: "Party type",
  dParty: "Party",
  detailLoading: "Loading details…",
  detailError: "Could not load the details.",
};

export function journalListCopyFor(language: string): JournalListCopy {
  return language === "en" ? EN : BN;
}

/** Bilingual copy for the Employee Expense Claim surface. */

export interface ExpenseClaimCopy {
  heading: string;
  subtitle: string;
  back: string;
  loading: string;
  loadFailed: string;
  retry: string;
  sessionExpiredTitle: string;
  signInAgain: string;
  /** Permission refusal — a calm, actionable state. */
  permissionTitle: string;
  permissionHint: string;
  /** No Employee record is linked to the account. */
  noEmployeeTitle: string;
  noEmployeeHint: string;
  refresh: string;
  refreshing: string;
  refreshed: string;

  /* summary cards */
  summaryHeading: string;
  summaryTotal: string;
  summaryDraft: string;
  summaryPending: string;
  summaryApproved: string;
  summaryPaid: string;
  summarySiteScope: string;

  /* list */
  listHeading: string;
  listHint: string;
  newClaim: string;
  newClaimHint: string;
  openAction: string;
  colId: string;
  colDate: string;
  colClaimed: string;
  colSanctioned: string;
  colStatus: string;
  colPaid: string;
  colAction: string;
  /** Display-only serial number (1, 2, 3…) column. */
  colSl: string;
  viewDetails: string;
  emptyTitle: string;
  emptyHint: string;
  emptyCta: string;

  /* status + paid labels */
  statusDraft: string;
  statusSubmitted: string;
  statusApproved: string;
  statusRejected: string;
  statusPaid: string;
  statusCancelled: string;
  paidLabel: string;
  unpaidLabel: string;

  /* details drawer */
  detailsHeading: string;
  detailsLoading: string;
  /** Details fetch failed (inline + toast). */
  detailsFailed: string;
  close: string;
  dEmployee: string;
  dEmployeeId: string;
  dPostingDate: string;
  dCompany: string;
  dDepartment: string;
  dCostCenter: string;
  dCurrency: string;
  dApprover: string;
  dStatus: string;
  dApproval: string;
  dClaimed: string;
  dSanctioned: string;
  dGrandTotal: string;
  dReimbursed: string;
  dPaid: string;
  dRemark: string;
  dExpenses: string;
  dExpenseDate: string;
  dExpenseType: string;
  dDescription: string;
  dAmount: string;

  /* form */
  formHeading: string;
  formSubtitle: string;
  requiredNote: string;
  sectionClaim: string;
  sectionAuto: string;
  sectionExpenses: string;
  autoNote: string;
  addRow: string;
  removeRow: string;
  rowLabel: (n: number) => string;
  totalClaimed: string;
  previewNote: string;
  submit: string;
  submitting: string;
  reset: string;
  selectPlaceholder: string;
  linkLoading: string;
  linkNoOptions: string;
  linkEmptyHint: string;
  linkLoadFailed: string;
  searchPlaceholder: string;
  yes: string;
  no: string;
  missingRequired: (label: string) => string;
  rowMissing: string;

  /* toasts */
  successTitle: string;
  successBody: (name: string) => string;
  errorTitle: string;
  createdLabel: string;
  createAnother: string;
}

export const expenseClaimCopy: Record<"bn" | "en", ExpenseClaimCopy> = {
  bn: {
    heading: "এক্সপেন্স ক্লেম",
    subtitle: "আপনার খরচের দাবি তৈরি করুন এবং বর্তমান অবস্থা দেখুন।",
    back: "ড্যাশবোর্ডে ফিরুন",
    loading: "আপনার এক্সপেন্স ক্লেম লোড হচ্ছে…",
    loadFailed: "এক্সপেন্স ক্লেম লোড করা যায়নি।",
    retry: "আবার চেষ্টা করুন",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ",
    signInAgain: "আবার সাইন ইন করুন",
    permissionTitle: "এক্সপেন্স ক্লেম দেখার অনুমতি নেই",
    permissionHint:
      "আপনার অ্যাকাউন্টে Expense Claim দেখার/তৈরির অনুমতি দেওয়া নেই। একজন HR/Accounts অ্যাডমিনের সাথে যোগাযোগ করুন।",
    noEmployeeTitle: "Employee প্রোফাইল পাওয়া যায়নি",
    noEmployeeHint:
      "আপনার ইউজার অ্যাকাউন্টের সাথে কোনো Employee রেকর্ড লিংক করা নেই। একজন HR অ্যাডমিনের সাথে যোগাযোগ করুন।",
    refresh: "রিফ্রেশ",
    refreshing: "রিফ্রেশ হচ্ছে…",
    refreshed: "তালিকা হালনাগাদ হয়েছে।",
    summaryHeading: "সারসংক্ষেপ",
    summaryTotal: "মোট ক্লেম",
    summaryDraft: "ড্রাফট",
    summaryPending: "পেন্ডিং / অপরিশোধিত",
    summaryApproved: "অনুমোদিত",
    summaryPaid: "পরিশোধিত",
    summarySiteScope: "আপনার ক্লেম",
    listHeading: "আপনার এক্সপেন্স ক্লেম",
    listHint: "সর্বশেষটি আগে দেখানো হয়েছে।",
    newClaim: "নতুন এক্সপেন্স ক্লেম",
    newClaimHint: "একটি নতুন খরচের দাবি তৈরি করুন।",
    openAction: "খুলুন",
    colSl: "ক্রমিক",
    colId: "এক্সপেন্স ক্লেম আইডি",
    colDate: "পোস্টিং তারিখ",
    colClaimed: "দাবি করা পরিমাণ",
    colSanctioned: "অনুমোদিত পরিমাণ",
    colStatus: "স্ট্যাটাস",
    colPaid: "পেমেন্ট",
    colAction: "অ্যাকশন",
    viewDetails: "বিস্তারিত দেখুন",
    emptyTitle: "এখনও কোনো Expense Claim তৈরি করা হয়নি।",
    emptyHint: "আপনার প্রথম খরচের দাবি তৈরি করে শুরু করুন।",
    emptyCta: "নতুন Expense Claim তৈরি করুন",
    statusDraft: "ড্রাফট",
    statusSubmitted: "সাবমিটেড",
    statusApproved: "অনুমোদিত",
    statusRejected: "প্রত্যাখ্যাত",
    statusPaid: "পরিশোধিত",
    statusCancelled: "বাতিল",
    paidLabel: "পরিশোধিত",
    unpaidLabel: "অপরিশোধিত",
    detailsHeading: "ক্লেমের বিস্তারিত",
    detailsLoading: "বিস্তারিত লোড হচ্ছে…",
    detailsFailed: "এক্সপেন্স ক্লেমের বিস্তারিত তথ্য লোড করা যাচ্ছে না।",
    close: "বন্ধ করুন",
    dEmployee: "কর্মী",
    dEmployeeId: "কর্মী আইডি",
    dPostingDate: "পোস্টিং তারিখ",
    dCompany: "প্রতিষ্ঠান",
    dDepartment: "বিভাগ",
    dCostCenter: "কস্ট সেন্টার",
    dCurrency: "মুদ্রা",
    dApprover: "অনুমোদনকারী",
    dStatus: "স্ট্যাটাস",
    dApproval: "অনুমোদন অবস্থা",
    dClaimed: "মোট দাবি",
    dSanctioned: "মোট অনুমোদিত",
    dGrandTotal: "সর্বমোট",
    dReimbursed: "পরিশোধিত পরিমাণ",
    dPaid: "পেমেন্ট অবস্থা",
    dRemark: "মন্তব্য",
    dExpenses: "খরচের সারি",
    dExpenseDate: "খরচের তারিখ",
    dExpenseType: "খরচের ধরন",
    dDescription: "বিবরণ",
    dAmount: "পরিমাণ",
    formHeading: "নতুন এক্সপেন্স ক্লেম",
    formSubtitle: "খরচের সারি যোগ করে একটি ড্রাফট দাবি তৈরি করুন।",
    requiredNote: "* চিহ্নিত ঘরগুলো আবশ্যক।",
    sectionClaim: "ক্লেম ডিটেইলস",
    sectionAuto: "আপনার তথ্য",
    sectionExpenses: "খরচের সারি",
    autoNote: "এই তথ্যগুলো আপনার Employee প্রোফাইল থেকে স্বয়ংক্রিয়ভাবে বসানো হয়।",
    addRow: "খরচ যোগ করুন",
    removeRow: "সরান",
    rowLabel: (n) => `খরচ ${n}`,
    totalClaimed: "মোট দাবিকৃত",
    previewNote: "চূড়ান্ত হিসাব ও যাচাই ERPNext-এ হয়ে থাকে।",
    submit: "ক্লেম তৈরি করুন",
    submitting: "তৈরি হচ্ছে…",
    reset: "রিসেট",
    selectPlaceholder: "নির্বাচন করুন",
    linkLoading: "খোঁজা হচ্ছে…",
    linkNoOptions: "কিছু পাওয়া যায়নি।",
    linkEmptyHint:
      "কোনো Expense Claim Type পাওয়া যায়নি। ERPNext-এ আগে Expense Claim Type তৈরি করুন।",
    linkLoadFailed: "Expense Type তালিকা লোড করা যাচ্ছে না। আবার চেষ্টা করুন।",
    searchPlaceholder: "খুঁজুন…",
    yes: "হ্যাঁ",
    no: "না",
    missingRequired: (label) => `${label} আবশ্যক।`,
    rowMissing: "কমপক্ষে একটি খরচ যোগ করুন (Expense Type এবং Amount সহ)।",
    successTitle: "সফল",
    successBody: (name) => `এক্সপেন্স ক্লেম সফলভাবে তৈরি হয়েছে — ${name}`,
    errorTitle: "ব্যর্থ",
    createdLabel: "তৈরি হয়েছে",
    createAnother: "আরেকটি তৈরি করুন",
  },
  en: {
    heading: "Expense Claim",
    subtitle: "Create your expense claims and track their current state.",
    back: "Back to dashboard",
    loading: "Loading your expense claims…",
    loadFailed: "The expense claims could not be loaded.",
    retry: "Try again",
    sessionExpiredTitle: "Your session has expired",
    signInAgain: "Sign in again",
    permissionTitle: "No permission to view expense claims",
    permissionHint:
      "Your account is missing the Expense Claim read/create permission. Ask an HR / Accounts administrator to grant it.",
    noEmployeeTitle: "No Employee profile found",
    noEmployeeHint:
      "No Employee record is linked to your user account. Please contact an HR administrator.",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    refreshed: "List refreshed.",
    summaryHeading: "Summary",
    summaryTotal: "Total Claims",
    summaryDraft: "Draft",
    summaryPending: "Pending / Unpaid",
    summaryApproved: "Approved",
    summaryPaid: "Paid",
    summarySiteScope: "Your claims",
    listHeading: "Your Expense Claims",
    listHint: "Newest first.",
    newClaim: "New Expense Claim",
    newClaimHint: "Create a new expense claim.",
    openAction: "Open",
    colSl: "SL",
    colId: "Expense Claim ID",
    colDate: "Posting Date",
    colClaimed: "Claimed Amount",
    colSanctioned: "Sanctioned Amount",
    colStatus: "Status",
    colPaid: "Paid",
    colAction: "Action",
    viewDetails: "View Details",
    emptyTitle: "No expense claims yet.",
    emptyHint: "Create your first expense claim to get started.",
    emptyCta: "Create a new Expense Claim",
    statusDraft: "Draft",
    statusSubmitted: "Submitted",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusPaid: "Paid",
    statusCancelled: "Cancelled",
    paidLabel: "Paid",
    unpaidLabel: "Unpaid",
    detailsHeading: "Claim details",
    detailsLoading: "Loading details…",
    detailsFailed: "The expense claim details could not be loaded.",
    close: "Close",
    dEmployee: "Employee",
    dEmployeeId: "Employee ID",
    dPostingDate: "Posting Date",
    dCompany: "Company",
    dDepartment: "Department",
    dCostCenter: "Cost Center",
    dCurrency: "Currency",
    dApprover: "Expense Approver",
    dStatus: "Status",
    dApproval: "Approval Status",
    dClaimed: "Claimed Amount",
    dSanctioned: "Sanctioned Amount",
    dGrandTotal: "Grand Total",
    dReimbursed: "Reimbursed Amount",
    dPaid: "Paid Status",
    dRemark: "Remark",
    dExpenses: "Expense rows",
    dExpenseDate: "Expense Date",
    dExpenseType: "Expense Type",
    dDescription: "Description",
    dAmount: "Amount",
    formHeading: "New Expense Claim",
    formSubtitle: "Add expense rows and create a draft claim.",
    requiredNote: "Fields marked * are required.",
    sectionClaim: "Claim Details",
    sectionAuto: "Your details",
    sectionExpenses: "Expense rows",
    autoNote: "These values are filled automatically from your Employee profile.",
    addRow: "Add expense",
    removeRow: "Remove",
    rowLabel: (n) => `Expense ${n}`,
    totalClaimed: "Total claimed",
    previewNote: "Final amounts and validation are computed by ERPNext.",
    submit: "Create claim",
    submitting: "Creating…",
    reset: "Reset",
    selectPlaceholder: "Select",
    linkLoading: "Searching…",
    linkNoOptions: "No results.",
    linkEmptyHint: "No Expense Claim Type found. Create one in ERPNext first.",
    linkLoadFailed: "The Expense Type list could not be loaded. Please try again.",
    searchPlaceholder: "Search…",
    yes: "Yes",
    no: "No",
    missingRequired: (label) => `${label} is required.`,
    rowMissing: "Add at least one expense row (with Expense Type and Amount).",
    successTitle: "Success",
    successBody: (name) => `Expense claim created successfully — ${name}`,
    errorTitle: "Failed",
    createdLabel: "Created",
    createAnother: "Create another",
  },
};

export function expenseClaimCopyFor(language: string): ExpenseClaimCopy {
  return expenseClaimCopy[language === "en" ? "en" : "bn"];
}

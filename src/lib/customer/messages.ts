/** Bilingual copy for the System-User "Create Customer" surface. */

export interface CustomerCopy {
  heading: string;
  hint: string;
  back: string;
  /** Live "Created: <name>" confirmation. */
  createdLabel: string;
  createdName: (name: string) => string;
  createAnother: string;
  submit: string;
  submitting: string;
  reset: string;
  loading: string;
  loadFailed: string;
  /** Lapsed ERP session — offer a sign-in instead of a blind retry. */
  sessionExpiredTitle: string;
  signInAgain: string;
  retry: string;
  /** Permission refusal — a clean, actionable state, not an error card. */
  permissionTitle: string;
  permissionHint: string;
  empty: string;
  /** Per-field states. */
  requiredMark: string;
  selectPlaceholder: string;
  searchPlaceholder: string;
  linkLoading: string;
  linkNoOptions: string;
  yes: string;
  no: string;
  /** Toast copy. */
  successTitle: string;
  successBody: (name: string) => string;
  errorTitle: string;
  validationTitle: string;
  missingRequired: (label: string) => string;
  /** Known section labels, keyed by the ERP's English label. */
  sectionLabels: Record<string, string>;
}

export const customerCopy: Record<"bn" | "en", CustomerCopy> = {
  bn: {
    heading: "কাস্টমার তৈরি করুন",
    hint: "ERPNext-এ সরাসরি একটি নতুন কাস্টমার যোগ করুন।",
    back: "ড্যাশবোর্ডে ফিরুন",
    createdLabel: "তৈরি হয়েছে",
    createdName: (name) => `কাস্টমার আইডি: ${name}`,
    createAnother: "আরেকটি তৈরি করুন",
    submit: "কাস্টমার তৈরি করুন",
    submitting: "তৈরি হচ্ছে…",
    reset: "রিসেট",
    loading: "কাস্টমার ফর্ম লোড হচ্ছে…",
    loadFailed: "ফর্ম লোড করা যায়নি।",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ",
    signInAgain: "আবার সাইন ইন করুন",
    retry: "আবার চেষ্টা করুন",
    permissionTitle: "কাস্টমার তৈরির অনুমতি নেই",
    permissionHint:
      "আপনার অ্যাকাউন্টে Customer তৈরির অনুমতি দেওয়া নেই। একজন সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন অথবা আপনার রোল-এ Customer তৈরির অনুমতি যোগ করান।",
    empty: "এই ডকটাইপে কোনো ইনপুট ফিল্ড পাওয়া যায়নি।",
    requiredMark: "আবশ্যক",
    selectPlaceholder: "নির্বাচন করুন",
    searchPlaceholder: "খুঁজুন…",
    linkLoading: "লোড হচ্ছে…",
    linkNoOptions: "কোনো অপশন নেই",
    yes: "হ্যাঁ",
    no: "না",
    successTitle: "কাস্টমার তৈরি হয়েছে",
    successBody: (name) => `কাস্টমার সফলভাবে তৈরি হয়েছে — আইডি ${name}।`,
    errorTitle: "কাস্টমার তৈরি ব্যর্থ",
    validationTitle: "তথ্য অসম্পূর্ণ",
    missingRequired: (label) => `"${label}" আবশ্যক।`,
    sectionLabels: {
      "Basic Information": "মৌলিক তথ্য",
      "Customer Details": "কাস্টমার বিবরণ",
      "Contact Information": "যোগাযোগ তথ্য",
      "Address Information": "ঠিকানা তথ্য",
      "Tax / Identification": "ট্যাক্স / পরিচিতি",
      "Territory / Market": "টেরিটরি / মার্কেট",
      "Additional Information": "অতিরিক্ত তথ্য",
      "Credit Limit": "ক্রেডিট লিমিট",
      "Sales Team": "সেলস টিম",
      "Loyalty Program": "লয়্যালটি প্রোগ্রাম",
    },
  },
  en: {
    heading: "Create Customer",
    hint: "Add a new Customer directly in ERPNext.",
    back: "Back to dashboard",
    createdLabel: "Created",
    createdName: (name) => `Customer ID: ${name}`,
    createAnother: "Create another",
    submit: "Create Customer",
    submitting: "Creating…",
    reset: "Reset",
    loading: "Loading the customer form…",
    loadFailed: "The form could not be loaded.",
    sessionExpiredTitle: "Your session has expired",
    signInAgain: "Sign in again",
    retry: "Try again",
    permissionTitle: "No permission to create customers",
    permissionHint:
      "Your account is missing the Customer: create permission. Ask a system administrator to grant it, or add it to your role.",
    empty: "No input fields were found on this DocType.",
    requiredMark: "Required",
    selectPlaceholder: "Select",
    searchPlaceholder: "Search…",
    linkLoading: "Loading…",
    linkNoOptions: "No options",
    yes: "Yes",
    no: "No",
    successTitle: "Customer created",
    successBody: (name) => `The customer was created successfully — ID ${name}.`,
    errorTitle: "Could not create the customer",
    validationTitle: "Incomplete details",
    missingRequired: (label) => `"${label}" is required.`,
    sectionLabels: {},
  },
};

export function customerCopyFor(language: string): CustomerCopy {
  return customerCopy[language === "en" ? "en" : "bn"];
}

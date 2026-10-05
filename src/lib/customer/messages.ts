/** Bilingual copy for the System-User "Create Customer" surface. */

export interface CustomerCopy {
  heading: string;
  hint: string;
  /** Header quick-info chips (tiny, informational). */
  quickInfo: string[];
  back: string;
  /** Live "Created: <name>" confirmation. */
  createdLabel: string;
  createdName: (name: string) => string;
  /** Success-summary field labels. */
  groupLabel: string;
  territoryLabel: string;
  verifiedLabel: string;
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
  /** Small legend near the top of the form about the required marker. */
  requiredNote: string;
  selectPlaceholder: string;
  searchPlaceholder: string;
  linkLoading: string;
  linkNoOptions: string;
  yes: string;
  no: string;
  /** Small BD-friendly phone hint. */
  mobileHelper: string;
  /** aria-label for the icon-only clear button on link fields. */
  clearSelection: string;
  /** Toast copy. */
  successTitle: string;
  successBody: (name: string) => string;
  errorTitle: string;
  validationTitle: string;
  /** Special toast title when the ERP rejects a duplicate name. */
  duplicateTitle: string;
  missingRequired: (label: string) => string;
  /** Restored-an-unfinished-draft info toast. */
  draftRestored: string;
  /** Unsaved-changes guard (in-view back + tab close). */
  unsavedTitle: string;
  unsavedBody: string;
  unsavedLeave: string;
  unsavedStay: string;
  /** Reset confirmation. */
  resetConfirmTitle: string;
  resetConfirmBody: string;
  resetConfirmYes: string;
  resetConfirmNo: string;
  /** Success-card chrome. */
  createdTitle: string;
  idLabel: string;
  typeLabel: string;
  contactLabel: string;
  /** Edit mode reuses the create surface with update semantics. */
  editHeading: string;
  editHint: string;
  submitEdit: string;
  submittingEdit: string;
  updatedTitle: string;
  updateSuccessTitle: string;
  /** Known section labels, keyed by the ERP's English label. */
  sectionLabels: Record<string, string>;
  /** One-line helper per section, keyed by the ERP's English label. */
  sectionHelp: Record<string, string>;
}

export const customerCopy: Record<"bn" | "en", CustomerCopy> = {
  bn: {
    heading: "কাস্টমার তৈরি করুন",
    hint: "ERPNext-এ নতুন কাস্টমার তৈরি করুন এবং প্রয়োজনীয় তথ্য সংরক্ষণ করুন।",
    quickInfo: ["ERPNext Customer ডকটাইপে সংরক্ষিত", "তৈরি হলে সাথে সাথে যাচাই করা হয়"],
    back: "ড্যাশবোর্ডে ফিরুন",
    createdLabel: "তৈরি হয়েছে",
    createdName: (name) => `কাস্টমার আইডি: ${name}`,
    groupLabel: "গ্রুপ",
    territoryLabel: "টেরিটরি",
    verifiedLabel: "ERPNext-এ যাচাই করা হয়েছে",
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
    requiredNote: "* চিহ্নিত ফিল্ডগুলো আবশ্যক।",
    selectPlaceholder: "নির্বাচন করুন",
    searchPlaceholder: "খুঁজুন…",
    linkLoading: "লোড হচ্ছে…",
    linkNoOptions: "কোনো অপশন নেই",
    yes: "হ্যাঁ",
    no: "না",
    mobileHelper: "উদাহরণ: 01XXXXXXXXX",
    clearSelection: "নির্বাচন মুছুন",
    successTitle: "কাস্টমার তৈরি হয়েছে",
    successBody: (name) => `কাস্টমার সফলভাবে তৈরি হয়েছে — আইডি ${name}।`,
    errorTitle: "কাস্টমার তৈরি ব্যর্থ",
    validationTitle: "তথ্য অসম্পূর্ণ",
    duplicateTitle: "ডুপ্লিকেট কাস্টমার",
    missingRequired: (label) => `"${label}" আবশ্যক।`,
    draftRestored: "আপনার অসম্পূর্ণ খসড়াটি ফিরিয়ে আনা হয়েছে।",
    unsavedTitle: "অসম্পূর্ণ তথ্য আছে",
    unsavedBody:
      "আপনি কিছু তথ্য লিখেছেন কিন্তু এখনো সংরক্ষণ করেননি। পেজ ছাড়লে এই তথ্য হারিয়ে যাবে।",
    unsavedLeave: "তবুও ছাড়ুন",
    unsavedStay: "এখানে থাকুন",
    resetConfirmTitle: "ফর্ম রিসেট করবেন?",
    resetConfirmBody: "আপনি যা লিখেছেন সব মুছে যাবে। এটি ফেরানো যাবে না।",
    resetConfirmYes: "হ্যা, রিসেট করুন",
    resetConfirmNo: "বাতিল",
    createdTitle: "কাস্টমার সফলভাবে তৈরি হয়েছে",
    idLabel: "কাস্টমার আইডি",
    typeLabel: "ধরন",
    contactLabel: "যোগাযোগ",
    editHeading: "কাস্টমার সম্পাদনা",
    editHint: "এই কাস্টমারের তথ্য হালনাগাদ করুন এবং সংরক্ষণ করুন।",
    submitEdit: "পরিবর্তন সংরক্ষণ করুন",
    submittingEdit: "সংরক্ষণ হচ্ছে…",
    updatedTitle: "কাস্টমার সফলভাবে হালনাগাদ হয়েছে",
    updateSuccessTitle: "কাস্টমার হালনাগাদ হয়েছে",
    sectionLabels: {
      "Customer Information": "কাস্টমার তথ্য",
      "Basic Information": "মৌলিক তথ্য",
      "Customer Details": "কাস্টমার বিবরণ",
      "Contact Information": "যোগাযোগ তথ্য",
      "Address Information": "ঠিকানা তথ্য",
      "Business & Tax": "ব্যবসা ও কর",
      "Tax / Identification": "ট্যাক্স / পরিচিতি",
      "Territory / Market": "টেরিটরি / মার্কেট",
      "Additional Information": "অতিরিক্ত তথ্য",
      "Credit Limit": "ক্রেডিট লিমিট",
      "Sales Team": "সেলস টিম",
      "Loyalty Program": "লয়্যালটি প্রোগ্রাম",
    },
    sectionHelp: {
      "Customer Information": "কাস্টমারের মূল পরিচয় ও শ্রেণীবিভাগ দিন।",
      "Basic Information": "কাস্টমারের মূল পরিচয় ও শ্রেণীবিভাগ দিন।",
      "Customer Details": "কাস্টমারের মূল পরিচয় ও শ্রেণীবিভাগ দিন।",
      "Contact Information": "ইনভয়েস ও নোটিশ পাঠানোর জন্য যোগাযোগের মাধ্যম দিন।",
      "Address Information": "বিলিং ও ডেলিভারি ঠিকানা দিন।",
      "Business & Tax": "কর পরিচিতি ও আর্থিক ডিফল্ট (প্রয়োজন হলে)।",
      "Tax / Identification": "কর পরিচিতি ও আর্থিক ডিফল্ট (প্রয়োজন হলে)।",
      "Additional Information": "এই সাইটে বাধ্যতামূলক করা বাকি ফিল্ডগুলো।",
    },
  },
  en: {
    heading: "Create Customer",
    hint: "Create a new Customer in ERPNext and save the details it needs.",
    quickInfo: ["Stored in the ERPNext Customer DocType", "Verified against the database on creation"],
    back: "Back to dashboard",
    createdLabel: "Created",
    createdName: (name) => `Customer ID: ${name}`,
    groupLabel: "Group",
    territoryLabel: "Territory",
    verifiedLabel: "Verified in ERPNext",
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
    requiredNote: "Fields marked with * are required.",
    selectPlaceholder: "Select",
    searchPlaceholder: "Search…",
    linkLoading: "Loading…",
    linkNoOptions: "No options",
    yes: "Yes",
    no: "No",
    mobileHelper: "e.g. 01XXXXXXXXX",
    clearSelection: "Clear selection",
    successTitle: "Customer created",
    successBody: (name) => `The customer was created successfully — ID ${name}.`,
    errorTitle: "Could not create the customer",
    validationTitle: "Incomplete details",
    duplicateTitle: "Duplicate customer",
    missingRequired: (label) => `"${label}" is required.`,
    draftRestored: "Your unfinished draft was restored.",
    unsavedTitle: "You have unsaved details",
    unsavedBody:
      "You have entered details that have not been saved yet. Leaving this page will discard them.",
    unsavedLeave: "Leave anyway",
    unsavedStay: "Keep editing",
    resetConfirmTitle: "Reset the form?",
    resetConfirmBody: "Everything you entered will be cleared. This cannot be undone.",
    resetConfirmYes: "Yes, reset",
    resetConfirmNo: "Cancel",
    createdTitle: "Customer created successfully",
    idLabel: "Customer ID",
    typeLabel: "Type",
    contactLabel: "Contact",
    editHeading: "Edit Customer",
    editHint: "Update this customer's details and save your changes.",
    submitEdit: "Save changes",
    submittingEdit: "Saving…",
    updatedTitle: "Customer updated successfully",
    updateSuccessTitle: "Customer updated",
    sectionLabels: {},
    sectionHelp: {
      "Customer Information": "Core identity and classification for this customer.",
      "Basic Information": "Core identity and classification for this customer.",
      "Customer Details": "Core identity and classification for this customer.",
      "Contact Information": "How to reach this customer for invoices and notices.",
      "Address Information": "Billing and shipping addresses.",
      "Business & Tax": "Tax identifier and financial defaults (optional).",
      "Tax / Identification": "Tax identifier and financial defaults (optional).",
      "Additional Information": "Remaining mandatory fields defined on this site.",
    },
  },
};

export function customerCopyFor(language: string): CustomerCopy {
  return customerCopy[language === "en" ? "en" : "bn"];
}

/**
 * Human-friendly duplicate detection. The ERP already localises the message
 * ("এই নামে একটি কাস্টমার ইতিমধ্যে আছে।" / "A customer with this name already
 * exists.") but the toast title should be specific rather than the generic
 * "could not create" heading, so we sniff both languages.
 */
export function isDuplicateError(message: string): boolean {
  const m = (message || "").toLowerCase();
  return (
    m.includes("already exists") ||
    m.includes("duplicate") ||
    m.includes("ইতিমধ্যেই আছে") ||
    m.includes("ইতিমধ্যে আছে") ||
    m.includes("আগেই আছে")
  );
}

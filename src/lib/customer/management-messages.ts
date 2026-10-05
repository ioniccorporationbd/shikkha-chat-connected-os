/** Bilingual copy for the Customer Management (list / search / edit / delete). */

export interface CustomerManagementCopy {
  heading: string;
  hint: string;
  /** "You have created X customers" — the real count from the backend. */
  countLabel: (count: number) => string;
  searchPlaceholder: string;
  noResults: string;
  emptyTitle: string;
  emptyHint: string;
  createNew: string;
  back: string;
  loading: string;
  loadFailed: string;
  retry: string;
  sessionExpiredTitle: string;
  signInAgain: string;
  permissionTitle: string;
  permissionHint: string;
  /** Placeholder for an empty cell. */
  notSet: string;
  /** Column headers. */
  colSl: string;
  colId: string;
  colName: string;
  colType: string;
  colGroup: string;
  colTerritory: string;
  colMobile: string;
  colEmail: string;
  colCreated: string;
  colActions: string;
  edit: string;
  delete: string;
  details: string;
  /** Delete confirmation modal. */
  deleteTitle: string;
  deleteBody: (name: string) => string;
  deleteConfirm: string;
  deleteCancel: string;
  deleting: string;
  /** Toasts. */
  deleteSuccess: string;
  deleteBlocked: string;
  deleteFailed: string;
}

export const customerManagementCopy: Record<"bn" | "en", CustomerManagementCopy> = {
  bn: {
    heading: "কাস্টমার ব্যবস্থাপনা",
    hint: "আপনার তৈরি করা কাস্টমারগুলো এখান থেকে দেখুন, সম্পাদনা করুন বা নতুন কাস্টমার তৈরি করুন।",
    countLabel: (count) => `আপনি মোট ${count} জন কাস্টমার তৈরি করেছেন`,
    searchPlaceholder: "আইডি, নাম, মোবাইল বা ইমেইল দিয়ে খুঁজুন…",
    noResults: "আপনার খোঁজার সাথে মিলে এমন কোনো কাস্টমার নেই।",
    emptyTitle: "এখনো কোনো কাস্টমার তৈরি করা হয়নি",
    emptyHint: "প্রথম কাস্টমার তৈরি করতে নিচের বাটনে ক্লিক করুন।",
    createNew: "নতুন কাস্টমার তৈরি করুন",
    back: "ড্যাশবোর্ডে ফিরুন",
    loading: "কাস্টমার তালিকা লোড হচ্ছে…",
    loadFailed: "কাস্টমার তালিকা লোড করা যায়নি।",
    retry: "আবার চেষ্টা করুন",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ",
    signInAgain: "আবার সাইন ইন করুন",
    permissionTitle: "কাস্টমার ব্যবস্থাপনার অনুমতি নেই",
    permissionHint:
      "আপনার অ্যাকাউন্টে Customer ব্যবস্থাপনার অনুমতি নেই। একজন সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।",
    notSet: "—",
    colSl: "ক্রমিক",
    colId: "কাস্টমার আইডি",
    colName: "নাম",
    colType: "ধরন",
    colGroup: "গ্রুপ",
    colTerritory: "টেরিটরি",
    colMobile: "মোবাইল",
    colEmail: "ইমেইল",
    colCreated: "তৈরির তারিখ",
    colActions: "কার্যক্রম",
    edit: "সম্পাদনা",
    delete: "মুছুন",
    details: "বিস্তারিত",
    deleteTitle: "কাস্টমার মুছবেন?",
    deleteBody: (name) =>
      `আপনি কি নিশ্চিতভাবে "${name}" কাস্টমারটি মুছে ফেলতে চান? এটি ফেরানো যাবে না।`,
    deleteConfirm: "হ্যা, মুছে ফেলুন",
    deleteCancel: "বাতিল",
    deleting: "মুছে ফেলা হচ্ছে…",
    deleteSuccess: "কাস্টমার সফলভাবে মুছে ফেলা হয়েছে।",
    deleteBlocked: "এই কাস্টমারের সাথে লেনদেন যুক্ত আছে, তাই মুছে ফেলা যাচ্ছে না।",
    deleteFailed: "কাস্টমার মুছে ফেলা যায়নি।",
  },
  en: {
    heading: "Customer Management",
    hint: "Review the customers you created, edit them, or add a new one.",
    countLabel: (count) => `You have created ${count} customer${count === 1 ? "" : "s"}`,
    searchPlaceholder: "Search by ID, name, mobile or email…",
    noResults: "No customers match your search.",
    emptyTitle: "No customers yet",
    emptyHint: "Create your first customer with the button below.",
    createNew: "Create new customer",
    back: "Back to dashboard",
    loading: "Loading your customers…",
    loadFailed: "The customer list could not be loaded.",
    retry: "Try again",
    sessionExpiredTitle: "Your session has expired",
    signInAgain: "Sign in again",
    permissionTitle: "No permission to manage customers",
    permissionHint:
      "Your account is missing the Customer management permission. Ask a system administrator to grant it.",
    notSet: "—",
    colSl: "SL",
    colId: "Customer ID",
    colName: "Name",
    colType: "Type",
    colGroup: "Group",
    colTerritory: "Territory",
    colMobile: "Mobile",
    colEmail: "Email",
    colCreated: "Created",
    colActions: "Actions",
    edit: "Edit",
    delete: "Delete",
    details: "Details",
    deleteTitle: "Delete this customer?",
    deleteBody: (name) =>
      `Are you sure you want to delete the customer "${name}"? This cannot be undone.`,
    deleteConfirm: "Yes, delete",
    deleteCancel: "Cancel",
    deleting: "Deleting…",
    deleteSuccess: "The customer was deleted successfully.",
    deleteBlocked: "This customer has linked transactions, so it cannot be deleted.",
    deleteFailed: "The customer could not be deleted.",
  },
};

export function customerManagementCopyFor(language: string): CustomerManagementCopy {
  return customerManagementCopy[language === "en" ? "en" : "bn"];
}

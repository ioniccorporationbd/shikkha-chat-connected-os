/**
 * Bilingual copy for the customer Payment Success page
 * (`/clientDashboard/payment-entry/success`).
 *
 * Kept separate from `messages.ts` so the (large) history copy stays untouched;
 * status/type labels are still read from `paymentEntryCopyFor` so the two
 * screens can never drift apart.
 */

export interface PaymentSuccessCopy {
  // ---- breadcrumb ----
  crumbDashboard: string;
  crumbPaymentEntry: string;
  crumbSuccess: string;

  // ---- loading ----
  loadingTitle: string;
  loadingHint: string;

  // ---- hero ----
  heroEyebrow: string;
  heroTitle: string;
  heroBodyDraft: string;
  heroBodyRecorded: string;
  draftNote: string;
  verifiedLabel: string;

  // ---- payment summary ----
  sectionPayment: string;
  idLabel: string;
  statusLabel: string;
  amountLabel: string;
  currencyLabel: string;
  methodLabel: string;
  typeLabel: string;
  dateLabel: string;
  companyLabel: string;
  customerLabel: string;

  // ---- transaction / reference ----
  sectionReference: string;
  referenceNoLabel: string;
  referenceDateLabel: string;

  // ---- bank ----
  sectionBank: string;
  bankToLabel: string;
  bankFromLabel: string;

  // ---- more (remark) ----
  sectionMore: string;
  remarkLabel: string;
  remarkEmpty: string;

  // ---- references table ----
  referencesHeading: string;
  referencesEmpty: string;
  rDocType: string;
  rReference: string;
  rAllocated: string;

  // ---- actions ----
  actionsHeading: string;
  actionPayAgain: string;
  actionDashboard: string;
  actionHome: string;

  // ---- error / calm states ----
  errorTitle: string;
  errorMissingTitle: string;
  errorMissingHint: string;
  errorNotFoundTitle: string;
  errorNotFoundHint: string;
  errorNotOwnerTitle: string;
  errorNotOwnerHint: string;
  errorSessionTitle: string;
  errorSessionHint: string;
  errorGenericHint: string;
  backToPaymentEntry: string;
  dashboardOverview: string;
  signInAgain: string;
  retry: string;
}

export const paymentSuccessCopy: Record<"bn" | "en", PaymentSuccessCopy> = {
  bn: {
    crumbDashboard: "ড্যাশবোর্ড",
    crumbPaymentEntry: "পেমেন্ট এন্ট্রি",
    crumbSuccess: "পেমেন্ট সফল",

    loadingTitle: "পেমেন্টের তথ্য লোড হচ্ছে…",
    loadingHint: "আপনার Payment Entry আনা হচ্ছে।",

    heroEyebrow: "পেমেন্ট রেকর্ড হয়েছে",
    heroTitle: "পেমেন্ট এন্ট্রি সফলভাবে তৈরি হয়েছে",
    heroBodyDraft:
      "আপনার Payment Entry ড্রাফট হিসেবে রেকর্ড হয়েছে। এটি এখনো সাবমিট হয়নি — যাচাই শেষ হলে সাবমিট হবে।",
    heroBodyRecorded: "আপনার পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে।",
    draftNote: "ড্রাফট — এখনো সাবমিট হয়নি",
    verifiedLabel: "যাচাইকৃত",

    sectionPayment: "পেমেন্ট সারসংক্ষেপ",
    idLabel: "পেমেন্ট এন্ট্রি আইডি",
    statusLabel: "স্ট্যাটাস",
    amountLabel: "পরিমাণ",
    currencyLabel: "মুদ্রা",
    methodLabel: "পরিশোধের মাধ্যম",
    typeLabel: "পেমেন্ট টাইপ",
    dateLabel: "পোস্টিং তারিখ",
    companyLabel: "প্রতিষ্ঠান",
    customerLabel: "কাস্টমার",

    sectionReference: "লেনদেন / রেফারেন্স",
    referenceNoLabel: "রেফারেন্স নম্বর",
    referenceDateLabel: "রেফারেন্স তারিখ",

    sectionBank: "ব্যাংক বিবরণ",
    bankToLabel: "যে অ্যাকাউন্টে জমা",
    bankFromLabel: "যে অ্যাকাউন্ট থেকে",

    sectionMore: "অতিরিক্ত তথ্য",
    remarkLabel: "মন্তব্য",
    remarkEmpty: "কোনো মন্তব্য নেই।",

    referencesHeading: "রেফারেন্স সারি",
    referencesEmpty: "কোনো রেফারেন্স সংযুক্ত নেই।",
    rDocType: "ডকটাইপ",
    rReference: "রেফারেন্স",
    rAllocated: "বরাদ্দ",

    actionsHeading: "পরবর্তী কী করবেন",
    actionPayAgain: "আবার পেমেন্ট করুন",
    actionDashboard: "ড্যাশবোর্ড ওভারভিউ",
    actionHome: "হোমে যান",

    errorTitle: "এই পেমেন্ট দেখানো যাচ্ছে না",
    errorMissingTitle: "কোনো পেমেন্ট আইডি দেওয়া হয়নি",
    errorMissingHint: "সঠিক Payment Entry আইডি নিয়ে লিংকটি আবার খুলুন।",
    errorNotFoundTitle: "এই পেমেন্টটি খুঁজে পাওয়া যায়নি",
    errorNotFoundHint: "সম্ভবত এটি মুছে ফেলা হয়েছে, অথবা আইডিটি সঠিক নয়।",
    errorNotOwnerTitle: "এই পেমেন্ট দেখার অনুমতি আপনার নেই",
    errorNotOwnerHint: "এই পেমেন্টটি আপনার অ্যাকাউন্টের নয়।",
    errorSessionTitle: "সেশনের মেয়াদ শেষ হয়েছে",
    errorSessionHint: "অনুগ্রহ করে আবার সাইন ইন করুন।",
    errorGenericHint: "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",
    backToPaymentEntry: "পেমেন্ট এন্ট্রিতে ফিরুন",
    dashboardOverview: "ড্যাশবোর্ড ওভারভিউ",
    signInAgain: "আবার সাইন ইন করুন",
    retry: "আবার চেষ্টা করুন",
  },
  en: {
    crumbDashboard: "Dashboard",
    crumbPaymentEntry: "Payment Entry",
    crumbSuccess: "Payment Successful",

    loadingTitle: "Loading payment details…",
    loadingHint: "Fetching your Payment Entry.",

    heroEyebrow: "Payment recorded",
    heroTitle: "Payment Entry created successfully",
    heroBodyDraft:
      "Your Payment Entry was recorded as a Draft. It has not been submitted yet — it will be submitted once verified.",
    heroBodyRecorded: "Your payment has been recorded successfully.",
    draftNote: "Draft — not yet submitted",
    verifiedLabel: "Verified",

    sectionPayment: "Payment summary",
    idLabel: "Payment Entry ID",
    statusLabel: "Status",
    amountLabel: "Amount",
    currencyLabel: "Currency",
    methodLabel: "Mode of Payment",
    typeLabel: "Payment Type",
    dateLabel: "Posting Date",
    companyLabel: "Company",
    customerLabel: "Customer",

    sectionReference: "Transaction / Reference",
    referenceNoLabel: "Reference No",
    referenceDateLabel: "Reference Date",

    sectionBank: "Bank details",
    bankToLabel: "Credited to",
    bankFromLabel: "Paid from",

    sectionMore: "More information",
    remarkLabel: "Remarks",
    remarkEmpty: "No remarks.",

    referencesHeading: "Reference rows",
    referencesEmpty: "No reference rows linked.",
    rDocType: "DocType",
    rReference: "Reference",
    rAllocated: "Allocated",

    actionsHeading: "What's next",
    actionPayAgain: "Make Another Payment",
    actionDashboard: "Dashboard Overview",
    actionHome: "Go to Home",

    errorTitle: "Unable to show this payment",
    errorMissingTitle: "No payment id was provided",
    errorMissingHint: "Open the link again with a valid Payment Entry id.",
    errorNotFoundTitle: "This payment could not be found",
    errorNotFoundHint: "It may have been removed, or the id is incorrect.",
    errorNotOwnerTitle: "You are not permitted to view this payment",
    errorNotOwnerHint: "This payment does not belong to your account.",
    errorSessionTitle: "Your session has expired",
    errorSessionHint: "Please sign in again.",
    errorGenericHint: "Something went wrong. Please try again.",
    backToPaymentEntry: "Back to Payment Entry",
    dashboardOverview: "Dashboard Overview",
    signInAgain: "Sign in again",
    retry: "Try again",
  },
};

export function paymentSuccessCopyFor(language: string): PaymentSuccessCopy {
  return language === "en" ? paymentSuccessCopy.en : paymentSuccessCopy.bn;
}

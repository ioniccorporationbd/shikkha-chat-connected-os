/** Bilingual copy for the customer "Make Payment" (manual + SSLCommerz) flow. */

import type { ManualPaymentStatusKey } from "./types";

export interface ManualPaymentCopy {
  // ---- modal shell ----
  makePayment: string;
  makePaymentSubtitle: string;
  close: string;
  back: string;

  // ---- step 1: payment mode ----
  stepMethodTitle: string;
  stepMethodSubtitle: string;
  onlineTitle: string;
  onlineDesc: string;
  onlineBadge: string;
  onlineInfoTitle: string;
  onlineInfoBody: string;
  manualTitle: string;
  manualDesc: string;

  // ---- step 1b: online (SSLCommerz) ----
  sslcommerzTitle: string;
  sslcommerzDesc: string;
  sslcommerzBadge: string;
  sslcommerzStepTitle: string;
  sslcommerzStepSubtitle: string;
  sslAmountLabel: string;
  sslAmountPlaceholder: string;
  sslAmountHint: string;
  sslPayWith: string;
  sslRedirecting: string;
  sslEnvironmentNote: string;
  sslResultSuccessTitle: string;
  sslResultSuccessBody: string;
  sslResultFailTitle: string;
  sslResultFailBody: string;
  sslResultCancelTitle: string;
  sslResultCancelBody: string;

  // ---- step 2: manual method ----
  stepManualTitle: string;
  stepManualSubtitle: string;
  methodBkash: string;
  methodRocket: string;
  methodNagad: string;
  methodBank: string;
  methodBkashDesc: string;
  methodRocketDesc: string;
  methodNagadDesc: string;
  methodBankDesc: string;

  // ---- shared payment form ----
  formTitleBkash: string;
  formTitleRocket: string;
  formTitleNagad: string;
  formTitleBank: string;
  amountLabel: string;
  amountPlaceholder: string;
  amountHint: string;
  senderMobileLabel: string;
  senderMobilePlaceholder: string;
  senderMobileHint: string;
  transactionIdLabel: string;
  transactionIdPlaceholder: string;
  transactionIdHint: string;
  paymentDateLabel: string;
  paymentDateHint: string;
  proofLabel: string;
  proofHint: string;
  noteLabel: string;
  notePlaceholder: string;
  optional: string;
  submit: string;
  submitting: string;

  // ---- bank ----
  bankSelectLabel: string;
  bankSelectPlaceholder: string;
  bankNoMatch: string;
  bankLoading: string;
  bankEmpty: string;
  bankLoadFailed: string;
  retry: string;
  bankReceiveTitle: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankRouting: string;
  bankInstructions: string;
  bankCopy: string;
  bankCopied: string;
  bankDemoNote: string;
  senderAccountNameLabel: string;
  senderAccountNamePlaceholder: string;
  senderAccountNumberLabel: string;
  senderAccountNumberPlaceholder: string;
  bankReferenceLabel: string;
  bankReferencePlaceholder: string;
  receiptLabel: string;

  // ---- proof upload ----
  uploadChoose: string;
  uploadDrop: string;
  uploadTypes: string;
  uploadReplace: string;
  uploadRemove: string;
  uploadPreviewAlt: string;
  uploadErrType: string;
  uploadErrSize: string;

  // ---- validation ----
  errAmount: string;
  errMobile: string;
  errTransactionId: string;
  errDate: string;
  errFutureDate: string;
  errProof: string;
  errBank: string;
  errReference: string;
  errSenderName: string;
  errSummary: string;

  // ---- success ----
  successTitle: string;
  successBody: string;
  successRef: string;
  successMethod: string;
  successAmount: string;
  successStatus: string;
  successClose: string;
  statuses: Record<ManualPaymentStatusKey, string>;

  // ---- failure ----
  submitFailed: string;
}

export const manualPaymentCopy: Record<"bn" | "en", ManualPaymentCopy> = {
  bn: {
    makePayment: "পেমেন্ট করুন",
    makePaymentSubtitle: "পেমেন্টের তথ্য দিন — আপনার Payment Entry তৈরি হয়ে পেমেন্ট হিস্টোরিতে দেখা যাবে।",
    close: "বন্ধ করুন",
    back: "পূর্ববর্তী",

    stepMethodTitle: "পেমেন্ট করার ধরন বাছুন",
    stepMethodSubtitle: "কীভাবে পেমেন্ট করতে চান?",
    onlineTitle: "অনলাইন পেমেন্ট",
    onlineDesc: "কার্ড / ইন্টারনেট ব্যাংকিং দিয়ে সরাসরি পরিশোধ।",
    onlineBadge: "শিগগিরই",
    onlineInfoTitle: "অনলাইন পেমেন্ট শিগগিরই চালু হবে।",
    onlineInfoBody:
      "এই মুহূর্তে অনলাইন গেটওয়ে এখনো চালু হয়নি। অনুগ্রহ করে ম্যানুয়াল পেমেন্ট ব্যবহার করে আপনার পেমেন্টের তথ্য দিন।",
    manualTitle: "ম্যানুয়াল পেমেন্ট",
    manualDesc: "bKash, Rocket, Nagad বা ব্যাংক ট্রান্সফার করে পেমেন্ট রেকর্ড করুন।",

    sslcommerzTitle: "SSLCommerz দিয়ে পরিশোধ",
    sslcommerzDesc: "কার্ড / মোবাইল ব্যাংকিং দিয়ে নিরাপদে অনলাইন পেমেন্ট করুন।",
    sslcommerzBadge: "স্যান্ডবক্স",
    sslcommerzStepTitle: "SSLCommerz অনলাইন পেমেন্ট",
    sslcommerzStepSubtitle: "যে পরিমাণ পরিশোধ করতে চান সেটি লিখুন।",
    sslAmountLabel: "পরিমাণ",
    sslAmountPlaceholder: "যেমন ১০০০",
    sslAmountHint: "আপনি যত টাকা পরিশোধ করতে চান সেটি লিখুন।",
    sslPayWith: "SSLCommerz দিয়ে {amount} পরিশোধ করুন",
    sslRedirecting: "SSLCommerz-এ নিয়ে যাওয়া হচ্ছে…",
    sslEnvironmentNote:
      "এটি SSLCommerz স্যান্ডবক্স — কোনো প্রকৃত টাকা কাটা হবে না। টেস্ট কার্ড ব্যবহার করুন।",
    sslResultSuccessTitle: "পেমেন্ট সফল হয়েছে।",
    sslResultSuccessBody:
      "আপনার পেমেন্ট যাচাই হয়ে Payment Entry তৈরি হয়েছে এবং পেমেন্ট হিস্টোরিতে দেখা যাচ্ছে।",
    sslResultFailTitle: "পেমেন্ট ব্যর্থ হয়েছে।",
    sslResultFailBody: "পেমেন্ট সম্পন্ন হয়নি। কোনো টাকা কাটা হয়নি — আবার চেষ্টা করুন।",
    sslResultCancelTitle: "পেমেন্ট বাতিল হয়েছে।",
    sslResultCancelBody:
      "আপনি পেমেন্ট বাতিল করেছেন। আপনার ফি এখনো পরিশোধযোগ্য — আবার চেষ্টা করতে পারেন।",

    stepManualTitle: "ম্যানুয়াল পেমেন্টের মাধ্যম বাছুন",
    stepManualSubtitle: "যে মাধ্যমে টাকা পাঠিয়েছেন সেটি বেছে নিন।",
    methodBkash: "bKash",
    methodRocket: "Rocket",
    methodNagad: "Nagad",
    methodBank: "ব্যাংক",
    methodBkashDesc: "bKash দিয়ে পাঠানো পেমেন্টের তথ্য দিন।",
    methodRocketDesc: "Rocket দিয়ে পাঠানো পেমেন্টের তথ্য দিন।",
    methodNagadDesc: "Nagad দিয়ে পাঠানো পেমেন্টের তথ্য দিন।",
    methodBankDesc: "ব্যাংক ট্রান্সফারের রিসিট ও তথ্য দিন।",

    formTitleBkash: "bKash পেমেন্ট",
    formTitleRocket: "Rocket পেমেন্ট",
    formTitleNagad: "Nagad পেমেন্ট",
    formTitleBank: "ব্যাংক পেমেন্ট",
    amountLabel: "পরিমাণ",
    amountPlaceholder: "যেমন ৫০০",
    amountHint: "যে পরিমাণ পাঠিয়েছেন সেটি লিখুন।",
    senderMobileLabel: "প্রেরকের মোবাইল নম্বর",
    senderMobilePlaceholder: "01XXXXXXXXX",
    senderMobileHint: "যে নম্বর থেকে পাঠিয়েছেন (১১ ডিজিট)।",
    transactionIdLabel: "ট্রানজেকশন আইডি",
    transactionIdPlaceholder: "যেমন 8N7A2K9QL",
    transactionIdHint: "SMS-এ পাওয়া ট্রানজেকশন আইডি লিখুন।",
    paymentDateLabel: "পেমেন্টের তারিখ",
    paymentDateHint: "আজ বা আগের কোনো তারিখ।",
    proofLabel: "পেমেন্ট প্রমাণ / স্ক্রিনশট",
    proofHint: "JPG, PNG বা WEBP — সর্বোচ্চ ৫ MB।",
    noteLabel: "মন্তব্য",
    notePlaceholder: "অতিরিক্ত কিছু জানাতে চাইলে লিখুন…",
    optional: "ঐচ্ছিক",
    submit: "পেমেন্ট জমা দিন",
    submitting: "জমা হচ্ছে…",

    bankSelectLabel: "ব্যাংক বাছুন",
    bankSelectPlaceholder: "একটি ব্যাংক নির্বাচন করুন",
    bankNoMatch: "এই নামে কোনো ব্যাংক পাওয়া যায়নি।",
    bankLoading: "ব্যাংকের তালিকা লোড হচ্ছে…",
    bankEmpty: "এই মুহূর্তে কোনো সাপোর্টেড ব্যাংক কনফিগার করা নেই।",
    bankLoadFailed: "ব্যাংকের তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।",
    retry: "আবার চেষ্টা করুন",
    bankReceiveTitle: "যে অ্যাকাউন্টে পাঠাবেন",
    bankAccountName: "অ্যাকাউন্টের নাম",
    bankAccountNumber: "অ্যাকাউন্ট নম্বর",
    bankBranch: "শাখা",
    bankRouting: "রাউটিং নম্বর",
    bankInstructions: "নির্দেশনা",
    bankCopy: "কপি",
    bankCopied: "কপি হয়েছে",
    bankDemoNote:
      "এই ব্যাংক তথ্যগুলো ডেমো/প্লেসহোল্ডার — প্রকৃত অ্যাকাউন্ট নয়। প্রকৃত অ্যাকাউন্টে টাকা পাঠানোর আগে নিশ্চিত হয়ে নিন।",
    senderAccountNameLabel: "প্রেরকের অ্যাকাউন্টের নাম",
    senderAccountNamePlaceholder: "যে অ্যাকাউন্ট থেকে পাঠিয়েছেন",
    senderAccountNumberLabel: "প্রেরকের অ্যাকাউন্ট নম্বর",
    senderAccountNumberPlaceholder: "ঐচ্ছিক",
    bankReferenceLabel: "ট্রান্সফার রেফারেন্স",
    bankReferencePlaceholder: "ব্যাংকের রেফারেন্স / TrxID",
    receiptLabel: "পেমেন্ট রিসিটের ছবি",

    uploadChoose: "ছবি নির্বাচন করুন",
    uploadDrop: "ছবি এখানে টেনে ছাড়ুন বা ক্লিক করুন",
    uploadTypes: "JPG, JPEG, PNG, WEBP · সর্বোচ্চ ৫ MB",
    uploadReplace: "পরিবর্তন করুন",
    uploadRemove: "মুছুন",
    uploadPreviewAlt: "পেমেন্ট প্রমাণের প্রিভিউ",
    uploadErrType: "শুধু JPG, PNG বা WEBP ছবি আপলোড করুন।",
    uploadErrSize: "ছবির আকার ৫ MB-এর কম হতে হবে।",

    errAmount: "সঠিক পরিমাণ লিখুন (০-এর বেশি)।",
    errMobile: "সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।",
    errTransactionId: "ট্রানজেকশন আইডি লিখুন।",
    errDate: "পেমেন্টের তারিখ দিন।",
    errFutureDate: "ভবিষ্যতের তারিখ দেওয়া যাবে না।",
    errProof: "পেমেন্টের প্রমাণের ছবি যোগ করুন।",
    errBank: "একটি ব্যাংক নির্বাচন করুন।",
    errReference: "ট্রান্সফার রেফারেন্স লিখুন।",
    errSenderName: "প্রেরকের অ্যাকাউন্টের নাম লিখুন।",
    errSummary: "কিছু তথ্য সঠিকভাবে পূরণ করুন।",

    successTitle: "পেমেন্ট সফলভাবে রেকর্ড হয়েছে।",
    successBody: "আপনার Payment Entry তৈরি হয়েছে এবং এখন পেমেন্ট হিস্টোরিতে দেখা যাচ্ছে।",
    successRef: "পেমেন্ট আইডি",
    successMethod: "মাধ্যম",
    successAmount: "পরিমাণ",
    successStatus: "স্ট্যাটাস",
    successClose: "ঠিক আছে",
    statuses: {
      draft: "ড্রাফ্ট",
      submitted: "সাবমিটেড",
      paid: "পরিশোধিত",
      reconciled: "রেকনসাইল্ড",
      cancelled: "বাতিল",
      other: "অন্যান্য",
    },

    submitFailed: "পেমেন্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
  },
  en: {
    makePayment: "Make Payment",
    makePaymentSubtitle: "Enter your payment details — a Payment Entry is created and appears in your history.",
    close: "Close",
    back: "Back",

    stepMethodTitle: "Choose how to pay",
    stepMethodSubtitle: "How would you like to pay?",
    onlineTitle: "Online Pay",
    onlineDesc: "Pay directly by card / internet banking.",
    onlineBadge: "Coming soon",
    onlineInfoTitle: "Online payment is coming soon.",
    onlineInfoBody:
      "The online gateway isn't live yet. Please use Manual Pay to record your payment in the meantime.",
    manualTitle: "Manual Pay",
    manualDesc: "Record a payment sent via bKash, Rocket, Nagad or a bank transfer.",

    sslcommerzTitle: "Pay with SSLCommerz",
    sslcommerzDesc: "Pay securely online by card or mobile banking.",
    sslcommerzBadge: "Sandbox",
    sslcommerzStepTitle: "SSLCommerz online payment",
    sslcommerzStepSubtitle: "Enter the amount you want to pay.",
    sslAmountLabel: "Amount",
    sslAmountPlaceholder: "e.g. 1000",
    sslAmountHint: "Enter the amount you want to pay.",
    sslPayWith: "Pay {amount} with SSLCommerz",
    sslRedirecting: "Redirecting to SSLCommerz…",
    sslEnvironmentNote:
      "This is the SSLCommerz sandbox — no real money is charged. Use a test card.",
    sslResultSuccessTitle: "Payment successful",
    sslResultSuccessBody:
      "Your payment was verified, a Payment Entry was created and now appears in your history.",
    sslResultFailTitle: "Payment failed",
    sslResultFailBody: "The payment did not complete. Nothing was charged — please try again.",
    sslResultCancelTitle: "Payment cancelled",
    sslResultCancelBody:
      "You cancelled the payment. Your fee is still payable — you can try again.",

    stepManualTitle: "Choose a manual method",
    stepManualSubtitle: "Pick the method you used to send the money.",
    methodBkash: "bKash",
    methodRocket: "Rocket",
    methodNagad: "Nagad",
    methodBank: "Bank",
    methodBkashDesc: "Record a payment sent with bKash.",
    methodRocketDesc: "Record a payment sent with Rocket.",
    methodNagadDesc: "Record a payment sent with Nagad.",
    methodBankDesc: "Record the receipt and details of a bank transfer.",

    formTitleBkash: "bKash payment",
    formTitleRocket: "Rocket payment",
    formTitleNagad: "Nagad payment",
    formTitleBank: "Bank payment",
    amountLabel: "Amount",
    amountPlaceholder: "e.g. 500",
    amountHint: "Enter the amount you sent.",
    senderMobileLabel: "Sender mobile number",
    senderMobilePlaceholder: "01XXXXXXXXX",
    senderMobileHint: "The 11-digit number you sent from.",
    transactionIdLabel: "Transaction ID",
    transactionIdPlaceholder: "e.g. 8N7A2K9QL",
    transactionIdHint: "Enter the transaction ID from your SMS.",
    paymentDateLabel: "Payment date",
    paymentDateHint: "Today or any earlier date.",
    proofLabel: "Payment proof / screenshot",
    proofHint: "JPG, PNG or WEBP — up to 5 MB.",
    noteLabel: "Note",
    notePlaceholder: "Anything else you'd like us to know…",
    optional: "optional",
    submit: "Submit payment",
    submitting: "Submitting…",

    bankSelectLabel: "Select a bank",
    bankSelectPlaceholder: "Choose a supported bank",
    bankNoMatch: "No bank matches that name.",
    bankLoading: "Loading the bank list…",
    bankEmpty: "No supported bank is configured right now.",
    bankLoadFailed: "The bank list could not be loaded. Please try again.",
    retry: "Try again",
    bankReceiveTitle: "Send to this account",
    bankAccountName: "Account name",
    bankAccountNumber: "Account number",
    bankBranch: "Branch",
    bankRouting: "Routing number",
    bankInstructions: "Instructions",
    bankCopy: "Copy",
    bankCopied: "Copied",
    bankDemoNote:
      "These bank details are demo/placeholder — not a real account. Confirm before sending money to a real account.",
    senderAccountNameLabel: "Sender account name",
    senderAccountNamePlaceholder: "The account you sent from",
    senderAccountNumberLabel: "Sender account number",
    senderAccountNumberPlaceholder: "optional",
    bankReferenceLabel: "Transfer reference",
    bankReferencePlaceholder: "Bank reference / TrxID",
    receiptLabel: "Payment receipt image",

    uploadChoose: "Choose image",
    uploadDrop: "Drag & drop an image here, or click",
    uploadTypes: "JPG, JPEG, PNG, WEBP · up to 5 MB",
    uploadReplace: "Replace",
    uploadRemove: "Remove",
    uploadPreviewAlt: "Payment proof preview",
    uploadErrType: "Upload a JPG, PNG or WEBP image only.",
    uploadErrSize: "The image must be under 5 MB.",

    errAmount: "Enter a valid amount (greater than 0).",
    errMobile: "Enter a valid 11-digit mobile number.",
    errTransactionId: "Enter the transaction ID.",
    errDate: "Enter the payment date.",
    errFutureDate: "The date cannot be in the future.",
    errProof: "Attach the payment proof image.",
    errBank: "Select a bank.",
    errReference: "Enter the transfer reference.",
    errSenderName: "Enter the sender account name.",
    errSummary: "Please correct the highlighted fields.",

    successTitle: "Your payment has been recorded.",
    successBody: "A Payment Entry was created and now appears in your payment history.",
    successRef: "Payment ID",
    successMethod: "Method",
    successAmount: "Amount",
    successStatus: "Status",
    successClose: "Done",
    statuses: {
      draft: "Draft",
      submitted: "Submitted",
      paid: "Paid",
      reconciled: "Reconciled",
      cancelled: "Cancelled",
      other: "Other",
    },

    submitFailed: "The payment could not be submitted. Please try again.",
  },
};

export function manualPaymentCopyFor(language: string): ManualPaymentCopy {
  return language === "en" ? manualPaymentCopy.en : manualPaymentCopy.bn;
}

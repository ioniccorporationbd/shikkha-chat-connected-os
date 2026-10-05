/** Bilingual copy for the customer "Make Payment" (manual) flow. */

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

  // ---- step 2: manual method ----
  stepManualTitle: string;
  stepManualSubtitle: string;
  methodBkash: string;
  methodRocket: string;
  methodBank: string;
  methodBkashDesc: string;
  methodRocketDesc: string;
  methodBankDesc: string;

  // ---- shared payment form ----
  formTitleBkash: string;
  formTitleRocket: string;
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
  successClose: string;

  // ---- manual request history (server-backed) ----
  historyHeading: string;
  historyHint: string;
  historyEmpty: string;
  historyLoading: string;
  historyError: string;
  histColId: string;
  histColMethod: string;
  histColAmount: string;
  histColDate: string;
  histColRef: string;
  histColStatus: string;
  histColSubmitted: string;
  statuses: Record<ManualPaymentStatusKey, string>;
  rejectionReason: string;

  // ---- failure ----
  submitFailed: string;
}

export const manualPaymentCopy: Record<"bn" | "en", ManualPaymentCopy> = {
  bn: {
    makePayment: "পেমেন্ট করুন",
    makePaymentSubtitle: "পেমেন্টের তথ্য জমা দিন, যাচাইয়ের পর আপডেট পাবেন।",
    close: "বন্ধ করুন",
    back: "পূর্ববর্তী",

    stepMethodTitle: "পেমেন্ট করার ধরন বাছুন",
    stepMethodSubtitle: "কীভাবে পেমেন্ট করতে চান?",
    onlineTitle: "অনলাইন পেমেন্ট",
    onlineDesc: "কার্ড / ইন্টারনেট ব্যাংকিং দিয়ে সরাসরি পরিশোধ।",
    onlineBadge: "শিগগিরই",
    onlineInfoTitle: "অনলাইন পেমেন্ট শিগগিরই চালু হবে।",
    onlineInfoBody:
      "এই মুহূর্তে অনলাইন গেটওয়ে এখনো চালু হয়নি। অনুগ্রহ করে ম্যানুয়াল পেমেন্ট ব্যবহার করে আপনার পেমেন্টের প্রমাণ জমা দিন।",
    manualTitle: "ম্যানুয়াল পেমেন্ট",
    manualDesc: "bKash, Rocket বা ব্যাংক ট্রান্সফার করে প্রমাণ জমা দিন।",

    stepManualTitle: "ম্যানুয়াল পেমেন্টের মাধ্যম বাছুন",
    stepManualSubtitle: "যে মাধ্যমে টাকা পাঠিয়েছেন সেটি বেছে নিন।",
    methodBkash: "bKash",
    methodRocket: "Rocket",
    methodBank: "ব্যাংক",
    methodBkashDesc: "bKash দিয়ে পাঠানো পেমেন্টের প্রমাণ দিন।",
    methodRocketDesc: "Rocket দিয়ে পাঠানো পেমেন্টের প্রমাণ দিন।",
    methodBankDesc: "ব্যাংক ট্রান্সফারের রিসিট ও তথ্য দিন।",

    formTitleBkash: "bKash পেমেন্ট",
    formTitleRocket: "Rocket পেমেন্ট",
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

    successTitle: "পেমেন্ট রিকোয়েস্ট জমা হয়েছে।",
    successBody: "সার্ভারে সংরক্ষিত হয়েছে। যাচাইয়ের পর আপডেট জানানো হবে।",
    successRef: "রিকোয়েস্ট আইডি",
    successMethod: "মাধ্যম",
    successAmount: "পরিমাণ",
    successClose: "ঠিক আছে",

    historyHeading: "ম্যানুয়াল পেমেন্ট রিকোয়েস্ট",
    historyHint: "আপনার জমা দেওয়া পেমেন্ট রিকোয়েস্ট — অ্যাডমিন যাচাই করলে স্ট্যাটাস আপডেট হবে।",
    historyEmpty: "এখনো কোনো ম্যানুয়াল পেমেন্ট রিকোয়েস্ট জমা দেওয়া হয়নি।",
    historyLoading: "রিকোয়েস্ট লোড হচ্ছে…",
    historyError: "পেমেন্ট রিকোয়েস্ট লোড করা যায়নি।",
    histColId: "রিকোয়েস্ট আইডি",
    histColMethod: "মাধ্যম",
    histColAmount: "পরিমাণ",
    histColDate: "পেমেন্টের তারিখ",
    histColRef: "ট্রানজেকশন / রেফারেন্স",
    histColStatus: "স্ট্যাটাস",
    histColSubmitted: "জমা দেওয়ার সময়",
    statuses: {
      pending: "যাচাইয়ের অপেক্ষায়",
      verified: "যাচাইকৃত",
      rejected: "বাতিল করা হয়েছে",
      cancelled: "বাতিল",
    },
    rejectionReason: "কারণ",

    submitFailed: "পেমেন্ট রিকোয়েস্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
  },
  en: {
    makePayment: "Make Payment",
    makePaymentSubtitle: "Submit your payment details; you'll be updated after verification.",
    close: "Close",
    back: "Back",

    stepMethodTitle: "Choose how to pay",
    stepMethodSubtitle: "How would you like to pay?",
    onlineTitle: "Online Pay",
    onlineDesc: "Pay directly by card / internet banking.",
    onlineBadge: "Coming soon",
    onlineInfoTitle: "Online payment is coming soon.",
    onlineInfoBody:
      "The online gateway isn't live yet. Please use Manual Pay to submit your payment proof in the meantime.",
    manualTitle: "Manual Pay",
    manualDesc: "Send via bKash, Rocket or a bank transfer and submit the proof.",

    stepManualTitle: "Choose a manual method",
    stepManualSubtitle: "Pick the method you used to send the money.",
    methodBkash: "bKash",
    methodRocket: "Rocket",
    methodBank: "Bank",
    methodBkashDesc: "Submit proof of a payment sent with bKash.",
    methodRocketDesc: "Submit proof of a payment sent with Rocket.",
    methodBankDesc: "Submit the receipt and details of a bank transfer.",

    formTitleBkash: "bKash payment",
    formTitleRocket: "Rocket payment",
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

    successTitle: "Payment request submitted.",
    successBody: "It has been saved on the server. You'll be updated once it is verified.",
    successRef: "Request ID",
    successMethod: "Method",
    successAmount: "Amount",
    successClose: "Done",

    historyHeading: "Manual Payment Requests",
    historyHint: "Your submitted payment requests — the status updates once an admin verifies them.",
    historyEmpty: "No manual payment request has been submitted yet.",
    historyLoading: "Loading requests…",
    historyError: "The payment requests could not be loaded.",
    histColId: "Request ID",
    histColMethod: "Method",
    histColAmount: "Amount",
    histColDate: "Payment date",
    histColRef: "Transaction / Reference",
    histColStatus: "Status",
    histColSubmitted: "Submitted at",
    statuses: {
      pending: "Pending verification",
      verified: "Verified",
      rejected: "Rejected",
      cancelled: "Cancelled",
    },
    rejectionReason: "Reason",

    submitFailed: "The payment request could not be submitted. Please try again.",
  },
};

export function manualPaymentCopyFor(language: string): ManualPaymentCopy {
  return language === "en" ? manualPaymentCopy.en : manualPaymentCopy.bn;
}

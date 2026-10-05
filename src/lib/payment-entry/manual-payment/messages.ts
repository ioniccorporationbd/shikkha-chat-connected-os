/** Bilingual copy for the customer "Make Payment" (manual) flow. */

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

  // ---- pending (local) submissions ----
  pendingHeading: string;
  pendingHint: string;
  pendingLocal: string;
  pendingProof: string;
  statusPending: string;

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
    bankReceiveTitle: "যে অ্যাকাউন্টে পাঠাবেন",
    bankAccountName: "অ্যাকাউন্টের নাম",
    bankAccountNumber: "অ্যাকাউন্ট নম্বর",
    bankBranch: "শাখা",
    bankRouting: "রাউটিং নম্বর",
    bankInstructions: "নির্দেশনা",
    bankCopy: "কপি",
    bankCopied: "কপি হয়েছে",
    bankDemoNote:
      "এই ব্যাংক তথ্যগুলো ডেমো/প্লেসহোল্ডার — প্রকৃত অ্যাকাউন্ট নয়। সার্ভার কনফিগ থেকে লোড হওয়ার আগ পর্যন্ত ব্যবহার করা যাবে না।",
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

    successTitle: "পেমেন্ট তথ্য জমা হয়েছে।",
    successBody: "যাচাইয়ের পর আপডেট জানানো হবে।",
    successRef: "রেফারেন্স আইডি",
    successMethod: "মাধ্যম",
    successAmount: "পরিমাণ",
    successClose: "ঠিক আছে",

    pendingHeading: "যাচাইয়ের অপেক্ষায়",
    pendingHint: "আপনার জমা দেওয়া পেমেন্ট রিকোয়েস্ট — অ্যাডমিন যাচাই করলে আপডেট হবে।",
    pendingLocal: "স্থানীয়ভাবে সংরক্ষিত (সার্ভার যাচাই বাকি)",
    pendingProof: "প্রমাণ সংযুক্ত",
    statusPending: "যাচাইয়ের অপেক্ষায়",

    submitFailed: "পেমেন্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
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
    bankReceiveTitle: "Send to this account",
    bankAccountName: "Account name",
    bankAccountNumber: "Account number",
    bankBranch: "Branch",
    bankRouting: "Routing number",
    bankInstructions: "Instructions",
    bankCopy: "Copy",
    bankCopied: "Copied",
    bankDemoNote:
      "These bank details are demo/placeholder — not a real account. They can't be used until loaded from server config.",
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

    successTitle: "Payment details submitted.",
    successBody: "You'll be updated once it is verified.",
    successRef: "Reference ID",
    successMethod: "Method",
    successAmount: "Amount",
    successClose: "Done",

    pendingHeading: "Pending verification",
    pendingHint: "Your submitted payment requests — updated once verified by an admin.",
    pendingLocal: "Saved locally (server verification pending)",
    pendingProof: "Proof attached",
    statusPending: "Pending verification",

    submitFailed: "The payment could not be submitted. Please try again.",
  },
};

export function manualPaymentCopyFor(language: string): ManualPaymentCopy {
  return language === "en" ? manualPaymentCopy.en : manualPaymentCopy.bn;
}

/** Bilingual copy for the self-service registration surface (button, form, OTP step). */

import { looksTechnical } from "@/lib/auth/sanitize";

export interface RegisterCopy {
  /** Home-page / sidebar button label. */
  button: string;
  panelTitle: string;
  panelSubtitle: string;

  stepLabel: string; // "ধাপ {n}/২"

  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;

  sendOtp: string;
  sendingOtp: string;
  verify: string;
  verifying: string;

  otpTitle: string;
  otpHint: string; // "আমরা <email> এবং <mobile> এ কোড পাঠিয়েছি"
  otpTtl: string; // "কোডটি আর <m:ss> মিনিট সক্রিয়"
  otpLabel: string;
  otpPlaceholder: string;
  resend: string;
  resendWait: string; // "আবার পাঠান (<s>s)"
  changeDetails: string;

  haveAccount: string;
  newHere: string;
  signIn: string;
  backHome: string;
  needHelp: string;

  availabilityChecking: string;
  emailTaken: string;
  mobileTaken: string;
  smsNotSent: string;
  emailNotSent: string;
  otpSentNotice: string;

  errors: {
    validation_error: string;
    rate_limited: string;
    upstream_error: string;
    upstream_unreachable: string;
    not_configured: string;
    no_session: string;
    network_error: string;
    empty_response: string;
    delivery_failed: string;
  };
}

export const registerCopy: Record<"bn" | "en", RegisterCopy> = {
  bn: {
    button: "রেজিস্ট্রেশন",
    panelTitle: "নতুন অ্যাকাউন্ট খুলুন",
    panelSubtitle: "নাম, ইমেইল ও মোবাইল নম্বর দিয়ে নিজেই অ্যাকাউন্ট তৈরি করুন।",
    stepLabel: "ধাপ {n}/২",
    nameLabel: "পূর্ণ নাম",
    namePlaceholder: "আপনার নাম",
    emailLabel: "ইমেইল",
    emailPlaceholder: "you@example.com",
    mobileLabel: "মোবাইল নম্বর",
    mobilePlaceholder: "01XXXXXXXXX",
    passwordLabel: "পাসওয়ার্ড",
    passwordPlaceholder: "কমপক্ষে ৬ অক্ষর",
    showPassword: "পাসওয়ার্ড দেখান",
    hidePassword: "পাসওয়ার্ড লুকান",
    sendOtp: "OTP পাঠান",
    sendingOtp: "পাঠানো হচ্ছে…",
    verify: "যাচাই করে অ্যাকাউন্ট খুলুন",
    verifying: "যাচাই করা হচ্ছে…",
    otpTitle: "OTP যাচাই করুন",
    otpHint: "আমরা {target} ঠিকানায় একটি ৬ ডিজিটের কোড পাঠিয়েছি।",
    otpTtl: "কোডটি আর {time} সক্রিয় থাকবে।",
    otpLabel: "OTP কোড",
    otpPlaceholder: "৬ ডিজিটের কোড",
    resend: "আবার কোড পাঠান",
    resendWait: "আবার পাঠান ({s}s)",
    changeDetails: "তথ্য বদলান",
    haveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    newHere: "নতুন ব্যবহারকারী?",
    signIn: "লগইন করুন",
    backHome: "হোমে ফিরে যান",
    needHelp: "সমস্যা হলে আপনার প্রতিষ্ঠানের অ্যাডমিনের সাথে যোগাযোগ করুন।",
    availabilityChecking: "যাচাই করা হচ্ছে…",
    emailTaken: "এই ইমেইল আগেই নেওয়া হয়েছে।",
    mobileTaken: "এই মোবাইল নম্বর আগেই নেওয়া হয়েছে।",
    smsNotSent: "মোবাইলে SMS পাঠানো যায়নি — কোডটি ইমেইলে পাঠানো হয়েছে।",
    emailNotSent: "ইমেইলে পাঠানো যায়নি — কোডটি মোবাইলে SMS-এ পাঠানো হয়েছে।",
    otpSentNotice: "আপনার কোড পাঠানো হয়েছে।",
    errors: {
      validation_error: "আবার লিখে চেষ্টা করুন।",
      rate_limited: "অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।",
      upstream_error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      upstream_unreachable: "ERP সার্ভারে পৌঁছানো যাচ্ছে না। আবার চেষ্টা করুন।",
      not_configured: "পোর্টালের সাথে এখনো ERP যুক্ত হয়নি। অ্যাডমিনকে জানান।",
      no_session: "অ্যাকাউন্ট তৈরি হয়েছে কিন্তু সেশন পাওয়া যায়নি। লগইন করুন।",
      network_error: "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      empty_response: "সার্ভার খালি উত্তর দিয়েছে। আবার চেষ্টা করুন।",
      delivery_failed: "OTP পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
    },
  },
  en: {
    button: "Register",
    panelTitle: "Create a new account",
    panelSubtitle: "Sign yourself up with your name, email and mobile number.",
    stepLabel: "Step {n}/2",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    mobileLabel: "Mobile number",
    mobilePlaceholder: "01XXXXXXXXX",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    showPassword: "Show password",
    hidePassword: "Hide password",
    sendOtp: "Send OTP",
    sendingOtp: "Sending…",
    verify: "Verify & create account",
    verifying: "Verifying…",
    otpTitle: "Verify your OTP",
    otpHint: "We sent a 6-digit code to {target}.",
    otpTtl: "The code stays valid for another {time}.",
    otpLabel: "OTP code",
    otpPlaceholder: "6-digit code",
    resend: "Resend code",
    resendWait: "Resend in {s}s",
    changeDetails: "Change details",
    haveAccount: "Already have an account?",
    newHere: "New here?",
    signIn: "Sign in",
    backHome: "Back to home",
    needHelp: "Need help? Contact your organisation's administrator.",
    availabilityChecking: "Checking…",
    emailTaken: "That email is already registered.",
    mobileTaken: "That mobile number is already registered.",
    smsNotSent: "We could not send the SMS — the code went to your email instead.",
    emailNotSent: "We could not send the email — the code went to your mobile by SMS instead.",
    otpSentNotice: "A code has been sent to you.",
    errors: {
      validation_error: "Please review the form and try again.",
      rate_limited: "Too many attempts. Please wait a few minutes and try again.",
      upstream_error: "The server ran into a problem. Please try again.",
      upstream_unreachable: "The ERP server could not be reached. Please try again.",
      not_configured: "The portal is not connected to an ERP yet. Please contact an administrator.",
      no_session: "Your account was created but no session was returned. Please sign in.",
      network_error: "Network problem. Please try again.",
      empty_response: "The server returned an empty response. Please try again.",
      delivery_failed: "We could not send the OTP. Please try again in a moment.",
    },
  },
};

export function registerCopyFor(language: string): RegisterCopy {
  return registerCopy[language === "en" ? "en" : "bn"];
}

/**
 * Registration errors prefer the backend's own message (it is specific and
 * already localized), falling back to canned copy for transport-level failures
 * where the backend message is not user-facing.
 */
const CANNED_CODES = new Set([
  "rate_limited",
  "upstream_error",
  "upstream_unreachable",
  "not_configured",
  "no_session",
  "network_error",
  "empty_response",
  "delivery_failed",
]);

export function registerErrorMessage(
  language: string,
  code: string,
  fallback: string
): string {
  const copy = registerCopyFor(language);
  const message = (fallback ?? "").trim();

  if (code in copy.errors && CANNED_CODES.has(code)) {
    return copy.errors[code as keyof RegisterCopy["errors"]];
  }

  // Never surface a raw technical string — only human-readable backend copy.
  if (message && !looksTechnical(message)) return message;

  return copy.errors.validation_error;
}

export function registerStepLabel(language: string, step: number): string {
  return registerCopyFor(language).stepLabel.replace("{n}", String(step));
}

/** Bilingual copy for the auth surface (sidebar button, login page). */

export interface AuthCopy {
  signIn: string;
  signedInAs: string;
  openDashboard: string;
  panelTitle: string;
  panelSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  submitting: string;
  backHome: string;
  needHelp: string;
  expiredNotice: string;

  /** Two-step sign-in: email/mobile + password -> one-time code. */
  stepLabel: string; // "ধাপ {n}/২"
  identifierStepTitle: string;
  passwordStepTitle: string;
  otpStepTitle: string;
  identifierStepHint: string;
  passwordStepHint: string;
  next: string;
  backToIdentifier: string;
  backToPassword: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  sendOtp: string;
  sendingOtp: string;
  otpLabel: string;
  otpPlaceholder: string;
  verifyOtp: string;
  verifyingOtp: string;
  otpHint: string; // "আমরা {target} এ কোড পাঠিয়েছি"
  otpTtl: string; // "কোডটি আর {time} সক্রিয়"
  resend: string;
  resendWait: string; // "আবার পাঠান ({s}s)"
  changeIdentifier: string;
  smsNotSent: string;
  emailNotSent: string;

  /** Forgot-password flow. */
  forgotPassword: string; // link on the main sign-in form
  forgotTitle: string;
  forgotHint: string;
  forgotIdentifierLabel: string;
  forgotIdentifierPlaceholder: string;
  forgotSend: string;
  forgotSending: string;
  forgotOtpTitle: string;
  forgotOtpHint: string; // "আমরা {target} এ কোড পাঠিয়েছি"
  forgotVerify: string;
  forgotVerifying: string;
  forgotResend: string;
  forgotResendWait: string; // "আবার পাঠান ({s}s)"
  forgotChangeIdentifier: string;
  forgotBackToLogin: string;
  forgotSuccessTitle: string;
  forgotSuccessBody: string; // "আপনার নতুন ৬ ডিজিটের পাসওয়ার্ড {target} এ পাঠানো হয়েছে।"
  forgotReturnToLogin: string;
  resetNotice: string; // banner on the sign-in form after a reset

  /** Copy for the account dropdown on the signed-in user's name. */
  userMenu: {
    open: string;
    profile: string;
    accountType: string;
    systemUser: string;
    websiteUser: string;
    roles: string;
    dashboard: string;
    signOut: string;
    signingOut: string;
  };
  errors: {
    validation_error: string;
    not_authenticated: string;
    rate_limited: string;
    upstream_error: string;
    upstream_unreachable: string;
    not_configured: string;
    no_session: string;
    network_error: string;
    empty_response: string;
  };
}

export const authCopy: Record<"bn" | "en", AuthCopy> = {
  bn: {
    signIn: "লগইন",
    signedInAs: "লগইন করা আছে",
    openDashboard: "ড্যাশবোর্ড",
    panelTitle: "শিক্ষা চ্যাট প্যানেলে লগইন করুন",
    panelSubtitle: "আপনার অ্যাকাউন্ট দিয়ে সাইন ইন করে ড্যাশবোর্ডে যান।",
    emailLabel: "ইমেইল",
    emailPlaceholder: "you@example.com",
    passwordLabel: "পাসওয়ার্ড",
    passwordPlaceholder: "পাসওয়ার্ড লিখুন",
    showPassword: "পাসওয়ার্ড দেখান",
    hidePassword: "পাসওয়ার্ড লুকান",
    submit: "সাইন ইন করুন",
    submitting: "সাইন ইন করা হচ্ছে…",
    backHome: "হোমে ফিরে যান",
    needHelp: "লগইন করতে সমস্যা হলে আপনার প্রতিষ্ঠানের অ্যাডমিনের সাথে যোগাযোগ করুন।",
    expiredNotice: "আপনার সেশন শেষ হয়ে গেছে। আবার সাইন ইন করুন।",
    stepLabel: "ধাপ {n}/২",
    identifierStepTitle: "লগইন করুন",
    passwordStepTitle: "পাসওয়ার্ড দিন",
    otpStepTitle: "OTP যাচাই করুন",
    identifierStepHint: "ইমেইল বা মোবাইল নম্বর দিয়ে শুরু করুন।",
    passwordStepHint: "পাসওয়ার্ড যাচাইয়ের পর আপনার ইমেইল ও মোবাইলে একটি ৬ ডিজিটের কোড পাঠানো হবে।",
    next: "পরবর্তী",
    backToIdentifier: "ইমেইল/মোবাইল বদলান",
    backToPassword: "পাসওয়ার্ড বদলান",
    identifierLabel: "ইমেইল বা মোবাইল নম্বর",
    identifierPlaceholder: "you@example.com অথবা 01XXXXXXXXX",
    sendOtp: "OTP পাঠান",
    sendingOtp: "পাঠানো হচ্ছে…",
    otpLabel: "OTP কোড",
    otpPlaceholder: "৬ ডিজিটের কোড",
    verifyOtp: "যাচাই করে লগইন করুন",
    verifyingOtp: "যাচাই করা হচ্ছে…",
    otpHint: "আমরা {target} ঠিকানায় একটি ৬ ডিজিটের কোড পাঠিয়েছি।",
    otpTtl: "কোডটি আর {time} সক্রিয় থাকবে।",
    resend: "আবার কোড পাঠান",
    resendWait: "আবার পাঠান ({s}s)",
    changeIdentifier: "ইমেইল/মোবাইল বদলান",
    smsNotSent: "মোবাইলে SMS পাঠানো যায়নি — কোডটি ইমেইলে পাঠানো হয়েছে।",
    emailNotSent: "ইমেইলে পাঠানো যায়নি — কোডটি মোবাইলে SMS-এ পাঠানো হয়েছে।",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    forgotTitle: "পাসওয়ার্ড রিসেট করুন",
    forgotHint: "আপনার অ্যাকাউন্টের ইমেইল বা মোবাইল নম্বর দিন — সেখানে একটি যাচাই কোড পাঠানো হবে।",
    forgotIdentifierLabel: "ইমেইল বা মোবাইল নম্বর",
    forgotIdentifierPlaceholder: "you@example.com অথবা 01XXXXXXXXX",
    forgotSend: "রিসেট কোড পাঠান",
    forgotSending: "পাঠানো হচ্ছে…",
    forgotOtpTitle: "কোড যাচাই করুন",
    forgotOtpHint: "আমরা {target} ঠিকানায় একটি ৬ ডিজিটের কোড পাঠিয়েছি।",
    forgotVerify: "যাচাই করুন",
    forgotVerifying: "যাচাই করা হচ্ছে…",
    forgotResend: "আবার কোড পাঠান",
    forgotResendWait: "আবার পাঠান ({s}s)",
    forgotChangeIdentifier: "ইমেইল/মোবাইল বদলান",
    forgotBackToLogin: "লগইনে ফিরে যান",
    forgotSuccessTitle: "নতুন পাসওয়ার্ড পাঠানো হয়েছে",
    forgotSuccessBody: "আপনার নতুন ৬ ডিজিটের পাসওয়ার্ড {target} ঠিকানায় পাঠানো হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।",
    forgotReturnToLogin: "লগইন ফর্মে ফিরে যান",
    resetNotice: "নতুন পাসওয়ার্ড পাঠানো হয়েছে। এখন সেটি দিয়ে লগইন করুন।",
    userMenu: {
      open: "অ্যাকাউন্ট মেনু",
      profile: "প্রোফাইল তথ্য",
      accountType: "অ্যাকাউন্টের ধরন",
      systemUser: "সিস্টেম ইউজার",
      websiteUser: "ওয়েবসাইট ইউজার (ক্লায়েন্ট)",
      roles: "রোল",
      dashboard: "ড্যাশবোর্ড",
      signOut: "লগআউট",
      signingOut: "লগআউট হচ্ছে…",
    },
    errors: {
      validation_error: "ইমেইল ও পাসওয়ার্ড সঠিকভাবে লিখুন।",
      not_authenticated: "ইমেইল বা পাসওয়ার্ড ভুল।",
      rate_limited: "অনেকবার চেষ্টা করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।",
      upstream_error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      upstream_unreachable: "ERP সার্ভারে পৌঁছানো যাচ্ছে না। আবার চেষ্টা করুন।",
      not_configured: "পোর্টালের সাথে এখনো ERP যুক্ত হয়নি। অ্যাডমিনকে জানান।",
      no_session: "ERP কোনো সেশন দেয়নি। আবার চেষ্টা করুন।",
      network_error: "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      empty_response: "সার্ভার খালি উত্তর দিয়েছে। আবার চেষ্টা করুন।",
    },
  },
  en: {
    signIn: "Login",
    signedInAs: "Signed in",
    openDashboard: "Dashboard",
    panelTitle: "Sign in to the Shikkha Chat panel",
    panelSubtitle: "Use your account to continue to your dashboard.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign in",
    submitting: "Signing in…",
    backHome: "Back to home",
    needHelp: "Cannot sign in? Contact your organisation's administrator.",
    expiredNotice: "Your session has expired. Please sign in again.",
    stepLabel: "Step {n}/2",
    identifierStepTitle: "Sign in",
    passwordStepTitle: "Enter your password",
    otpStepTitle: "Verify your OTP",
    identifierStepHint: "Start with the email or mobile number on your account.",
    passwordStepHint: "After we check your password, we will send a 6-digit code to your email and mobile.",
    next: "Next",
    backToIdentifier: "Change email/mobile",
    backToPassword: "Change password",
    identifierLabel: "Email or mobile number",
    identifierPlaceholder: "you@example.com or 01XXXXXXXXX",
    sendOtp: "Send OTP",
    sendingOtp: "Sending…",
    otpLabel: "OTP code",
    otpPlaceholder: "6-digit code",
    verifyOtp: "Verify & sign in",
    verifyingOtp: "Verifying…",
    otpHint: "We sent a 6-digit code to {target}.",
    otpTtl: "The code stays valid for another {time}.",
    resend: "Resend code",
    resendWait: "Resend in {s}s",
    changeIdentifier: "Change email/mobile",
    smsNotSent: "We could not send the SMS — the code went to your email instead.",
    emailNotSent: "We could not send the email — the code went to your mobile by SMS instead.",
    forgotPassword: "Forgot password?",
    forgotTitle: "Reset your password",
    forgotHint: "Enter the email or mobile number on your account — we will send a verification code there.",
    forgotIdentifierLabel: "Email or mobile number",
    forgotIdentifierPlaceholder: "you@example.com or 01XXXXXXXXX",
    forgotSend: "Send reset code",
    forgotSending: "Sending…",
    forgotOtpTitle: "Verify the code",
    forgotOtpHint: "We sent a 6-digit code to {target}.",
    forgotVerify: "Verify",
    forgotVerifying: "Verifying…",
    forgotResend: "Resend code",
    forgotResendWait: "Resend in {s}s",
    forgotChangeIdentifier: "Change email/mobile",
    forgotBackToLogin: "Back to sign in",
    forgotSuccessTitle: "Password sent",
    forgotSuccessBody: "Your new 6-digit password has been sent to {target}. Sign in with the new password.",
    forgotReturnToLogin: "Back to the sign-in form",
    resetNotice: "Your new password has been sent. Sign in with it now.",
    userMenu: {
      open: "Account menu",
      profile: "Profile",
      accountType: "Account type",
      systemUser: "System User",
      websiteUser: "Website User (client)",
      roles: "Roles",
      dashboard: "Dashboard",
      signOut: "Sign out",
      signingOut: "Signing out…",
    },
    errors: {
      validation_error: "Enter your email and password.",
      not_authenticated: "Incorrect email or password.",
      rate_limited: "Too many attempts. Please wait a few minutes and try again.",
      upstream_error: "The server ran into a problem. Please try again.",
      upstream_unreachable: "The ERP server could not be reached. Please try again.",
      not_configured: "The portal is not connected to an ERP yet. Please contact an administrator.",
      no_session: "The ERP did not return a session. Please try again.",
      network_error: "Network problem. Please try again.",
      empty_response: "The server returned an empty response. Please try again.",
    },
  },
};

export function authCopyFor(language: string): AuthCopy {
  return authCopy[language === "en" ? "en" : "bn"];
}

export function authErrorMessage(language: string, code: string, fallback: string): string {
  const copy = authCopyFor(language);
  const message = (fallback ?? "").trim();

  // `validation_error` is a generic bucket: the backend attaches the real,
  // already-localised reason (a bad password, "too many attempts", …). Show
  // that instead of the catch-all credential copy, which otherwise masks the
  // true cause and shows "enter your email and password" for everything.
  if (code === "validation_error" && message) {
    return message;
  }

  const known = copy.errors[code as keyof AuthCopy["errors"]];

  // Unknown code: the backend already produced a human message - show it.
  return known ?? message;
}

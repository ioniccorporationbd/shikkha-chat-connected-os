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
  const known = copy.errors[code as keyof AuthCopy["errors"]];

  // Unknown code: the backend already produced a human message - show it.
  return known ?? fallback;
}

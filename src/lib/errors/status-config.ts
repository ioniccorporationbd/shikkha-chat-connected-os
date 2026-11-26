/**
 * Central configuration for the dynamic error surface.
 *
 * ONE map drives every error page — title, description, tone, icon and the
 * primary/secondary actions. `DynamicError` reads from here so no status
 * condition is ever duplicated across pages (see the task's "duplicate
 * condition spread" rule).
 *
 * Framework-free on purpose: no react-icons / next imports here, so it can be
 * unit-read anywhere. The component maps `icon`/`action` keys to real pieces.
 */

export type ErrorTone = "amber" | "neutral" | "danger" | "info";

/** Keys the component maps to a Feather icon (react-icons/fi). */
export type ErrorIconKey =
  | "alert-circle"
  | "log-in"
  | "credit-card"
  | "shield-off"
  | "search"
  | "clock"
  | "git-merge"
  | "rotate-ccw"
  | "server"
  | "wifi-off";

/** Keys the component maps to a rendered action (link / button). */
export type ErrorActionKey = "home" | "dashboard" | "login" | "back" | "retry";

export interface ErrorCopy {
  /** Short uppercase badge shown above the title (the status, or "!"). */
  code: string;
  title: string;
  description: string;
}

export interface ErrorStatusConfig {
  tone: ErrorTone;
  icon: ErrorIconKey;
  primary: ErrorActionKey;
  secondary?: ErrorActionKey;
  copy: Record<"bn" | "en", ErrorCopy>;
}

/** Unknown / off-spec statuses land here. */
export const ERROR_FALLBACK: ErrorStatusConfig = {
  tone: "neutral",
  icon: "alert-circle",
  primary: "retry",
  secondary: "home",
  copy: {
    bn: {
      code: "!",
      title: "কিছু একটা ঠিক হয়নি",
      description: "অনুরোধটি সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    },
    en: {
      code: "!",
      title: "Something went wrong",
      description: "The request could not be completed. Please try again.",
    },
  },
};

export const ERROR_STATUS_CONFIG: Record<number, ErrorStatusConfig> = {
  400: {
    tone: "amber",
    icon: "alert-circle",
    primary: "back",
    secondary: "home",
    copy: {
      bn: {
        code: "400",
        title: "অনুরোধটি সঠিক নয়",
        description:
          "অনুরোধটি ত্রুটিপূর্ণ বা অসম্পূর্ণ ছিল, তাই সার্ভার তা প্রক্রিয়া করতে পারেনি।",
      },
      en: {
        code: "400",
        title: "Bad request",
        description:
          "The request was malformed or incomplete, so the server could not process it.",
      },
    },
  },
  401: {
    tone: "neutral",
    icon: "log-in",
    primary: "login",
    secondary: "back",
    copy: {
      bn: {
        code: "401",
        title: "লগ ইন প্রয়োজন",
        description: "এই পেজটি দেখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগ ইন করুন।",
      },
      en: {
        code: "401",
        title: "Sign-in required",
        description: "Please sign in to your account to view this page.",
      },
    },
  },
  402: {
    tone: "amber",
    icon: "credit-card",
    primary: "dashboard",
    secondary: "back",
    copy: {
      bn: {
        code: "402",
        title: "পেমেন্ট প্রয়োজন",
        description:
          "এই কাজটি চালিয়ে যেতে একটি পেমেন্ট সম্পন্ন করা প্রয়োজন। ড্যাশবোর্ড থেকে বিস্তারিত দেখুন।",
      },
      en: {
        code: "402",
        title: "Payment required",
        description:
          "A payment is required to continue. Open your dashboard to see the details.",
      },
    },
  },
  403: {
    tone: "danger",
    icon: "shield-off",
    primary: "dashboard",
    secondary: "back",
    copy: {
      bn: {
        code: "403",
        title: "আপনার এই পেজে প্রবেশাধিকার নেই",
        description:
          "এই পেজ বা রিসোর্সটি দেখার অনুমতি আপনার অ্যাকাউন্টে নেই। ড্যাশবোর্ডে ফিরে যান।",
      },
      en: {
        code: "403",
        title: "You don’t have access to this page",
        description:
          "Your account is not permitted to view this page or resource. Head back to your dashboard.",
      },
    },
  },
  404: {
    tone: "info",
    icon: "search",
    primary: "home",
    secondary: "back",
    copy: {
      bn: {
        code: "404",
        title: "পেজটি খুঁজে পাওয়া যায়নি",
        description:
          "আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে। আপনি হোমপেজে ফিরে যেতে পারেন।",
      },
      en: {
        code: "404",
        title: "Page not found",
        description:
          "The page you are looking for doesn’t exist or has been moved. You can head back home.",
      },
    },
  },
  408: {
    tone: "amber",
    icon: "clock",
    primary: "retry",
    secondary: "dashboard",
    copy: {
      bn: {
        code: "408",
        title: "রিকোয়েস্ট টাইম আউট হয়েছে",
        description: "সার্ভার সময়মতো উত্তর দিতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "408",
        title: "Request timed out",
        description: "The server took too long to respond. Please try again.",
      },
    },
  },
  409: {
    tone: "amber",
    icon: "git-merge",
    primary: "retry",
    secondary: "back",
    copy: {
      bn: {
        code: "409",
        title: "ডেটা কনফ্লিক্ট হয়েছে",
        description:
          "আপনার অনুরোধ বর্তমান ডেটার সাথে দ্বন্দ্ব তৈরি করছে। রিফ্রেশ করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "409",
        title: "Data conflict",
        description:
          "Your request conflicts with the current state of the data. Refresh and try again.",
      },
    },
  },
  422: {
    tone: "amber",
    icon: "alert-circle",
    primary: "back",
    secondary: "home",
    copy: {
      bn: {
        code: "422",
        title: "কিছু তথ্য সঠিক নয়",
        description:
          "আপনার দেওয়া কিছু তথ্য যাচাই করা যায়নি। তথ্যগুলো ঠিক করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "422",
        title: "Some details aren’t valid",
        description:
          "Some of the information you submitted could not be validated. Please correct it and try again.",
      },
    },
  },
  429: {
    tone: "amber",
    icon: "rotate-ccw",
    primary: "retry",
    secondary: "back",
    copy: {
      bn: {
        code: "429",
        title: "অনেক বেশি অনুরোধ হয়েছে",
        description: "কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "429",
        title: "Too many requests",
        description: "Please wait a little while and try again.",
      },
    },
  },
  500: {
    tone: "danger",
    icon: "server",
    primary: "retry",
    secondary: "dashboard",
    copy: {
      bn: {
        code: "500",
        title: "সার্ভারে একটি সমস্যা হয়েছে",
        description:
          "আমাদের দিকে একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "500",
        title: "Something went wrong on the server",
        description:
          "An unexpected error occurred on our side. Please try again — if it persists, come back a little later.",
      },
    },
  },
  502: {
    tone: "danger",
    icon: "wifi-off",
    primary: "retry",
    secondary: "dashboard",
    copy: {
      bn: {
        code: "502",
        title: "সার্ভার থেকে সঠিক রেসপন্স পাওয়া যাচ্ছে না",
        description:
          "সার্ভারের সাথে যোগাযোগে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "502",
        title: "Bad gateway",
        description:
          "We couldn’t get a valid response from the server. Please try again.",
      },
    },
  },
  503: {
    tone: "danger",
    icon: "server",
    primary: "retry",
    secondary: "dashboard",
    copy: {
      bn: {
        code: "503",
        title: "সার্ভিস সাময়িকভাবে অনুপলব্ধ",
        description:
          "সার্ভিসটি এই মুহূর্তে রক্ষণাবেক্ষণের কাজ চলছে। অল্পক্ষণ পরে আবার চেষ্টা করুন।",
      },
      en: {
        code: "503",
        title: "Service temporarily unavailable",
        description:
          "The service is temporarily unavailable. Please try again in a few moments.",
      },
    },
  },
  504: {
    tone: "danger",
    icon: "clock",
    primary: "retry",
    secondary: "dashboard",
    copy: {
      bn: {
        code: "504",
        title: "সার্ভার রেসপন্স দিতে দেরি করছে",
        description: "সার্ভার সময়মতো উত্তর দিতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      en: {
        code: "504",
        title: "Gateway timeout",
        description: "The server took too long to respond. Please try again.",
      },
    },
  },
};

/** Legacy `kind` prop -> status, so existing boundaries keep working. */
export type LegacyErrorKind = "not-found" | "server" | "generic";

const KIND_STATUS: Record<LegacyErrorKind, number | undefined> = {
  "not-found": 404,
  server: 500,
  generic: undefined,
};

/**
 * Resolve any of {status, kind} to a config. Unknown statuses fall back to the
 * generic surface, never a blank page.
 */
export function resolveErrorConfig(input: {
  status?: number;
  kind?: LegacyErrorKind;
}): ErrorStatusConfig {
  const status =
    typeof input.status === "number"
      ? input.status
      : input.kind
        ? KIND_STATUS[input.kind]
        : undefined;

  if (typeof status === "number" && ERROR_STATUS_CONFIG[status]) {
    return ERROR_STATUS_CONFIG[status];
  }
  return ERROR_FALLBACK;
}

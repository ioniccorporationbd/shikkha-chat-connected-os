/** Bilingual copy for the Employee Check In / Out surface. */

export interface CheckinCopy {
  heading: string;
  hint: string;
  back: string;
  loading: string;
  loadFailed: string;
  retry: string;
  sessionExpiredTitle: string;
  signInAgain: string;
  /** Permission refusal — a calm, actionable state. */
  permissionTitle: string;
  permissionHint: string;
  /** No Employee record is linked to the account. */
  noEmployeeTitle: string;
  noEmployeeHint: string;
  statusHeading: string;
  checkedIn: string;
  checkedOut: string;
  statusInHint: string;
  statusOutHint: string;
  locationHeading: string;
  locationReady: string;
  locationDenied: string;
  locationUnavailable: string;
  locationRequesting: string;
  captureLocation: string;
  retryLocation: string;
  latitudeLabel: string;
  longitudeLabel: string;
  deviceHeading: string;
  deviceHint: string;
  activityHeading: string;
  lastIn: string;
  lastOut: string;
  none: string;
  checkIn: string;
  checkOut: string;
  working: string;
  refresh: string;
  refreshing: string;
  /** Toast copy. */
  successIn: string;
  successOut: string;
  locationRequired: string;
  locationError: string;
  requestError: string;
  refreshed: string;
}

export const checkinCopy: Record<"bn" | "en", CheckinCopy> = {
  bn: {
    heading: "চেক ইন / আউট",
    hint: "আপনার দৈনিক উপস্থিতি এখানে রেকর্ড করুন।",
    back: "ড্যাশবোর্ডে ফিরুন",
    loading: "চেক-ইন স্ট্যাটাস লোড হচ্ছে…",
    loadFailed: "চেক-ইন স্ট্যাটাস লোড করা যায়নি।",
    retry: "আবার চেষ্টা করুন",
    sessionExpiredTitle: "সেশনের মেয়াদ শেষ",
    signInAgain: "আবার সাইন ইন করুন",
    permissionTitle: "Check In / Out করার অনুমতি নেই",
    permissionHint:
      "আপনার অ্যাকাউন্টে Employee Checkin তৈরি/দেখার অনুমতি দেওয়া নেই। একজন HR অ্যাডমিনের সাথে যোগাযোগ করুন।",
    noEmployeeTitle: "Employee রেকর্ড সংযুক্ত নেই",
    noEmployeeHint:
      "আপনার ইউজার অ্যাকাউন্টের সাথে কোনো Employee রেকর্ড লিংক করা নেই। একজন HR অ্যাডমিনের সাথে যোগাযোগ করুন।",
    statusHeading: "বর্তমান অবস্থা",
    checkedIn: "চেক-ইন করা অবস্থায়",
    checkedOut: "চেক-আউট করা অবস্থায়",
    statusInHint: "Check Out করার জন্য প্রস্তুত।",
    statusOutHint: "Check In করার জন্য প্রস্তুত।",
    locationHeading: "লোকেশন",
    locationReady: "লোকেশন নেওয়া হয়েছে।",
    locationDenied: "লোকেশন পারমিশন দেওয়া হয়নি।",
    locationUnavailable: "লোকেশন পাওয়া যায়নি।",
    locationRequesting: "লোকেশন নেওয়া হচ্ছে…",
    captureLocation: "লোকেশন নিন",
    retryLocation: "আবার নিন",
    latitudeLabel: "অক্ষাংশ",
    longitudeLabel: "দ্রাঘিমাংশ",
    deviceHeading: "ডিভাইস",
    deviceHint: "এই ব্রাউজারের আইডি",
    activityHeading: "সর্বশেষ কার্যক্রম",
    lastIn: "সর্বশেষ চেক ইন",
    lastOut: "সর্বশেষ চেক আউট",
    none: "এখনো নেই",
    checkIn: "চেক ইন করুন",
    checkOut: "চেক আউট করুন",
    working: "অপেক্ষা করুন…",
    refresh: "রিফ্রেশ",
    refreshing: "রিফ্রেশ হচ্ছে…",
    successIn: "সফলভাবে চেক ইন করা হয়েছে।",
    successOut: "সফলভাবে চেক আউট করা হয়েছে।",
    locationRequired: "চালিয়ে যেতে লোকেশন পারমিশন প্রয়োজন।",
    locationError: "আপনার বর্তমান লোকেশন পাওয়া যায়নি।",
    requestError: "চেক-ইন অনুরোধ সম্পন্ন করা যায়নি।",
    refreshed: "স্ট্যাটাস হালনাগাদ হয়েছে।",
  },
  en: {
    heading: "Check In / Out",
    hint: "Record your daily attendance here.",
    back: "Back to dashboard",
    loading: "Loading your check-in status…",
    loadFailed: "The check-in status could not be loaded.",
    retry: "Try again",
    sessionExpiredTitle: "Your session has expired",
    signInAgain: "Sign in again",
    permissionTitle: "No permission to check in or out",
    permissionHint:
      "Your account is missing the Employee Checkin read/create permission. Ask an HR administrator to grant it.",
    noEmployeeTitle: "No Employee record linked",
    noEmployeeHint:
      "No Employee record is linked to your user account. Please contact an HR administrator.",
    statusHeading: "Current status",
    checkedIn: "Checked In",
    checkedOut: "Checked Out",
    statusInHint: "You are ready to check out.",
    statusOutHint: "You are ready to check in.",
    locationHeading: "Location",
    locationReady: "Location captured.",
    locationDenied: "Location permission was not granted.",
    locationUnavailable: "Location could not be captured.",
    locationRequesting: "Getting your location…",
    captureLocation: "Get location",
    retryLocation: "Retry",
    latitudeLabel: "Latitude",
    longitudeLabel: "Longitude",
    deviceHeading: "Device",
    deviceHint: "This browser's id",
    activityHeading: "Last activity",
    lastIn: "Last check in",
    lastOut: "Last check out",
    none: "None yet",
    checkIn: "Check In",
    checkOut: "Check Out",
    working: "Please wait…",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    successIn: "Successfully checked in.",
    successOut: "Successfully checked out.",
    locationRequired: "Location permission is required to continue.",
    locationError: "Unable to get your current location.",
    requestError: "Unable to complete the check-in request.",
    refreshed: "Status refreshed.",
  },
};

export function checkinCopyFor(language: string): CheckinCopy {
  return checkinCopy[language === "en" ? "en" : "bn"];
}

/** Bilingual copy for the self-service profile surfaces (edit + password). */

export interface ProfileCopy {
  /** Account-dropdown action labels. */
  menuEdit: string;
  menuPassword: string;
  menuRefresh: string;

  editTitle: string;
  editSubtitle: string;
  passwordTitle: string;
  passwordSubtitle: string;

  save: string;
  saving: string;
  update: string;
  updating: string;
  cancel: string;
  close: string;
  loading: string;

  savedTitle: string;
  saved: string;
  passwordChangedTitle: string;
  passwordChanged: string;

  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  currentPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  showPassword: string;
  hidePassword: string;

  mismatch: string;
  tooShort: string;
  samePassword: string;
  required: string;
  nothingToChange: string;
  passwordHint: string;

  reloading: string;
  reloadDone: string;
  genericError: string;

  emailLocked: string;
  fieldLabels: Record<string, string>;
}

export const profileCopy: Record<"bn" | "en", ProfileCopy> = {
  bn: {
    menuEdit: "প্রোফাইল সম্পাদনা",
    menuPassword: "পাসওয়ার্ড পরিবর্তন",
    menuRefresh: "রিফ্রেশ করুন",

    editTitle: "প্রোফাইল সম্পাদনা",
    editSubtitle: "আপনার অ্যাকাউন্টের তথ্য হালনাগাদ করুন।",
    passwordTitle: "পাসওয়ার্ড পরিবর্তন",
    passwordSubtitle: "নিরাপত্তার জন্য প্রথমে বর্তমান পাসওয়ার্ড দিন।",

    save: "সংরক্ষণ করুন",
    saving: "সংরক্ষণ হচ্ছে…",
    update: "আপডেট করুন",
    updating: "আপডেট হচ্ছে…",
    cancel: "বাতিল",
    close: "বন্ধ করুন",
    loading: "লোড হচ্ছে…",

    savedTitle: "সংরক্ষিত",
    saved: "আপনার প্রোফাইল হালনাগাদ করা হয়েছে।",
    passwordChangedTitle: "পাসওয়ার্ড পরিবর্তিত",
    passwordChanged: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।",

    currentPassword: "বর্তমান পাসওয়ার্ড",
    newPassword: "নতুন পাসওয়ার্ড",
    confirmPassword: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
    currentPasswordPlaceholder: "আপনার বর্তমান পাসওয়ার্ড লিখুন",
    newPasswordPlaceholder: "কমপক্ষে ৬ ডিজিটের নতুন পাসওয়ার্ড",
    confirmPasswordPlaceholder: "নতুন পাসওয়ার্ডটি আবার লিখুন",
    showPassword: "পাসওয়ার্ড দেখান",
    hidePassword: "পাসওয়ার্ড লুকান",

    mismatch: "নতুন পাসওয়ার্ড দুইবার একইভাবে লিখুন।",
    tooShort: "নতুন পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।",
    samePassword: "নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।",
    required: "এই ঘরটি পূরণ করুন।",
    nothingToChange: "পরিবর্তন করার মতো কিছু নেই।",
    passwordHint: "৬ থেকে ১২৮ ডিজিটের যেকোনো পাসওয়ার্ড ব্যবহার করতে পারেন।",

    reloading: "রিফ্রেশ হচ্ছে…",
    reloadDone: "ড্যাশবোর্ডের তথ্য হালনাগাদ হয়েছে।",
    genericError: "এই মুহূর্তে অনুরোধটি সম্পন্ন করা যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।",

    emailLocked: "ইমেইল পরিবর্তন করা যায় না — সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।",
    fieldLabels: {
      full_name: "পূর্ণ নাম",
      mobile_no: "মোবাইল নম্বর",
      phone: "ফোন",
      location: "লোকেশন",
      bio: "সংক্ষিপ্ত পরিচিতি",
      time_zone: "টাইম জোন",
    },
  },
  en: {
    menuEdit: "Edit profile",
    menuPassword: "Change password",
    menuRefresh: "Refresh",

    editTitle: "Edit profile",
    editSubtitle: "Keep your account information up to date.",
    passwordTitle: "Change password",
    passwordSubtitle: "For your security, confirm your current password first.",

    save: "Save changes",
    saving: "Saving…",
    update: "Update",
    updating: "Updating…",
    cancel: "Cancel",
    close: "Close",
    loading: "Loading…",

    savedTitle: "Saved",
    saved: "Your profile has been updated.",
    passwordChangedTitle: "Password changed",
    passwordChanged: "Your password was changed successfully.",

    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    currentPasswordPlaceholder: "Enter your current password",
    newPasswordPlaceholder: "At least 6 characters",
    confirmPasswordPlaceholder: "Re-type the new password",
    showPassword: "Show password",
    hidePassword: "Hide password",

    mismatch: "The new passwords do not match.",
    tooShort: "The new password must be at least 6 characters.",
    samePassword: "The new password must differ from the current one.",
    required: "This field is required.",
    nothingToChange: "There is nothing to update.",
    passwordHint: "6 to 128 characters.",

    reloading: "Refreshing…",
    reloadDone: "Dashboard data refreshed.",
    genericError: "The request could not be completed right now. Please try again in a moment.",

    emailLocked: "Email cannot be changed here — contact an administrator for help.",
    fieldLabels: {
      full_name: "Full name",
      mobile_no: "Mobile number",
      phone: "Phone",
      location: "Location",
      bio: "Short bio",
      time_zone: "Time zone",
    },
  },
};

export function profileCopyFor(language: string): ProfileCopy {
  return profileCopy[language === "en" ? "en" : "bn"];
}

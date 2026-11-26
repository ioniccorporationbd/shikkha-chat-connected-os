/**
 * Language constants shared by the server render (root layout) and the client
 * provider. This module must stay free of "use client"/React code: the root
 * layout reads the preference cookie on the SERVER, and a plain function
 * exported from a client module can never be called there.
 */
export type Language = "bn" | "en";

/** The language the server renders when the visitor has no saved preference. */
export const DEFAULT_LANGUAGE: Language = "bn";

/** Same key for localStorage and the mirror cookie. */
export const LANGUAGE_STORAGE_KEY = "shikkha-chat-site-language";

/**
 * The preference is mirrored into a cookie so the SERVER knows it too — see the
 * root layout. Without that the server always rendered Bangla, so a returning
 * English visitor read Bangla until React hydrated and the effect retranslated
 * the page; on a content-heavy route hydration alone takes seconds, which is
 * exactly the "text arrives late / only half translated" symptom.
 */
export const LANGUAGE_COOKIE = LANGUAGE_STORAGE_KEY;

/** Cookie/localStorage value -> a valid language, defaulting to Bangla. */
export function normalizeLanguage(value: string | null | undefined): Language {
  return value === "en" || value === "bn" ? value : DEFAULT_LANGUAGE;
}

/**
 * Dark / light theme plumbing.
 *
 * One key, one attribute: `localStorage["shikkha-theme"]` holds the user's
 * explicit choice ("light" | "dark") and `<html data-theme="…">` drives every
 * token override in globals.css. Nothing is stored when the user has never
 * chosen — the OS preference wins in that case, which is why this module can
 * be read both from the pre-paint inline script and from React.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "shikkha-theme";
/** Window event fired whenever the theme changes, so every toggle stays in sync. */
export const THEME_EVENT = "shikkha:theme-change";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : null;
  } catch {
    // Private mode / blocked storage: fall through to the system preference.
    return null;
  }
}

export function resolveTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

/** The attribute currently painted on <html> (falls back to resolveTheme()). */
export function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : resolveTheme();
}

export function applyTheme(theme: Theme, persist: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

/**
 * Runs before first paint (inline in <head>), so no white flash and no
 * hydration-time layout shift. Kept in sync with resolveTheme() above.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;

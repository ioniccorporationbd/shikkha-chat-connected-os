import { THEME_INIT_SCRIPT } from "@/lib/theme/theme";

/**
 * Inline, pre-paint theme bootstrap. Rendered in <head> so the correct
 * data-theme is on <html> before the first pixel — no flash of light UI when
 * the user prefers dark.
 */
export default function ThemeScript() {
  return (
    <script
      // Static, controlled string (no user input interpolated).
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { FiX } from "react-icons/fi";

interface DashboardModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  /** Localised label for the close (✕) button. */
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  /** Right-aligned action row; rendered only when provided. */
  footer?: ReactNode;
  widthClass?: string;
}

/**
 * One dialog shell for every dashboard modal (edit profile, change password).
 *
 * Behaviour kept consistent across all of them: overlay + `Escape` close, body
 * scroll lock while open, focus moved into the panel on open, and focus handed
 * back to whatever was focused before on close.
 *
 * Per the project's CSS convention, text/colour utilities live on inner
 * elements — never directly on the <button>.
 */
export default function DashboardModal({
  open,
  title,
  subtitle,
  closeLabel,
  onClose,
  children,
  footer,
  widthClass = "max-w-[480px]",
}: DashboardModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Keep the latest onClose in a ref so the focus/scroll-lock effect below can
  // depend on `open` alone. When callers pass a fresh onClose every render
  // (inline arrows, non-memoised handlers), an [open, onClose] dependency made
  // the effect tear down and re-run on EVERY render — its cleanup restored
  // focus to the element captured at open while the 40ms timer re-focused the
  // first field, so each keystroke dropped focus out of the active input.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        "input, textarea, select, button, [href], [tabindex]"
      );
      target?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-no-translate="true"
      className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center sm:p-4"
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex max-h-[92vh] w-full ${widthClass} flex-col overflow-hidden rounded-t-[26px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] shadow-[0_40px_90px_-30px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] sm:rounded-[26px]`}
      >
        <header className="relative flex items-start gap-3 bg-[linear-gradient(135deg,var(--color-primary)_0%,color-mix(in_srgb,var(--color-primary)_80%,var(--color-secondary))_100%)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[16px] font-semibold leading-tight text-[var(--color-white)]"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-white)_80%,transparent)]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-white)_12%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-white)_24%,transparent)]"
          >
            <span className="text-[var(--color-white)]">
              <FiX size={15} />
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

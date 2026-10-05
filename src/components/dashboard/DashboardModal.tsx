"use client";

import Image from "next/image";
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
  /** Render the Shikkha Chat logo at the top of the dialog body. */
  logo?: boolean;
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
  logo = false,
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

    const panel = panelRef.current;
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

    // On open, move focus to the first REAL, visible text field.
    //
    // Two traps this avoids: (1) the old flat query ("input, textarea, select,
    // button …") matched the header ✕ close button first, since it precedes the
    // body inputs in DOM order — so every modal opened with focus on ✕. (2) The
    // profile-image picker is an <input type="file"> that is visually hidden;
    // its .focus() is a silent no-op and left focus stranded on <body>. We now
    // skip hidden/file/button-type inputs and anything without layout. A modal
    // with no usable field falls back to the first focusable element.
    //
    // The timer is also guarded: if the user has already focused something
    // inside the panel (e.g. clicked a field within the 40ms window), we leave
    // it untouched instead of snapping focus away and deactivating the input.
    const focusTimer = window.setTimeout(() => {
      const node = panelRef.current;
      if (!node || node.contains(document.activeElement)) return;

      const isUsableField = (el: HTMLElement): boolean => {
        if (el.hasAttribute("disabled")) return false;
        if (el.tagName.toLowerCase() === "input") {
          const type = (el as HTMLInputElement).type;
          if (
            ["hidden", "file", "submit", "button", "reset", "image", "checkbox", "radio"].includes(type)
          ) {
            return false;
          }
        }
        // Ignore elements with no layout box (display:none / likely hidden).
        return el.getClientRects().length > 0;
      };

      const fields = Array.from(
        node.querySelectorAll<HTMLElement>('input, textarea, select, [contenteditable="true"]')
      );
      const firstField = fields.find(isUsableField);
      const fallback = node.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (firstField ?? fallback)?.focus();
    }, 40);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      // Hand focus back to the trigger on close, but only if it is still in the
      // document (never focus a node that was unmounted while the modal was up).
      const trigger = previouslyFocused.current;
      if (trigger && document.contains(trigger)) trigger.focus?.();
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {logo ? (
            <div className="mb-4 flex justify-center">
              <span className="relative block h-9 w-[130px]">
                <Image
                  src="/images/logo.png"
                  alt="Shikkha Chat"
                  fill
                  priority
                  sizes="130px"
                  className="object-contain"
                />
              </span>
            </div>
          ) : null}

          {children}
        </div>

        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

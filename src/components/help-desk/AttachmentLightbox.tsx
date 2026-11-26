"use client";

import { useEffect } from "react";
import { FiDownload, FiX } from "react-icons/fi";

/**
 * Full-screen image preview for Help Desk attachments (new-ticket thumbnails,
 * ticket detail, problem info card).
 *
 * Opened by clicking any image attachment. Esc, the × button or a backdrop
 * click closes it. `src` is always the same authorised URL the thumbnail used
 * (blob URL before submit, `/api/help-desk/files?...` after), so opening the
 * lightbox never widens who can read the file.
 */
export default function AttachmentLightbox({
  src,
  alt,
  downloadHref,
  closeLabel = "Close",
  downloadLabel = "Download",
  onClose,
}: {
  src: string;
  alt: string;
  downloadHref?: string;
  closeLabel?: string;
  downloadLabel?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--color-primary)_82%,transparent)] p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="flex w-full max-w-4xl items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold text-[var(--color-white)]">{alt}</p>
        <div className="flex flex-none items-center gap-2">
          {downloadHref ? (
            <a
              href={downloadHref}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-white)_35%,transparent)] px-3 py-1.5 text-[11px] font-semibold text-[var(--color-white)] transition hover:bg-[color-mix(in_srgb,var(--color-white)_14%,transparent)]"
            >
              <FiDownload className="h-3.5 w-3.5" aria-hidden />
              {downloadLabel}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-white)_35%,transparent)] text-[var(--color-white)] transition hover:bg-[color-mix(in_srgb,var(--color-white)_14%,transparent)]"
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[80vh] w-auto max-w-full rounded-2xl bg-[var(--color-white)] object-contain shadow-[0_30px_80px_-30px_color-mix(in_srgb,var(--color-primary)_80%,transparent)]"
      />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { FiDownload, FiX } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";

/**
 * Full-screen image preview for chat attachments.
 *
 * Opened by tapping an image bubble; Esc, the × button or a backdrop click
 * closes it. The download link points at the same authorised
 * `/api/help-desk/files` route the bubble used, so no attachment becomes more
 * public through the preview.
 */
export default function ImageLightbox({
  copy,
  src,
  alt,
  onClose,
}: {
  copy: ConversationCopy;
  src: string;
  alt: string;
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
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,var(--color-primary)_78%,transparent)] p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div className="relative flex max-h-full w-full max-w-4xl flex-col items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full items-center justify-between gap-2 px-1">
          <p className="truncate text-[12px] font-semibold text-[var(--color-white)]/90">{alt}</p>
          <div className="flex items-center gap-1.5">
            <a
              href={src}
              download={alt}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-white)]/12 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-white)] transition hover:bg-[var(--color-white)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-white)]/60"
            >
              <FiDownload size={12} aria-hidden />
              {copy.imageDownload}
            </a>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-white)]/12 text-[var(--color-white)] transition hover:bg-[var(--color-white)]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-white)]/60"
              aria-label={copy.imageClose}
              title={copy.imageClose}
            >
              <FiX size={15} aria-hidden />
            </button>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] w-auto max-w-full rounded-xl bg-[var(--color-white)] object-contain shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)]"
        />
      </div>
    </div>
  );
}

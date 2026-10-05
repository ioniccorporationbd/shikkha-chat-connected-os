"use client";

import { useEffect, useRef } from "react";
import { FiCamera, FiTrash2, FiX } from "react-icons/fi";

import { profileCopyFor } from "@/lib/auth/profile-messages";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface ProfileImageMenuProps {
  open: boolean;
  /** Whether the account currently has a picture (controls "Remove photo"). */
  hasImage: boolean;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
  onClose: () => void;
}

/**
 * The small popover shown when the Overview avatar is clicked — Change Photo /
 * Remove Photo / Cancel. Both photo actions hand off to the existing edit flow
 * (which uploads through the same profile-image API and commits via OTP), so no
 * second image architecture is introduced.
 */
export default function ProfileImageMenu({
  open,
  hasImage,
  onChangePhoto,
  onRemovePhoto,
  onClose,
}: ProfileImageMenuProps) {
  const { language } = useLanguage();
  const copy = profileCopyFor(language);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]";

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={copy.imageTitle}
      className="absolute left-0 top-full z-40 mt-2 w-[210px] rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-1.5 shadow-[0_26px_54px_-24px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
    >
      <button type="button" role="menuitem" onClick={onChangePhoto} className={itemClass}>
        <FiCamera aria-hidden className="text-[var(--color-primary)]" size={15} />
        <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.imageChange}</span>
      </button>

      {hasImage ? (
        <button type="button" role="menuitem" onClick={onRemovePhoto} className={itemClass}>
          <FiTrash2 aria-hidden className="text-[var(--color-danger-strong)]" size={15} />
          <span className="text-[13px] font-semibold text-[var(--color-danger-strong)]">{copy.imageRemove}</span>
        </button>
      ) : null}

      <button type="button" role="menuitem" onClick={onClose} className={itemClass}>
        <FiX aria-hidden className="text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]" size={15} />
        <span className="text-[13px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
          {copy.cancel}
        </span>
      </button>
    </div>
  );
}

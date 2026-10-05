"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";

import {
  formatBytes,
  isAllowedProofFile,
  MAX_PROOF_BYTES,
  PROOF_ACCEPT,
} from "@/lib/payment-entry/manual-payment/config";
import type { ManualPaymentCopy } from "@/lib/payment-entry/manual-payment/messages";

import { PAY_FOCUS, PAY_LABEL_CLASS, payBorder } from "./PaymentField";

interface PaymentProofUploadProps {
  copy: ManualPaymentCopy;
  inputId: string;
  /** True when the parent's submit has run and no file is attached. */
  invalid?: boolean;
  onChange: (file: File | null) => void;
}

/**
 * One reusable image picker for bKash / Rocket / Bank proof screenshots.
 *
 * Uncontrolled on purpose: it owns the staged file + its preview (read as a
 * data URL, exactly like EditProfileModal), and reports the File upward. Because
 * each step is conditionally rendered, switching steps or closing the modal
 * unmounts this component and discards its state — no cross-step leakage.
 *
 * Supports click-to-select and drag & drop, validates type + size up front, and
 * offers preview / replace / remove.
 */
export default function PaymentProofUpload({
  copy,
  inputId,
  invalid,
  onChange,
}: PaymentProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ file: File; preview: string } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const accept = (file: File | null) => {
    if (!file) return;
    if (!isAllowedProofFile(file)) {
      setError(copy.uploadErrType);
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      setError(copy.uploadErrSize);
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result || "");
      setStaged({ file, preview });
      onChange(file);
    };
    reader.onerror = () => setError(copy.uploadErrType);
    reader.readAsDataURL(file);
  };

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = ""; // allow re-picking the same file
    accept(file);
  };

  const remove = () => {
    setStaged(null);
    setError("");
    onChange(null);
  };

  const showError = Boolean(error) || Boolean(invalid && !staged);

  return (
    <div className="flex flex-col gap-1.5">
      <span className={PAY_LABEL_CLASS}>{copy.proofLabel}</span>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={PROOF_ACCEPT}
        className="sr-only"
        onChange={pick}
      />

      {staged ? (
        <div
          className={`flex items-center gap-3 rounded-2xl border ${payBorder(false)} bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-3`}
        >
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[var(--color-white)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={staged.preview}
              alt={copy.uploadPreviewAlt}
              className="h-full w-full object-cover"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-[var(--color-primary)]">
              {staged.file.name}
            </p>
            <p className="text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {formatBytes(staged.file.size)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={`rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1 transition hover:border-[var(--color-primary)] ${PAY_FOCUS}`}
            >
              <span className="text-[11px] font-semibold text-[var(--color-primary)]">
                {copy.uploadReplace}
              </span>
            </button>
            <button
              type="button"
              onClick={remove}
              className={`rounded-xl px-2.5 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] ${PAY_FOCUS}`}
            >
              <span className="text-[11px] font-semibold text-[var(--color-danger-strong)]">
                {copy.uploadRemove}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event: DragEvent<HTMLButtonElement>) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event: DragEvent<HTMLButtonElement>) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border border-dashed ${payBorder(
            showError,
          )} bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-4 py-5 text-center transition ${PAY_FOCUS} ${
            dragging
              ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))]"
              : ""
          }`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
            <FiUploadCloud size={18} />
          </span>
          <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">
            {copy.uploadDrop}
          </span>
          <span className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
            {copy.uploadTypes}
          </span>
        </button>
      )}

      {showError ? (
        <span role="alert" className="text-[11.5px] font-medium text-[var(--color-danger-strong)]">
          {error || copy.errProof}
        </span>
      ) : null}
    </div>
  );
}

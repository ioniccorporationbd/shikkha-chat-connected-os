"use client";

import { useCallback, useRef, useState } from "react";
import { FiPaperclip, FiSend, FiX } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatFileSize } from "@/lib/help-desk/format";
import type { ConversationMessage } from "@/lib/help-desk/types";

export interface ComposerInput {
  message: string;
  replyTo: string | null;
  files: File[];
}

/**
 * The write box under a ticket conversation.
 *
 * Same component serves the customer's Messages page and the employee's
 * problem view — the ERP decides who the author is, so there is no mode flag
 * for "customer vs support" here, only the wording of the send button and the
 * reply-to banner. Attachments are browser `File`s handed upward untouched;
 * the service uploads each one as a real ERP `File` before the message posts.
 */
export default function ConversationComposer({
  copy,
  quoted,
  onClearQuote,
  onSubmit,
  disabled,
  disabledHint,
  requirementMode,
}: {
  copy: ConversationCopy;
  quoted: ConversationMessage | null;
  onClearQuote: () => void;
  onSubmit: (input: ComposerInput) => Promise<boolean>;
  disabled?: boolean;
  disabledHint?: string;
  /** Customer "additional requirement" wording; otherwise a normal message. */
  requirementMode?: boolean;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)]);
  }, []);

  const submit = useCallback(async () => {
    if (busy || disabled) return;
    const message = text.trim();
    if (!message) {
      setError(copy.composerValidation);
      return;
    }
    setError("");
    setBusy(true);
    const ok = await onSubmit({ message, replyTo: quoted?.id ?? null, files });
    setBusy(false);
    if (ok) {
      setText("");
      setFiles([]);
      if (quoted) onClearQuote();
    }
  }, [busy, copy.composerValidation, disabled, files, onClearQuote, onSubmit, quoted, text]);

  const placeholder = requirementMode ? copy.composerRequirementPlaceholder : copy.composerPlaceholder;

  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] p-3">
      {quoted ? (
        <div className="mb-2 flex items-start gap-2 rounded-xl border-l-2 border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] px-2.5 py-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
              {copy.composerReplyTo(quoted.isMine ? copy.conversationYou : quoted.authorName || copy.conversationSupport)}
            </p>
            <p className="line-clamp-2 text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
              {quoted.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearQuote}
            aria-label={copy.composerCancelReply}
            title={copy.composerCancelReply}
            className="grid h-6 w-6 flex-none place-items-center rounded-lg text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:bg-[var(--color-white)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
          >
            <FiX size={13} aria-hidden />
          </button>
        </div>
      ) : null}

      {disabled ? (
        <p className="rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-3 py-2.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_68%,transparent)]">
          {disabledHint}
        </p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={3}
            placeholder={placeholder}
            className="w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] px-3 py-2 text-[13.5px] text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
          />

          {files.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-2.5 py-1"
                >
                  <span className="max-w-[12rem] truncate text-[11.5px] font-semibold text-[var(--color-primary)]">
                    {file.name}
                  </span>
                  <span className="text-[10.5px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    aria-label={copy.composerRemoveFile}
                    title={copy.composerRemoveFile}
                    className="grid h-4 w-4 place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_65%,transparent)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                  >
                    <FiX size={11} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {error ? <p className="mt-2 text-[11.5px] font-semibold text-[#8a5a10]">{error}</p> : null}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
              >
                <FiPaperclip size={13} aria-hidden />
                {copy.composerAttach}
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              {requirementMode ? (
                <span className="hidden text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] sm:inline">
                  {copy.composerRequirementHint}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-action)] px-3.5 py-2 text-[12.5px] font-bold text-[var(--color-white)] shadow-[0_14px_28px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
            >
              <FiSend size={13} className="text-[var(--color-white)]" aria-hidden />
              {busy ? copy.composerSending : requirementMode ? copy.composerRequirementSend : copy.composerSend}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

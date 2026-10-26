"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMic, FiPaperclip, FiSend, FiSquare, FiX } from "react-icons/fi";

import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatFileSize } from "@/lib/help-desk/format";
import type { ConversationMessage } from "@/lib/help-desk/types";

export interface ComposerInput {
  message: string;
  replyTo: string | null;
  files: File[];
}

const ACCEPT = "image/*,application/pdf,audio/*,text/plain,.doc,.docx,.xls,.xlsx,.csv";

const audioIsAudio = (file: File) => (file.type || "").startsWith("audio/");

const clock = (total: number) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/**
 * The write box under a ticket conversation.
 *
 * Same component serves the customer's Messages page and the employee's
 * problem view — the ERP decides who the author is, so there is no mode flag
 * for "customer vs support" here, only the wording of the send button and the
 * reply-to banner. Attachments are browser `File`s handed upward untouched;
 * the service uploads each one as a real ERP `File` before the message posts.
 *
 * The layout mirrors WhatsApp: attach on the left, a rounded input in the
 * middle, and one round action on the right that is the microphone while the
 * box is empty and the send arrow the moment there is something to post.
 * Enter sends, Shift+Enter breaks the line.
 */
export default function ConversationComposer({
  copy,
  quoted,
  onClearQuote,
  onSubmit,
  disabled,
  disabledHint,
  requirementMode,
  initialText,
}: {
  copy: ConversationCopy;
  quoted: ConversationMessage | null;
  onClearQuote: () => void;
  onSubmit: (input: ComposerInput) => Promise<boolean>;
  disabled?: boolean;
  disabledHint?: string;
  /** Customer "additional requirement" wording; otherwise a normal message. */
  requirementMode?: boolean;
  /** Text to seed the box with (a draft kept across a forced sign-in). */
  initialText?: string;
}) {
  const [text, setText] = useState(initialText ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const canRecord =
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [stopTimer]);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)]);
  }, []);

  const submit = useCallback(async () => {
    if (busy || disabled) return;
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) {
      setError(copy.composerValidation);
      return;
    }
    // The ERP stores a body with every Communication record, so an attachment
    // or voice note sent without words gets a plain, honest caption.
    const hasAudio = files.some(audioIsAudio);
    const message = trimmed || (hasAudio ? copy.composerVoiceNote : copy.composerAttachmentOnly);
    setError("");
    setBusy(true);
    const ok = await onSubmit({ message, replyTo: quoted?.id ?? null, files });
    setBusy(false);
    if (ok) {
      setText("");
      setFiles([]);
      if (quoted) onClearQuote();
    }
  }, [busy, copy.composerAttachmentOnly, copy.composerValidation, copy.composerVoiceNote, disabled, files, onClearQuote, onSubmit, quoted, text]);

  const startRecording = useCallback(async () => {
    if (recording || busy) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) {
          const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
          setFiles((current) => [
            ...current,
            new File([blob], `voice-${Date.now()}.${extension}`, { type }),
          ]);
        }
        stopTimer();
        setSeconds(0);
        setRecording(false);
        recorderRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setError("");
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch {
      setError(copy.composerMicDenied);
    }
  }, [busy, copy.composerMicDenied, recording, stopTimer]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const placeholder = requirementMode ? copy.composerRequirementPlaceholder : copy.composerPlaceholder;
  const hasContent = text.trim().length > 0 || files.length > 0;

  // A recorded voice note deserves a listen before it is posted. The object
  // URLs are local to the browser — nothing is uploaded until Send.
  const audioPreviews = useMemo(
    () => files.map((file) => (audioIsAudio(file) ? URL.createObjectURL(file) : null)),
    [files],
  );
  useEffect(
    () => () => {
      audioPreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    },
    [audioPreviews],
  );

  return (
    <div className="w-full">
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
      ) : recording ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-action)_6%,var(--color-white))] px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5 flex-none">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-action)] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-action)]" />
          </span>
          <span className="flex-1 text-[12.5px] font-semibold text-[var(--color-primary)]">
            {copy.composerRecording} · {clock(seconds)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            aria-label={copy.composerStopRecording}
            title={copy.composerStopRecording}
            className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--color-action)] text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
          >
            <FiSquare size={13} aria-hidden />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label={copy.composerAttach}
              title={copy.composerAttach}
              className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
            >
              <FiPaperclip size={16} aria-hidden />
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder={placeholder}
              className="max-h-32 min-h-10 w-full flex-1 resize-none rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))] px-3.5 py-2.5 text-[13.5px] leading-snug text-[var(--color-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
            />

            {hasContent || busy ? (
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                aria-label={requirementMode ? copy.composerRequirementSend : copy.composerSend}
                title={requirementMode ? copy.composerRequirementSend : copy.composerSend}
                className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[var(--color-action)] text-[var(--color-white)] shadow-[0_14px_28px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2"
              >
                <FiSend size={15} className="text-[var(--color-white)]" aria-hidden />
              </button>
            ) : canRecord ? (
              <button
                type="button"
                onClick={() => void startRecording()}
                aria-label={copy.composerRecordVoice}
                title={copy.composerRecordVoice}
                className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)] transition hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
              >
                <FiMic size={16} aria-hidden />
              </button>
            ) : null}
          </div>

          {files.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-2.5 py-1"
                >
                  {audioIsAudio(file) ? (
                    <FiMic size={12} className="flex-none text-[var(--color-primary)]" aria-hidden />
                  ) : null}
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

          {audioPreviews.some(Boolean) ? (
            <div className="mt-2 space-y-1.5" aria-label={copy.voicePreview}>
              {audioPreviews.map((url, index) =>
                url ? (
                  <audio
                    key={`preview-${index}`}
                    controls
                    preload="metadata"
                    src={url}
                    aria-label={`${copy.voicePreview} — ${files[index]?.name ?? ""}`}
                    className="h-9 w-full max-w-xs"
                  />
                ) : null,
              )}
            </div>
          ) : null}

          {requirementMode ? (
            <p className="mt-2 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.composerRequirementHint}
            </p>
          ) : null}

          {error ? <p className="mt-2 text-[11.5px] font-semibold text-[#8a5a10]">{error}</p> : null}
        </>
      )}
    </div>
  );
}

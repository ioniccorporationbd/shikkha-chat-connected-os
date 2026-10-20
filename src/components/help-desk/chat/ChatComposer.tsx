"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiMic, FiPaperclip, FiSend, FiSquare, FiX } from "react-icons/fi";

import { formatFileSize } from "@/lib/help-desk/format";
import type { HelpDeskCopy } from "@/lib/help-desk/messages";
import { uploadAttachment } from "@/lib/help-desk/service";
import type { HelpDeskUploadedFile } from "@/lib/help-desk/types";
import { toast } from "@/lib/ui/toast";

/**
 * WhatsApp-style message composer.
 *
 * - attach button → photo / PDF / document file picker (uploaded to the ERP as
 *   real File records before the message is posted)
 * - mic button → records a voice note with MediaRecorder and attaches it
 * - Enter sends, Shift+Enter adds a line
 */
export default function ChatComposer({
  copy,
  onSend,
  disabled = false,
  notice,
  autoFocusOnMount = false,
}: {
  copy: HelpDeskCopy;
  onSend: (text: string, attachments: Array<{ name: string; url: string }>) => Promise<void>;
  disabled?: boolean;
  notice?: string;
  autoFocusOnMount?: boolean;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<HelpDeskUploadedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoFocusOnMount) textareaRef.current?.focus();
  }, [autoFocusOnMount]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const canSend = !disabled && !busy && !uploading && !recording && (text.trim().length > 0 || files.length > 0);

  const submit = useCallback(async () => {
    if (!canSend) return;
    setBusy(true);
    try {
      await onSend(
        text.trim(),
        files.map((file) => ({ name: file.name, url: file.url }))
      );
      setText("");
      setFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.chatSendFailed);
    } finally {
      setBusy(false);
    }
  }, [canSend, copy.chatSendFailed, files, onSend, text]);

  const pickFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setUploading(true);
    try {
      const uploaded: HelpDeskUploadedFile[] = [];
      for (const file of Array.from(picked).slice(0, 5)) {
        uploaded.push(await uploadAttachment(file));
      }
      setFiles((current) => [...current, ...uploaded].slice(0, 5));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : copy.chatSendFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    if (disabled || busy || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (blob.size < 800) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        setUploading(true);
        try {
          const uploaded = await uploadAttachment(file);
          setFiles((current) => [...current, uploaded].slice(0, 5));
        } catch (error) {
          toast.error(error instanceof Error && error.message ? error.message : copy.chatSendFailed);
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => setRecordSeconds((value) => value + 1), 1000);
    } catch {
      toast.error(copy.chatVoice);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  return (
    <div className="sticky bottom-0 z-20 mt-4 bg-[var(--color-white)] pb-1 pt-2">
      {notice ? (
        <p className="mb-2 rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-white))] px-3 py-2 text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_66%,var(--color-white))]">
          {notice}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[var(--color-white)] py-1 pl-2.5 pr-1 text-[11.5px] font-semibold text-[var(--color-primary)]"
            >
              <span className="max-w-[180px] truncate">{file.name}</span>
              <span className="text-[10px] font-medium text-[color-mix(in_srgb,var(--color-primary)_50%,var(--color-white))]">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                aria-label={copy.chatRemoveFile}
                onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))]"
              >
                <FiX className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={`flex items-end gap-2 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-white))] bg-[var(--color-white)] p-1.5 pl-2 shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_5%,transparent)] ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,text/plain,audio/*,.webm,.mp3,.m4a,.wav,.ogg,.doc,.docx,.xls,.xlsx,.csv"
          className="hidden"
          onChange={(event) => void pickFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || recording}
          aria-label={copy.chatAttach}
          title={copy.chatAttach}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] hover:text-[var(--color-primary)] disabled:cursor-not-allowed"
        >
          <FiPaperclip className="h-[18px] w-[18px]" aria-hidden />
        </button>

        {recording ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5">
            <span className="h-2 w-2 flex-none animate-pulse rounded-full bg-[var(--color-action)]" aria-hidden />
            <span className="truncate text-[13px] font-medium text-[var(--color-action)]">{copy.chatRecording}</span>
            <span className="ml-auto tabular-nums text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))]">
              {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
            </span>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={copy.chatPlaceholder}
            onChange={(event) => {
              setText(event.target.value);
              const node = event.target;
              node.style.height = "auto";
              node.style.height = `${Math.min(node.scrollHeight, 132)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            className="max-h-[132px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-[14px] leading-relaxed text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-white))]"
          />
        )}

        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-label={copy.chatRecording}
            title={copy.chatRecording}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-action)] text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)]"
          >
            <FiSquare className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          text.trim().length > 0 || files.length > 0 ? (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSend}
              aria-label={copy.chatSend}
              title={copy.chatSend}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[var(--color-action)] text-[var(--color-white)] transition hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-white))]"
            >
              <FiSend className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={disabled || uploading || busy}
              aria-label={copy.chatVoice}
              title={copy.chatVoice}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,var(--color-white))] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] hover:text-[var(--color-primary)] disabled:cursor-not-allowed"
            >
              <FiMic className="h-[18px] w-[18px]" aria-hidden />
            </button>
          )
        )}
      </div>
      {uploading ? (
        <p className="mt-1.5 text-[11px] font-medium text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
          {copy.chatAttach}…
        </p>
      ) : null}
    </div>
  );
}

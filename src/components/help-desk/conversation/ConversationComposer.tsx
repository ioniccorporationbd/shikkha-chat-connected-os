"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FiFileText, FiMusic, FiPaperclip, FiSend, FiSmile, FiX } from "react-icons/fi";

import EmojiPicker from "@/components/help-desk/conversation/EmojiPicker";
import type { ConversationCopy } from "@/lib/help-desk/conversation-copy";
import { formatFileSize } from "@/lib/help-desk/format";
import type { ConversationMessage } from "@/lib/help-desk/types";

export interface ComposerInput {
  message: string;
  replyTo: string | null;
  files: File[];
}

const ACCEPT = "image/*,application/pdf,audio/*,text/plain,.doc,.docx,.xls,.xlsx,.csv";

/**
 * The ERP's own upload limits (``shikkha_os.api.v1.help_desk``): five files, a
 * five-megabyte ceiling and the extension allow-list. Mirrored here so a bad
 * pick is refused in the browser, before anything touches the network — the
 * server stays the final gate either way.
 */
const MAX_FILES = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "pdf",
  "txt",
  "log",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "webm",
  "mp3",
  "m4a",
  "wav",
  "ogg",
  "oga",
  "aac",
  "mp4",
]);

/** Past this height the box stops growing and scrolls inside instead. */
const MAX_TEXTAREA_HEIGHT = 132;

const fileIsImage = (file: File) => (file.type || "").startsWith("image/");
const fileIsAudio = (file: File) => (file.type || "").startsWith("audio/");
const fileExt = (file: File) => (file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "");

/**
 * The write box under a ticket conversation.
 *
 * Same component serves the customer's Messages page and the employee's
 * problem view — the ERP decides who the author is, so there is no mode flag
 * for "customer vs support" here, only the wording of the send button and the
 * reply-to banner. Attachments are browser `File`s handed upward untouched;
 * the service uploads each one as a real ERP `File` before the message posts.
 *
 * The whole box is one rounded surface, the way a messaging app draws it: the
 * attach button, the growing text, the emoji sheet and the send button read as
 * a single control. Nothing in it is a browser-default field, so there is no
 * focus ring to remove and no double border between the text and its frame.
 *
 * Enter sends, Shift+Enter breaks the line, and text still being composed by a
 * Bangla/Chinese IME never submits on the Enter that commits the candidate.
 * The Send button (a paper plane, dark red, white icon) is always in the same
 * place: it sits dimmed and disabled while there is nothing to send and turns
 * solid the moment text or a file is ready.
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  // Live mirror of `files`, so validation can run synchronously without
  // re-creating the native change listener on every pick.
  const filesRef = useRef<File[]>([]);

  const addFiles = useCallback(
    (picked: File[]) => {
      if (picked.length === 0) return;
      const next = [...filesRef.current];
      let tooLarge = 0;
      let wrongType = 0;
      let tooMany = 0;
      for (const file of picked) {
        if ((file.size || 0) > MAX_FILE_BYTES) {
          tooLarge += 1;
          continue;
        }
        if (!ALLOWED_EXT.has(fileExt(file))) {
          wrongType += 1;
          continue;
        }
        if (next.length >= MAX_FILES) {
          tooMany += 1;
          continue;
        }
        next.push(file);
      }
      filesRef.current = next;
      setFiles(next);
      setError(
        tooLarge > 0
          ? copy.attachmentTooLarge
          : wrongType > 0
            ? copy.attachmentWrongType
            : tooMany > 0
              ? copy.attachmentTooMany
              : ""
      );
    },
    [copy.attachmentTooLarge, copy.attachmentTooMany, copy.attachmentWrongType]
  );

  const removeFile = useCallback((index: number) => {
    const next = filesRef.current.filter((_, position) => position !== index);
    filesRef.current = next;
    setFiles(next);
    setError("");
  }, []);

  // A native listener, not React's onChange: the same file can be picked again
  // after a removal, and a cleared input re-fires `change` natively while
  // React's value tracker can swallow the repeat. The `File` list is copied
  // before the input is cleared — clearing empties the live FileList, and the
  // state updater may run after that.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleChange = () => {
      const picked = input.files ? Array.from(input.files) : [];
      input.value = "";
      if (picked.length > 0) addFiles(picked);
    };
    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, [addFiles]);

  const submit = useCallback(async () => {
    if (busy || disabled) return;
    const trimmed = text.trim();
    // The button is disabled in this state; the guard keeps Enter honest.
    if (!trimmed && filesRef.current.length === 0) return;
    const current = filesRef.current;
    // The ERP stores a body with every Communication record, so an attachment
    // sent without words gets a plain, honest caption.
    const hasAudio = current.some(fileIsAudio);
    const message = trimmed || (hasAudio ? copy.composerVoiceNote : copy.composerAttachmentOnly);
    setError("");
    setBusy(true);
    setEmojiOpen(false);
    const ok = await onSubmit({ message, replyTo: quoted?.id ?? null, files: current });
    setBusy(false);
    if (ok) {
      setText("");
      filesRef.current = [];
      setFiles([]);
      if (quoted) onClearQuote();
    }
    // On failure the text, the files and the quote all stay: nothing is lost.
  }, [busy, copy.composerAttachmentOnly, copy.composerVoiceNote, disabled, filesRef, onClearQuote, onSubmit, quoted, text]);

  // Grow with the text up to the cap, then let the textarea scroll inside. A
  // layout effect keeps the resize in the same frame as the keystroke, so the
  // box never renders one line short and then jumps.
  useLayoutEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  // Back to the empty one-liner after a send (or a cleared draft).
  useEffect(() => {
    if (text.length > 0) return;
    const node = textareaRef.current;
    if (node) node.style.height = "";
  }, [text]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const node = textareaRef.current;
      if (!node) {
        setText((current) => `${current}${emoji}`);
        return;
      }
      const start = node.selectionStart ?? text.length;
      const end = node.selectionEnd ?? start;
      setText(`${text.slice(0, start)}${emoji}${text.slice(end)}`);
      // Put the caret after the emoji and keep typing where the user was.
      window.requestAnimationFrame(() => {
        node.focus();
        const caret = start + emoji.length;
        node.setSelectionRange(caret, caret);
      });
    },
    [text]
  );

  const placeholder = requirementMode ? copy.composerRequirementPlaceholder : copy.composerPlaceholder;
  const hasContent = text.trim().length > 0 || files.length > 0;

  // Local previews for picked attachments. Object URLs are browser-side only —
  // nothing is uploaded until Send, and every URL is released when the list
  // changes or the composer unmounts, so a long session cannot leak blobs.
  const previews = useMemo(
    () => files.map((file) => (fileIsImage(file) || fileIsAudio(file) ? URL.createObjectURL(file) : null)),
    [files]
  );
  useEffect(
    () => () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    },
    [previews]
  );

  const sendLabel = requirementMode ? copy.composerRequirementSend : copy.composerSend;
  // Every card shows the same honest status: files are uploaded when Send is
  // pressed, so until then they are ready, and while the send runs they are
  // being sent.
  const fileStatus = busy ? copy.composerSending : copy.attachmentReady;

  return (
    <div className="w-full">
      {quoted ? (
        <div className="mb-2 flex items-stretch gap-2 overflow-hidden rounded-xl rounded-l-md border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]">
          <span className="w-[3px] shrink-0 bg-[var(--color-action)]" aria-hidden />
          <div className="min-w-0 flex-1 py-1.5 pr-1">
            <p className="truncate text-[10.5px] font-bold text-[var(--color-action)]">
              {copy.composerReplyTo(quoted.isMine ? copy.conversationYou : quoted.authorName || copy.conversationSupport)}
            </p>
            <p className="line-clamp-2 text-[11.5px] leading-snug text-[color-mix(in_srgb,var(--color-primary)_64%,transparent)]">
              {quoted.body}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearQuote}
            aria-label={copy.composerCancelReply}
            title={copy.composerCancelReply}
            className="mr-1.5 grid h-6 w-6 flex-none place-items-center self-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition hover:bg-[var(--color-white)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
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
          {/* One surface for the whole composer. Focus is shown as a slightly
              stronger frame, never as a ring or a browser outline. */}
          <div
            className={`relative rounded-[22px] border bg-[var(--color-white)] px-2 py-2 shadow-[0_10px_24px_-22px_color-mix(in_srgb,var(--color-primary)_75%,transparent)] transition ${
              busy
                ? "border-[color-mix(in_srgb,var(--color-action)_26%,transparent)]"
                : "border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] focus-within:border-[color-mix(in_srgb,var(--color-primary)_34%,transparent)] focus-within:shadow-[0_14px_30px_-24px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]"
            }`}
          >
            {files.length > 0 ? (
              <ul className="mb-1.5 flex flex-wrap gap-1.5 px-0.5" aria-label={copy.composerAttachedFiles}>
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex w-[264px] max-w-full items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_3%,var(--color-white))] p-1.5"
                  >
                    {fileIsImage(file) && previews[index] ? (
                      // The name sits right beside the thumbnail, so the image is
                      // decorative here — an empty alt keeps a decoder failure
                      // from spilling alt text across the card.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[index] as string}
                        alt=""
                        className="h-9 w-9 flex-none overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-white))] object-cover"
                      />
                    ) : (
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
                        {fileIsAudio(file) ? <FiMusic size={15} aria-hidden /> : <FiFileText size={15} aria-hidden />}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-[var(--color-primary)]">
                        {file.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
                        <span className="tabular-nums">{formatFileSize(file.size)}</span>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[color-mix(in_srgb,var(--color-action)_78%,transparent)]">
                          <span
                            className={`h-[5px] w-[5px] rounded-full ${
                              busy ? "animate-pulse bg-[var(--color-action)]" : "bg-[color-mix(in_srgb,var(--color-action)_70%,var(--color-white))]"
                            }`}
                            aria-hidden
                          />
                          {fileStatus}
                        </span>
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label={`${copy.composerRemoveFile}: ${file.name}`}
                      title={copy.composerRemoveFile}
                      className="grid h-6 w-6 flex-none place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)]"
                    >
                      <FiX size={12} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label={copy.composerAttach}
                title={copy.composerAttach}
                className="grid h-9 w-9 flex-none place-items-center rounded-full text-[color-mix(in_srgb,var(--color-primary)_66%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]"
              >
                <FiPaperclip size={17} aria-hidden />
              </button>
              <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" />

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={() => {
                  composingRef.current = false;
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey) return;
                  // Enter committing an IME candidate ("নমস্কার" → Enter) must
                  // not also send: 229 and isComposing mean the key belongs to
                  // the input method, not to us.
                  const native = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };
                  if (composingRef.current || native.isComposing || native.keyCode === 229) return;
                  event.preventDefault();
                  void submit();
                }}
                rows={1}
                placeholder={placeholder}
                aria-label={requirementMode ? copy.composerRequirementPlaceholder : copy.composerPlaceholder}
                className="hd-composer-textarea hd-scrollbar-hidden max-h-[132px] min-h-9 w-full flex-1 resize-none bg-transparent px-1 py-[7px] text-[13.5px] leading-snug text-[var(--color-primary)] outline-none placeholder:text-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]"
              />

              <div className="relative flex flex-none items-center">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((open) => !open)}
                  aria-label={copy.composerEmoji}
                  title={copy.composerEmoji}
                  aria-expanded={emojiOpen}
                  className={`grid h-9 w-9 place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] ${
                    emojiOpen
                      ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-white))] text-[var(--color-primary)]"
                      : "text-[color-mix(in_srgb,var(--color-primary)_66%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--color-white))] hover:text-[var(--color-primary)]"
                  }`}
                >
                  <FiSmile size={17} aria-hidden />
                </button>
                {emojiOpen ? (
                  <EmojiPicker
                    title={copy.composerEmojiTitle}
                    labels={{
                      smileys: copy.composerEmojiSmileys,
                      gestures: copy.composerEmojiGestures,
                      objects: copy.composerEmojiObjects,
                    }}
                    onPick={insertEmoji}
                    onClose={() => setEmojiOpen(false)}
                  />
                ) : null}
              </div>

              {/* Always in the same spot — the voice button's old place. Dark red
                  with a white paper plane when there is something to send; dimmed
                  and disabled while the box is empty; a spinner while sending. */}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy || !hasContent}
                aria-label={sendLabel}
                title={sendLabel}
                aria-busy={busy}
                aria-disabled={busy || !hasContent}
                className={`grid h-10 w-10 flex-none place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-ring)] focus-visible:ring-offset-2 ${
                  busy
                    ? "cursor-progress bg-[var(--color-action)] text-[var(--color-white)] opacity-80"
                    : hasContent
                      ? "bg-[var(--color-action)] text-[var(--color-white)] shadow-[0_14px_28px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] hover:bg-[var(--color-action-hover)] active:scale-95"
                      : "cursor-not-allowed bg-[color-mix(in_srgb,var(--color-action)_12%,var(--color-white))] text-[color-mix(in_srgb,var(--color-action)_88%,transparent)]"
                }`}
              >
                {busy ? (
                  <span
                    className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-white)_35%,transparent)] border-t-[var(--color-white)]"
                    aria-hidden
                  />
                ) : (
                  <FiSend size={15} className="text-current" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {previews.some(Boolean) && files.some(fileIsAudio) ? (
            <div className="mt-2 space-y-1.5" aria-label={copy.voicePreview}>
              {previews.map((url, index) =>
                url && fileIsAudio(files[index]) ? (
                  <audio
                    key={`preview-${index}`}
                    controls
                    preload="metadata"
                    src={url}
                    aria-label={`${copy.voicePreview} — ${files[index]?.name ?? ""}`}
                    className="h-9 w-full max-w-xs"
                  />
                ) : null
              )}
            </div>
          ) : null}

          {requirementMode ? (
            <p className="mt-2 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              {copy.composerRequirementHint}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-[11.5px] font-semibold text-[#8a5a10]">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

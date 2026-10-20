"use client";

import { FiDownload, FiFileText } from "react-icons/fi";

import { formatFileSize } from "@/lib/help-desk/format";
import { attachmentUrl } from "@/lib/help-desk/service";
import type { MessageAttachment } from "@/lib/help-desk/types";

/** What kind of preview a chat attachment deserves. */
export function attachmentKind(file: MessageAttachment): "image" | "audio" | "file" {
  const type = (file.fileType || "").toLowerCase();
  const name = (file.fileName || file.url || "").toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image";
  if (type.startsWith("audio/") || /\.(webm|ogg|oga|mp3|m4a|wav|aac|opus)$/.test(name)) return "audio";
  return "file";
}

/** Render one message attachment: image preview, voice player or a file chip. */
export default function MessageAttachmentView({
  file,
  copy,
}: {
  file: MessageAttachment;
  copy: { chatVoiceNote: string };
}) {
  const href = attachmentUrl(file) || file.url;
  const kind = attachmentKind(file);

  if (kind === "image") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-block max-w-full overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={href}
          alt={file.fileName || "attachment"}
          className="block h-auto max-h-64 w-auto max-w-full object-contain"
        />
      </a>
    );
  }

  if (kind === "audio") {
    return (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[var(--color-white)] p-1.5">
        <audio controls preload="none" src={href} aria-label={copy.chatVoiceNote} className="h-9 w-full max-w-[260px]" />
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] bg-[var(--color-white)] px-2.5 py-2 transition hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-white))]"
    >
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-white))] text-[var(--color-primary)]">
        <FiFileText className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-[var(--color-primary)]">
          {file.fileName || file.url}
        </span>
        <span className="block text-[11px] text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]">
          {file.size ? formatFileSize(file.size) : ""}
        </span>
      </span>
      <FiDownload className="h-4 w-4 flex-none text-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-white))]" aria-hidden />
    </a>
  );
}

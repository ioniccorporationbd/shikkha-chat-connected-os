"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FiAlertCircle, FiSave } from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { postJson } from "@/lib/api/http";
import { profileCopyFor } from "@/lib/auth/profile-messages";
import { useProfileQuery } from "@/lib/auth/queries";
import { looksTechnical } from "@/lib/auth/sanitize";
import { useAuthStore } from "@/lib/auth/store";
import type { ProfileUpdateResult } from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown while the profile request is in flight, so the header is never blank. */
  fallbackName?: string;
  fallbackEmail?: string;
}

/** Fields that get a textarea instead of a single-line input. */
const TEXTAREA_FIELDS = new Set(["bio"]);

/** Shared input styling; layout here, readable copy carried by the label span. */
const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)] focus:bg-[var(--color-white)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)]";

export default function EditProfileModal({
  open,
  onClose,
  fallbackName,
  fallbackEmail,
}: EditProfileModalProps) {
  const { language } = useLanguage();
  const copy = profileCopyFor(language);
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const { data, isLoading, isError, error } = useProfileQuery(open);

  // Local edits layered over the fetched values. `draft === null` means
  // "pristine": inputs show the server values and the first keystroke starts a
  // draft. Deriving this (instead of seeding state in an effect) avoids the
  // set-state-in-effect lint rule and a redundant render on open.
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  const values = draft ?? data?.values ?? {};

  const setField = (field: string, value: string) =>
    setDraft((prev) => ({ ...(prev ?? data?.values ?? {}), [field]: value }));

  const close = () => {
    setDraft(null);
    onClose();
  };

  const editable = data?.editable ?? [];
  const email = data?.email || fallbackEmail || "";
  const name = data?.full_name || fallbackName || "";

  const handleSave = async () => {
    if (!data || saving) return;

    const payload: Record<string, string> = {};
    for (const field of editable) payload[field] = (values[field] ?? "").trim();

    setSaving(true);

    try {
      const result = await postJson<ProfileUpdateResult>("/api/auth/profile", payload);

      if (result?.user) setSession(result.user);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);

      toast.success(copy.saved, copy.savedTitle);
      setDraft(null);
      onClose();
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      toast.error(looksTechnical(raw) || !raw ? copy.genericError : raw);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardModal
      open={open}
      title={copy.editTitle}
      subtitle={copy.editSubtitle}
      closeLabel={copy.close}
      onClose={close}
      footer={
        <>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] disabled:opacity-60"
          >
            <span className="text-[13px] font-semibold text-[var(--color-primary)]">
              {copy.cancel}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isLoading || isError}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_80%,transparent)] transition hover:opacity-92 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
              <FiSave size={15} />
              {saving ? copy.saving : copy.save}
            </span>
          </button>
        </>
      }
    >
      {/* Identity strip — picture (or monogram) + name + read-only email. */}
      <div className="flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] p-3">
        <UserAvatar
          user={{ full_name: name, name, user_image: data?.user_image }}
          size={46}
          rounded="rounded-2xl"
        />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--color-primary)]">{name}</p>
          {email ? (
            <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {email}
            </p>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
          {copy.loading}
        </p>
      ) : null}

      {isError ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-danger-strong)]">
          <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
          {(() => {
            const raw = (error as Error)?.message ?? "";
            return looksTechnical(raw) || !raw ? copy.genericError : raw;
          })()}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="mt-4 flex flex-col gap-3.5">
          {editable.map((field) => (
            <label key={field} className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]">
                {copy.fieldLabels[field] ?? field}
              </span>
              {TEXTAREA_FIELDS.has(field) ? (
                <textarea
                  rows={3}
                  value={values[field] ?? ""}
                  onChange={(event) => setField(field, event.target.value)}
                  className={`${FIELD_CLASS} resize-y`}
                />
              ) : (
                <input
                  type="text"
                  value={values[field] ?? ""}
                  onChange={(event) => setField(field, event.target.value)}
                  className={FIELD_CLASS}
                />
              )}
            </label>
          ))}

          <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
            {copy.emailLocked}
          </p>
        </div>
      ) : null}
    </DashboardModal>
  );
}

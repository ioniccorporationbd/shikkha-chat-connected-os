"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCamera,
  FiCheckCircle,
  FiImage,
  FiLock,
  FiSave,
  FiShield,
  FiTrash2,
} from "react-icons/fi";

import DashboardModal from "@/components/dashboard/DashboardModal";
import UserAvatar from "@/components/dashboard/UserAvatar";
import { postJson } from "@/lib/api/http";
import { profileCopyFor } from "@/lib/auth/profile-messages";
import { useProfileQuery } from "@/lib/auth/queries";
import { looksTechnical } from "@/lib/auth/sanitize";
import { useAuthStore } from "@/lib/auth/store";
import { formatBdMobile } from "@/lib/format/mobile";
import type {
  ProfileFieldMeta,
  ProfileImageUploadResult,
  ProfileOtpStartPayload,
  ProfileUpdateResult,
} from "@/lib/auth/types";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown while the profile request is in flight, so the header is never blank. */
  fallbackName?: string;
  fallbackEmail?: string;
  /**
   * An optional one-shot intent when the modal is opened from the Overview
   * avatar menu: jump straight to picking a photo, or stage the removal of the
   * current one. Consumed once via `onIntentHandled`.
   */
  intent?: "change-photo" | "remove-photo" | null;
  onIntentHandled?: () => void;
}

/** Fieldtypes that get a textarea rather than a single-line input. */
const TEXTAREA_FIELDTYPES = new Set(["Text", "Small Text", "Long Text", "Text Editor"]);
/** The order the form renders the ERP's sections in. */
const SECTION_ORDER = ["basic", "personal", "work", "additional"] as const;
/** A profile picture is capped by the ERP (2 MB) — reject early with a toast. */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Shared input styling; layout here, readable copy carried by the label span. */
const FIELD_CLASS =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:bg-[var(--color-white)] focus:ring-2 focus:ring-[var(--color-action-ring)] focus:ring-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] disabled:cursor-not-allowed";

const LABEL_CLASS =
  "text-[12px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_75%,transparent)]";

export default function EditProfileModal({
  open,
  onClose,
  fallbackName,
  fallbackEmail,
  intent,
  onIntentHandled,
}: EditProfileModalProps) {
  const { language } = useLanguage();
  const copy = profileCopyFor(language);
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);

  const { data, isLoading, isError, error } = useProfileQuery(open);

  // Local edits layered over the fetched values. `draft === null` means
  // "pristine": inputs show the server values and the first keystroke starts a
  // draft. Deriving this (instead of seeding state in an effect) keeps typing
  // stable — a background refetch of `data` can never clobber what is being
  // typed, because a live draft always wins over the fetched values.
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [staged, setStaged] = useState<{ fileUrl: string; preview: string } | null>(null);
  // Removal is staged (not applied) until the OTP step commits it, exactly like
  // a newly-picked picture.
  const [removeStaged, setRemoveStaged] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [otpTarget, setOtpTarget] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPayloadRef = useRef<Record<string, string>>({});

  const editable = useMemo(() => data?.editable ?? [], [data]);
  const values = useMemo(() => draft ?? data?.values ?? {}, [draft, data]);
  const email = data?.email || fallbackEmail || "";
  const name = data?.full_name || fallbackName || "";
  const previewSrc = removeStaged ? null : staged?.preview ?? null;
  const hasExistingImage = Boolean((data?.user_image ?? "").trim());

  /** Field presentation meta from the ERP, with a safe local fallback. */
  const fields = useMemo<ProfileFieldMeta[]>(() => {
    if (data?.fields?.length) return data.fields;

    return editable.map((field) => ({
      fieldname: field,
      label: copy.fieldLabels[field] ?? field,
      fieldtype: field === "bio" ? "Small Text" : "Data",
      options: [],
      section: field === "full_name" || field === "phone" ? "basic" : "additional",
      required: field === "full_name",
    }));
  }, [data, editable, copy]);

  const groupedFields = useMemo(() => {
    const map = new Map<string, ProfileFieldMeta[]>();
    for (const field of fields) {
      const list = map.get(field.section) ?? [];
      list.push(field);
      map.set(field.section, list);
    }
    return map;
  }, [fields]);

  const setField = (field: string, value: string) =>
    setDraft((prev) => ({ ...(prev ?? data?.values ?? {}), [field]: value }));

  const reset = () => {
    setDraft(null);
    setStep("form");
    setStaged(null);
    setRemoveStaged(false);
    setUploadingImage(false);
    setSending(false);
    setVerifying(false);
    setCode("");
    setOtpTarget("");
    setResendIn(0);
    setFormError(null);
    pendingPayloadRef.current = {};
  };

  const close = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (step !== "otp" || resendIn <= 0) return;

    const timer = window.setInterval(() => setResendIn((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, resendIn]);

  // Honour a one-shot intent from the Overview avatar menu. Deferred off the
  // effect's synchronous path so no state is set during render.
  useEffect(() => {
    if (!open || !intent) return;
    const timer = window.setTimeout(() => {
      if (intent === "change-photo") {
        fileInputRef.current?.click();
      } else if (intent === "remove-photo") {
        setStaged(null);
        setRemoveStaged(true);
      }
      onIntentHandled?.();
    }, 160);
    return () => window.clearTimeout(timer);
  }, [open, intent, onIntentHandled]);

  /** Which editable fields actually differ from the fetched values. */
  const changedFields = useMemo(() => {
    if (!data) return [] as string[];

    return editable.filter((field) => (values[field] ?? "").trim() !== (data.values[field] ?? "").trim());
  }, [data, editable, values]);

  const hasChanges = changedFields.length > 0 || Boolean(staged) || removeStaged;

  const handlePickImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-picking the same file next time.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning(copy.imageHint);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.warning(copy.imageTooLarge);
      return;
    }

    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });

      const result = await postJson<ProfileImageUploadResult>("/api/auth/profile/image", {
        file_name: file.name,
        file_data: dataUrl,
      });

      setStaged({ fileUrl: result.file_url, preview: dataUrl });
      setRemoveStaged(false);
      toast.success(copy.imageChange);
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      toast.error(looksTechnical(raw) || !raw ? copy.genericError : raw);
    } finally {
      setUploadingImage(false);
    }
  };

  /** Build the pending edit payload (allow-listed fields + a staged picture). */
  const buildPayload = () => {
    const payload: Record<string, string> = {};
    for (const field of editable) payload[field] = (values[field] ?? "").trim();
    if (staged) payload.user_image = staged.fileUrl;
    if (removeStaged) payload.remove_image = "1";
    // The OTP message language follows the portal's own language switch.
    payload.ui_language = language;
    return payload;
  };

  const requestOtp = async () => {
    if (sending || verifying || uploadingImage) return;

    if (!hasChanges) {
      toast.info(copy.nothingToChange);
      return;
    }

    setFormError(null);
    setSending(true);
    try {
      const payload = buildPayload();
      pendingPayloadRef.current = payload;

      const result = await postJson<ProfileOtpStartPayload>("/api/auth/profile/otp", payload);

      setOtpTarget(result.target || result.email || result.mobile || "");
      setResendIn(result.resend_after_seconds || 30);
      setCode("");
      setStep("otp");
      toast.success(copy.otpSentTo(result.target || result.email || result.mobile || ""));
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      const message = looksTechnical(raw) || !raw ? copy.genericError : raw;
      setFormError(message);
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const resendOtp = async () => {
    if (resendIn > 0 || sending) return;

    setSending(true);
    try {
      const result = await postJson<ProfileOtpStartPayload>(
        "/api/auth/profile/otp",
        pendingPayloadRef.current
      );
      setResendIn(result.resend_after_seconds || 30);
      toast.success(copy.otpSentTo(result.target || result.email || result.mobile || ""));
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      toast.error(looksTechnical(raw) || !raw ? copy.genericError : raw);
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (verifying || sending) return;

    if (!code.trim()) {
      toast.warning(copy.otpInvalid);
      return;
    }

    setVerifying(true);
    try {
      const result = await postJson<ProfileUpdateResult>("/api/auth/profile/otp/verify", {
        otp: code.trim(),
      });

      if (result?.user) setSession(result.user);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);

      toast.success(copy.saved, copy.savedTitle);
      reset();
      onClose();
    } catch (caught) {
      const raw = caught instanceof Error ? caught.message : "";
      toast.error(looksTechnical(raw) || !raw ? copy.genericError : raw);
    } finally {
      setVerifying(false);
    }
  };

  /** One field, rendered by the ERP's fieldtype. */
  const renderField = (field: ProfileFieldMeta) => {
    const value = values[field.fieldname] ?? "";
    const label = copy.fieldLabels[field.fieldname] ?? field.label;
    const isTextarea = TEXTAREA_FIELDTYPES.has(field.fieldtype) || field.fieldname === "bio";
    const isDate = field.fieldtype === "Date";
    const isChoice =
      field.fieldtype === "Select" || (field.fieldtype === "Link" && field.options.length > 0);

    return (
      <label key={field.fieldname} className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>
          {label}
          {field.required ? " *" : ""}
        </span>

        {isTextarea ? (
          <textarea
            rows={3}
            value={value}
            onChange={(event) => setField(field.fieldname, event.target.value)}
            className={`${FIELD_CLASS} resize-y`}
          />
        ) : isDate ? (
          <input
            type="date"
            value={value}
            onChange={(event) => setField(field.fieldname, event.target.value)}
            className={FIELD_CLASS}
          />
        ) : isChoice ? (
          <select
            value={value}
            onChange={(event) => setField(field.fieldname, event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">{copy.selectPlaceholder}</option>
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => setField(field.fieldname, event.target.value)}
            className={FIELD_CLASS}
          />
        )}
      </label>
    );
  };

  /** The mobile number is a recovery channel — always shown, never editable. */
  const renderMobileReadonly = () => (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL_CLASS}>{copy.fieldLabels.mobile_no}</span>
      <span className="relative block">
        <input
          type="text"
          value={formatBdMobile(data?.mobile_no)}
          readOnly
          disabled
          aria-readonly="true"
          className={`${FIELD_CLASS} pr-10 opacity-80`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 grid w-10 place-items-center text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]">
          <FiLock size={14} />
        </span>
      </span>
      <span className="text-[11px] leading-snug text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
        {copy.mobileLocked}
      </span>
    </label>
  );

  const otpStep = step === "otp";

  return (
    <DashboardModal
      open={open}
      title={otpStep ? copy.otpTitle : copy.editTitle}
      subtitle={otpStep ? copy.otpSubtitle : copy.editSubtitle}
      closeLabel={copy.close}
      onClose={close}
      widthClass="max-w-[560px]"
      logo
      footer={
        otpStep ? (
          <>
            <button
              type="button"
              onClick={() => setStep("form")}
              disabled={verifying}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] disabled:opacity-60"
            >
              <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.otpBack}</span>
            </button>

            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifying || sending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                <FiShield size={15} />
                {verifying ? copy.otpVerifying : copy.otpVerify}
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={close}
              disabled={sending}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-2.5 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] disabled:opacity-60"
            >
              <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
            </button>

            <button
              type="button"
              onClick={requestOtp}
              disabled={sending || isLoading || isError || uploadingImage}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-action)_80%,transparent)] transition hover:bg-[var(--color-action-hover)] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-white)]">
                <FiSave size={15} />
                {sending ? copy.saving : copy.save}
              </span>
            </button>
          </>
        )
      }
    >
      {otpStep ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] p-3.5">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-white)]">
              <FiShield size={16} />
            </span>
            <p className="text-[13px] leading-relaxed text-[var(--color-primary)]">
              {copy.otpSentTo(otpTarget || email)}
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>{copy.otpLabel}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              placeholder={copy.otpPlaceholder}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${FIELD_CLASS} text-center text-[18px] tracking-[0.5em]`}
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
              <FiCheckCircle size={14} />
              {copy.otpSubtitle}
            </span>

            <button
              type="button"
              onClick={resendOtp}
              disabled={resendIn > 0 || sending}
              className="rounded-xl px-2 py-1 transition hover:bg-[var(--color-action-tint)] disabled:opacity-50"
            >
              <span className="text-[12px] font-semibold text-[var(--color-primary)]">
                {resendIn > 0 ? copy.otpResendIn(resendIn) : copy.otpResend}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Identity + picture strip */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-white))] p-3.5">
            <div className="relative shrink-0">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={name}
                  className="h-[58px] w-[58px] rounded-full object-cover"
                />
              ) : (
                <UserAvatar
                  user={{ full_name: name, name, user_image: removeStaged ? "" : data?.user_image }}
                  size={58}
                  rounded="rounded-full"
                />
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                aria-label={copy.imageChoose}
                className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--color-white)] bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:opacity-90 disabled:opacity-60"
              >
                <FiCamera size={13} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[var(--color-primary)]">{name}</p>
              {email ? (
                <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {email}
                </p>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-2.5 py-1 transition hover:border-[var(--color-action)] hover:bg-[var(--color-action-tint)] disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-primary)]">
                    <FiImage size={12} />
                    {uploadingImage ? copy.imageUploading : previewSrc ? copy.imageChange : copy.imageChoose}
                  </span>
                </button>

                {previewSrc ? (
                  <button
                    type="button"
                    onClick={() => setStaged(null)}
                    disabled={uploadingImage}
                    className="rounded-xl px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] disabled:opacity-60"
                  >
                    <span className="text-[11px] font-semibold text-[var(--color-danger-strong)]">
                      {copy.imageRemove}
                    </span>
                  </button>
                ) : null}

                {!previewSrc && hasExistingImage && !removeStaged ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStaged(null);
                      setRemoveStaged(true);
                    }}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1 transition hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-white))] disabled:opacity-60"
                  >
                    <FiTrash2 size={12} className="text-[var(--color-danger-strong)]" />
                    <span className="text-[11px] font-semibold text-[var(--color-danger-strong)]">
                      {copy.imageRemove}
                    </span>
                  </button>
                ) : null}

                {removeStaged ? (
                  <button
                    type="button"
                    onClick={() => setRemoveStaged(false)}
                    className="rounded-xl px-2 py-1 transition hover:bg-[var(--color-action-tint)]"
                  >
                    <span className="text-[11px] font-semibold text-[var(--color-primary)]">{copy.cancel}</span>
                  </button>
                ) : null}
              </div>
              <p className="mt-1.5 text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                {removeStaged ? copy.imageRemove : copy.imageHint}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handlePickImage}
            />
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
            <div className="mt-4 flex flex-col gap-5">
              {SECTION_ORDER.map((section) => {
                const list = groupedFields.get(section) ?? [];
                const isBasic = section === "basic";
                if (!list.length && !isBasic) return null;

                return (
                  <section
                    key={section}
                    className="flex flex-col gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4"
                  >
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                      {copy.sectionLabels[section] ?? section}
                    </h3>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      {isBasic ? renderMobileReadonly() : null}
                      {list.map(renderField)}
                    </div>
                  </section>
                );
              })}

              <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-3.5 py-2.5 text-[12px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                {copy.emailLocked}
              </p>

              {formError ? (
                <p className="flex items-start gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_26%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-white))] px-3.5 py-2.5 text-[13px] text-[var(--color-danger-strong)]">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={15} />
                  {formError}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </DashboardModal>
  );
}

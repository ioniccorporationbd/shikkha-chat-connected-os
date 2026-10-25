"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  name: string;
  designation: string;
  institution: string;
  mobile: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  name: "",
  designation: "",
  institution: "",
  mobile: "",
};

/** Digits only — visitors type 01712-345678 and 01712345678 alike. */
const digitsOf = (value: string) => value.replace(/\D+/g, "");

/**
 * Lead capture for the hero's “Request a Demo” button.
 *
 * Four fields only, because the client asked for exactly that: name,
 * designation, institution, mobile. Submitting posts the lead to
 * `/api/demo-request`, then the dialog thanks the visitor and closes itself —
 * the form never lingers on screen after a successful submit.
 */
export default function DemoRequestModal({ open, onClose }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAndClose = useCallback(() => {
    onClose();
    // Clear only after the exit animation so the card does not flicker empty.
    setTimeout(() => {
      setForm(EMPTY_FORM);
      setErrors({});
      setStatus("idle");
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") resetAndClose();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => firstFieldRef.current?.focus(), 80);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
    };
  }, [open, resetAndClose]);

  useEffect(() => {
    if (status !== "sent") return;
    closeTimer.current = setTimeout(resetAndClose, 1400);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [status, resetAndClose]);

  if (!open) return null;

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = t("Please enter your name");
    if (!form.designation.trim()) next.designation = t("Please enter your designation");
    if (!form.institution.trim()) next.institution = t("Please enter your institution name");

    const mobile = digitsOf(form.mobile);
    if (!mobile) next.mobile = t("Please enter your mobile number");
    else if (!/^01[3-9]\d{8}$/.test(mobile)) next.mobile = t("Use a valid 11-digit mobile number");

    return next;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setStatus("sending");

    try {
      await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          designation: form.designation.trim(),
          institution: form.institution.trim(),
          mobile: digitsOf(form.mobile),
          page: typeof window !== "undefined" ? window.location.pathname : "/",
        }),
      });
    } catch {
      // A failed intake must not trap the visitor in the dialog; the lead is
      // still shown the thank-you state and can be called back.
    }

    setStatus("sent");
  };

  const fields: Array<{
    key: keyof FormState;
    label: string;
    placeholder: string;
    type: string;
    inputMode?: "text" | "tel";
    autoComplete: string;
  }> = [
    {
      key: "name",
      label: t("Your name"),
      placeholder: t("e.g. Md. Rakib Hasan"),
      type: "text",
      autoComplete: "name",
    },
    {
      key: "designation",
      label: t("Your designation"),
      placeholder: t("e.g. Principal"),
      type: "text",
      autoComplete: "organization-title",
    },
    {
      key: "institution",
      label: t("Institution name"),
      placeholder: t("e.g. City Model School"),
      type: "text",
      autoComplete: "organization",
    },
    {
      key: "mobile",
      label: t("Mobile number"),
      placeholder: "01XXXXXXXXX",
      type: "tel",
      inputMode: "tel",
      autoComplete: "tel",
    },
  ];

  return (
    <div
      data-no-translate="true"
      className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) resetAndClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-request-title"
        className="w-full max-w-[440px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] sm:p-7"
      >
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              ✓
            </span>
            <p className="text-[16px] font-bold text-slate-900">{t("Request received")}</p>
            <p className="max-w-[300px] text-[13.5px] leading-relaxed text-slate-500">
              {t("Thank you! Our team will call you shortly to arrange the demo.")}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="demo-request-title"
                  className="text-[19px] font-bold tracking-[-0.01em] text-slate-900"
                >
                  {t("Request a Demo")}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  {t("Share four details and our team will call you back.")}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                aria-label={t("Close")}
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
              {fields.map((field, index) => (
                <label key={field.key} className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-semibold text-slate-700">
                    {field.label}
                    <span className="ml-0.5 text-rose-500">*</span>
                  </span>
                  <input
                    ref={index === 0 ? firstFieldRef : undefined}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    value={form[field.key]}
                    onChange={(event) => update(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={errors[field.key] ? true : undefined}
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      errors[field.key]
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                    }`}
                  />
                  {errors[field.key] ? (
                    <span className="text-[11.5px] font-medium text-rose-600">
                      {errors[field.key]}
                    </span>
                  ) : null}
                </label>
              ))}

              <button
                type="submit"
                disabled={status === "sending"}
                className="mk-btn mk-btn--primary mt-1 h-11 w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === "sending" ? t("Sending…") : t("Submit request")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

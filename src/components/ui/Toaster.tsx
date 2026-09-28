"use client";

import { useEffect, useState } from "react";
import { FiAlertOctagon, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { useToastStore, type ToastItem, type ToastType } from "@/lib/ui/toast";

const TITLES: Record<"bn" | "en", Record<ToastType, string>> = {
  bn: { error: "ত্রুটি", success: "সফল", warning: "সতর্কতা", info: "তথ্য" },
  en: { error: "Error", success: "Success", warning: "Warning", info: "Info" },
};

const LOOK: Record<
  ToastType,
  { accent: string; surface: string; border: string; icon: string; ring: string }
> = {
  error: {
    accent: "var(--color-danger)",
    surface: "color-mix(in srgb, var(--color-danger) 7%, var(--color-white))",
    border: "color-mix(in srgb, var(--color-danger) 26%, transparent)",
    icon: "var(--color-danger-strong)",
    ring: "color-mix(in srgb, var(--color-danger) 16%, transparent)",
  },
  success: {
    accent: "var(--color-success)",
    surface: "color-mix(in srgb, var(--color-success) 8%, var(--color-white))",
    border: "color-mix(in srgb, var(--color-success) 26%, transparent)",
    icon: "var(--color-success)",
    ring: "color-mix(in srgb, var(--color-success) 16%, transparent)",
  },
  warning: {
    accent: "var(--color-warning)",
    surface: "color-mix(in srgb, var(--color-warning) 10%, var(--color-white))",
    border: "color-mix(in srgb, var(--color-warning) 30%, transparent)",
    icon: "color-mix(in srgb, var(--color-warning) 85%, var(--color-black))",
    ring: "color-mix(in srgb, var(--color-warning) 18%, transparent)",
  },
  info: {
    accent: "var(--color-primary)",
    surface: "color-mix(in srgb, var(--color-secondary) 22%, var(--color-white))",
    border: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
    icon: "var(--color-primary)",
    ring: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
  },
};

function Icon({ type }: { type: ToastType }) {
  const size = 18;
  if (type === "success") return <FiCheckCircle size={size} />;
  if (type === "warning") return <FiAlertTriangle size={size} />;
  if (type === "error") return <FiAlertOctagon size={size} />;
  return <FiInfo size={size} />;
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { language } = useLanguage();
  const [leaving, setLeaving] = useState(false);
  const look = LOOK[item.type];
  const title = item.title ?? TITLES[language === "en" ? "en" : "bn"][item.type];

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setLeaving(true), item.duration);
    const goneTimer = window.setTimeout(onClose, item.duration + 200);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(goneTimer);
    };
  }, [item.duration, onClose]);

  return (
    <div
      role={item.type === "error" ? "alert" : "status"}
      aria-live={item.type === "error" ? "assertive" : "polite"}
      style={{ background: look.surface, borderColor: look.border }}
      className={[
        "pointer-events-auto relative flex w-full max-w-[380px] items-start gap-3 overflow-hidden rounded-2xl border py-3 pl-4 pr-3 shadow-[0_22px_48px_-22px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] backdrop-blur",
        leaving ? "animate-sc-toast-out" : "animate-sc-toast-in",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: look.accent }}
      />
      <span
        aria-hidden
        style={{ color: look.icon, boxShadow: `0 0 0 6px ${look.ring}` }}
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-white)]"
      >
        <Icon type={item.type} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[var(--color-primary)]">{title}</span>
        <span className="mt-0.5 block break-words text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-primary)_82%,transparent)]">
          {item.message}
        </span>
      </span>

      <button
        type="button"
        onClick={() => {
          setLeaving(true);
          window.setTimeout(onClose, 160);
        }}
        aria-label="Dismiss"
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] hover:text-[var(--color-primary)]"
      >
        <FiX size={15} />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[200] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onClose={() => dismiss(item.id)} />
      ))}
    </div>
  );
}

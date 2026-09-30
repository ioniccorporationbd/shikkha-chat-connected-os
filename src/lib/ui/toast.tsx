"use client";

import { createElement } from "react";
import { toast as rtToast, type ToastOptions } from "react-toastify";

import ToastBody from "@/components/ui/ToastBody";

/**
 * Single toast entry point for every surface.
 *
 * Backed by `react-toastify` (platform requirement) while keeping the
 * project's original `toast.<type>(message, title?)` API, so no call site had
 * to change. Colours follow the design tokens — primary theme for normal/info,
 * danger for errors, success/warning for the rest — and body text is always
 * white. Rendering goes through `<ToastBody />`, which supplies the premium
 * card look and receives react-toastify's injected `closeToast`.
 */
export type ToastType = "error" | "success" | "warning" | "info";

const DURATION: Record<ToastType, number> = {
  error: 6500,
  success: 4200,
  warning: 5200,
  info: 4600,
};

function emit(type: ToastType, message: string, title?: string): string {
  const options: ToastOptions = {
    type,
    autoClose: DURATION[type],
    closeButton: false,
    icon: false,
    className: `sc-toast sc-toast--${type}`,
  };

  const id = rtToast(createElement(ToastBody, { type, message, title }), options);

  return String(id);
}

export const toast = {
  /** Error / danger — red. */
  error: (message: string, title?: string): string => emit("error", message, title),
  /** Success — success token. */
  success: (message: string, title?: string): string => emit("success", message, title),
  /** Warning — warning token. */
  warning: (message: string, title?: string): string => emit("warning", message, title),
  /** Info / normal — primary theme colour. */
  info: (message: string, title?: string): string => emit("info", message, title),
  /** Alias for {@link toast.info} — the project's "normal" toast. */
  normal: (message: string, title?: string): string => emit("info", message, title),
  dismiss: (id: string): void => {
    rtToast.dismiss(id);
  },
};

"use client";

import { create } from "zustand";

/**
 * A tiny, framework-agnostic toast bus.
 *
 * Forms call `toast.error(...)` / `toast.success(...)` from anywhere (event
 * handlers, effects); the single `<Toaster />` mounted in the root layout
 * subscribes and paints the stack. This keeps every surface using one visual
 * language instead of each form rendering its own inline error text.
 */
export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  error: 6500,
  success: 4200,
  warning: 5200,
  info: 4600,
};

interface ToastState {
  toasts: ToastItem[];
  push: (input: {
    type: ToastType;
    message: string;
    title?: string;
    duration?: number;
    id?: string;
  }) => string;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (input) => {
    counter += 1;
    const id = input.id ?? `t_${Date.now().toString(36)}_${counter.toString(36)}`;
    const item: ToastItem = {
      id,
      type: input.type,
      title: input.title,
      message: input.message,
      duration: input.duration ?? DEFAULT_DURATION[input.type],
    };
    // Keep the stack short — the last four are always the most relevant.
    set((state) => ({ toasts: [...state.toasts, item].slice(-4) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

function emit(type: ToastType, message: string, title?: string): string {
  return useToastStore.getState().push({ type, message, title });
}

export const toast = {
  error: (message: string, title?: string): string => emit("error", message, title),
  success: (message: string, title?: string): string => emit("success", message, title),
  warning: (message: string, title?: string): string => emit("warning", message, title),
  info: (message: string, title?: string): string => emit("info", message, title),
  dismiss: (id: string): void => useToastStore.getState().dismiss(id),
};

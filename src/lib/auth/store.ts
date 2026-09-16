"use client";

import { create } from "zustand";

import type { SessionUser } from "@/lib/auth/types";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  status: AuthStatus;
  user: SessionUser | null;
  setSession: (user: SessionUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  reset: () => void;
}

/**
 * Client-side mirror of the ERP session, hydrated once by `AuthBootstrap`
 * from `GET /api/auth/me`. It exists so chrome that lives outside React Query
 * (the sidebar button) can render auth state without its own fetch.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Starts as "guest", never "loading": the sidebar sign-in button is part of
  // the server-rendered HTML, so the first client render must agree with it.
  // `AuthBootstrap` upgrades this to "authenticated" once /api/auth/me answers.
  status: "guest",
  user: null,
  setSession: (user) => set({ user, status: user ? "authenticated" : "guest" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "guest", user: null }),
}));

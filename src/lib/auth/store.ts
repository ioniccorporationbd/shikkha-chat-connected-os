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
  status: "loading",
  user: null,
  setSession: (user) => set({ user, status: user ? "authenticated" : "guest" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: "guest", user: null }),
}));

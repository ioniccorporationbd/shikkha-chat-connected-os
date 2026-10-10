"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

/**
 * Project-wide "reload" registry.
 *
 * The dashboard shell owns ONE reload button (the header refresh, plus the
 * account-menu "রিফ্রেশ করুন" entry). Some panels — Payment Entry, Service Build,
 * Check-In/Out, Expense Claim, Customer list — keep their own local state (they
 * are NOT React Query queries), so a plain dashboard refetch never refreshes
 * them. That is why the shared reload button used to look "dead" on those pages.
 *
 * A panel whose data lives in local state registers its own refresh function
 * here; the shell's single reload button then drives it. On the Overview (no
 * registrations) the shell falls back to its own snapshot-compare reload.
 */
export type ReloadHandler = () => unknown;

interface ReloadRegistryValue {
  register: (handler: ReloadHandler) => () => void;
}

const ReloadRegistryContext = createContext<ReloadRegistryValue>({
  register: () => () => {},
});

export function ReloadRegistryProvider({
  value,
  children,
}: {
  value: ReloadRegistryValue;
  children: React.ReactNode;
}) {
  return <ReloadRegistryContext.Provider value={value}>{children}</ReloadRegistryContext.Provider>;
}

/** Created once by the shell; hands the `value` to the provider and exposes `runAll`. */
export function useReloadRegistry() {
  const handlers = useRef(new Set<ReloadHandler>());

  const register = useCallback((handler: ReloadHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);

  const runAll = useCallback(async () => {
    await Promise.all(
      [...handlers.current].map(async (handler) => {
        try {
          await handler();
        } catch {
          /* a single panel failing must not block the others */
        }
      }),
    );
  }, []);

  const hasHandlers = useCallback(() => handlers.current.size > 0, []);

  const value = useMemo<ReloadRegistryValue>(() => ({ register }), [register]);

  return { value, runAll, hasHandlers };
}

/**
 * Register a panel's own refresh with the shell's shared reload button.
 * Call it with the panel's reload callback (stable via useCallback there).
 */
export function useReloadHandler(handler: ReloadHandler) {
  const { register } = useContext(ReloadRegistryContext);
  useEffect(() => register(handler), [register, handler]);
}

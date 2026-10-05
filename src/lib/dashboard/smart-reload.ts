"use client";

import { toast } from "@/lib/ui/toast";

export interface SmartReloadCopy {
  /** Nothing changed — a lightweight refresh already happened. */
  unchanged: string;
  /** Something changed — an automatic, one-time reload is starting. */
  changed: string;
  /** The refresh request itself failed. */
  failed: string;
}

export type SmartReloadOutcome = "unchanged" | "changed" | "failed";

interface RefetchResult<T> {
  data: T | null | undefined;
  error?: unknown;
}

/**
 * The Dashboard "Smart Reload": snapshot → refetch → compare.
 *
 *   - unchanged → keep the freshly refetched state, show a calm toast (no reload)
 *   - changed   → one hard browser reload so every panel resyncs
 *   - failure   → a failed toast, never a reload
 *
 * It runs exactly once per call, so it can never loop. Shared by the Overview
 * and the Payment History panel so both behave identically — do not fork it.
 */
export async function runSmartReload<T>({
  before,
  refetch,
  snapshot,
  copy,
}: {
  before: T | null | undefined;
  refetch: () => Promise<RefetchResult<T>>;
  snapshot: (value: T | null | undefined) => string;
  copy: SmartReloadCopy;
}): Promise<SmartReloadOutcome> {
  const beforeFp = snapshot(before);

  let result: RefetchResult<T>;
  try {
    result = await refetch();
  } catch {
    toast.error(copy.failed);
    return "failed";
  }

  if (result.error) {
    toast.error(copy.failed);
    return "failed";
  }

  const afterFp = snapshot(result.data);

  if (beforeFp && afterFp && beforeFp !== afterFp) {
    toast.info(copy.changed);
    if (typeof window !== "undefined") window.location.reload();
    return "changed";
  }

  toast.success(copy.unchanged);
  return "unchanged";
}

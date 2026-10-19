"use client";

import { useEffect } from "react";

import DynamicError from "@/components/errors/DynamicError";
import { reportClientError } from "@/lib/log/report-error";

/**
 * Route-level error boundary.
 *
 * A React render error never reaches `window.onerror` (React catches it first and
 * shows this boundary instead), so this is the only place a crashed screen can be
 * reported. Every unhandled render error therefore lands in the browser console
 * AND in the ERP Error Log at https://dash.shikkhachat.com/desk/system/error-log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      scope: "route:error-boundary",
      message: error?.message || "A screen failed to render.",
      detail: {
        name: error?.name,
        digest: error?.digest,
        stack: error?.stack,
        route: typeof window === "undefined" ? undefined : window.location.pathname,
      },
    });
  }, [error]);

  return <DynamicError status={500} onRetry={reset} requestId={error?.digest} />;
}

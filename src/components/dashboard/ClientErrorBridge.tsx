"use client";

import { useEffect } from "react";

import { reportClientError } from "@/lib/log/report-error";

/**
 * Catches the two browser-level failures a React app cannot recover from and
 * forwards them to `reportClientError`, i.e. the console **and** the ERP Error
 * Log (`/desk/system/error-log`). Mounted once by the dashboard shell so an
 * uncaught exception or an unhandled rejection is never invisible.
 */
export default function ClientErrorBridge() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({
        scope: "window:error",
        message: event.message || "Uncaught error",
        detail: {
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error instanceof Error ? event.error.stack : undefined,
        },
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      const shaped = reason as { message?: string; stack?: string } | null;

      reportClientError({
        scope: "window:unhandledrejection",
        message:
          (typeof shaped?.message === "string" && shaped.message) ||
          (typeof reason === "string" ? reason : "Unhandled promise rejection"),
        detail: { stack: shaped?.stack },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

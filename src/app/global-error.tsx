"use client";

import DynamicError from "@/components/errors/DynamicError";

/**
 * Last-resort boundary: renders its own <html>/<body> because the root layout
 * may itself have failed. It carries no providers, so <DynamicError /> falls
 * back to the default language safely.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="bn" data-lang="bn" translate="no" className="h-full">
      <body className="min-h-full bg-[var(--color-white)]">
        <DynamicError kind="server" onRetry={reset} />
      </body>
    </html>
  );
}

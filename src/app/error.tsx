"use client";

import DynamicError from "@/components/errors/DynamicError";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DynamicError status={500} onRetry={reset} requestId={error?.digest} />;
}

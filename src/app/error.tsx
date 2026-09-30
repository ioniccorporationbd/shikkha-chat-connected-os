"use client";

import DynamicError from "@/components/errors/DynamicError";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DynamicError kind="server" onRetry={reset} />;
}

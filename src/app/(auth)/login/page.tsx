import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "লগইন · Shikkha Chat",
  description: "Sign in to the Shikkha Chat panel.",
};

export default function LoginPage() {
  return (
    /* useSearchParams() inside LoginForm needs a Suspense boundary. */
    <Suspense
      fallback={
        <div className="relative z-10 h-[420px] w-full max-w-[460px] rounded-[28px] border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)]" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

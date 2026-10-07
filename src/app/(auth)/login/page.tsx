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
        <div className="relative z-10 h-[440px] w-full max-w-[468px] rounded-[30px] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)] shadow-[0_36px_80px_-40px_color-mix(in_srgb,var(--color-action)_38%,transparent)]" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

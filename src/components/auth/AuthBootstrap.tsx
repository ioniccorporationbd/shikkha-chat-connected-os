"use client";

import { useEffect } from "react";

import { useSessionQuery } from "@/lib/auth/queries";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Hydrates the auth store from the ERP session once per page load. Mounted in
 * the root layout so the sidebar button and the dashboard agree on who is
 * signed in.
 */
export default function AuthBootstrap() {
  const { data, isError, isSuccess } = useSessionQuery();
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (isSuccess) {
      setSession(data?.authenticated ? data.user : null);
      return;
    }

    if (isError) {
      setSession(null);
    }
  }, [data, isError, isSuccess, setSession]);

  return null;
}

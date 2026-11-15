"use client";

import { useEffect } from "react";

/**
 * Registers the Shikkha Chat service worker (public/sw.js) so the app becomes
 * installable and can serve cached assets / an offline page.
 *
 * Only runs in a production build — in `next dev` a service worker would cache
 * the dev bundle and fight hot-reload (same policy GQGL uses). To test PWA
 * behaviour locally use `npm run build && npm start` (localhost is a secure
 * context, so the SW + install prompt work there too).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* registration failures are non-fatal */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

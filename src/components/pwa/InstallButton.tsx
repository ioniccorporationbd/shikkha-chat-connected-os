"use client";

import { useCallback, useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "shikkha.pwa.install-dismissed";

/**
 * Floating "install app" pill, driven by the browser's `beforeinstallprompt`
 * event (Android / desktop Chrome & Edge). Hidden when the app is already
 * running standalone, or once the user dismisses it.
 */
export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadyStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    if (alreadyStandalone || dismissed) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    setVisible(false);
  }, [deferred]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:justify-end sm:pr-6">
      <div className="flex items-center gap-2 rounded-full border border-[#e6ebf2] bg-white py-1.5 pl-2 pr-1.5 shadow-[0_12px_30px_-10px_rgba(11,37,69,0.35)]">
        <button
          type="button"
          onClick={install}
          className="flex items-center gap-2 rounded-full bg-[#0b2545] px-4 py-2 text-[13px] font-semibold text-white transition active:opacity-80"
        >
          <FiDownload className="h-4 w-4" aria-hidden />
          অ্যাপ ইনস্টল করুন
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="বন্ধ করুন"
          className="grid h-8 w-8 place-items-center rounded-full text-[#8a97ab] transition hover:bg-[#f2f5f9]"
        >
          <FiX className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

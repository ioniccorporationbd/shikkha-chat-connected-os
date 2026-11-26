"use client";

/**
 * Shared client-side store for the "saved sections / saved products"
 * selection used by the Middle Section right sidebar (SectionPanel save
 * button) and the bottom product router section (ProductRouterSection).
 *
 * Both ends read and write the SAME localStorage key and broadcast the SAME
 * custom event, so a section saved from the right sidebar appears instantly
 * in the bottom "সংরক্ষিত / Saved" area and vice-versa. No backend calls.
 */

import { useCallback, useEffect, useState } from "react";

export const SAVED_SECTIONS_STORAGE_KEY = "connected-os-saved-products";

/** Fired on the window whenever the saved set changes (same tab). */
export const SAVED_SECTIONS_EVENT = "connected-os-saved-products-changed";

export function readSavedSections(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_SECTIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function persistSavedSections(ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SAVED_SECTIONS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable (private mode / quota) — keep going, event still fires */
  }

  window.dispatchEvent(
    new CustomEvent(SAVED_SECTIONS_EVENT, { detail: { ids } })
  );
}

export function isSectionSaved(id: string): boolean {
  return readSavedSections().includes(id);
}

/** Toggle a section/product in the saved set. Returns the new set. */
export function toggleSavedSection(id: string): string[] {
  const current = readSavedSections();
  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];

  persistSavedSections(next);
  return next;
}

/** Force a saved state for a section/product. Returns the new set. */
export function setSectionSaved(id: string, saved: boolean): string[] {
  const current = readSavedSections();
  const has = current.includes(id);

  if (saved === has) return current;

  const next = saved
    ? [...current, id]
    : current.filter((item) => item !== id);

  persistSavedSections(next);
  return next;
}

/**
 * React hook around the shared store. Subscribes to the in-tab custom event
 * and the cross-tab `storage` event so every consumer (right sidebar panels,
 * bottom saved area) stays in sync. Starts empty so SSR / first paint match,
 * then hydrates from localStorage on mount.
 */
export function useSavedSections() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSaved(readSavedSections());

    sync();

    window.addEventListener(SAVED_SECTIONS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SAVED_SECTIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setSaved(toggleSavedSection(id));
  }, []);

  const set = useCallback((id: string, value: boolean) => {
    setSaved(setSectionSaved(id, value));
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, set, isSaved };
}

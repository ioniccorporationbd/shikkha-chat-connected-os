"use client";

import { useSyncExternalStore } from "react";

/*
 * -------------------------------------------------------------------------
 * ROLE SUB-ROUTE FOCUS
 *
 * Tiny shared store that lets the MIDDLE galactic scene (a role's sub-route
 * circles) tell the RIGHT rail panel (the same role's documentation card) which
 * sub-route the user clicked. Both live in different trees and neither owns the
 * other, so a 20-line external store is all that is needed — no context
 * provider, no prop drilling, no re-render of the whole page.
 *
 * The rule for this documentation area: the focused sub-route is described by
 * its TITLE and its work, never by its internal path (e.g. the value of
 * `/dashboard/student/ai-pathshala/lessons` is not printed in the UI).
 * -------------------------------------------------------------------------
 */

export type RoleRouteFocus = { roleKey: string; path: string } | null;

let focus: RoleRouteFocus = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setRoleRouteFocus(roleKey: string, path: string | null) {
  const next: RoleRouteFocus = path ? { roleKey, path } : null;
  if (focus?.roleKey === next?.roleKey && focus?.path === next?.path) return;
  focus = next;
  emit();
}

export function getRoleRouteFocus(): RoleRouteFocus {
  return focus;
}

export function subscribeRoleRouteFocus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Element id of the right-rail "selected sub-route" card of a role. */
export function roleRouteFocusCardId(roleKey: string): string {
  return `role-route-focus-${roleKey}`;
}

export function useRoleRouteFocus(): RoleRouteFocus {
  return useSyncExternalStore(
    subscribeRoleRouteFocus,
    getRoleRouteFocus,
    () => null,
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";

import type { SessionUser } from "@/lib/auth/types";

type AvatarUser = Pick<SessionUser, "full_name" | "name"> & { user_image?: string };

/** One- or two-letter monogram, used whenever there is no picture to show. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "?";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

/**
 * Resolve the user's picture to a URL the browser can actually load.
 *
 * The ERP stores `user_image` as a path on the *ERP* host (`/files/...`) or as an
 * absolute URL — neither is reachable from the portal origin. Everything goes
 * through `/api/auth/avatar`, which resolves it server-side with the session
 * cookie. `?v=` keys the URL to the stored path so a replaced picture is not
 * served from a stale cache.
 */
export function avatarSrc(user: AvatarUser | null | undefined): string | null {
  const image = (user?.user_image ?? "").trim();
  if (!image) return null;

  return `/api/auth/avatar?v=${encodeURIComponent(image)}`;
}

type UserAvatarProps = {
  user: AvatarUser | null | undefined;
  size?: number;
  /** `solid`: brand fill + white monogram. `soft`: white fill + brand monogram. */
  tone?: "solid" | "soft";
  rounded?: string;
  className?: string;
};

/**
 * Profile picture with a monogram fallback.
 *
 * The monogram is what renders when the picture is absent, so server and client
 * agree on the first paint; the picture only replaces it once the browser has
 * loaded it, and the monogram comes back if the image fails.
 */
export default function UserAvatar({
  user,
  size = 32,
  tone = "solid",
  rounded = "rounded-xl",
  className = "",
}: UserAvatarProps) {
  const name = user?.full_name || user?.name || "";
  const src = avatarSrc(user);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  const toneClass =
    tone === "soft"
      ? "border border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)]"
      : "bg-[var(--color-primary)] text-[var(--color-white)]";

  return (
    <span
      className={[
        "relative grid shrink-0 place-items-center overflow-hidden font-semibold",
        rounded,
        toneClass,
        className,
      ].join(" ")}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name}
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span data-no-translate="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}

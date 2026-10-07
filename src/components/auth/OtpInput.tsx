"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * One shared six-box OTP field for the whole app.
 *
 * Behaviour (task-standard, used by login / registration / reset OTP steps):
 *  - initial focus lands on the first empty box automatically
 *  - typing a digit auto-advances to the next box
 *  - Backspace on an empty box steps back and clears the previous one
 *  - pasting a full code (e.g. 123456) fills every box in one go
 *  - partial paste fills as many boxes as available
 *  - only digits are ever accepted
 *  - `inputMode="numeric"` for the mobile numeric keyboard
 *  - each box has an aria-label ("OTP digit N") and is keyboard reachable
 *
 * It is intentionally internal-stateful (seeded from `value`) and reports every
 * change up via `onChange`, firing `onComplete` exactly once when the code
 * becomes full — so a parent never has to fight a controlled input, and a
 * double-submit can't happen. Remount (or change `key`) to reset it.
 */
export default function OtpInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  loading = false,
  error = false,
  autoFocus = true,
  ariaLabelPrefix = "OTP digit",
  className = "",
}: {
  value?: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  ariaLabelPrefix?: string;
  className?: string;
}) {
  const seed = useMemo(
    () =>
      Array.from({ length }, (_, i) =>
        /[0-9]/.test(value[i] ?? "") ? value[i] : "",
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // seed only on mount — OtpInput keeps its own state afterwards
  );
  const [chars, setChars] = useState<string[]>(seed);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const submitted = useRef<string | null>(null);
  const locked = disabled || loading;

  // Initial focus: first empty box (falls back to the last box when full).
  useEffect(() => {
    if (!autoFocus || locked) return;
    const id = requestAnimationFrame(() => {
      const firstEmpty = seed.findIndex((c) => !c);
      refs.current[firstEmpty === -1 ? length - 1 : firstEmpty]?.focus();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next: string[]) => {
    setChars(next);
    const joined = next.join("");
    onChange(joined);
    if (joined.length === length && /^\d+$/.test(joined)) {
      if (submitted.current !== joined) {
        submitted.current = joined;
        onComplete?.(joined);
      }
    } else {
      submitted.current = null;
    }
  };

  const focusAt = (i: number) => {
    refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();
  };

  const handleChange = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      const next = [...chars];
      next[i] = "";
      commit(next);
      return;
    }
    const next = [...chars];
    let idx = i;
    for (const d of digits) {
      if (idx >= length) break;
      next[idx] = d;
      idx += 1;
    }
    commit(next);
    focusAt(idx);
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...chars];
      if (next[i]) {
        next[i] = "";
        commit(next);
      } else if (i > 0) {
        next[i - 1] = "";
        commit(next);
        focusAt(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      const next = [...chars];
      next[i] = "";
      commit(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = [...chars];
    let idx = i;
    for (const d of text) {
      if (idx >= length) break;
      next[idx] = d;
      idx += 1;
    }
    commit(next);
    focusAt(idx);
  };

  return (
    <div
      role="group"
      aria-label="One-time password"
      className={`flex items-center gap-2 ${className}`}
    >
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          value={c}
          disabled={locked}
          aria-label={`${ariaLabelPrefix} ${i + 1}`}
          aria-invalid={error || undefined}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={`aspect-square w-full min-w-0 max-w-[52px] flex-1 rounded-xl border text-center text-[18px] font-semibold text-[var(--color-primary)] outline-none transition disabled:opacity-60 sm:text-[20px] ${
            error
              ? "border-[var(--color-danger-strong)] bg-[var(--color-white)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-danger-strong)_30%,transparent)]"
              : `${
                  c
                    ? "border-[color-mix(in_srgb,var(--color-action)_38%,transparent)] bg-[var(--color-action-tint)]"
                    : "border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)]"
                } focus:border-[color-mix(in_srgb,var(--color-action)_50%,transparent)] focus:ring-2 focus:ring-[var(--color-action-ring)]`
          }`}
        />
      ))}
    </div>
  );
}

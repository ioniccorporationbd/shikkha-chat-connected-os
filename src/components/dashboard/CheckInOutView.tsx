"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiUserCheck,
} from "react-icons/fi";

import UserAvatar from "@/components/dashboard/UserAvatar";
import { ApiError, getJson, postJson } from "@/lib/api/http";
import { useSessionQuery } from "@/lib/auth/queries";
import {
  CHECKIN_HISTORY_DAYS,
  CHECKIN_MAX_RANGE_DAYS,
  checkinCopyFor,
} from "@/lib/checkin/messages";
import type {
  CheckinDay,
  CheckinHistoryPayload,
  CheckinPunchResult,
  CheckinStatus,
  GeoPoint,
} from "@/lib/checkin/types";
import { getDeviceId } from "@/lib/device/deviceId";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

const INPUT =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] bg-[var(--color-white)] px-3 py-2 text-[13px] text-[var(--color-primary)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]";

type LocationState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface CheckInOutViewProps {
  onBack?: () => void;
}

/** Parse a Frappe timestamp ("YYYY-MM-DD HH:MM:SS.ffffff" or "YYYY-MM-DD"). */
function parseStamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = value.replace(" ", "T").replace(/\.(\d{3})\d*$/, ".$1");
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Date only — "05 Oct 2026". */
function formatDate(value: string | null | undefined, locale: string): string {
  const parsed = parseStamp(value);
  if (!parsed) return (value || "").slice(0, 10);
  try {
    return parsed.toLocaleDateString(locale === "en" ? "en-GB" : "bn-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return (value || "").slice(0, 10);
  }
}

/** Time only — "09:05 AM" (hour + minute, no seconds) for history rows. */
function formatTime(value: string | null | undefined, locale: string): string {
  const parsed = parseStamp(value);
  if (!parsed) return "";
  try {
    return parsed.toLocaleTimeString(locale === "en" ? "en-US" : "bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/** Time with seconds — "03:31:42 PM" — used only by the live hero clock. */
function formatClock(value: number, locale: string): string {
  const date = new Date(value);
  try {
    return date.toLocaleTimeString(locale === "en" ? "en-US" : "bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/** A rounded info tile inside the card. */
function InfoTile({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">{title}</p>
          {hint ? (
            <p className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">{hint}</p>
          ) : null}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * The Employee Check In / Out card.
 *
 * The current state and history come from the ERP (the employee's own `Employee
 * Checkin` records), the location from the browser's Geolocation API and the
 * device id from a stable per-browser value. The employee is always resolved
 * server-side, so the browser never sends — and can never choose — an employee.
 */
export default function CheckInOutView({ onBack }: CheckInOutViewProps) {
  const { language } = useLanguage();
  const copy = checkinCopyFor(language);
  const { data: session } = useSessionQuery();
  const sessionUser = session?.user ?? null;

  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [punching, setPunching] = useState(false);

  const [history, setHistory] = useState<CheckinHistoryPayload | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  // Date-range filter (From / To). `applied` is null while the default rolling
  // window (last CHECKIN_HISTORY_DAYS calendar days) is in effect.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterError, setFilterError] = useState("");
  const [applied, setApplied] = useState<{ from: string; to: string } | null>(null);

  const [clock, setClock] = useState(() => Date.now());

  const [deviceId] = useState(getDeviceId);
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");

  const checkedIn = status?.checked_in ?? false;

  /* ------------------------------------------------------------ loaders */

  const loadStatus = useCallback(async () => {
    try {
      const data = await getJson<CheckinStatus>("/api/checkin/status?language=" + encodeURIComponent(language));
      setStatus(data);
      setLoadError("");
      setPermissionDenied(false);
      setExpired(false);
    } catch (error) {
      const err = error as ApiError;
      if (err?.code === "not_authenticated") {
        setExpired(true);
      } else if (err?.code === "not_permitted") {
        setPermissionDenied(true);
        setStatus(null);
      } else {
        setLoadError(err?.message || copy.loadFailed);
      }
    } finally {
      setLoading(false);
    }
  }, [language, copy.loadFailed]);

  const loadHistory = useCallback(
    async (range: { from: string; to: string } | null = null) => {
      setHistoryLoading(true);
      try {
        const scope = range
          ? `from_date=${encodeURIComponent(range.from)}&to_date=${encodeURIComponent(range.to)}`
          : `days=${CHECKIN_HISTORY_DAYS}`;
        const data = await getJson<CheckinHistoryPayload>(
          `/api/checkin/history?${scope}&language=${encodeURIComponent(language)}`
        );
        setHistory(data);
      } catch {
        setHistory(null);
      } finally {
        setHistoryLoading(false);
      }
    },
    [language]
  );

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationState("unavailable");
      return;
    }

    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setPoint({ latitude, longitude, geolocation: `${latitude}, ${longitude}` });
        setLocationState("granted");
      },
      (err) => {
        setPoint(null);
        setLocationState(err && err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  useEffect(() => {
    let active = true;
    // Defer the first fetches / location prompt out of the effect body so they
    // run as callbacks (not a synchronous state update during render).
    queueMicrotask(() => {
      if (!active) return;
      void loadStatus();
      void loadHistory();
      requestLocation();
    });
    return () => {
      active = false;
    };
  }, [loadStatus, loadHistory, requestLocation]);

  // A live clock with seconds, refreshed every second. The clock is only ever
  // painted inside the (client-fetched) status branch, so the server never
  // renders a timestamp — there is no SSR/client hydration mismatch.
  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  /** One-shot geolocation capture returning the point (or null). */
  const locate = useCallback((): Promise<GeoPoint | null> => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = Number(pos.coords.latitude.toFixed(6));
          const longitude = Number(pos.coords.longitude.toFixed(6));
          resolve({ latitude, longitude, geolocation: `${latitude}, ${longitude}` });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
      );
    });
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([loadStatus(), loadHistory(applied)]);
      requestLocation();
      toast.success(copy.refreshed);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, loadStatus, loadHistory, requestLocation, copy.refreshed, applied]);

  const handlePunch = useCallback(async () => {
    if (!status || punching) return;

    const logType = status.checked_in ? "OUT" : "IN";

    // Location is required to continue (graceful: only when the browser can
    // actually provide it).
    let currentPoint = point;
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      if (locationState === "denied") {
        toast.error(copy.locationRequired);
        return;
      }
      if (!currentPoint) {
        setLocationState("requesting");
        currentPoint = await locate();
        if (currentPoint) {
          setPoint(currentPoint);
          setLocationState("granted");
        } else {
          setLocationState("unavailable");
          toast.error(copy.locationError);
          return;
        }
      }
    }

    setPunching(true);
    try {
      await postJson<CheckinPunchResult>("/api/checkin/punch", {
        log_type: logType,
        device_id: deviceId,
        latitude: currentPoint?.latitude ?? null,
        longitude: currentPoint?.longitude ?? null,
        geolocation: currentPoint?.geolocation ?? "",
        language,
      });

      toast.success(logType === "IN" ? copy.successIn : copy.successOut);
      await Promise.all([loadStatus(), loadHistory(applied)]);
    } catch (error) {
      const err = error as ApiError;
      const message = err?.message || copy.requestError;
      toast.error(message);
      // The ERP refused because our view was stale (already in / out): refresh.
      if (/already/i.test(message) || err?.code === "validation_error") {
        await Promise.all([loadStatus(), loadHistory(applied)]);
      }
    } finally {
      setPunching(false);
    }
  }, [status, punching, point, locationState, locate, deviceId, language, copy, loadStatus, loadHistory, applied]);

  /** Validate the From/To pair client-side, then load that explicit range. */
  const applyFilter = useCallback(() => {
    const from = fromDate.trim();
    const to = toDate.trim();
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      setFilterError(copy.filterInvalidDate);
      return;
    }
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setFilterError(copy.filterInvalidDate);
      return;
    }
    if (start > end) {
      setFilterError(copy.filterInvalidRange);
      return;
    }
    const span = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (span > CHECKIN_MAX_RANGE_DAYS) {
      setFilterError(copy.filterRangeTooLarge);
      return;
    }
    setFilterError("");
    setApplied({ from, to });
    void loadHistory({ from, to });
  }, [fromDate, toDate, copy, loadHistory]);

  /** Back to the default rolling window (last CHECKIN_HISTORY_DAYS days). */
  const resetFilter = useCallback(() => {
    setFromDate("");
    setToDate("");
    setFilterError("");
    setApplied(null);
    void loadHistory(null);
  }, [loadHistory]);

  const locationText = useMemo(() => {
    if (point) return copy.locationReady;
    if (locationState === "requesting") return copy.locationRequesting;
    if (locationState === "denied") return copy.locationDenied;
    if (locationState === "unavailable") return copy.locationUnavailable;
    return copy.captureLocation;
  }, [point, locationState, copy]);

  const today = history?.days?.[0] ?? null;
  const clockDate = new Date(clock);

  const employeeName = status?.employee?.employee_name ?? status?.employee?.name ?? "";
  const heroLine = status?.employee
    ? `${status.employee.employee_name} · ${status.employee.name}`
    : "";

  const nowDateText = (() => {
    try {
      return clockDate.toLocaleDateString(language === "en" ? "en-GB" : "bn-BD", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return clockDate.toISOString().slice(0, 10);
    }
  })();

  const nowTimeText = formatClock(clock, language);

  const historyScopeText =
    history?.filtered && history.from_date && history.to_date
      ? copy.historyRangeHint(formatDate(history.from_date, language), formatDate(history.to_date, language))
      : copy.historyHint(history?.window_days ?? CHECKIN_HISTORY_DAYS);

  return (
    <section className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}>
      {/* ---------------------------------------------------------- header */}
      <div className="flex flex-col gap-4 border-b border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-secondary)_20%,var(--color-white))_0%,var(--color-white)_70%)] p-5 sm:flex-row sm:items-center sm:gap-3 sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_14px_30px_-16px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]">
            <FiClock size={20} />
          </span>

          <div className="min-w-0">
            <h1 className="text-[19px] font-semibold leading-tight sm:text-[21px]">{copy.heading}</h1>
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
              {copy.hint}
            </p>
          </div>
        </div>

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] sm:w-auto"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
              <FiArrowLeft size={15} />
              {copy.back}
            </span>
          </button>
        ) : null}
      </div>

      {/* ----------------------------------------------------------- body */}
      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-[128px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-[132px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                />
              ))}
            </div>
            <p className="text-center text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {copy.loading}
            </p>
          </div>
        ) : expired ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.sessionExpiredTitle}
            hint={copy.loadFailed}
            action={
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
              >
                <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.signInAgain}</span>
              </a>
            }
          />
        ) : permissionDenied ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.permissionTitle}
            hint={copy.permissionHint}
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setPermissionDenied(false);
                  void loadStatus().finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)]"
              >
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.retry}</span>
              </button>
            }
          />
        ) : loadError ? (
          <CalmState
            icon={<FiActivity size={22} />}
            title={copy.loadFailed}
            hint={loadError}
            action={
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setLoadError("");
                  void loadStatus().finally(() => setLoading(false));
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 transition hover:opacity-90"
              >
                <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.retry}</span>
              </button>
            }
          />
        ) : status && !status.linked ? (
          <CalmState icon={<FiUserCheck size={22} />} title={copy.noEmployeeTitle} hint={copy.noEmployeeHint} />
        ) : status ? (
          <div className="flex flex-col gap-4">
            {/* ------------------------------------------- hero / status */}
            <div className="flex flex-col gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar
                  user={sessionUser ?? (employeeName ? { full_name: employeeName, name: employeeName } : null)}
                  size={56}
                  rounded="rounded-3xl"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                    {copy.employeeHeading}
                  </p>
                  <p className="mt-0.5 truncate text-[15px] font-bold text-[var(--color-primary)]">
                    {status.employee?.employee_name || copy.none}
                  </p>
                  {heroLine ? (
                    <p className="truncate text-[12px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                      {heroLine}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    {checkedIn ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-3.5 py-1.5">
                        <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.checkedIn}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-3.5 py-1.5">
                        <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.checkedOut}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0 text-left lg:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  {copy.clockHeading}
                </p>
                <p className="mt-0.5 text-[22px] font-bold tabular-nums text-[var(--color-primary)]">{nowTimeText}</p>
                <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{nowDateText}</p>
              </div>
            </div>

            {/* ------------------------------------------------ info tiles */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile icon={<FiMapPin size={16} />} title={copy.locationHeading}>
                {point ? (
                  <dl className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.latitudeLabel}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-medium">{point.latitude}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                        {copy.longitudeLabel}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-medium">{point.longitude}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                    {locationText}
                  </p>
                )}

                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationState === "requesting"}
                  className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[var(--color-white)] px-3 py-2 transition hover:border-[var(--color-primary)] disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--color-primary)]">
                    <FiNavigation size={14} />
                    {point ? copy.retryLocation : copy.captureLocation}
                  </span>
                </button>
              </InfoTile>

              <InfoTile icon={<FiActivity size={16} />} title={copy.activityHeading}>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.lastIn}
                    </span>
                    <span className="text-right text-[12.5px] font-medium">
                      {status.last_in?.time ? formatTime(status.last_in.time, language) : copy.none}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.lastOut}
                    </span>
                    <span className="text-right text-[12.5px] font-medium">
                      {status.last_out?.time ? formatTime(status.last_out.time, language) : copy.none}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.locationHeading}
                    </span>
                    <span className="text-right text-[12.5px] font-medium">
                      {status.last?.latitude != null && status.last?.longitude != null
                        ? `${Number(status.last.latitude).toFixed(4)}, ${Number(status.last.longitude).toFixed(4)}`
                        : copy.noLocation}
                    </span>
                  </div>
                </div>
              </InfoTile>

              <InfoTile icon={<FiCalendar size={16} />} title={copy.todaySummaryHeading}>
                {today && today.total > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                        {copy.firstInLabel}
                      </span>
                      <span className="text-right text-[12.5px] font-medium">
                        {today.first_in ? formatTime(today.first_in, language) : copy.none}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                        {copy.lastOutLabel}
                      </span>
                      <span className="text-right text-[12.5px] font-medium">
                        {today.last_out ? formatTime(today.last_out, language) : copy.none}
                      </span>
                    </div>
                    <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">
                      {copy.multiSummary(today.in_count, today.out_count)}
                    </p>
                  </div>
                ) : (
                  <p className="text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                    {copy.noPunchesToday}
                  </p>
                )}
              </InfoTile>
            </div>

            {/* -------------------------------------------------- action bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePunch}
                disabled={punching}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-5 py-3 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-action)_85%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
                  {checkedIn ? <FiLogOut size={17} /> : <FiLogIn size={17} />}
                  {punching ? copy.working : checkedIn ? copy.checkOut : copy.checkIn}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-5 py-3 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--color-primary)]">
                  <FiRefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? copy.refreshing : copy.refresh}
                </span>
              </button>
            </div>

            {/* --------------------------------------------- date filter */}
            <div className="rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_8%,var(--color-white))] p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
                  <FiCalendar size={15} />
                </span>
                <p className="text-[12.5px] font-semibold text-[var(--color-primary)]">{copy.filterHeading}</p>
                <span className="ml-auto text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  {copy.filterDefault}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-end">
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                    {copy.fromLabel}
                  </span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className={INPUT}
                  />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[11px] font-semibold text-[color-mix(in_srgb,var(--color-primary)_60%,transparent)]">
                    {copy.toLabel}
                  </span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className={INPUT}
                  />
                </label>
                <div className="flex gap-2 sm:pb-[1px]">
                  <button
                    type="button"
                    onClick={applyFilter}
                    disabled={historyLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-action)] px-4 py-2.5 transition hover:-translate-y-0.5 hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:flex-none"
                  >
                    <span className="text-[13px] font-semibold text-[var(--color-white)]">{copy.applyFilter}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetFilter}
                    disabled={historyLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-4 py-2.5 transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    <span className="text-[13px] font-semibold text-[var(--color-primary)]">{copy.resetFilter}</span>
                  </button>
                </div>
              </div>

              {filterError ? (
                <p className="mt-2 text-[11.5px] font-medium text-[var(--color-danger-strong)]" role="alert">
                  {filterError}
                </p>
              ) : null}
            </div>

            {/* --------------------------------------------------- history */}
            <div className="mt-1 flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <h2 className="text-[15px] font-semibold text-[var(--color-primary)]">{copy.historyHeading}</h2>
                <p className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {historyScopeText}
                </p>
              </div>

              {historyLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="h-[76px] animate-pulse rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))]"
                    />
                  ))}
                  <span className="sr-only">{copy.historyLoading}</span>
                </div>
              ) : history && history.days.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {history.days.map((day) => (
                    <DayCard
                      key={day.date}
                      day={day}
                      copy={copy}
                      language={language}
                      open={Boolean(openDays[day.date])}
                      onToggle={() => setOpenDays((prev) => ({ ...prev, [day.date]: !prev[day.date] }))}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] px-4 py-6 text-center text-[13px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                  {copy.historyEmpty}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* One day in the history timeline                                     */
/* ------------------------------------------------------------------ */

function DayCard({
  day,
  copy,
  language,
  open,
  onToggle,
}: {
  day: CheckinDay;
  copy: ReturnType<typeof checkinCopyFor>;
  language: string;
  open: boolean;
  onToggle: () => void;
}) {
  const hasPunches = day.total > 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-[var(--color-white)]">
      <button
        type="button"
        onClick={hasPunches ? onToggle : undefined}
        aria-expanded={hasPunches ? open : undefined}
        disabled={!hasPunches}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
          hasPunches ? "hover:bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))]" : "cursor-default"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-[15px] ${
              hasPunches
                ? "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]"
                : "bg-[color-mix(in_srgb,var(--color-secondary)_16%,var(--color-white))] text-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
            }`}
          >
            <FiCalendar size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--color-primary)]">{formatDate(day.date, language)}</p>
            <p className="truncate text-[11.5px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
              {hasPunches
                ? copy.multiSummary(day.in_count, day.out_count)
                : copy.noPunchesToday}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasPunches ? (
            <div className="hidden text-right sm:block">
              <p className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">{copy.firstInLabel}</p>
              <p className="text-[12.5px] font-medium text-[var(--color-primary)]">
                {day.first_in ? formatTime(day.first_in, language) : copy.none}
              </p>
            </div>
          ) : null}
          {hasPunches ? (
            <span className="text-[var(--color-primary)]">
              {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </span>
          ) : null}
        </div>
      </button>

      {open && hasPunches ? (
        <div className="border-t border-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_6%,var(--color-white))] p-4">
          <div className="flex flex-col gap-2.5">
            {day.punches.map((punch, index) => {
              const isIn = String(punch.log_type).toUpperCase() === "IN";
              return (
                <div key={`${punch.time}-${index}`} className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[13px] ${
                      isIn
                        ? "bg-[color-mix(in_srgb,var(--color-success)_14%,var(--color-white))] text-[var(--color-success)]"
                        : "bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-white))] text-[var(--color-danger-strong)]"
                    }`}
                  >
                    {isIn ? <FiLogIn size={14} /> : <FiLogOut size={14} />}
                  </span>
                  <span className="text-[12.5px] font-semibold text-[var(--color-primary)]">
                    {isIn ? copy.checkIn : copy.checkOut}
                  </span>
                  <span className="ml-auto text-[13px] font-medium tabular-nums text-[var(--color-primary)]">
                    {formatTime(punch.time, language)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A calm, centred card for the non-happy states (permission, no employee, ...). */
function CalmState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-white))] px-5 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-white))] text-[var(--color-primary)]">
        {icon}
      </span>
      <h2 className="text-[16px] font-semibold">{title}</h2>
      {hint ? (
        <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">{hint}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

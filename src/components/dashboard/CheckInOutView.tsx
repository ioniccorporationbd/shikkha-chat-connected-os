"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiNavigation,
  FiPlayCircle,
  FiRefreshCw,
  FiStopCircle,
  FiUserCheck,
} from "react-icons/fi";

import { ApiError, getJson, postJson } from "@/lib/api/http";
import { checkinCopyFor } from "@/lib/checkin/messages";
import type { CheckinPunchResult, CheckinStatus, GeoPoint } from "@/lib/checkin/types";
import { getDeviceId } from "@/lib/device/deviceId";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { toast } from "@/lib/ui/toast";

const CARD_BORDER = "border-[color-mix(in_srgb,var(--color-primary)_16%,transparent)]";
const CARD_SHADOW =
  "shadow-[0_18px_44px_-26px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]";

type LocationState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface CheckInOutViewProps {
  onBack?: () => void;
}

/** Frappe returns "YYYY-MM-DD HH:MM:SS.ffffff" in the site timezone. */
function formatStamp(value: string | null | undefined, locale: string): string {
  if (!value) return "";

  const iso = value.replace(" ", "T").replace(/\.(\d{3})\d*$/, ".$1");
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return value;

  try {
    return parsed.toLocaleString(locale === "en" ? "en-GB" : "bn-BD", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
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
            <p className="text-[11px] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
              {hint}
            </p>
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
 * The current state comes from the ERP (the latest `Employee Checkin` record),
 * the location from the browser's Geolocation API and the device id from a
 * stable per-browser value. The employee is always resolved server-side, so the
 * browser never sends — and can never choose — an employee id.
 */
export default function CheckInOutView({ onBack }: CheckInOutViewProps) {
  const { language } = useLanguage();
  const copy = checkinCopyFor(language);

  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [punching, setPunching] = useState(false);

  const [deviceId] = useState(getDeviceId);
  const [point, setPoint] = useState<GeoPoint | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");

  const checkedIn = status?.checked_in ?? false;

  const loadStatus = useCallback(async () => {
    try {
      const data = await getJson<CheckinStatus>("/api/checkin/status");
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
      // First load (and every refresh / post-punch reload) always settles here,
      // so the loading skeleton can never get stuck on screen.
      setLoading(false);
    }
  }, [copy.loadFailed]);

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
    // Defer the first status fetch / location prompt out of the effect body so
    // it runs as a callback (not a synchronous state update during render).
    queueMicrotask(() => {
      if (!active) return;
      void loadStatus();
      requestLocation();
    });
    return () => {
      active = false;
    };
  }, [loadStatus, requestLocation]);

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
      await loadStatus();
      requestLocation();
      toast.success(copy.refreshed);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, loadStatus, requestLocation, copy.refreshed]);

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
      await loadStatus();
    } catch (error) {
      const err = error as ApiError;
      const message = err?.message || copy.requestError;
      toast.error(message);
      // The ERP refused because our view was stale (already in / out): refresh.
      if (/already/i.test(message) || err?.code === "validation_error") {
        await loadStatus();
      }
    } finally {
      setPunching(false);
    }
  }, [status, punching, point, locationState, locate, deviceId, language, copy, loadStatus]);

  const locationText = useMemo(() => {
    if (point) return copy.locationReady;
    if (locationState === "requesting") return copy.locationRequesting;
    if (locationState === "denied") return copy.locationDenied;
    if (locationState === "unavailable") return copy.locationUnavailable;
    return copy.captureLocation;
  }, [point, locationState, copy]);

  return (
    <section
      className={`overflow-hidden rounded-[26px] border ${CARD_BORDER} bg-[var(--color-white)] ${CARD_SHADOW}`}
    >
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
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {copy.signInAgain}
                </span>
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
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">
                  {copy.retry}
                </span>
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
                <span className="text-[13px] font-semibold text-[var(--color-white)]">
                  {copy.retry}
                </span>
              </button>
            }
          />
        ) : status && !status.linked ? (
          <CalmState
            icon={<FiUserCheck size={22} />}
            title={copy.noEmployeeTitle}
            hint={copy.noEmployeeHint}
          />
        ) : status ? (
          <div className="flex flex-col gap-4">
            {/* ------------------------------------------------ status banner */}
            <div className="flex flex-col gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_14%,var(--color-white))] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]">
                  {copy.statusHeading}
                </p>

                <div className="mt-2">
                  {checkedIn ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-3.5 py-1.5">
                      <span className="text-[13px] font-semibold text-[var(--color-white)]">
                        {copy.checkedIn}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[var(--color-white)] px-3.5 py-1.5">
                      <span className="text-[13px] font-semibold text-[var(--color-primary)]">
                        {copy.checkedOut}
                      </span>
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[12.5px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
                  {checkedIn ? copy.statusInHint : copy.statusOutHint}
                </p>

                {status.employee ? (
                  <p className="mt-1 text-[12px] font-medium text-[color-mix(in_srgb,var(--color-primary)_70%,transparent)]">
                    {status.employee.employee_name} · {status.employee.name}
                  </p>
                ) : null}
              </div>

              <span
                className={
                  checkedIn
                    ? "grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-[var(--color-primary)] text-[var(--color-white)] shadow-[0_16px_36px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)]"
                    : "grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[var(--color-white)] text-[var(--color-primary)]"
                }
              >
                <FiClock size={22} />
              </span>
            </div>

            {/* --------------------------------------------------- info tiles */}
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

              <InfoTile icon={<FiMonitor size={16} />} title={copy.deviceHeading} hint={copy.deviceHint}>
                <p className="break-all font-mono text-[12px] text-[color-mix(in_srgb,var(--color-primary)_72%,transparent)]">
                  {deviceId || copy.none}
                </p>
              </InfoTile>

              <InfoTile icon={<FiActivity size={16} />} title={copy.activityHeading}>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.lastIn}
                    </span>
                    <span className="text-right text-[12.5px] font-medium">
                      {status.last_in?.time ? formatStamp(status.last_in.time, language) : copy.none}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[12px] text-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]">
                      {copy.lastOut}
                    </span>
                    <span className="text-right text-[12.5px] font-medium">
                      {status.last_out?.time
                        ? formatStamp(status.last_out.time, language)
                        : copy.none}
                    </span>
                  </div>
                </div>
              </InfoTile>
            </div>

            {/* -------------------------------------------------- action bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePunch}
                disabled={punching}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 shadow-[0_16px_34px_-18px_color-mix(in_srgb,var(--color-primary)_85%,transparent)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-white)]">
                  {checkedIn ? <FiStopCircle size={17} /> : <FiPlayCircle size={17} />}
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
          </div>
        ) : null}
      </div>
    </section>
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
        <p className="max-w-[46ch] text-[13px] text-[color-mix(in_srgb,var(--color-primary)_62%,transparent)]">
          {hint}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

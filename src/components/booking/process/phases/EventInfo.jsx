"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import CalendarSchedule from "@/components/admin/schedules/calendar/CalendarSchedules";

import { useDb } from "@/context/DbContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";

import {
  AGENCY_LOCATION,
  createEventLocation,
  formatDistanceKm,
  isValidCoordinates,
  normalizeEventLocation,
} from "@/lib/location";

import EventLocationMap from "./EventLocationMap";

function parseDateKey(dateKey) {
  if (!dateKey) {
    return new Date();
  }

  const [year, month, day] = dateKey
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatSelectedDate(dateKey) {
  if (!dateKey) return "";

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(parseDateKey(dateKey));
}

function formatCurrency(
  value,
  currency = "IDR",
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function calculateEndTime(
  startTime,
  durationHours,
) {
  if (
    !/^\d{2}:\d{2}$/.test(
      String(startTime || ""),
    )
  ) {
    return {
      endTime: "",
      dayOffset: 0,
    };
  }

  const duration =
    Number(durationHours);

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return {
      endTime: "",
      dayOffset: 0,
    };
  }

  const [hours, minutes] =
    startTime.split(":").map(Number);

  const startMinutes =
    hours * 60 + minutes;

  const durationMinutes =
    Math.round(duration * 60);

  const totalMinutes =
    startMinutes + durationMinutes;

  const minutesInDay =
    24 * 60;

  const dayOffset =
    Math.floor(
      totalMinutes / minutesInDay,
    );

  const normalizedMinutes =
    totalMinutes % minutesInDay;

  const endHours =
    Math.floor(
      normalizedMinutes / 60,
    );

  const endMinutes =
    normalizedMinutes % 60;

  return {
    endTime: `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`,
    dayOffset,
  };
}

function SubsectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="mb-5">
      <p className="font-label-sm text-[10px] uppercase tracking-[0.22em] text-secondary">
        {eyebrow}
      </p>

      <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {description}
        </p>
      )}
    </div>
  );
}

export default function EventInfo({
  data,
  errors = {},
  selectedPackage = null,
  sessionName = "",
  sessionIndex = 0,
  packageIndex = 0,
  onChange,
}) {
  const db = useDb();
  const { translate, language } = useLanguage();

  const {
    openOverlay,
    closeOverlay,
  } = useOverlay();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    data.eventDate || "",
  );

  const [
    availabilityStatus,
    setAvailabilityStatus,
  ] = useState(
    data.eventDate
      ? "selected"
      : "idle",
  );

  const [
    geolocationStatus,
    setGeolocationStatus,
  ] = useState("idle");

  const [
    geolocationError,
    setGeolocationError,
  ] = useState("");

  const [
    locationSearchStatus,
    setLocationSearchStatus,
  ] = useState("idle");

  const [
    locationSearchError,
    setLocationSearchError,
  ] = useState("");

  const durationHours =
    Number(selectedPackage?.durationHours) || 0;

  const eventLocation = useMemo(
    () =>
      normalizeEventLocation(
        data.location,
      ),
    [data.location],
  );

  const agencyConfigured =
    isValidCoordinates(
      AGENCY_LOCATION.coordinates,
    );

  const distanceLabel =
    formatDistanceKm(
      eventLocation.distance
        ?.straightLineKm,
    );

  const distanceCharge =
    eventLocation.distanceCharge ??
    null;

  const distanceChargeAmount =
    Number(
      distanceCharge?.amount,
    ) || 0;

  const distanceChargeLabel =
    distanceLabel
      ? distanceChargeAmount > 0
        ? `+${formatCurrency(
            distanceChargeAmount,
            distanceCharge?.currency ||
              "IDR",
          )}`
        : "Tanpa biaya tambahan"
      : "-";

  const {
    rows: schedules,
    error: schedulesError,
  } = useCollection(
    () => db.colRef("Schedules"),
    [],
  );

  useEffect(() => {
    const nextDate =
      data.eventDate || "";

    setSelectedDate(nextDate);

    setAvailabilityStatus(
      nextDate
        ? "selected"
        : "idle",
    );
  }, [data.eventDate]);

  /*
   * Jika durasi paket berubah dan start time sudah dipilih,
   * time out dihitung ulang otomatis.
   */
  useEffect(() => {
    if (!data.startTime) return;

    const {
      endTime,
      dayOffset,
    } = calculateEndTime(
      data.startTime,
      durationHours,
    );

    if (
      data.endTime === endTime &&
      Number(
        data.endTimeDayOffset || 0,
      ) === dayOffset
    ) {
      return;
    }

    onChange?.({
      endTime,
      endTimeDayOffset:
        dayOffset,
    });
  }, [
    data.startTime,
    data.endTime,
    data.endTimeDayOffset,
    durationHours,
    onChange,
  ]);

  const blockedDateKeys =
    useMemo(
      () => [
        ...new Set(
          schedules
            .filter(
              (schedule) =>
                [
                  "booked",
                  "conflict",
                ].includes(
                  schedule.scheduleStatus,
                ),
            )
            .map(
              (schedule) =>
                schedule.date,
            )
            .filter(Boolean),
        ),
      ],
      [schedules],
    );

  const handleDateSelect =
    (day) => {
      setSelectedDate(
        day.dateKey,
      );

      setAvailabilityStatus(
        "selected",
      );

      onChange?.({
        eventDate:
          day.dateKey,
      });

      closeOverlay();
    };

  const openDatePicker =
    () => {
      openOverlay({
        closeOnBackdrop: true,
        className:
          "p-2 md:p-6",
        content: (
          <div className="max-h-[92vh] w-[min(1100px,calc(100vw-1rem))] overflow-y-auto rounded-xl bg-surface-container-lowest p-3 shadow-xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Pilih Tanggal Acara
                </h3>

                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Pilih tanggal yang masih tersedia. Tanggal yang sudah terjadwal tidak dapat dipilih.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeOverlay
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant text-xl text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Tutup kalender"
              >
                ×
              </button>
            </div>

            <CalendarSchedule
              initialDate={
                parseDateKey(
                  selectedDate,
                )
              }
              selectionMode
              selectedDate={
                selectedDate
              }
              blockedDateKeys={
                blockedDateKeys
              }
              onCellClick={
                handleDateSelect
              }
            />
          </div>
        ),
      });
    };

  const handleStartTimeChange =
    (event) => {
      const startTime =
        event.target.value;

      const {
        endTime,
        dayOffset,
      } = calculateEndTime(
        startTime,
        durationHours,
      );

      onChange?.({
        startTime,
        endTime,
        endTimeDayOffset:
          dayOffset,
      });
    };

  const updateEventLocation = ({
    venueName =
      eventLocation.venueName,
    coordinates =
      eventLocation.coordinates,
    accommodationRequest =
      eventLocation.accommodationRequest ?? 0,
  } = {}) => {
    onChange?.({
      location:
        createEventLocation({
          venueName,
          coordinates,
          accommodationRequest,
        }),
    });

    setGeolocationError("");
  };

  const handleLocationInputChange =
    (event) => {
      const venueName =
        event.target.value;

      /*
       * Nama venue / alamat hanyalah label lokasi.
       * Koordinat yang sudah dipilih dari map tetap dipertahankan.
       *
       * Dengan begitu user bisa:
       * 1. klik titik di map lalu isi nama venue bebas, atau
       * 2. isi nama/alamat lalu pakai "Cari Lokasi" sebagai bantuan.
       */
      updateEventLocation({
        venueName,
      });

      setLocationSearchStatus(
        "idle",
      );
      setLocationSearchError("");
    };

  const handleLocationSearch =
    async () => {
      const query =
        String(
          eventLocation.venueName ||
            "",
        ).trim();

      if (
        locationSearchStatus ===
        "loading"
      ) {
        return;
      }

      if (query.length < 3) {
        setLocationSearchStatus(
          "error",
        );
        setLocationSearchError(
          "Masukkan nama venue atau alamat minimal 3 karakter.",
        );
        return;
      }

      setLocationSearchStatus(
        "loading",
      );
      setLocationSearchError("");

      try {
        const response =
          await fetch(
            `/api/location/search?q=${encodeURIComponent(query)}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const payload =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              "Lokasi tidak dapat dicari.",
          );
        }

        const result =
          payload?.result;

        const lat =
          Number(result?.lat);
        const lng =
          Number(result?.lng);

        if (
          !result ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          throw new Error(
            "Lokasi tidak ditemukan. Coba tulis alamat yang lebih lengkap.",
          );
        }

        updateEventLocation({
          venueName:
            String(
              result.displayName ||
                query,
            ).trim(),
          coordinates: {
            lat,
            lng,
          },
        });

        setLocationSearchStatus(
          "success",
        );
      } catch (error) {
        console.error(
          "LOCATION SEARCH ERROR:",
          error,
        );

        setLocationSearchStatus(
          "error",
        );
        setLocationSearchError(
          error?.message ||
            "Lokasi tidak dapat dicari. Silakan coba lagi.",
        );
      }
    };

  const handleLocationInputKeyDown =
    (event) => {
      if (
        event.key !== "Enter"
      ) {
        return;
      }

      event.preventDefault();
      handleLocationSearch();
    };

  const handleUseCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setGeolocationError(
          "Browser ini tidak mendukung akses lokasi.",
        );
        return;
      }

      setGeolocationStatus(
        "loading",
      );
      setGeolocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateEventLocation({
            coordinates: {
              lat:
                position.coords
                  .latitude,
              lng:
                position.coords
                  .longitude,
            },
          });

          setGeolocationStatus(
            "success",
          );
        },
        (error) => {
          setGeolocationStatus(
            "error",
          );

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            setGeolocationError(
              "Izin lokasi ditolak. Cari alamat atau pilih titik pada peta.",
            );
            return;
          }

          setGeolocationError(
            "Lokasi perangkat tidak dapat diperoleh. Cari alamat atau pilih titik pada peta.",
          );
        },
        {
          enableHighAccuracy:
            true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    };

  return (
    <div>
      <header className="mb-8">
        <p className="font-label-sm text-[10px] uppercase tracking-[0.24em] text-secondary">
          {translate("eventInformation")} {sessionIndex + 1}
        </p>

        {(sessionName || selectedPackage?.name) && (
          <p className="mt-2 font-label-md text-label-md text-on-surface-variant">
            {sessionName || selectedPackage.name}
          </p>
        )}

       
      </header>

      {/* DATE & TIME */}
      <section>
        <SubsectionHeading
          eyebrow={translate("schedule")}
          title={translate("dateTime")}
          description={translate("chooseDateDescription")}
        />

        <div className="max-w-2xl">
          <div className="flex min-h-14 items-center justify-between gap-5 border-b border-outline py-3">
            <div className="min-w-0">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                {translate("eventDate")}
              </p>

              {selectedDate ? (
                <>
                  <p className="mt-1 font-label-md text-label-md text-on-surface">
                    {formatSelectedDate(
                      selectedDate,
                    )}
                  </p>

                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant/70">
                    {selectedDate}
                  </p>
                </>
              ) : (
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  {translate("notSelected")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={
                openDatePicker
              }
              className="shrink-0 font-label-sm text-label-sm font-semibold text-secondary transition-colors hover:text-primary"
            >
              {selectedDate
                ? translate("changeDate")
                : translate("chooseDate")}
            </button>
          </div>

          {errors.eventDate && (
            <p className="mt-2 font-label-sm text-label-sm text-error">
              {errors.eventDate}
            </p>
          )}

          {availabilityStatus ===
            "selected" && (
            <p className="mt-2 font-label-sm text-label-sm text-secondary">
              {translate("dateAvailable")}
            </p>
          )}

          {schedulesError && (
            <p className="mt-2 font-label-sm text-label-sm text-error">
              {translate("scheduleLoadError")}
            </p>
          )}

          {selectedDate && (
            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="event-start-time"
                  className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  {translate("startTime")}
                </label>

                <div className="mt-2 flex w-full min-w-0 border-b border-outline py-3 focus-within:border-primary">
                  <input
                    id="event-start-time"
                    type="time"
                    value={
                      data.startTime ||
                      ""
                    }
                    onChange={
                      handleStartTimeChange
                    }
                    className="block w-full min-w-0 border-0 bg-transparent p-0 font-body-md text-body-md text-on-surface outline-none"
                  />
                </div>

                {errors.startTime && (
                  <p className="mt-2 font-label-sm text-label-sm text-error">
                    {errors.startTime}
                  </p>
                )}
              </div>

              <div>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {translate("endTime")}
                </p>

                <div className="mt-2 min-h-12 border-b border-outline py-3">
                  <p
                    className={`font-body-md text-body-md ${
                      data.endTime
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {data.endTime
                      ? `${data.endTime}${
                          Number(
                            data.endTimeDayOffset ||
                              0,
                          ) > 0
                            ? ` · ${translate("nextDay")}`
                            : ""
                        }`
                      : durationHours > 0
                        ? translate("chooseStartTime")
                        : translate("packageDurationUnavailable")}
                  </p>
                </div>

                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant/70">
                  {durationHours > 0
                    ? `${translate("packageDuration")} ${durationHours} ${language === "en" ? "hours" : "jam"}.`
                    : translate("endTimeDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="my-9 h-px w-full bg-outline-variant/35" />

      {/* LOCATION */}
      <section>
        <SubsectionHeading
          eyebrow={translate("venue")}
          title={translate("eventLocation")}
          description={translate("locationDescription")}
        />

        <div className="max-w-3xl">
          <label
            htmlFor="event-location-search"
            className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            {translate("venueAddress")}
          </label>

          <div className="mt-2 flex items-end gap-3 border-b border-outline focus-within:border-primary">
            <input
              id="event-location-search"
              className="min-w-0 flex-1 border-0 bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface outline-none"
              placeholder={translate("venuePlaceholder")}
              type="search"
              autoComplete="street-address"
              value={
                eventLocation.venueName
              }
              onChange={
                handleLocationInputChange
              }
              onKeyDown={
                handleLocationInputKeyDown
              }
            />

            <button
              type="button"
              onClick={
                handleLocationSearch
              }
              disabled={
                locationSearchStatus ===
                  "loading" ||
                !String(
                  eventLocation.venueName ||
                    "",
                ).trim()
              }
              className="mb-3 shrink-0 font-label-sm text-label-sm font-semibold text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locationSearchStatus ===
              "loading"
                ? translate("searching")
                : translate("searchLocation")}
            </button>
          </div>

          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant/70">
            {translate("locationHelp")}
          </p>

          {locationSearchStatus ===
            "success" &&
            isValidCoordinates(
              eventLocation.coordinates,
            ) && (
              <p className="mt-2 font-label-sm text-label-sm text-secondary">
                {translate("locationFound")}
              </p>
            )}

          {locationSearchError && (
            <p
              role="alert"
              className="mt-2 font-label-sm text-label-sm text-error"
            >
              {locationSearchError}
            </p>
          )}
        </div>

        <div className="mt-7">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                {translate("mapPoint")}
              </p>

        
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={
                  handleUseCurrentLocation
                }
                disabled={
                  geolocationStatus ===
                  "loading"
                }
                className="font-label-sm text-label-sm font-semibold text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                {geolocationStatus ===
                "loading"
                  ? translate("searching")
                  : translate("useMyLocation")}
              </button>

              {isValidCoordinates(
                eventLocation.coordinates,
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    updateEventLocation({
                      coordinates: null,
                    })
                  }
                  className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-error"
                >
                  {translate("removePoint")}
                </button>
              )}
            </div>
          </div>

          <EventLocationMap
            value={
              eventLocation.coordinates
            }
            onChange={
              (coordinates) =>
                updateEventLocation({
                  coordinates,
                })
            }
          />

          <div className="mt-5 max-w-md">
            <label
              htmlFor={`accommodation-request-${packageIndex}-${sessionIndex}`}
              className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              {translate("accommodationRequest")}
            </label>

            <div className="mt-2 flex items-center gap-3 border-b border-outline py-3 focus-within:border-primary">
              <span className="font-body-md text-body-md text-on-surface-variant">
                Rp
              </span>
              <input
                id={`accommodation-request-${packageIndex}-${sessionIndex}`}
                type="text"
                inputMode="numeric"
                value={
                  eventLocation.accommodationRequest
                    ? new Intl.NumberFormat("id-ID").format(
                        eventLocation.accommodationRequest,
                      )
                    : ""
                }
                onChange={(event) => {
                  const numericValue = event.target.value.replace(/\D/g, "");
                  updateEventLocation({
                    accommodationRequest: Number(numericValue) || 0,
                  });
                }}
                placeholder="0"
                className="w-full border-0 bg-transparent p-0 font-body-md text-body-md text-on-surface outline-none"
              />
            </div>
          </div>

            {/* Accommodation summary uses the existing distance-charge policy. */}
          <div className="mt-5 flex flex-col gap-4 border-b border-outline-variant/35 pb-5 sm:flex-row sm:items-start sm:gap-10">
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {translate("distanceFrom")} {AGENCY_LOCATION.name}
              </p>

              <p className="mt-1 font-label-md text-label-md text-on-surface">
                {distanceLabel
                  ? `${distanceLabel} km`
                  : agencyConfigured
                    ? translate("waitingLocation")
                    : translate("agencyNotConfigured")}
              </p>
            </div>

            <div className="hidden h-10 w-px bg-outline-variant/40 sm:block" />

            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {translate("accommodationCost")}
              </p>

              <p
                className={`mt-1 font-label-md text-label-md ${
                  distanceChargeAmount >
                  0
                    ? "text-secondary"
                    : "text-on-surface"
                }`}
              >
                {distanceChargeLabel}
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-3xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant/75">
            {translate("accommodationPolicyShort")}
          </p>

          {errors.location && (
            <p className="mt-3 font-label-sm text-label-sm text-error">
              {errors.location}
            </p>
          )}

          {geolocationError && (
            <p className="mt-3 font-label-sm text-label-sm text-error">
              {geolocationError}
            </p>
          )}

          {!agencyConfigured && (
            <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
              Lokasi agency belum dikonfigurasi. Isi NEXT_PUBLIC_AGENCY_LAT dan NEXT_PUBLIC_AGENCY_LNG untuk mengaktifkan perhitungan jarak.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
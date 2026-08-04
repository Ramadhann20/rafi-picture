"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

// Sesuaikan path ini jika lokasi CalendarSchedules berbeda di project Anda.
import CalendarSchedule from "@/components/admin/schedules/calendar/CalendarSchedules";

import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";

function parseDateKey(dateKey) {
  if (!dateKey) {
    return new Date();
  }

  const [year, month, day] =
    dateKey
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return new Date();
  }

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatSelectedDate(dateKey) {
  if (!dateKey) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(
    parseDateKey(dateKey),
  );
}

export default function EventInfo({
  data,
  errors = {},
  onChange,
}) {
  const db = useDb();

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

  const {
    rows: schedules,
    error: schedulesError,
  } = useCollection(
    () =>
      db.colRef("Schedules"),
    [],
  );

  useEffect(() => {
    const nextDate =
      data.eventDate || "";

    setSelectedDate(
      nextDate,
    );

    setAvailabilityStatus(
      nextDate
        ? "selected"
        : "idle",
    );
  }, [data.eventDate]);

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
                  Klik tanggal yang masih tersedia. Tanggal yang terkunci atau sudah terjadwal tidak dapat dipilih.
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

  return (
    <div>
      <h2 className="mb-stack-md font-headline-md text-headline-md">
        Event Details
      </h2>

      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Preferred Date
          </label>

          <div className="flex min-h-12 items-center justify-between gap-4 border-b border-outline py-3">
            {selectedDate ? (
              <div>
                <p className="font-label-sm text-label-sm text-secondary">
                  {formatSelectedDate(
                    selectedDate,
                  )}
                </p>

                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  {selectedDate}
                </p>
              </div>
            ) : (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Belum dipilih
              </p>
            )}

            <button
              type="button"
              onClick={
                openDatePicker
              }
              className="shrink-0 font-label-sm text-label-sm text-secondary transition-colors hover:underline"
            >
              {selectedDate
                ? "Ubah Tanggal"
                : "Pilih Tanggal"}
            </button>
          </div>

          {errors.eventDate && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.eventDate}
            </p>
          )}

          {availabilityStatus ===
            "selected" && (
            <p className="font-label-sm text-label-sm text-secondary">
              Tanggal tersedia dan sudah dipilih.
            </p>
          )}

          {schedulesError && (
            <p className="font-label-sm text-label-sm text-error">
              Data jadwal gagal dimuat. Silakan coba kembali.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Event Location
          </label>

          <input
            className="border-x-0 border-b border-t-0 border-outline bg-surface-bright px-0 py-3 font-body-md text-body-md transition-colors focus:border-primary"
            placeholder="City, State or Venue Name"
            type="text"
            value={
              data.location ?? ""
            }
            onChange={(event) =>
              onChange?.({
                location:
                  event.target.value,
              })
            }
          />

          {errors.location && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.location}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Tell us about your vision
          </label>

          <textarea
            className="resize-none border-x-0 border-b border-t-0 border-outline bg-surface-bright px-0 py-3 font-body-md text-body-md transition-colors focus:border-primary"
            placeholder="Briefly describe what you're looking for..."
            rows={4}
            value={
              data.vision ?? ""
            }
            onChange={(event) =>
              onChange?.({
                vision:
                  event.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
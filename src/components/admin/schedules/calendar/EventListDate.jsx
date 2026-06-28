"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import AppIcon from "@/components/global/AppIcon";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import {
  useOverlay,
} from "@/context/ui/OverlayContext";

import {
  EventPill,
} from "./event/CalendarEvent";

const DATE_LOCKS_COLLECTION =
  "DateLocks";

const ORDERS_ROUTE =
  "/admin/orders";

function parseDateValue(
  date,
  dateKey,
) {
  if (date instanceof Date) {
    return date;
  }

  if (
    typeof dateKey === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateKey,
    )
  ) {
    const [year, month, day] =
      dateKey
        .split("-")
        .map(Number);

    return new Date(
      year,
      month - 1,
      day,
    );
  }

  const parsedDate =
    new Date(date ?? dateKey);

  return Number.isNaN(
    parsedDate.getTime(),
  )
    ? null
    : parsedDate;
}

function formatFullDate(
  date,
  dateKey,
) {
  const parsedDate =
    parseDateValue(
      date,
      dateKey,
    );

  if (!parsedDate) {
    return dateKey || "Tanggal";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(parsedDate);
}

function sortEvents(events) {
  const sourceOrder = {
    booking: 0,
    schedule: 1,
  };

  return [...events].sort(
    (first, second) => {
      const sourceDifference =
        (sourceOrder[
          first.source
        ] ?? 9) -
        (sourceOrder[
          second.source
        ] ?? 9);

      if (
        sourceDifference !== 0
      ) {
        return sourceDifference;
      }

      return String(
        first.title ?? "",
      ).localeCompare(
        String(
          second.title ?? "",
        ),
      );
    },
  );
}

export default function EventListDate({
  date,
  dateKey,
  events = [],
}) {
  const db = useDb();
  const router = useRouter();

  const {
    user,
  } = useAuth();

  const {
    closeOverlay,
  } = useOverlay();

  const [
    dateLock,
    setDateLock,
  ] = useState(null);

  const [
    lockLoading,
    setLockLoading,
  ] = useState(true);

  const [
    lockProcessing,
    setLockProcessing,
  ] = useState(false);

  const [
    lockError,
    setLockError,
  ] = useState(null);

  const sortedEvents =
    useMemo(
      () =>
        sortEvents(events),
      [events],
    );

  const isLocked =
    dateLock?.status ===
    "locked";

  const isScheduleLock =
    isLocked &&
    dateLock?.source ===
      "schedule";

  const fullDate =
    formatFullDate(
      date,
      dateKey,
    );

  /* =========================================================
     REALTIME DATE LOCK
  ========================================================= */

  useEffect(() => {
    if (!dateKey) {
      setDateLock(null);
      setLockLoading(false);
      return undefined;
    }

    setLockLoading(true);
    setLockError(null);

    const unsubscribe =
      db.listenDoc(
        DATE_LOCKS_COLLECTION,
        dateKey,
        (snapshot) => {
          setDateLock(
            snapshot.exists()
              ? {
                  id:
                    snapshot.id,
                  ...snapshot.data(),
                }
              : null,
          );

          setLockLoading(false);
        },
        (error) => {
          console.error(
            "DATE LOCK LISTENER ERROR:",
            error,
          );

          setLockError(
            "Status kunci tanggal gagal dimuat.",
          );

          setLockLoading(false);
        },
      );

    return () =>
      unsubscribe();
  }, [
    db,
    dateKey,
  ]);

  /* =========================================================
     LOCK / UNLOCK DATE
  ========================================================= */

  const handleToggleLock =
    async () => {
      if (
        !dateKey ||
        lockLoading ||
        lockProcessing ||
        isScheduleLock
      ) {
        return;
      }

      setLockProcessing(true);
      setLockError(null);

      try {
        if (isLocked) {
          await db.deleteDoc(
            DATE_LOCKS_COLLECTION,
            dateKey,
          );

          return;
        }

        const timestamp =
          db.serverTimestamp();

        await db.setDoc(
          DATE_LOCKS_COLLECTION,
          dateKey,
          {
            date: dateKey,
            status: "locked",
            source: "manual",

            reason:
              "Tanggal dikunci melalui kalender admin.",

            bookingId: null,
            scheduleId: null,

            lockedBy:
              user?.uid ?? null,

            createdAt:
              timestamp,

            updatedAt:
              timestamp,
          },
        );
      } catch (error) {
        console.error(
          "TOGGLE DATE LOCK ERROR:",
          error,
        );

        setLockError(
          error?.message ??
            "Tanggal gagal diperbarui.",
        );
      } finally {
        setLockProcessing(false);
      }
    };

  /* =========================================================
     EVENT NAVIGATION
  ========================================================= */

  const handleEventClick =
    (event) => {
      if (!event?.bookingId) {
        setLockError(
          "Event ini tidak memiliki bookingId.",
        );

        return;
      }

      closeOverlay();

      router.push(
        `${ORDERS_ROUTE}?bookingId=${encodeURIComponent(
          event.bookingId,
        )}`,
      );
    };

  return (
    <section className="flex max-h-[88dvh] w-[min(720px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="shrink-0 border-b border-outline-variant/20 bg-surface-container-lowest/95 px-5 py-5 backdrop-blur-xl sm:px-7">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
              Event pada Tanggal
            </p>

            <h2 className="mt-2 font-headline-md text-headline-md text-on-surface">
              {fullDate}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              closeOverlay
            }
            aria-label="Tutup detail tanggal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <AppIcon
              name="close"
              size={22}
            />
          </button>
        </div>

        {/* Lock control */}
        <div
          className={`mt-5 rounded-xl border p-4 transition-colors ${
            isLocked
              ? "border-error/20 bg-error-container/35"
              : "border-outline-variant/25 bg-surface-container-low"
          }`}
        >
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <p
                className={`font-label-md text-label-md ${
                  isLocked
                    ? "text-error"
                    : "text-on-surface"
                }`}
              >
                {isScheduleLock
                  ? "Terkunci Otomatis"
                  : "Kunci Tanggal"}
              </p>

              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                {lockLoading
                  ? "Memuat status tanggal..."
                  : isLocked
                    ? "Tanggal Terkunci, client tidak bisa melakukan booking di tanggal ini."
                    : "Tanggal tersedia, client masih dapat melakukan booking di tanggal ini."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={
                isLocked
              }
              aria-label="Kunci tanggal"
              disabled={
                lockLoading ||
                lockProcessing ||
                isScheduleLock
              }
              onClick={
                handleToggleLock
              }
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                isLocked
                  ? "bg-error"
                  : "bg-outline-variant"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  isLocked
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {isScheduleLock && (
            <p className="mt-3 border-t border-error/15 pt-3 font-label-sm text-label-sm text-error">
              Tanggal ini dikunci oleh schedule aktif dan tidak dapat dibuka secara manual.
            </p>
          )}

          {lockError && (
            <p
              role="alert"
              className="mt-3 border-t border-error/15 pt-3 font-label-sm text-label-sm text-error"
            >
              {lockError}
            </p>
          )}
        </div>
      </header>

      {/* =====================================================
          ALL EVENTS — FILTER KALENDER TIDAK BERLAKU
      ===================================================== */}

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-label-md text-label-md text-on-surface">
              Seluruh Event
            </p>

            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
              Menampilkan pesanan dan schedule pada tanggal ini tanpa mengikuti filter kalender.
            </p>
          </div>

          <span className="inline-flex shrink-0 rounded-full bg-surface-container-high px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant">
            {sortedEvents.length} event
          </span>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {sortedEvents.map(
              (event) => (
                <div
                  key={
                    event.id
                  }
                  className="rounded-xl border border-outline-variant/25 bg-surface-bright/70 p-3 transition-colors hover:border-outline-variant/60 hover:bg-surface-bright"
                >
                  <EventPill
                    event={event}
                    onClick={
                      handleEventClick
                    }
                  />

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant/20 pt-3">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {event.source ===
                      "schedule"
                        ? "Terjadwal"
                        : "Pesanan"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
                      Buka pesanan

                      <AppIcon
                        name="arrow_forward"
                        size={15}
                      />
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/40 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
              <AppIcon
                name="calendar_month"
                size={27}
                className="text-on-surface-variant"
              />
            </div>

            <p className="mt-4 font-label-md text-label-md text-on-surface">
              Belum ada event
            </p>

            <p className="mt-1 max-w-sm font-body-md text-body-md text-on-surface-variant">
              Tidak ada pesanan maupun schedule pada tanggal ini.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

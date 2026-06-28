"use client";

import { useMemo, useState } from "react";

import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";

import CalendarSchedule from "./calendar/CalendarSchedules";
import EventListDate from "./calendar/EventListDate";

const COLLECTIONS = {
  bookings: "Bookings",
  schedules: "Schedules",
};

const CALENDAR_FILTERS = {
  all: "all",
  bookings: "bookings",
  schedules: "schedules",
};

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getClientName(client) {
  const fullName =
    client?.fullName ??
    client?.name ??
    "";

  const partnerName =
    client?.partnerName ?? "";

  if (fullName && partnerName) {
    return `${fullName} & ${partnerName}`;
  }

  return (
    fullName ||
    partnerName ||
    "Unnamed Client"
  );
}

function getBookingDate(booking) {
  return (
    booking?.event?.preferredDate ??
    booking?.preferredDate ??
    ""
  );
}

function getScheduleDate(
  schedule,
  relatedBooking,
) {
  return (
    schedule?.eventDate ??
    schedule?.date ??
    schedule?.scheduledDate ??
    schedule?.startDate ??
    relatedBooking?.event
      ?.preferredDate ??
    ""
  );
}

function getScheduleLocation(
  schedule,
  relatedBooking,
) {
  return (
    schedule?.location ??
    relatedBooking?.event
      ?.location ??
    "No location"
  );
}

function mapPendingBookings(
  bookings,
) {
  return bookings
    .filter(
      (booking) =>
        normalizeStatus(
          booking.status ??
            booking.bookingStatus,
        ) === "pending",
    )
    .map((booking) => ({
      id: `booking-${booking.id}`,
      source: "booking",
      date: getBookingDate(
        booking,
      ),
      title: getClientName(
        booking.client,
      ),
      subtitle:
        booking.event?.location ??
        "Booking request",
      status: "pending",
      bookingId: booking.id,
      scheduleId: null,
      raw: booking,
    }))
    .filter(
      (event) =>
        Boolean(event.date),
    );
}

function mapSchedules(
  schedules,
  bookingById,
) {
  return schedules
    .filter(
      (schedule) =>
        normalizeStatus(
          schedule.status,
        ) !== "cancelled",
    )
    .map((schedule) => {
      const relatedBooking =
        bookingById.get(
          schedule.bookingId,
        ) ?? null;

      const client =
        schedule.client ??
        relatedBooking?.client ??
        null;

      return {
        id: `schedule-${schedule.id}`,
        source: "schedule",
        date: getScheduleDate(
          schedule,
          relatedBooking,
        ),
        title: getClientName(
          client,
        ),
        subtitle:
          getScheduleLocation(
            schedule,
            relatedBooking,
          ),
        status:
          normalizeStatus(
            schedule.status,
          ) || "draft",
        bookingId:
          schedule.bookingId ??
          relatedBooking?.id ??
          null,
        scheduleId:
          schedule.id,
        raw: {
          schedule,
          booking:
            relatedBooking,
        },
      };
    })
    .filter(
      (event) =>
        Boolean(event.date),
    );
}

function sortCalendarEvents(
  events,
) {
  return [...events].sort(
    (first, second) =>
      String(first.date).localeCompare(
        String(second.date),
      ),
  );
}

export default function Schedules() {
  const db = useDb();

  const {
    openOverlay,
  } = useOverlay();

  const [
    activeFilter,
    setActiveFilter,
  ] = useState(
    CALENDAR_FILTERS.all,
  );

  const {
    rows: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useCollection(
    () =>
      db.query(
        db.colRef(
          COLLECTIONS.bookings,
        ),
      ),
    [],
  );

  const {
    rows: schedules,
    loading: schedulesLoading,
    error: schedulesError,
  } = useCollection(
    () =>
      db.query(
        db.colRef(
          COLLECTIONS.schedules,
        ),
      ),
    [],
  );

  const bookingById =
    useMemo(
      () =>
        new Map(
          bookings.map(
            (booking) => [
              booking.id,
              booking,
            ],
          ),
        ),
      [bookings],
    );

  const bookingEvents =
    useMemo(
      () =>
        mapPendingBookings(
          bookings,
        ),
      [bookings],
    );

  const scheduleEvents =
    useMemo(
      () =>
        mapSchedules(
          schedules,
          bookingById,
        ),
      [
        schedules,
        bookingById,
      ],
    );

  /*
   * Digunakan oleh EventListDate.
   * Daftar ini selalu berisi booking pending dan schedules,
   * sehingga tidak terpengaruh filter kalender.
   */
  const allCalendarEvents =
    useMemo(
      () =>
        sortCalendarEvents([
          ...bookingEvents,
          ...scheduleEvents,
        ]),
      [
        bookingEvents,
        scheduleEvents,
      ],
    );

  const calendarEvents =
    useMemo(() => {
      if (
        activeFilter ===
        CALENDAR_FILTERS.bookings
      ) {
        return sortCalendarEvents(
          bookingEvents,
        );
      }

      if (
        activeFilter ===
        CALENDAR_FILTERS.schedules
      ) {
        return sortCalendarEvents(
          scheduleEvents,
        );
      }

      return allCalendarEvents;
    }, [
      activeFilter,
      bookingEvents,
      scheduleEvents,
      allCalendarEvents,
    ]);

  const filterCounts =
    useMemo(
      () => ({
        all:
          bookingEvents.length +
          scheduleEvents.length,

        bookings:
          bookingEvents.length,

        schedules:
          scheduleEvents.length,
      }),
      [
        bookingEvents,
        scheduleEvents,
      ],
    );

  const handleDateClick =
    (day) => {
      const eventsForDate =
        allCalendarEvents.filter(
          (event) =>
            event.date ===
            day.dateKey,
        );

      openOverlay({
        content: (
          <EventListDate
            date={day.date}
            dateKey={day.dateKey}
            events={
              eventsForDate
            }
          />
        ),
        closeOnBackdrop: true,
      });
    };

  const handleEventClick =
    (event) => {
      /*
       * Klik pill di kalender membuka overlay tanggal
       * yang sama, bukan langsung mengikuti filter aktif.
       */
      const eventDate =
        event?.date;

      if (!eventDate) {
        return;
      }

      const [
        year,
        month,
        day,
      ] = eventDate
        .split("-")
        .map(Number);

      handleDateClick({
        date:
          new Date(
            year,
            month - 1,
            day,
          ),
        dateKey:
          eventDate,
      });
    };

  if (
    bookingsLoading ||
    schedulesLoading
  ) {
    return (
      <PageState>
        Loading schedule data...
      </PageState>
    );
  }

  if (
    bookingsError ||
    schedulesError
  ) {
    return (
      <PageState error>
        Failed to load booking or
        schedule data.
      </PageState>
    );
  }

  return (
    <section>
      <header className="mb-stack-lg">
        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          Schedule
        </p>

        <h1 className="font-display-lg text-display-lg text-primary">
          Schedule Management
        </h1>

        <p className="mt-2 max-w-3xl font-body-md text-body-md text-on-surface-variant">
          View pending booking requests and
          confirmed schedules in one calendar.
        </p>
      </header>

      <CalendarSchedule
        events={calendarEvents}
        activeFilter={
          activeFilter
        }
        filterCounts={
          filterCounts
        }
        onFilterChange={
          setActiveFilter
        }
        onCellClick={
          handleDateClick
        }
        onEventClick={
          handleEventClick
        }
      />
    </section>
  );
}

function PageState({
  children,
  error = false,
}) {
  return (
    <section className="glass-panel flex min-h-72 items-center justify-center rounded-xl p-stack-lg text-center">
      <p
        className={
          error
            ? "font-body-md text-body-md text-error"
            : "font-body-md text-body-md text-on-surface-variant"
        }
      >
        {children}
      </p>
    </section>
  );
}

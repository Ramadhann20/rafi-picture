"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useDb,
} from "@/context/DbContext";

import {
  useLanguage,
} from "@/context/LanguageContext";

import {
  useOverlay,
} from "@/context/ui/OverlayContext";

import {
  useCollection,
} from "@/hooks/useCollection";

import CalendarSchedule from "./calendar/CalendarSchedules";
import EventListDate from "./calendar/EventListDate";

const COLLECTIONS = {
  bookings:
    "Bookings",
  schedules:
    "Schedules",
};

const CALENDAR_FILTERS = {
  all:
    "all",
  bookings:
    "bookings",
  schedules:
    "schedules",
};

function normalizeStatus(value) {
  return String(
    value ?? "",
  )
    .trim()
    .toLowerCase();
}

function getClientName(client) {
  const fullName =
    String(
      client?.fullName ??
        client?.name ??
        "",
    ).trim();

  const partnerName =
    String(
      client?.partnerName ??
        "",
    ).trim();

  if (
    fullName &&
    partnerName
  ) {
    return `${fullName} & ${partnerName}`;
  }

  return (
    fullName ||
    partnerName ||
    "Unnamed Client"
  );
}

function getLocationLabel(location) {
  if (
    typeof location ===
    "string"
  ) {
    return (
      location.trim() ||
      "Lokasi belum tersedia"
    );
  }

  return (
    String(
      location?.venueName ??
        location?.addressLabel ??
        "",
    ).trim() ||
    "Lokasi belum tersedia"
  );
}

function getBookingDate(booking) {
  return (
    booking?.event
      ?.preferredDate ??
    booking?.preferredDate ??
    ""
  );
}

function getScheduleDate(
  schedule,
  relatedBooking,
) {
  /*
   * `date` adalah field canonical schedule terbaru.
   * eventDate dipertahankan sebagai compatibility.
   */
  return (
    schedule?.date ??
    schedule?.eventDate ??
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
  if (
    schedule?.venueName
  ) {
    return String(
      schedule.venueName,
    );
  }

  return getLocationLabel(
    schedule?.location ??
      relatedBooking?.event
        ?.location,
  );
}

function getEventTimeLabel({
  startTime,
  endTime,
  endTimeDayOffset = 0,
}) {
  if (
    !startTime &&
    !endTime
  ) {
    return "";
  }

  if (
    startTime &&
    endTime
  ) {
    return `${startTime} - ${endTime}${
      Number(
        endTimeDayOffset || 0,
      ) > 0
        ? " (+1 hari)"
        : ""
    }`;
  }

  return (
    startTime ||
    endTime ||
    ""
  );
}

function getScheduleStatus(
  schedule,
) {
  return (
    normalizeStatus(
      schedule
        ?.scheduleStatus,
    ) ||
    normalizeStatus(
      schedule?.status,
    ) ||
    "draft"
  );
}

function buildSubtitle({
  timeLabel,
  locationLabel,
}) {
  return [
    timeLabel,
    locationLabel,
  ]
    .filter(Boolean)
    .join(" • ");
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
    .map((booking) => {
      const event =
        booking?.event ?? {};

      const locationLabel =
        getLocationLabel(
          event?.location,
        );

      const timeLabel =
        getEventTimeLabel({
          startTime:
            event?.startTime,
          endTime:
            event?.endTime,
          endTimeDayOffset:
            event?.endTimeDayOffset,
        });

      return {
        id:
          `booking-${booking.id}`,
        source:
          "booking",
        date:
          getBookingDate(
            booking,
          ),
        title:
          getClientName(
            booking.client,
          ),
        subtitle:
          buildSubtitle({
            timeLabel,
            locationLabel,
          }),
        status:
          "pending",
        bookingId:
          booking.id,
        scheduleId:
          null,
        bookingCode:
          booking?.bookingCode ??
          null,
        packageName:
          booking?.package
            ?.name ??
          null,
        timeLabel,
        locationLabel,
        raw:
          booking,
      };
    })
    .filter(
      (event) =>
        Boolean(
          event.date,
        ),
    );
}

function mapSchedules(
  schedules,
  bookingById,
) {
  return schedules
    .filter((schedule) => {
      const status =
        getScheduleStatus(
          schedule,
        );

      return (
        status !==
        "cancelled"
      );
    })
    .map((schedule) => {
      const relatedBooking =
        bookingById.get(
          schedule.bookingId,
        ) ?? null;

      const client =
        schedule.client ??
        relatedBooking?.client ??
        {
          fullName:
            schedule.clientName,
        };

      const status =
        getScheduleStatus(
          schedule,
        );

      const locationLabel =
        getScheduleLocation(
          schedule,
          relatedBooking,
        );

      const timeLabel =
        getEventTimeLabel({
          startTime:
            schedule?.startTime ??
            relatedBooking?.event
              ?.startTime,
          endTime:
            schedule?.endTime ??
            relatedBooking?.event
              ?.endTime,
          endTimeDayOffset:
            schedule
              ?.endTimeDayOffset ??
            relatedBooking?.event
              ?.endTimeDayOffset,
        });

      return {
        id:
          `schedule-${schedule.id}`,
        source:
          "schedule",
        date:
          getScheduleDate(
            schedule,
            relatedBooking,
          ),
        title:
          getClientName(
            client,
          ),
        subtitle:
          buildSubtitle({
            timeLabel,
            locationLabel,
          }),
        status,
        bookingId:
          schedule.bookingId ??
          relatedBooking?.id ??
          null,
        scheduleId:
          schedule.id,
        bookingCode:
          schedule
            ?.bookingCode ??
          relatedBooking
            ?.bookingCode ??
          null,
        packageName:
          schedule
            ?.packageName ??
          relatedBooking
            ?.package?.name ??
          null,
        timeLabel,
        locationLabel,
        raw: {
          schedule,
          booking:
            relatedBooking,
        },
      };
    })
    .filter(
      (event) =>
        Boolean(
          event.date,
        ),
    );
}

function sortCalendarEvents(
  events,
) {
  return [
    ...events,
  ].sort(
    (
      first,
      second,
    ) => {
      const dateDiff =
        String(
          first.date,
        ).localeCompare(
          String(
            second.date,
          ),
        );

      if (
        dateDiff !== 0
      ) {
        return dateDiff;
      }

      return String(
        first.timeLabel ??
          "",
      ).localeCompare(
        String(
          second.timeLabel ??
            "",
        ),
      );
    },
  );
}

export default function Schedules() {
  const db =
    useDb();
  const { translate } = useLanguage();

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
    rows:
      bookings,
    loading:
      bookingsLoading,
    error:
      bookingsError,
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
    rows:
      schedules,
    loading:
      schedulesLoading,
    error:
      schedulesError,
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
      [
        bookings,
      ],
    );

  const bookingEvents =
    useMemo(
      () =>
        mapPendingBookings(
          bookings,
        ),
      [
        bookings,
      ],
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
   * EventListDate selalu menerima semua event pada tanggal
   * terpilih, terlepas dari filter kalender yang sedang aktif.
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
            date={
              day.date
            }
            dateKey={
              day.dateKey
            }
            events={
              eventsForDate
            }
          />
        ),
        closeOnBackdrop:
          true,
      });
    };

  const handleEventClick =
    (event) => {
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
          {translate("loadingScheduleData")}
      </PageState>
    );
  }

  if (
    bookingsError ||
    schedulesError
  ) {
      return (
        <PageState error>
          {translate("failedLoadScheduleData")}
      </PageState>
    );
  }

  return (
    <section>
      <header className="mb-stack-lg">
        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          {translate("schedule")}
        </p>

        <h1 className="font-display-lg text-display-lg text-primary">
           {translate("scheduleManagement")}
        </h1>

        <p className="mt-2 max-w-3xl font-body-md text-body-md text-on-surface-variant">
           {translate("scheduleManagementDescription")}
        </p>
      </header>

      <CalendarSchedule
        events={
          calendarEvents
        }
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

"use client";

import {
  useMemo,
  useState,
} from "react";

import AppIcon from "@/components/global/AppIcon";

import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import {
  EventPill,
} from "./event/CalendarEvent";

const WEEK_DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const FILTER_OPTIONS = [
  {
    id: "all",
    label: "Tampilkan Semua",
  },
  {
    id: "bookings",
    label: "Tampilkan Pesanan",
  },
  {
    id: "schedules",
    label: "Tampilkan Terjadwal",
  },
];

function formatDateKey(date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthLabel(date) {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function getMonthDays(
  activeDate,
  events,
  lockedDateKeys,
) {
  const year =
    activeDate.getFullYear();

  const month =
    activeDate.getMonth();

  const firstDate =
    new Date(
      year,
      month,
      1,
    );

  const lastDate =
    new Date(
      year,
      month + 1,
      0,
    );

  const previousMonthLastDate =
    new Date(
      year,
      month,
      0,
    );

  const firstDayIndex =
    firstDate.getDay();

  const totalDays =
    lastDate.getDate();

  const days = [];

  for (
    let index =
      firstDayIndex - 1;
    index >= 0;
    index -= 1
  ) {
    const date =
      new Date(
        year,
        month - 1,
        previousMonthLastDate.getDate() -
          index,
      );

    days.push({
      key: `prev-${formatDateKey(
        date,
      )}`,
      date,
      dateKey:
        formatDateKey(date),
      dayNumber:
        date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      isLocked:
        lockedDateKeys.has(
          formatDateKey(date),
        ),
      events: [],
    });
  }

  for (
    let day = 1;
    day <= totalDays;
    day += 1
  ) {
    const date =
      new Date(
        year,
        month,
        day,
      );

    const dateKey =
      formatDateKey(date);

    days.push({
      key: dateKey,
      date,
      dateKey,
      dayNumber: day,
      isCurrentMonth: true,
      isToday:
        dateKey ===
        formatDateKey(
          new Date(),
        ),
      isLocked:
        lockedDateKeys.has(
          dateKey,
        ),
      events:
        events.filter(
          (event) =>
            event.date ===
            dateKey,
        ),
    });
  }

  const remainingSlots =
    42 - days.length;

  for (
    let day = 1;
    day <= remainingSlots;
    day += 1
  ) {
    const date =
      new Date(
        year,
        month + 1,
        day,
      );

    days.push({
      key: `next-${formatDateKey(
        date,
      )}`,
      date,
      dateKey:
        formatDateKey(date),
      dayNumber:
        day,
      isCurrentMonth: false,
      isToday: false,
      isLocked:
        lockedDateKeys.has(
          formatDateKey(date),
        ),
      events: [],
    });
  }

  return days;
}

function CalendarDayCell({
  day,
  onCellClick,
  onEventClick,
}) {
  const handleCellClick =
    () => {
      onCellClick?.(day);
    };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={
        handleCellClick
      }
      onKeyDown={(event) => {
        if (
          event.key ===
            "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          handleCellClick();
        }
      }}
      className={`flex min-h-0 cursor-pointer flex-col overflow-hidden border-b border-r p-3 transition-colors ${
        day.isLocked
          ? "border-error/20 bg-error-container/20 hover:bg-error-container/35"
          : "border-outline-variant hover:bg-surface-container-low"
      } ${
        day.isCurrentMonth
          ? ""
          : "opacity-50"
      } ${
        day.isToday
          ? "border-2 border-primary"
          : ""
      }`}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {day.isToday && (
            <span className="rounded-full bg-primary px-2 py-1 font-label-sm text-label-sm text-on-primary">
              Today
            </span>
          )}

          {day.isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-container/80 px-2 py-1 font-label-sm text-[10px] text-error">
              <AppIcon
                name="lock"
                size={12}
              />
              Locked
            </span>
          )}
        </div>

        <span
          className={`shrink-0 font-label-md text-label-md ${
            day.isLocked
              ? "text-error"
              : ""
          }`}
        >
          {day.dayNumber}
        </span>
      </div>

      <div className="hide-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {day.events.map(
          (event) => (
            <EventPill
              key={event.id}
              event={event}
              onClick={(
                selectedEvent,
              ) => {
                onEventClick?.(
                  selectedEvent,
                );
              }}
            />
          ),
        )}
      </div>
    </article>
  );
}

export default function CalendarSchedule({
  events = [],
  initialDate = new Date(),
  activeFilter = "all",
  filterCounts = {},
  onFilterChange,
  onCellClick,
  onEventClick,
}) {
  const db = useDb();

  const [
    activeDate,
    setActiveDate,
  ] = useState(initialDate);

  const {
    rows: dateLocks,
    error: dateLocksError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("DateLocks"),
        db.where(
          "status",
          "==",
          "locked",
        ),
      ),
    [],
  );

  const lockedDateKeys =
    useMemo(
      () =>
        new Set(
          dateLocks
            .map(
              (dateLock) =>
                dateLock.date ??
                dateLock.id,
            )
            .filter(Boolean),
        ),
      [dateLocks],
    );

  const monthLabel =
    getMonthLabel(activeDate);

  const calendarDays =
    useMemo(
      () =>
        getMonthDays(
          activeDate,
          events,
          lockedDateKeys,
        ),
      [
        activeDate,
        events,
        lockedDateKeys,
      ],
    );

  const goToPreviousMonth =
    () => {
      setActiveDate(
        (currentDate) =>
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() -
              1,
            1,
          ),
      );
    };

  const goToNextMonth =
    () => {
      setActiveDate(
        (currentDate) =>
          new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() +
              1,
            1,
          ),
      );
    };

  const handleFilterToggle =
    (filterId) => {
      /*
       * Secara visual menggunakan checkbox,
       * tetapi hanya satu mode tampilan yang aktif.
       */
      if (
        filterId ===
        activeFilter
      ) {
        return;
      }

      onFilterChange?.(
        filterId,
      );
    };

  return (
    <section className="glass-panel flex flex-col overflow-hidden rounded-xl">
      <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-4">
        <button
          type="button"
          onClick={
            goToPreviousMonth
          }
          className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-primary transition-all hover:bg-surface-container"
          aria-label="Previous month"
        >
          <AppIcon
            name="chevron_left"
            size={22}
          />
        </button>

        <h2 className="font-headline-md text-headline-md text-primary">
          {monthLabel}
        </h2>

        <button
          type="button"
          onClick={
            goToNextMonth
          }
          className="flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest p-2 text-primary transition-all hover:bg-surface-container"
          aria-label="Next month"
        >
          <AppIcon
            name="chevron_right"
            size={22}
          />
        </button>
      </header>

      <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
        {WEEK_DAYS.map(
          (day) => (
            <div
              key={day}
              className="py-4 text-center font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant"
            >
              {day}
            </div>
          ),
        )}
      </div>

      <div className="overflow-x-auto bg-surface-container-lowest">
        <div
          className="grid min-w-full grid-cols-7 border-l border-t border-outline-variant"
          style={{
            gridTemplateRows:
              "repeat(6, 148px)",
          }}
        >
          {calendarDays.map(
            (day) => (
              <CalendarDayCell
                key={day.key}
                day={day}
                onCellClick={
                  onCellClick
                }
                onEventClick={
                  onEventClick
                }
              />
            ),
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-4 border-t border-outline-variant bg-surface-container-low p-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
          aria-label="Calendar display filters"
        >
          {FILTER_OPTIONS.map(
            (filter) => {
              const isChecked =
                activeFilter ===
                filter.id;

              return (
                <label
                  key={filter.id}
                  className="group inline-flex cursor-pointer items-center gap-2.5"
                >
                  <input
                    type="checkbox"
                    checked={
                      isChecked
                    }
                    onChange={() =>
                      handleFilterToggle(
                        filter.id,
                      )
                    }
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  />

                  <span
                    className={`font-label-sm text-label-sm transition-colors ${
                      isChecked
                        ? "text-primary"
                        : "text-on-surface-variant group-hover:text-on-surface"
                    }`}
                  >
                    {filter.label}

                    <span className="ml-1 opacity-60">
                      (
                      {filterCounts[
                        filter.id
                      ] ?? 0}
                      )
                    </span>
                  </span>
                </label>
              );
            },
          )}
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          {dateLocksError && (
            <p className="font-label-sm text-label-sm text-error">
              Status kunci tanggal gagal dimuat.
            </p>
          )}

          <button
            type="button"
            className="flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-primary hover:underline"
          >
            Export Calendar

            <AppIcon
              name="download"
              size={18}
            />
          </button>
        </div>
      </footer>
    </section>
  );
}

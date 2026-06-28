"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

/* =========================================================
   AVAILABILITY CONFIG
========================================================= */

const CREW_AVAILABILITY = {
  available: {
    label: "Available",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  assigned: {
    label: "Busy",
    badgeClass: "bg-error-container text-error",
  },

  inactive: {
    label: "Inactive",
    badgeClass: "bg-error-container text-error",
  },
};

/*
 * Assignment dengan status berikut tidak mengunci kru.
 */
const NON_BLOCKING_ASSIGNMENT_STATUSES = new Set(["cancelled", "void"]);

/* =========================================================
   GENERAL HELPERS
========================================================= */

function formatRole(role) {
  if (!role) return "Role not specified";

  return role
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCrewRole(crew) {
  return crew?.baseRole ?? crew?.role ?? null;
}

function getInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function normalizeDateKey(value) {
  if (!value) return null;

  /*
   * String YYYY-MM-DD dipertahankan supaya tanggal
   * tidak berubah akibat konversi timezone.
   */
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const dateKey = normalizeDateKey(value);

  if (!dateKey) {
    return "the selected date";
  }

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/* =========================================================
   ASSIGNMENT HELPERS
========================================================= */

function getAssignmentDate(assignment) {
  return (
    assignment?.eventDate ??
    assignment?.date ??
    assignment?.scheduleDate ??
    null
  );
}

function getAssignmentCrewIds(assignment) {
  if (Array.isArray(assignment?.crewIds)) {
    return assignment.crewIds;
  }

  /*
   * Fallback sementara untuk data lama.
   */
  if (Array.isArray(assignment?.assignedCrewIds)) {
    return assignment.assignedCrewIds;
  }

  return [];
}

function isBlockingAssignment(assignment) {
  const status = String(assignment?.status ?? "published").toLowerCase();

  return !NON_BLOCKING_ASSIGNMENT_STATUSES.has(status);
}

/*
 * LOGIC 2 — CURRENT VERSION
 *
 * Untuk sekarang, kru dianggap bentrok apabila mempunyai
 * assignment lain pada tanggal yang sama.
 *
 * Saat aturan berdasarkan jam sudah ditetapkan, cukup ubah
 * function ini. Filter dan UI lain tidak perlu diubah.
 */
function hasScheduleConflict({
  assignment,
  targetDate,
  targetStartTime,
  targetEndTime,
}) {
  const assignmentDate = normalizeDateKey(getAssignmentDate(assignment));

  const selectedDate = normalizeDateKey(targetDate);

  if (!assignmentDate || !selectedDate) {
    return false;
  }

  if (assignmentDate !== selectedDate) {
    return false;
  }

  /*
   * FUTURE TIME-BASED VERSION:
   *
   * const assignmentStart =
   *   assignment.startTime;
   *
   * const assignmentEnd =
   *   assignment.endTime;
   *
   * if (
   *   !assignmentStart ||
   *   !assignmentEnd ||
   *   !targetStartTime ||
   *   !targetEndTime
   * ) {
   *   return true;
   * }
   *
   * return (
   *   assignmentStart < targetEndTime &&
   *   assignmentEnd > targetStartTime
   * );
   */

  void targetStartTime;
  void targetEndTime;

  return true;
}

function getBusyCrewIds({
  assignments,
  targetDate,
  targetStartTime,
  targetEndTime,
  currentBookingId,
  currentAssignmentId,
}) {
  const busyCrewIds = new Set();

  assignments.forEach((assignment) => {
    /*
     * Assignment milik booking yang sedang dibuka
     * tidak boleh dianggap bentrok dengan dirinya sendiri.
     */
    const belongsToCurrentBooking =
      Boolean(currentBookingId) && assignment.bookingId === currentBookingId;

    const isCurrentAssignment =
      Boolean(currentAssignmentId) && assignment.id === currentAssignmentId;

    if (belongsToCurrentBooking || isCurrentAssignment) {
      return;
    }

    if (!isBlockingAssignment(assignment)) {
      return;
    }

    if (
      !hasScheduleConflict({
        assignment,
        targetDate,
        targetStartTime,
        targetEndTime,
      })
    ) {
      return;
    }

    getAssignmentCrewIds(assignment).forEach((crewId) => {
      busyCrewIds.add(crewId);
    });
  });

  return busyCrewIds;
}

/* =========================================================
   CREW AVAILABILITY HELPERS
========================================================= */

/*
 * LOGIC 1
 *
 * Kru hanya dapat dipilih jika employmentStatus = active.
 */
function isCrewActive(crew) {
  return String(crew?.employmentStatus ?? "").toLowerCase() === "active";
}

function getCrewAvailability({ crew, busyCrewIds }) {
  if (!isCrewActive(crew)) {
    return {
      key: "inactive",
      ...CREW_AVAILABILITY.inactive,
      canBeSelected: false,
    };
  }

  if (busyCrewIds.has(crew.id)) {
    return {
      key: "assigned",
      ...CREW_AVAILABILITY.assigned,
      canBeSelected: false,
    };
  }

  return {
    key: "available",
    ...CREW_AVAILABILITY.available,
    canBeSelected: true,
  };
}

/*
 * Urutan tampilan crew:
 * 1. Available
 * 2. Busy
 * 3. Inactive
 */
function getAvailabilitySortPriority(crew) {
  const availabilityKey = crew?.availability?.key;

  if (availabilityKey === "available") {
    return 0;
  }

  if (availabilityKey === "assigned") {
    return 1;
  }

  return 2;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function CrewAssignment({
  crewMembers = [],
  assignments = [],

  eventDate = null,
  eventStartTime = null,
  eventEndTime = null,

  currentBookingId = null,
  currentAssignmentId = null,

  selectedCrewIds = [],

  enabled = false,
  readOnly = false,
  showOnlySelected = false,

  requiredCrewCount = 3,

  onSelectedCrewIdsChange,
}) {
  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");

  const [actionError, setActionError] = useState(null);

  const canInteract = enabled && !readOnly;

  /*
   * LOGIC 2
   *
   * Kumpulan ID kru yang sudah bertugas pada
   * assignment lain di tanggal yang sama.
   */
  const busyCrewIds = useMemo(() => {
    return getBusyCrewIds({
      assignments,
      targetDate: eventDate,
      targetStartTime: eventStartTime,
      targetEndTime: eventEndTime,
      currentBookingId,
      currentAssignmentId,
    });
  }, [
    assignments,
    eventDate,
    eventStartTime,
    eventEndTime,
    currentBookingId,
    currentAssignmentId,
  ]);

  /*
   * Setiap crew diperkaya dengan availability yang
   * dihitung dari employment status dan assignment.
   */
  const crewWithAvailability = useMemo(() => {
    return crewMembers.map((crew) => ({
      ...crew,

      availability: getCrewAvailability({
        crew,
        busyCrewIds,
      }),
    }));
  }, [crewMembers, busyCrewIds]);

  /*
   * Role filter diambil dari seluruh kru karena kru
   * inactive dan busy tetap ditampilkan.
   */
  const roleOptions = useMemo(() => {
    return [
      "all",

      ...Array.from(
        new Set(
          crewWithAvailability
            .map(getCrewRole)
            .filter(Boolean),
        ),
      ),
    ];
  }, [crewWithAvailability]);

  const filteredCrew = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return crewWithAvailability
      .filter((crew) => {
        const isSelected = selectedCrewIds.includes(crew.id);

        /*
         * Booking non-pending hanya menampilkan
         * kru yang tersimpan di assignment.
         */
        if (showOnlySelected && !isSelected) {
          return false;
        }

        const role = getCrewRole(crew);

        const searchableText = [
          crew.name,
          role,
          crew.email,
          crew.phone,

          ...(Array.isArray(crew.skills) ? crew.skills : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch || searchableText.includes(normalizedSearch);

        const matchesRole = roleFilter === "all" || role === roleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((firstCrew, secondCrew) => {
        const availabilityDifference =
          getAvailabilitySortPriority(firstCrew) -
          getAvailabilitySortPriority(secondCrew);

        if (availabilityDifference !== 0) {
          return availabilityDifference;
        }

        return String(firstCrew.name ?? "").localeCompare(
          String(secondCrew.name ?? ""),
        );
      });
  }, [
    crewWithAvailability,
    roleFilter,
    search,
    selectedCrewIds,
    showOnlySelected,
  ]);

  const selectedCrew = useMemo(() => {
    return crewWithAvailability.filter((crew) =>
      selectedCrewIds.includes(crew.id),
    );
  }, [crewWithAvailability, selectedCrewIds]);

  const progress =
    requiredCrewCount > 0
      ? Math.min(100, (selectedCrewIds.length / requiredCrewCount) * 100)
      : 0;

  const handleToggleCrew = (crew) => {
    if (!canInteract) return;

    const isSelected = selectedCrewIds.includes(crew.id);

    setActionError(null);

    /*
     * Kru terpilih selalu boleh dilepas.
     */
    if (isSelected) {
      onSelectedCrewIdsChange?.(selectedCrewIds.filter((id) => id !== crew.id));

      return;
    }

    if (!crew.availability?.canBeSelected) {
      const message =
        crew.availability?.key === "assigned"
          ? `${crew.name} already has another assignment on ${formatDate(
              eventDate,
            )}.`
          : `${crew.name} does not have active employment status.`;

      setActionError(message);

      return;
    }

    if (selectedCrewIds.length >= requiredCrewCount) {
      setActionError(`Maksimal ${requiredCrewCount} kru dapat dipilih.`);

      return;
    }

    onSelectedCrewIdsChange?.([...selectedCrewIds, crew.id]);
  };

  return (
    <section aria-labelledby="crew-assignment-title" className="relative">
      <div className="mb-stack-md">
        <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
          Step 02
        </p>

        <h2
          id="crew-assignment-title"
          className="mt-2 font-headline-lg text-headline-lg text-on-surface"
        >
          Crew Assignment
        </h2>

        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          {readOnly
            ? "View the production crew assigned to this booking."
            : `All crew are shown. Only active crew without another assignment on ${formatDate(
                eventDate,
              )} can be selected.`}
        </p>
      </div>

      {!enabled && (
        <div className="mb-stack-md rounded-xl border border-outline-variant bg-surface-container-low px-6 py-5">
          <div className="flex items-start gap-3">
            <AppIcon
              name="lock"
              size={22}
              className="mt-0.5 shrink-0 text-on-surface-variant"
            />

            <div>
              <p className="font-label-md text-label-md text-on-surface">
                Crew assignment is locked
              </p>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Confirm the booking review to unlock crew selection.
              </p>
            </div>
          </div>
        </div>
      )}

      {enabled && readOnly && !showOnlySelected && (
        <div className="mb-stack-md rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
          <div className="flex items-start gap-3">
            <AppIcon
              name="check"
              size={22}
              className="mt-0.5 shrink-0 text-primary"
            />

            <div>
              <p className="font-label-md text-label-md text-on-surface">
                Crew selection confirmed
              </p>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Choose Edit Crew below to change the local selection.
              </p>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-stack-md rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 font-body-md text-body-md text-error"
        >
          {actionError}
        </div>
      )}

      <div
        className={enabled ? "" : "pointer-events-none select-none opacity-45"}
      >
        {!showOnlySelected && (
          <div className="mb-gutter grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="glass-panel rounded-xl p-6">
                <label
                  htmlFor="crew-search"
                  className="font-label-md text-label-md uppercase tracking-widest text-primary"
                >
                  Find Crew
                </label>

                <div className="relative mt-4">
                  <AppIcon
                    name="search"
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />

                  <input
                    id="crew-search"
                    type="search"
                    value={search}
                    disabled={!canInteract}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search crew..."
                    className="w-full rounded-lg border-none bg-surface-container-low py-2.5 pl-10 pr-4 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="my-6 h-px bg-outline-variant/30" />

                <p className="font-label-md text-label-md uppercase tracking-widest text-primary">
                  Filter Role
                </p>

                <div className="mt-4 space-y-2">
                  {roleOptions.map((role) => {
                    const active = roleFilter === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={!canInteract}
                        onClick={() => setRoleFilter(role)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-label-sm text-label-sm transition-colors disabled:cursor-not-allowed ${
                          active
                            ? "bg-primary text-on-primary"
                            : "text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        <span>
                          {role === "all" ? "All Roles" : formatRole(role)}
                        </span>

                        {active && <AppIcon name="check" size={16} />}
                      </button>
                    );
                  })}
                </div>

                <div className="my-6 h-px bg-outline-variant/30" />

                <div className="space-y-2">
                  <AvailabilitySummary
                    label="Active Crew"
                    value={crewWithAvailability.filter(isCrewActive).length}
                  />

                  <AvailabilitySummary
                    label="Busy"
                    value={
                      crewWithAvailability.filter(
                        (crew) => crew.availability?.key === "assigned",
                      ).length
                    }
                  />

                  <AvailabilitySummary
                    label="Available"
                    value={
                      crewWithAvailability.filter(
                        (crew) => crew.availability?.key === "available",
                      ).length
                    }
                  />
                </div>
              </div>
            </aside>

            <div className="space-y-4 lg:col-span-9">
              <CrewList
                crew={filteredCrew}
                selectedCrewIds={selectedCrewIds}
                canInteract={canInteract}
                onToggle={handleToggleCrew}
              />
            </div>
          </div>
        )}

        {showOnlySelected && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CrewList
              crew={filteredCrew}
              selectedCrewIds={selectedCrewIds}
              canInteract={false}
              onToggle={handleToggleCrew}
            />
          </div>
        )}

        <div className="mt-stack-lg flex flex-col gap-6 border-t border-outline-variant pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3">
              {selectedCrew.map((crew) => (
                <div
                  key={crew.id}
                  title={crew.name}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-surface-container-high font-label-sm text-label-sm text-primary"
                >
                  {crew.avatarUrl ? (
                    <img
                      src={crew.avatarUrl}
                      alt={crew.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(crew.name)
                  )}
                </div>
              ))}
            </div>

            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Assigned:{" "}
                <span className="font-bold text-on-surface">
                  {selectedCrewIds.length}/{requiredCrewCount} Crew
                </span>
              </p>

              <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-surface-container-low px-4 py-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {readOnly
                ? "This assignment is displayed in read-only mode."
                : "Availability is currently checked per day, not per hour."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CHILD COMPONENTS
========================================================= */

function AvailabilitySummary({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </span>

      <span className="font-label-md text-label-md text-on-surface">
        {value}
      </span>
    </div>
  );
}

function CrewList({ crew, selectedCrewIds, canInteract, onToggle }) {
  if (crew.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <p className="font-label-md text-label-md text-on-surface">
          No available crew
        </p>

        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
          No crew matched the current search or role filter.
        </p>
      </div>
    );
  }

  return crew.map((crewMember) => {
    const selected = selectedCrewIds.includes(crewMember.id);

    const availability =
      crewMember.availability ??
      getCrewAvailability({
        crew: crewMember,
        busyCrewIds: new Set(),
      });

    const selectionDisabled = !selected && !availability.canBeSelected;

    return (
      <article
        key={crewMember.id}
        className={`glass-panel flex flex-col justify-between gap-6 rounded-xl p-6 transition-all md:flex-row md:items-center ${
          selected ? "ring-1 ring-primary" : "hover:bg-surface-container-low"
        }`}
      >
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-surface-container-highest bg-surface-container-high font-headline-md text-headline-md text-primary">
            {crewMember.avatarUrl ? (
              <img
                src={crewMember.avatarUrl}
                alt={crewMember.name}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(crewMember.name)
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-headline-md text-[20px] text-on-surface">
              {crewMember.name || "Unnamed Crew"}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {formatRole(getCrewRole(crewMember))}
              </span>

              <span className="h-1 w-1 rounded-full bg-outline-variant" />

              <span
                className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${availability.badgeClass}`}
              >
                {availability.label}
              </span>
            </div>

            <p className="mt-2 truncate font-label-sm text-label-sm text-on-surface-variant">
              {crewMember.email}
            </p>

            {Array.isArray(crewMember.skills) &&
              crewMember.skills.length > 0 && (
                <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
                  {crewMember.skills.map(formatRole).join(" • ")}
                </p>
              )}
          </div>
        </div>

        {canInteract && (
          <button
            type="button"
            disabled={selectionDisabled}
            onClick={() => onToggle(crewMember)}
            className={`shrink-0 rounded-lg px-8 py-2.5 font-label-md text-label-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
              selected
                ? "border border-outline text-primary"
                : "bg-primary text-on-primary"
            }`}
          >
            {selected
              ? "Remove"
              : availability.canBeSelected
                ? "Select"
                : "Unavailable"}
          </button>
        )}
      </article>
    );
  });
}

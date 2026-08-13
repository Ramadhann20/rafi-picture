"use client";

import { useMemo } from "react";

import AppIcon from "@/components/global/AppIcon";
import CrewDetails, { CREW_ROLE_OPTIONS } from "./CrewDetails";

import { useDb } from "@/context/DbContext";
import { useOverlay } from "@/context/ui/OverlayContext";
import { useCollection } from "@/hooks/useCollection";

const CREW_STATUS = {
  available: {
    label: "Available",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },
  assigned: {
    label: "Assigned",
    badgeClass: "bg-primary-container text-on-primary-container",
  },
  unavailable: {
    label: "Unavailable",
    badgeClass: "bg-surface-container-high text-on-surface-variant",
  },
};

function getInitials(name) {
  if (!name) return "?";

  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getCrewRole(member) {
  return member?.baseRole ?? member?.role ?? null;
}

function getRoleLabel(role) {
  return (
    CREW_ROLE_OPTIONS.find((option) => option.value === role)?.label ||
    String(role || "Crew Member")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function parseDateKey(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const key = parseDateKey(value);
  if (!key) return "-";

  const [year, month, day] = key.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getLocationLabel(location) {
  if (typeof location === "string") return location.trim() || "-";

  return (
    String(location?.venueName ?? location?.addressLabel ?? "").trim() || "-"
  );
}

function getAssignmentDate(assignment) {
  return assignment?.eventDate ?? assignment?.date ?? null;
}

function getAssignmentStatus(assignment) {
  return String(assignment?.status ?? "draft").toLowerCase();
}

function isTemporaryCrew(member) {
  return member?.temporary === true || member?.crewType === "freelance";
}

export default function CrewManagement() {
  const db = useDb();
  const { openOverlay, closeOverlay } = useOverlay();

  const {
    rows: crewMembers,
    loading: crewLoading,
    error: crewError,
  } = useCollection(
    () => db.query(db.colRef("Crews"), db.orderBy("name", "asc")),
    [],
  );

  const {
    rows: assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useCollection(() => db.colRef("CrewAssignments"), []);

  const todayKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const upcomingAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => {
          const status = getAssignmentStatus(assignment);
          const dateKey = parseDateKey(getAssignmentDate(assignment));

          return (
            !["cancelled", "void", "completed"].includes(status) &&
            Boolean(dateKey) &&
            dateKey >= todayKey
          );
        })
        .sort((a, b) =>
          String(parseDateKey(getAssignmentDate(a)) || "").localeCompare(
            String(parseDateKey(getAssignmentDate(b)) || ""),
          ),
        ),
    [assignments, todayKey],
  );

  const assignedCrewIds = useMemo(
    () =>
      new Set(
        upcomingAssignments.flatMap((assignment) =>
          Array.isArray(assignment?.crewIds) ? assignment.crewIds : [],
        ),
      ),
    [upcomingAssignments],
  );

  const allNormalizedCrew = useMemo(
    () =>
      crewMembers.map((member) => {
        const employmentStatus = String(
          member?.employmentStatus ?? "inactive",
        ).toLowerCase();

        const status =
          employmentStatus !== "active"
            ? "unavailable"
            : assignedCrewIds.has(member.id)
              ? "assigned"
              : "available";

        return { ...member, status };
      }),
    [crewMembers, assignedCrewIds],
  );

  const studioCrew = useMemo(
    () => allNormalizedCrew.filter((member) => !isTemporaryCrew(member)),
    [allNormalizedCrew],
  );

  const crewById = useMemo(
    () => new Map(allNormalizedCrew.map((member) => [member.id, member])),
    [allNormalizedCrew],
  );

  const getAssignmentCrewNames = (crewIds = []) =>
    crewIds
      .map((crewId) => crewById.get(crewId)?.name)
      .filter(Boolean)
      .join(", ") || "Crew belum dipilih";

  const crewStats = useMemo(() => {
    const countByStatus = (status) =>
      studioCrew.filter((member) => member.status === status).length;

    return [
      { id: "total", label: "Total Crew", value: studioCrew.length, cardClass: "" },
      {
        id: "available",
        label: "Available",
        value: countByStatus("available"),
        cardClass: "border-l-4 border-l-secondary",
      },
      {
        id: "assigned",
        label: "Currently Assigned",
        value: countByStatus("assigned"),
        cardClass: "border-l-4 border-l-primary",
      },
      {
        id: "upcoming",
        label: "Upcoming Assignments",
        value: upcomingAssignments.length,
        cardClass: "border-l-4 border-l-outline",
      },
    ];
  }, [studioCrew, upcomingAssignments]);

  async function saveStudioCrew(member, payload) {
    if (member?.id) {
      await db.updateDoc("Crews", member.id, {
        ...payload,
        crewType: member.crewType || "studio",
        temporary: false,
        updatedAt: db.serverTimestamp(),
      });
      return member.id;
    }

    const ref = await db.addDoc("Crews", {
      ...payload,
      crewType: "studio",
      temporary: false,
      avatarUrl: null,
      userId: null,
      createdAt: db.serverTimestamp(),
      updatedAt: db.serverTimestamp(),
    });

    return ref.id;
  }

  function openCreateCrew() {
    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "p-3 sm:p-6",
      content: (
        <CrewDetails
          mode="create"
          assignments={assignments}
          onClose={() => closeOverlay()}
          onSubmit={async (payload) => {
            await saveStudioCrew(null, payload);
            closeOverlay();
          }}
        />
      ),
    });
  }

  function openCrewDetails(member) {
    openOverlay({
      closeOnBackdrop: true,
      closeOnEscape: true,
      className: "p-3 sm:p-6",
      content: (
        <CrewDetails
          mode="edit"
          crew={member}
          assignments={assignments}
          onClose={() => closeOverlay()}
          onSubmit={async (payload) => {
            await saveStudioCrew(member, payload);
            closeOverlay();
          }}
        />
      ),
    });
  }

  if (crewLoading || assignmentsLoading) {
    return (
      <section className="glass-panel flex min-h-72 items-center justify-center rounded-xl">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Loading crew and assignments...
        </p>
      </section>
    );
  }

  if (crewError || assignmentsError) {
    return (
      <section className="glass-panel flex min-h-72 items-center justify-center rounded-xl">
        <p className="font-body-md text-body-md text-error">
          Failed to load crew or assignment data.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-stack-lg">
        <div className="flex flex-col gap-stack-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
              Crew
            </p>
            <h1 className="font-display-lg text-display-lg text-primary">
              Crew Management
            </h1>
            <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Kelola anggota studio, role, status kerja, dan assignment crew.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateCrew}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <AppIcon name="person_add" size={20} />
            New Crew Member
          </button>
        </div>
      </header>

      <section
        aria-label="Crew summary"
        className="mb-stack-md grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-4 xl:gap-gutter"
      >
        {crewStats.map((stat) => (
          <article
            key={stat.id}
            className={`glass-panel rounded-xl p-6 ${stat.cardClass}`}
          >
            <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              {stat.label}
            </p>
            <p className="font-headline-md text-headline-md text-primary">
              {stat.value.toLocaleString("en-US")}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="crew-table-title" className="mb-stack-lg">
        <header className="mb-stack-sm">
          <h2
            id="crew-table-title"
            className="font-headline-md text-headline-md text-on-surface"
          >
            Studio Crew
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Klik icon titik tiga untuk melihat Crew Details, mengubah role, status, dan assignment.
          </p>
        </header>

        <div className="glass-panel overflow-hidden rounded-xl shadow-sm shadow-[#3333330a]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Member</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Role</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Contact</th>
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                  <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10">
                {studioCrew.map((member) => {
                  const statusConfig =
                    CREW_STATUS[member.status] || CREW_STATUS.unavailable;

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-surface-container-low/55"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high font-label-md text-label-md text-on-surface">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(member.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-label-md text-label-md text-primary">
                              {member.name}
                            </p>
                            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                              Crew ID: {member.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-label-md text-label-md text-on-surface">
                          {getRoleLabel(getCrewRole(member))}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                          >
                            {member.email}
                          </a>
                        )}
                        {member.phone && (
                          <a
                            href={`tel:${String(member.phone).replace(/\s/g, "")}`}
                            className="mt-1 block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                          >
                            {member.phone}
                          </a>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => openCrewDetails(member)}
                          aria-label={`Open Crew Details for ${member.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
                        >
                          <AppIcon name="more_vert" size={21} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {studioCrew.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center font-body-md text-body-md text-on-surface-variant"
                    >
                      Belum ada data studio crew di collection Crews.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="upcoming-assignments-title">
        <header className="mb-stack-sm">
          <h2
            id="upcoming-assignments-title"
            className="font-headline-md text-headline-md text-on-surface"
          >
            Upcoming Assignments
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Assignment aktif dari Booking Detail yang akan datang.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-stack-sm xl:grid-cols-2">
          {upcomingAssignments.map((assignment) => {
            const title =
              assignment.title ||
              [assignment.packageName, assignment.clientName]
                .filter(Boolean)
                .join(": ") ||
              "Photography Assignment";

            return (
              <article
                key={assignment.id}
                className="glass-card flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                    <AppIcon
                      name={assignment.type === "video" ? "videocam" : "photo_camera"}
                      size={22}
                    />
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate font-label-md text-label-md text-on-surface">
                      {title}
                    </h3>
                    <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
                      {getAssignmentCrewNames(assignment.crewIds)}
                    </p>
                    <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant/70">
                      {getLocationLabel(assignment.location)}
                    </p>
                  </div>
                </div>

                <time
                  dateTime={parseDateKey(getAssignmentDate(assignment)) || undefined}
                  className="shrink-0 font-label-sm text-label-sm font-bold text-primary"
                >
                  {formatDate(getAssignmentDate(assignment))}
                </time>
              </article>
            );
          })}

          {upcomingAssignments.length === 0 && (
            <div className="glass-card col-span-full rounded-xl p-8 text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Belum ada upcoming assignment.
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

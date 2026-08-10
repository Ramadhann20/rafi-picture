"use client";

import {
  useMemo,
  useState,
} from "react";

import AppIcon from "@/components/global/AppIcon";

import {
  useDb,
} from "@/context/DbContext";

import {
  useCollection,
} from "@/hooks/useCollection";

const CREW_ROLES = {
  lead_photographer: {
    label:
      "Lead Photographer",
  },
  photographer: {
    label:
      "Photographer",
  },
  videographer: {
    label:
      "Videographer",
  },
  assistant_photographer: {
    label:
      "Assistant Photographer",
  },
  editor: {
    label:
      "Photo & Video Editor",
  },
};

const CREW_STATUS = {
  available: {
    label:
      "Available",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },
  assigned: {
    label:
      "Assigned",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },
  unavailable: {
    label:
      "Unavailable",
    badgeClass:
      "bg-surface-container-high text-on-surface-variant",
  },
};

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return String(
    name,
  )
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join("")
    .toUpperCase();
}

function getRoleLabel(role) {
  return (
    CREW_ROLES[
      role
    ]?.label ||
    "Crew Member"
  );
}

function parseDateKey(
  value,
) {
  if (!value) {
    return null;
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text,
    )
  ) {
    return text;
  }

  const date =
    typeof value?.toDate ===
    "function"
      ? value.toDate()
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
  const dateKey =
    parseDateKey(
      dateValue,
    );

  if (!dateKey) {
    return "-";
  }

  const [
    year,
    month,
    day,
  ] = dateKey
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    },
  ).format(
    new Date(
      year,
      month - 1,
      day,
    ),
  );
}

function getLocationLabel(location) {
  if (
    typeof location ===
    "string"
  ) {
    return (
      location.trim() ||
      "-"
    );
  }

  return (
    String(
      location?.venueName ??
        location?.addressLabel ??
        "",
    ).trim() ||
    "-"
  );
}

function getAssignmentDate(
  assignment,
) {
  return (
    assignment?.eventDate ??
    assignment?.date ??
    null
  );
}

function getAssignmentStatus(
  assignment,
) {
  return String(
    assignment
      ?.status ??
      "draft",
  ).toLowerCase();
}

export default function CrewManagement() {
  const db =
    useDb();

  const [
    activeMenuId,
    setActiveMenuId,
  ] = useState(null);

  const {
    rows:
      crewMembers,
    loading:
      crewLoading,
    error:
      crewError,
  } = useCollection(
    () =>
      db.query(
        db.colRef(
          "Crews",
        ),
        db.orderBy(
          "name",
          "asc",
        ),
      ),
    [],
  );

  const {
    rows:
      assignments,
    loading:
      assignmentsLoading,
    error:
      assignmentsError,
  } = useCollection(
    () =>
      db.colRef(
        "CrewAssignments",
      ),
    [],
  );

  const todayKey =
    useMemo(() => {
      const now =
        new Date();

      const year =
        now.getFullYear();

      const month =
        String(
          now.getMonth() +
            1,
        ).padStart(
          2,
          "0",
        );

      const day =
        String(
          now.getDate(),
        ).padStart(
          2,
          "0",
        );

      return `${year}-${month}-${day}`;
    }, []);

  const upcomingAssignments =
    useMemo(
      () =>
        assignments
          .filter(
            (assignment) => {
              const status =
                getAssignmentStatus(
                  assignment,
                );

              const dateKey =
                parseDateKey(
                  getAssignmentDate(
                    assignment,
                  ),
                );

              return (
                status !==
                  "cancelled" &&
                Boolean(
                  dateKey,
                ) &&
                dateKey >=
                  todayKey
              );
            },
          )
          .sort(
            (
              first,
              second,
            ) =>
              String(
                parseDateKey(
                  getAssignmentDate(
                    first,
                  ),
                ) || "",
              ).localeCompare(
                String(
                  parseDateKey(
                    getAssignmentDate(
                      second,
                    ),
                  ) || "",
                ),
              ),
          ),
      [
        assignments,
        todayKey,
      ],
    );

  const assignedCrewIds =
    useMemo(
      () =>
        new Set(
          upcomingAssignments.flatMap(
            (assignment) =>
              Array.isArray(
                assignment
                  ?.crewIds,
              )
                ? assignment.crewIds
                : [],
          ),
        ),
      [
        upcomingAssignments,
      ],
    );

  const normalizedCrew =
    useMemo(
      () =>
        crewMembers.map(
          (member) => {
            const storedStatus =
              String(
                member?.status ??
                  "available",
              ).toLowerCase();

            const status =
              storedStatus ===
                "unavailable"
                ? "unavailable"
                : assignedCrewIds.has(
                      member.id,
                    )
                  ? "assigned"
                  : storedStatus ===
                      "assigned"
                    ? "assigned"
                    : "available";

            return {
              ...member,
              status,
            };
          },
        ),
      [
        crewMembers,
        assignedCrewIds,
      ],
    );

  const crewById =
    useMemo(
      () =>
        new Map(
          normalizedCrew.map(
            (member) => [
              member.id,
              member,
            ],
          ),
        ),
      [
        normalizedCrew,
      ],
    );

  const getAssignmentCrewNames =
    (crewIds = []) =>
      crewIds
        .map(
          (crewId) =>
            crewById.get(
              crewId,
            )?.name,
        )
        .filter(Boolean)
        .join(", ") ||
      "Crew belum dipilih";

  const crewStats =
    useMemo(() => {
      const countByStatus =
        (status) =>
          normalizedCrew.filter(
            (member) =>
              member.status ===
              status,
          ).length;

      return [
        {
          id:
            "total",
          label:
            "Total Crew",
          value:
            normalizedCrew.length,
          cardClass:
            "",
        },
        {
          id:
            "available",
          label:
            "Available",
          value:
            countByStatus(
              "available",
            ),
          cardClass:
            "border-l-4 border-l-secondary",
        },
        {
          id:
            "assigned",
          label:
            "Currently Assigned",
          value:
            countByStatus(
              "assigned",
            ),
          cardClass:
            "border-l-4 border-l-primary",
        },
        {
          id:
            "upcoming",
          label:
            "Upcoming Assignments",
          value:
            upcomingAssignments.length,
          cardClass:
            "border-l-4 border-l-outline",
        },
      ];
    }, [
      normalizedCrew,
      upcomingAssignments,
    ]);

  function handleCreateCrew() {
    console.log(
      "OPEN_CREATE_CREW",
    );
  }

  function handleToggleMenu(
    crewId,
  ) {
    setActiveMenuId(
      (currentId) =>
        currentId ===
        crewId
          ? null
          : crewId,
    );
  }

  function handleEditCrew(
    member,
  ) {
    console.log(
      "EDIT_CREW",
      member,
    );

    setActiveMenuId(
      null,
    );
  }

  function handleDeleteCrew(
    member,
  ) {
    console.log(
      "DELETE_CREW",
      member,
    );

    setActiveMenuId(
      null,
    );
  }

  if (
    crewLoading ||
    assignmentsLoading
  ) {
    return (
      <section className="glass-panel flex min-h-72 items-center justify-center rounded-xl">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Loading crew and assignments...
        </p>
      </section>
    );
  }

  if (
    crewError ||
    assignmentsError
  ) {
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
              Data crew dan assignment sekarang membaca collection Firestore yang sama dengan flow Booking Detail.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleCreateCrew
            }
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <AppIcon
              name="person_add"
              size={20}
            />

            New Crew Member
          </button>
        </div>
      </header>

      <section
        aria-label="Crew summary"
        className="mb-stack-md grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-4 xl:gap-gutter"
      >
        {crewStats.map(
          (stat) => (
            <article
              key={
                stat.id
              }
              className={`glass-panel rounded-xl p-6 ${stat.cardClass}`}
            >
              <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                {
                  stat.label
                }
              </p>

              <p className="font-headline-md text-headline-md text-primary">
                {
                  stat.value.toLocaleString(
                    "en-US",
                  )
                }
              </p>
            </article>
          ),
        )}
      </section>

      <section
        aria-labelledby="crew-table-title"
        className="mb-stack-lg"
      >
        <header className="mb-stack-sm">
          <h2
            id="crew-table-title"
            className="font-headline-md text-headline-md text-on-surface"
          >
            Studio Crew
          </h2>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Review crew roles, contact information, and current assignment status.
          </p>
        </header>

        <div className="glass-panel overflow-visible rounded-xl shadow-sm shadow-[#3333330a]">
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/50">
                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Member
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Role
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Contact
                  </th>

                  <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/10">
                {normalizedCrew.map(
                  (member) => {
                    const statusConfig =
                      CREW_STATUS[
                        member.status
                      ] ||
                      CREW_STATUS.unavailable;

                    const isMenuOpen =
                      activeMenuId ===
                      member.id;

                    return (
                      <tr
                        key={
                          member.id
                        }
                        className="transition-colors hover:bg-surface-variant/20"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high font-label-md text-label-md text-on-surface">
                              {member.avatarUrl ? (
                                <img
                                  src={
                                    member.avatarUrl
                                  }
                                  alt={
                                    member.name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(
                                  member.name,
                                )
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-label-md text-label-md text-primary">
                                {
                                  member.name
                                }
                              </p>

                              <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                                Crew ID:{" "}
                                {
                                  member.id
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-label-md text-label-md text-on-surface">
                            {getRoleLabel(
                              member.role,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {member.email && (
                            <a
                              href={`mailto:${member.email}`}
                              className="block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                            >
                              {
                                member.email
                              }
                            </a>
                          )}

                          {member.phone && (
                            <a
                              href={`tel:${String(
                                member.phone,
                              ).replace(
                                /\s/g,
                                "",
                              )}`}
                              className="mt-1 block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                            >
                              {
                                member.phone
                              }
                            </a>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                          >
                            {
                              statusConfig.label
                            }
                          </span>
                        </td>

                        <td className="relative px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleMenu(
                                member.id,
                              )
                            }
                            aria-label={`Open actions for ${member.name}`}
                            aria-expanded={
                              isMenuOpen
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
                          >
                            <AppIcon
                              name="more_vert"
                              size={21}
                            />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-6 top-14 z-20 w-40 overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest py-1 text-left shadow-xl">
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditCrew(
                                    member,
                                  )
                                }
                                className="flex w-full items-center gap-2 px-4 py-2.5 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"
                              >
                                <AppIcon
                                  name="edit"
                                  size={17}
                                />

                                Edit member
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCrew(
                                    member,
                                  )
                                }
                                className="flex w-full items-center gap-2 px-4 py-2.5 font-label-sm text-label-sm text-error transition-colors hover:bg-error-container/50"
                              >
                                <AppIcon
                                  name="delete"
                                  size={17}
                                />

                                Delete member
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}

                {normalizedCrew.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center font-body-md text-body-md text-on-surface-variant"
                    >
                      Belum ada data crew di collection Crews.
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
          {upcomingAssignments.map(
            (assignment) => {
              const title =
                assignment.title ||
                [
                  assignment.packageName,
                  assignment.clientName,
                ]
                  .filter(Boolean)
                  .join(": ") ||
                "Photography Assignment";

              return (
                <article
                  key={
                    assignment.id
                  }
                  className="glass-card flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                      <AppIcon
                        name={
                          assignment.type ===
                          "video"
                            ? "videocam"
                            : "photo_camera"
                        }
                        size={22}
                      />
                    </span>

                    <div className="min-w-0">
                      <h3 className="truncate font-label-md text-label-md text-on-surface">
                        {
                          title
                        }
                      </h3>

                      <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
                        {getAssignmentCrewNames(
                          assignment.crewIds,
                        )}
                      </p>

                      <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant/70">
                        {getLocationLabel(
                          assignment.location,
                        )}
                      </p>
                    </div>
                  </div>

                  <time
                    dateTime={
                      parseDateKey(
                        getAssignmentDate(
                          assignment,
                        ),
                      ) ||
                      undefined
                    }
                    className="shrink-0 font-label-sm text-label-sm font-bold text-primary"
                  >
                    {formatDate(
                      getAssignmentDate(
                        assignment,
                      ),
                    )}
                  </time>
                </article>
              );
            },
          )}

          {upcomingAssignments.length ===
            0 && (
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

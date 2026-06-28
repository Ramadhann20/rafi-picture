"use client";

import { useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";

/* =========================================================
   CREW ROLE DEFINITIONS
========================================================= */

const CREW_ROLES = {
  lead_photographer: {
    label: "Lead Photographer",
  },
  photographer: {
    label: "Photographer",
  },
  videographer: {
    label: "Videographer",
  },
  assistant_photographer: {
    label: "Assistant Photographer",
  },
  editor: {
    label: "Photo & Video Editor",
  },
};

/* =========================================================
   CREW STATUS DEFINITIONS
========================================================= */

const CREW_STATUS = {
  available: {
    label: "Available",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },
  assigned: {
    label: "Assigned",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },
  unavailable: {
    label: "Unavailable",
    badgeClass:
      "bg-surface-container-high text-on-surface-variant",
  },
};

/* =========================================================
   DUMMY CREW DATA

   Field yang disarankan untuk collection crew:
   - id
   - name
   - role
   - email
   - phone
   - status
   - avatarUrl
   - joinedAt
========================================================= */

export const CREW_MEMBERS = [
  {
    id: "crew1",
    name: "Rafiqi Ruhbana Habibulloh",
    role: "lead_photographer",
    email: "rafiqi@rafipicture.com",
    phone: "+62 812-3456-7890",
    status: "assigned",
    avatarUrl: "",
    joinedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "crew2",
    name: "Deros",
    role: "videographer",
    email: "deros@rafipicture.com",
    phone: "+62 812-9876-5432",
    status: "assigned",
    avatarUrl: "",
    joinedAt: "2024-03-12T09:00:00Z",
  },
  {
    id: "crew3",
    name: "Gelar Ramadhan",
    role: "assistant_photographer",
    email: "gelar@rafipicture.com",
    phone: "+62 811-0000-1111",
    status: "available",
    avatarUrl: "",
    joinedAt: "2024-05-20T09:00:00Z",
  },
  {
    id: "crew4",
    name: "Nadia Prameswari",
    role: "photographer",
    email: "nadia@rafipicture.com",
    phone: "+62 813-5555-2233",
    status: "available",
    avatarUrl: "",
    joinedAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "crew5",
    name: "Fajar Maulana",
    role: "editor",
    email: "fajar@rafipicture.com",
    phone: "+62 857-1234-5678",
    status: "unavailable",
    avatarUrl: "",
    joinedAt: "2025-03-08T09:00:00Z",
  },
];

/* =========================================================
   DUMMY ASSIGNMENT DATA

   Assignment menyimpan crewIds supaya data crew tidak
   diduplikasi pada setiap pekerjaan.
========================================================= */

export const UPCOMING_ASSIGNMENTS = [
  {
    id: "assignment1",
    type: "photo",
    title: "Wedding: Julian & Clara",
    date: "2026-06-28",
    location: "Bandung",
    crewIds: ["crew1", "crew3"],
  },
  {
    id: "assignment2",
    type: "video",
    title: "Brand Film: Essence Collective",
    date: "2026-07-02",
    location: "Jakarta",
    crewIds: ["crew2", "crew5"],
  },
  {
    id: "assignment3",
    type: "photo",
    title: "Pre-Wedding: Nadia & Reza",
    date: "2026-07-06",
    location: "Bogor",
    crewIds: ["crew1", "crew4"],
  },
];

/* =========================================================
   LOOKUPS
========================================================= */

const CREW_BY_ID = new Map(
  CREW_MEMBERS.map((member) => [member.id, member]),
);

/* =========================================================
   HELPERS
========================================================= */

function getInitials(name) {
  if (!name) {
    return "?";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getRoleLabel(role) {
  return CREW_ROLES[role]?.label || "Crew Member";
}

function getAssignmentCrewNames(crewIds) {
  return crewIds
    .map((crewId) => CREW_BY_ID.get(crewId)?.name)
    .filter(Boolean)
    .join(", ");
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   CREW MANAGEMENT COMPONENT
========================================================= */

export default function CrewManagement() {
  const [activeMenuId, setActiveMenuId] = useState(null);

  /* ---------------------------------------------------------
     CREW STATISTICS
  --------------------------------------------------------- */

  const crewStats = useMemo(() => {
    const countByStatus = (status) =>
      CREW_MEMBERS.filter(
        (member) => member.status === status,
      ).length;

    return [
      {
        id: "total",
        label: "Total Crew",
        value: CREW_MEMBERS.length,
        cardClass: "",
      },
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
        value: UPCOMING_ASSIGNMENTS.length,
        cardClass: "border-l-4 border-l-outline",
      },
    ];
  }, []);

  /* ---------------------------------------------------------
     UI HANDLERS
  --------------------------------------------------------- */

  function handleCreateCrew() {
    console.log("OPEN_CREATE_CREW");
  }

  function handleToggleMenu(crewId) {
    setActiveMenuId((currentId) =>
      currentId === crewId ? null : crewId,
    );
  }

  function handleEditCrew(member) {
    console.log("EDIT_CREW", member);
    setActiveMenuId(null);
  }

  function handleDeleteCrew(member) {
    console.log("DELETE_CREW", member);
    setActiveMenuId(null);
  }

  return (
    <section>
      {/* =====================================================
          PAGE HEADER

          Header mengikuti struktur halaman lain:
          eyebrow → display title → description → action.
      ===================================================== */}

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
              Manage studio members, coordinate creative roles,
              and review upcoming assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateCrew}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <AppIcon name="person_add" size={20} />

            New Crew Member
          </button>
        </div>
      </header>

      {/* =====================================================
          CREW STATISTICS
      ===================================================== */}

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

      {/* =====================================================
          CREW TABLE
      ===================================================== */}

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
            Review crew roles, contact information, and current
            availability.
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
                {CREW_MEMBERS.map((member) => {
                  const statusConfig =
                    CREW_STATUS[member.status] ||
                    CREW_STATUS.unavailable;

                  const isMenuOpen =
                    activeMenuId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-surface-variant/20"
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
                          {getRoleLabel(member.role)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <a
                          href={`mailto:${member.email}`}
                          className="block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                        >
                          {member.email}
                        </a>

                        <a
                          href={`tel:${member.phone.replace(/\s/g, "")}`}
                          className="mt-1 block font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
                        >
                          {member.phone}
                        </a>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="relative px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleMenu(member.id)
                          }
                          aria-label={`Open actions for ${member.name}`}
                          aria-expanded={isMenuOpen}
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
                                handleEditCrew(member)
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
                                handleDeleteCrew(member)
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================
          UPCOMING ASSIGNMENTS
      ===================================================== */}

      <section aria-labelledby="upcoming-assignments-title">
        <header className="mb-stack-sm">
          <h2
            id="upcoming-assignments-title"
            className="font-headline-md text-headline-md text-on-surface"
          >
            Upcoming Assignments
          </h2>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Upcoming photography and videography work assigned
            to the studio team.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-stack-sm xl:grid-cols-2">
          {UPCOMING_ASSIGNMENTS.map((assignment) => (
            <article
              key={assignment.id}
              className="glass-card flex flex-col gap-4 rounded-xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <AppIcon
                    name={
                      assignment.type === "video"
                        ? "videocam"
                        : "photo_camera"
                    }
                    size={22}
                  />
                </span>

                <div className="min-w-0">
                  <h3 className="truncate font-label-md text-label-md text-on-surface">
                    {assignment.title}
                  </h3>

                  <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
                    {getAssignmentCrewNames(
                      assignment.crewIds,
                    )}
                  </p>

                  <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant/70">
                    {assignment.location}
                  </p>
                </div>
              </div>

              <time
                dateTime={assignment.date}
                className="shrink-0 font-label-sm text-label-sm font-bold text-primary"
              >
                {formatDate(assignment.date)}
              </time>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

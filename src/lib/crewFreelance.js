function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getAssignmentCrewIds(assignment) {
  if (Array.isArray(assignment?.crewIds)) return assignment.crewIds;
  if (Array.isArray(assignment?.assignedCrewIds)) return assignment.assignedCrewIds;
  return [];
}

function isTemporaryCrew(crew) {
  return crew?.temporary === true || crew?.crewType === "freelance";
}

/**
 * Bersihkan freelance temporary ketika booking/assignment sudah completed.
 *
 * Cleanup ini idempotent:
 * - crew id dilepas dari CrewAssignments
 * - dokumen Crews temporary dihapus
 *
 * Dipanggil dari Orders saat data realtime berubah. Jadi ketika status booking
 * menjadi `completed`, cleanup berjalan pada sesi admin yang sedang aktif atau
 * saat halaman Orders berikutnya dibuka.
 */
export async function cleanupCompletedFreelanceCrews({
  db,
  bookings = [],
  assignments = [],
  crewMembers = [],
}) {
  if (!db) return { removedCrewIds: [] };

  const completedBookingIds = new Set(
    bookings
      .filter((booking) => normalizeStatus(booking?.status) === "completed")
      .map((booking) => booking.id)
      .filter(Boolean),
  );

  assignments.forEach((assignment) => {
    if (
      normalizeStatus(assignment?.status) === "completed" &&
      assignment?.bookingId
    ) {
      completedBookingIds.add(assignment.bookingId);
    }
  });

  if (completedBookingIds.size === 0) {
    return { removedCrewIds: [] };
  }

  const temporaryCrews = crewMembers.filter(
    (crew) =>
      isTemporaryCrew(crew) &&
      crew?.temporaryBookingId &&
      completedBookingIds.has(crew.temporaryBookingId),
  );

  if (temporaryCrews.length === 0) {
    return { removedCrewIds: [] };
  }

  const removedCrewIds = temporaryCrews.map((crew) => crew.id);
  const removedSet = new Set(removedCrewIds);

  for (const assignment of assignments) {
    const currentCrewIds = getAssignmentCrewIds(assignment);

    if (!assignment?.id || !currentCrewIds.some((id) => removedSet.has(id))) {
      continue;
    }

    const nextCrewIds = currentCrewIds.filter((id) => !removedSet.has(id));
    const temporaryCrewIds = Array.isArray(assignment?.temporaryCrewIds)
      ? assignment.temporaryCrewIds.filter((id) => !removedSet.has(id))
      : [];

    await db.updateDoc("CrewAssignments", assignment.id, {
      crewIds: nextCrewIds,
      temporaryCrewIds,
      updatedAt: db.serverTimestamp(),
    });
  }

  for (const crew of temporaryCrews) {
    if (!crew?.id) continue;
    await db.deleteDoc("Crews", crew.id);
  }

  return { removedCrewIds };
}

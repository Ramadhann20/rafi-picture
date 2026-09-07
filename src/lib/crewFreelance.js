function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isTemporaryCrew(crew) {
  return crew?.temporary === true || crew?.crewType === "freelance";
}

/**
 * Bersihkan freelance temporary ketika booking/assignment sudah completed.
 *
 * Cleanup ini idempotent:
 * - dokumen Crews temporary tetap disimpan sebagai riwayat crew
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
      crew?.cleanupOnCompletion !== false &&
      crew?.temporaryBookingId &&
      completedBookingIds.has(crew.temporaryBookingId),
  );

  if (temporaryCrews.length === 0) {
    return { removedCrewIds: [] };
  }

  const archivedCrewIds = temporaryCrews.map((crew) => crew.id);

  for (const crew of temporaryCrews) {
    if (!crew?.id) continue;
    await db.updateDoc("Crews", crew.id, {
      employmentStatus: "inactive",
      cleanupOnCompletion: false,
      updatedAt: db.serverTimestamp(),
    });
  }

  return { archivedCrewIds };
}

import {
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

import {
  notifyAdmins,
} from "@/lib/adminNotifications";

export const runtime =
  "nodejs";

function jsonError(
  message,
  status = 400,
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

function getBearerToken(
  request,
) {
  const value =
    request.headers.get(
      "authorization",
    ) || "";

  if (
    !value.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return value
    .slice(7)
    .trim();
}

function getLocationLabel(
  location,
) {
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

function formatDate(
  value,
) {
  if (!value) {
    return "-";
  }

  const date =
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(value),
    )
      ? new Date(
          `${value}T00:00:00`,
        )
      : new Date(
          value,
        );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return String(
      value,
    );
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",
      month:
        "long",
      year:
        "numeric",
    },
  ).format(
    date,
  );
}

export async function POST(
  request,
) {
  try {
    const token =
      getBearerToken(
        request,
      );

    if (!token) {
      return jsonError(
        "Sesi pengguna tidak tersedia.",
        401,
      );
    }

    let decoded;

    try {
      decoded =
        await adminAuth
          .verifyIdToken(
            token,
          );
    } catch {
      return jsonError(
        "Sesi pengguna tidak valid.",
        401,
      );
    }

    const body =
      await request.json();

    const bookingId =
      String(
        body?.bookingId ||
        "",
      ).trim();

    if (!bookingId) {
      return jsonError(
        "Booking ID tidak tersedia.",
      );
    }

    const snapshot =
      await adminDb
        .collection(
          "Bookings",
        )
        .doc(
          bookingId,
        )
        .get();

    if (
      !snapshot.exists
    ) {
      return jsonError(
        "Booking tidak ditemukan.",
        404,
      );
    }

    const booking = {
      id:
        snapshot.id,
      ...snapshot.data(),
    };

    if (
      booking?.client
        ?.uid !==
      decoded.uid
    ) {
      return jsonError(
        "Booking ini bukan milik user yang sedang login.",
        403,
      );
    }

    const bookingCode =
      booking?.bookingCode ||
      booking.id;

    const clientName =
      booking?.client
        ?.fullName ||
      "Client";

    const packageName =
      booking?.package
        ?.name ||
      "Package";

    const eventDate =
      formatDate(
        booking?.event
          ?.preferredDate,
      );

    const location =
      getLocationLabel(
        booking?.event
          ?.location,
      );

    const title =
      `Booking Baru ${bookingCode}`;

    const message =
`${clientName} mengirim booking baru.

Booking: ${bookingCode}
Paket: ${packageName}
Tanggal: ${eventDate}
Lokasi: ${location}`;

    const notification =
      await notifyAdmins({
        eventKey:
          `booking-created-${booking.id}`,

        type:
          "booking_created",

        title,
        message,

        bookingId:
          booking.id,

        bookingCode,

        route:
          `/admin/orders?bookingId=${encodeURIComponent(
            booking.id,
          )}`,

        metadata: {
          clientName,
          packageName,
          eventDate:
            booking?.event
              ?.preferredDate ??
            null,
          location,
        },
      });

    return NextResponse.json({
      ok: true,
      data:
        notification,
    });
  } catch (error) {
    console.error(
      "BOOKING ADMIN NOTIFICATION ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Notifikasi admin gagal dikirim.",
      500,
    );
  }
}

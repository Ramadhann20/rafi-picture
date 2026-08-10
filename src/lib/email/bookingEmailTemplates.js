function toDate(value) {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] =
      value.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day,
    );
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatCurrency(
  value,
  currency = "IDR",
) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function getClientName(booking) {
  return (
    String(
      booking?.client?.fullName || "",
    ).trim() || "Klien"
  );
}

function getBookingCode(booking) {
  return (
    booking?.bookingCode ||
    booking?.id ||
    "-"
  );
}

function getBookingTotal(booking) {
  const packagePrice =
    Number(
      booking?.package?.price,
    ) || 0;

  const travelCharge =
    Number(
      booking?.event?.location?.distanceCharge?.amount,
    ) || 0;

  return packagePrice + travelCharge;
}

export const BOOKING_EMAIL_TEMPLATE_OPTIONS = [
  {
    value: "blank",
    label: "Custom / Blank",
  },
  {
    value: "booking_approved",
    label: "Booking Approved",
  },
  {
    value: "payment_reminder",
    label: "Payment Reminder",
  },
  {
    value: "payment_verified",
    label: "Payment Verified",
  },
  {
    value: "general_information",
    label: "General Information",
  },
];

export function buildBookingEmailTemplate(
  templateKey,
  booking,
) {
  const clientName =
    getClientName(booking);

  const bookingCode =
    getBookingCode(booking);

  const packageName =
    booking?.package?.name || "-";

  const eventDate =
    formatDate(
      booking?.event?.preferredDate,
    );

  const currency =
    booking?.package?.currency || "IDR";

  const bookingTotal =
    formatCurrency(
      getBookingTotal(booking),
      currency,
    );

  const templates = {
    blank: {
      subject: "",
      message: "",
    },

    booking_approved: {
      subject:
        `Booking ${bookingCode} Telah Disetujui`,
      message:
`Halo ${clientName},

Booking Anda telah disetujui oleh tim Rafi Picture.

Booking Code: ${bookingCode}
Paket: ${packageName}
Tanggal Acara: ${eventDate}
Estimasi Total: ${bookingTotal}

Silakan lanjutkan proses pembayaran sesuai informasi yang tersedia pada halaman booking Anda.

Terima kasih,
Rafi Picture`,
    },

    payment_reminder: {
      subject:
        `Pengingat Pembayaran Booking ${bookingCode}`,
      message:
`Halo ${clientName},

Kami ingin mengingatkan kembali mengenai pembayaran untuk booking Anda.

Booking Code: ${bookingCode}
Paket: ${packageName}
Tanggal Acara: ${eventDate}

Silakan melakukan pembayaran sesuai invoice atau informasi pembayaran yang telah diberikan.

Jika pembayaran sudah dilakukan, pesan ini dapat diabaikan.

Terima kasih,
Rafi Picture`,
    },

    payment_verified: {
      subject:
        `Pembayaran Booking ${bookingCode} Terverifikasi`,
      message:
`Halo ${clientName},

Pembayaran untuk booking Anda telah berhasil diverifikasi.

Booking Code: ${bookingCode}
Paket: ${packageName}
Tanggal Acara: ${eventDate}

Terima kasih telah menyelesaikan proses pembayaran. Tim Rafi Picture akan melanjutkan persiapan sesuai detail booking Anda.

Terima kasih,
Rafi Picture`,
    },

    general_information: {
      subject:
        `Informasi Booking ${bookingCode}`,
      message:
`Halo ${clientName},

Kami menghubungi Anda terkait booking berikut:

Booking Code: ${bookingCode}
Paket: ${packageName}
Tanggal Acara: ${eventDate}

[Tulis informasi tambahan di sini]

Terima kasih,
Rafi Picture`,
    },
  };

  return (
    templates[templateKey] ??
    templates.blank
  );
}

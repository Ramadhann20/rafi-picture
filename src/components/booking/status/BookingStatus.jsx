"use client";

import AppIcon from "@/components/global/AppIcon";

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu Review",
    title: "Inquiry Berhasil Dikirim",
    description:
      "Permintaan booking Anda sudah diterima. Tim Rafi Picture akan meninjau jadwal, lokasi, paket, dan kebutuhan acara terlebih dahulu.",
    icon: "hourglass_top",
    accentClass: "text-secondary",
  },

  approved: {
    label: "Disetujui",
    title: "Booking Disetujui",
    description:
      "Permintaan booking Anda sudah disetujui. Silakan lanjutkan ke tahap pembayaran deposit.",
    icon: "verified",
    accentClass: "text-primary",
  },

  confirmed: {
    label: "Pembayaran Dikirim",
    title: "Pembayaran Sedang Ditinjau",
    description:
      "Bukti pembayaran sudah diterima dan sedang diverifikasi oleh admin Rafi Picture.",
    icon: "check_circle",
    accentClass: "text-primary",
  },

  in_progress: {
    label: "Dalam Proses",
    title: "Booking Sedang Berjalan",
    description:
      "Booking Anda sudah aktif dan tim sedang mempersiapkan layanan sesuai detail acara.",
    icon: "pending_actions",
    accentClass: "text-secondary",
  },

  completed: {
    label: "Selesai",
    title: "Booking Selesai",
    description:
      "Seluruh proses booking telah selesai. Terima kasih telah menggunakan layanan Rafi Picture.",
    icon: "task_alt",
    accentClass: "text-primary",
  },

  cancelled: {
    label: "Dibatalkan",
    title: "Booking Dibatalkan",
    description:
      "Booking ini telah dibatalkan. Hubungi tim Rafi Picture jika Anda membutuhkan informasi lebih lanjut.",
    icon: "cancel",
    accentClass: "text-error",
  },
};

const EMPTY_VALUE = "-";

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

  if (!date) return EMPTY_VALUE;

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

function formatDateTime(value) {
  const date = toDate(value);

  if (!date) return EMPTY_VALUE;

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatCurrency(
  value,
  currency = "IDR",
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function formatRupiah(value) {
  const amount = Number(value);

  return `Rp ${new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  )}`;
}

function normalizeInstagram(value) {
  const instagram =
    String(value ?? "").trim();

  if (!instagram) {
    return EMPTY_VALUE;
  }

  return instagram.startsWith("@")
    ? instagram
    : `@${instagram}`;
}

function getLocationLabel(location) {
  if (typeof location === "string") {
    return (
      location.trim() ||
      EMPTY_VALUE
    );
  }

  return (
    String(
      location?.venueName || "",
    ).trim() ||
    EMPTY_VALUE
  );
}

function getEventTimeLabel(event) {
  if (!event?.startTime) {
    return EMPTY_VALUE;
  }

  if (!event?.endTime) {
    return event.startTime;
  }

  return `${event.startTime} - ${event.endTime}${
    Number(
      event.endTimeDayOffset || 0,
    ) > 0
      ? " (hari berikutnya)"
      : ""
  }`;
}

function getTravelCharge(location) {
  return Math.max(
    Number(
      location?.distanceCharge?.amount,
    ) || 0,
    0,
  );
}

function getPackageFeatures(packageItem) {
  const features =
    packageItem?.features ??
    packageItem?.serviceHighlights ??
    [];

  return Array.isArray(features)
    ? features
        .map((item) =>
          String(item).trim(),
        )
        .filter(Boolean)
    : [];
}

function getInvoicePdf(invoice) {
  const url =
    invoice?.pdf?.url ??
    invoice?.pdf?.secureUrl ??
    invoice?.pdfUrl ??
    null;

  if (!url) {
    return null;
  }

  return {
    url,
    fileName:
      invoice?.pdf?.fileName ??
      `${invoice?.invoiceNumber ?? "invoice-dp"}.pdf`,
    bytes:
      Number(
        invoice?.pdf?.bytes,
      ) || null,
  };
}

function formatFileSize(bytes) {
  const value =
    Number(bytes);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "PDF";
  }

  if (
    value <
    1024 * 1024
  ) {
    return `${(
      value / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    value /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getReceiptPdf(receipt) {
  const url =
    receipt?.pdf?.url ??
    receipt?.pdf?.secureUrl ??
    receipt?.pdfUrl ??
    null;

  if (!url) {
    return null;
  }

  return {
    url,
    fileName:
      receipt?.pdf?.fileName ??
      `${receipt?.receiptNumber ?? "receipt"}.pdf`,
    bytes:
      Number(
        receipt?.pdf?.bytes,
      ) || null,
  };
}

function getPackagePriceLabel(packageItem) {
  const numericPrice =
    Number(packageItem?.price);

  if (
    Number.isFinite(numericPrice)
  ) {
    return formatCurrency(
      numericPrice,
      packageItem?.currency ||
        "IDR",
    );
  }

  return (
    packageItem?.priceLabel ||
    EMPTY_VALUE
  );
}

function SectionHeading({
  icon,
  title,
  description,
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <AppIcon
        name={icon}
        size={21}
        className="mt-0.5 shrink-0 text-secondary"
      />

      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          {title}
        </h2>

        {description && (
          <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
  optional = false,
  accent = false,
  multiline = false,
}) {
  const displayValue =
    value === undefined ||
    value === null ||
    String(value).trim() === ""
      ? EMPTY_VALUE
      : value;

  return (
    <div
      className={`py-3.5 ${
        fullWidth
          ? "sm:col-span-2"
          : ""
      }`}
    >
      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}

        {optional && (
          <span className="ml-2 normal-case tracking-normal text-on-surface-variant/50">
            Optional
          </span>
        )}
      </p>

      <p
        className={`mt-1.5 break-words font-body-md text-body-md ${
          multiline
            ? "max-w-3xl whitespace-pre-wrap leading-relaxed"
            : ""
        } ${
          accent
            ? "font-medium text-secondary"
            : displayValue === EMPTY_VALUE
              ? "text-on-surface-variant/55"
              : "text-on-surface"
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

export default function BookingStatus({
  booking,
  invoice = null,
  receipt = null,
}) {
  if (!booking) {
    return (
      <section className="flex min-h-100 items-center justify-center px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Data booking tidak tersedia.
        </p>
      </section>
    );
  }

  const normalizedStatus =
    String(
      booking.status || "pending",
    ).toLowerCase();

  const statusConfig =
    STATUS_CONFIG[
      normalizedStatus
    ] ?? STATUS_CONFIG.pending;

  const client =
    booking.client ?? {};
  const event =
    booking.event ?? {};
  const selectedPackage =
    booking.package ?? {};

  const eventLocation =
    typeof event.location ===
    "object"
      ? event.location
      : {
          venueName:
            event.location || "",
        };

  const travelCharge =
    getTravelCharge(
      eventLocation,
    );

  const packagePrice =
    Math.max(
      Number(
        selectedPackage.price,
      ) || 0,
      0,
    );

  const estimatedTotal =
    packagePrice +
    travelCharge;

  const packageFeatures =
    getPackageFeatures(
      selectedPackage,
    );

  const showPartnerName =
    selectedPackage
      .bookingSubjectType ===
    "couple";

  const bookingReference =
    booking.bookingCode ||
    booking.id ||
    EMPTY_VALUE;

  const invoicePdf =
    getInvoicePdf(invoice);

  const receiptPdf =
    getReceiptPdf(receipt);

  const paymentStatus =
    String(
      booking?.paymentStatus ||
        "",
    ).toLowerCase();

  const isFinalPaymentUnderReview =
    paymentStatus ===
    "final_pending_verification";

  const isFullyPaid =
    paymentStatus ===
      "paid_full" ||
    booking?.financialStatus ===
      "paid_full";

  const displayConfig =
    isFinalPaymentUnderReview
      ? {
          ...statusConfig,
          label:
            "Pelunasan Dikirim",
          title:
            "Pelunasan Sedang Ditinjau",
          description:
            "Bukti pembayaran pelunasan sudah diterima dan sedang diverifikasi oleh admin Rafi Picture.",
          icon:
            "check_circle",
          accentClass:
            "text-primary",
        }
      : isFullyPaid
        ? {
            ...statusConfig,
            label:
              "Lunas",
            title:
              "Pembayaran Sudah Lunas",
            description:
              "Seluruh pembayaran booking sudah terverifikasi. Kuitansi pembayaran 100% tersedia di bawah dan juga dikirim melalui email.",
            icon:
              "verified",
            accentClass:
              "text-primary",
          }
        : statusConfig;

  return (
    <section className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-0">
      {/* STATUS HEADER */}
      <header className="mb-9 text-center">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center ${displayConfig.accentClass}`}
        >
          <AppIcon
            name={
              displayConfig.icon
            }
            size={38}
          />
        </div>

        <p
          className={`font-label-sm text-label-sm uppercase tracking-[0.2em] ${displayConfig.accentClass}`}
        >
          {displayConfig.label}
        </p>

        <h1 className="mt-2 font-headline-lg text-headline-lg tracking-tight text-on-surface">
          {displayConfig.title}
        </h1>

        <p className="mx-auto mt-3 max-w-2xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {displayConfig.description}
        </p>

        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-2 border-y border-outline-variant/35 py-4 sm:flex-row sm:gap-5">
          <div className="flex items-center gap-2">
            <AppIcon
              name="confirmation_number"
              size={18}
              className="text-secondary"
            />

            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Booking Code
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {bookingReference}
            </span>
          </div>

          <span className="hidden h-4 w-px bg-outline-variant/50 sm:block" />

          <div className="flex items-center gap-2">
            <AppIcon
              name="schedule"
              size={18}
              className="text-secondary"
            />

            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Dikirim
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {formatDateTime(
                booking.submittedAt,
              )}
            </span>
          </div>
        </div>
      </header>

      {/* PACKAGE */}
      <section className="border-b border-outline-variant/35 pb-7">
        <SectionHeading
          icon="photo_camera"
          title="Paket Dokumentasi"
          description="Ringkasan paket yang dipilih pada saat inquiry dikirim."
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-headline-md text-headline-md text-on-surface">
              {selectedPackage.name ||
                EMPTY_VALUE}
            </p>

            {selectedPackage.description && (
              <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {
                  selectedPackage.description
                }
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
              {Number(
                selectedPackage.durationHours,
              ) > 0 && (
                <span className="inline-flex items-center gap-2">
                  <AppIcon
                    name="schedule"
                    size={16}
                    className="text-secondary"
                  />
                  {
                    selectedPackage.durationHours
                  }{" "}
                  jam liputan
                </span>
              )}

              <span className="inline-flex items-center gap-2">
                <AppIcon
                  name={
                    showPartnerName
                      ? "groups"
                      : "person"
                  }
                  size={16}
                  className="text-secondary"
                />
                {showPartnerName
                  ? "Couple / berpasangan"
                  : "Individual"}
              </span>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Harga Paket
            </p>

            <p className="mt-1 font-headline-md text-headline-md text-primary">
              {getPackagePriceLabel(
                selectedPackage,
              )}
            </p>
          </div>
        </div>

        {packageFeatures.length >
          0 && (
          <div className="mt-6 border-t border-outline-variant/25 pt-5">
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Layanan Termasuk
            </p>

            <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {packageFeatures.map(
                (
                  feature,
                  index,
                ) => (
                  <li
                    key={`${feature}-${index}`}
                    className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface-variant"
                  >
                    <AppIcon
                      name="check"
                      size={17}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <span>
                      {feature}
                    </span>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </section>

      {/* EVENT */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="event"
          title="Detail Acara"
          description="Jadwal, lokasi, dan biaya perjalanan yang tercatat pada booking."
        />

        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <DetailItem
            label="Tanggal Acara"
            value={formatDate(
              event.preferredDate,
            )}
          />

          <DetailItem
            label="Jam Acara"
            value={getEventTimeLabel(
              event,
            )}
          />

          <DetailItem
            label="Lokasi Acara"
            value={getLocationLabel(
              eventLocation,
            )}
            fullWidth
          />

          <DetailItem
            label="Biaya Perjalanan"
            value={formatRupiah(
              travelCharge,
            )}
            accent={
              travelCharge > 0
            }
            fullWidth
          />
        </div>
      </section>

      {/* CLIENT */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="person"
          title="Data Pemesan"
          description="Informasi kontak yang digunakan tim Rafi Picture untuk komunikasi booking."
        />

        <div className="space-y-1">
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <DetailItem
              label="Nama Lengkap"
              value={
                client.fullName
              }
            />

            {showPartnerName && (
              <DetailItem
                label="Nama Pasangan"
                value={
                  client.partnerName
                }
                optional
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <DetailItem
              label="Email"
              value={client.email}
            />

            <DetailItem
              label="Nomor Telepon"
              value={client.phone}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            <DetailItem
              label="Instagram"
              value={normalizeInstagram(
                client.instagram,
              )}
              optional
            />
          </div>
        </div>
      </section>

      {/* VISION */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="auto_awesome"
          title="Vision & Catatan"
          description="Konsep atau kebutuhan tambahan yang disampaikan saat booking."
        />

        <DetailItem
          label="Catatan Acara"
          value={event.vision}
          optional
          fullWidth
          multiline
        />
      </section>

      {/* COST SUMMARY */}
      <section className="py-7">
        <SectionHeading
          icon="payments"
          title="Ringkasan Biaya"
          description="Ringkasan ini berdasarkan package dan biaya perjalanan pada saat inquiry dikirim."
        />

        <div className="max-w-xl">
          <div className="flex items-center justify-between gap-5 py-2.5">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Harga Paket
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {formatCurrency(
                packagePrice,
                selectedPackage.currency ||
                  "IDR",
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5 py-2.5">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Biaya Perjalanan
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {formatRupiah(
                travelCharge,
              )}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-5 border-t border-outline-variant/40 pt-4">
            <span className="font-label-md text-label-md text-on-surface">
              Estimasi Total
            </span>

            <span className="font-headline-sm text-headline-sm text-primary">
              {formatCurrency(
                estimatedTotal,
                selectedPackage.currency ||
                  "IDR",
              )}
            </span>
          </div>

          {invoicePdf && (
            <div className="mt-5 border-t border-outline-variant/30 pt-5">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                File Invoice
              </p>

              <a
                href={invoicePdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-lg border border-outline-variant/30 p-4 transition-colors hover:border-primary/45"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                  <AppIcon
                    name="receipt"
                    size={20}
                    className="text-primary"
                  />
                </div>

                <div className="min-w-0 grow">
                  <p className="truncate font-label-md text-label-md text-on-surface">
                    {invoicePdf.fileName}
                  </p>

                  <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                    {formatFileSize(
                      invoicePdf.bytes,
                    )}
                    {" • "}
                    {invoice?.type ===
                    "final"
                      ? "Invoice Pelunasan"
                      : "Invoice Down Payment"}
                  </p>
                </div>

                <AppIcon
                  name="visibility"
                  size={19}
                  className="shrink-0 text-secondary transition-colors group-hover:text-primary"
                />
              </a>
            </div>
          )}

          {receiptPdf && (
            <div className="mt-5 border-t border-outline-variant/30 pt-5">
              <p className="mb-3 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Kuitansi Pembayaran
              </p>

              <a
                href={receiptPdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-lg border border-primary/25 bg-primary/5 p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <AppIcon
                    name="verified"
                    size={20}
                  />
                </div>

                <div className="min-w-0 grow">
                  <p className="truncate font-label-md text-label-md text-on-surface">
                    {receiptPdf.fileName}
                  </p>

                  <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                    {formatFileSize(
                      receiptPdf.bytes,
                    )}
                    {" • "}
                    Kuitansi Pembayaran 100%
                  </p>
                </div>

                <AppIcon
                  name="visibility"
                  size={19}
                  className="shrink-0 text-primary"
                />
              </a>
            </div>
          )}

          {normalizedStatus ===
            "pending" && (
            <p className="mt-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant/70">
              Nominal final akan mengikuti hasil review admin dan invoice yang diterbitkan setelah booking disetujui.
            </p>
          )}
        </div>
      </section>

      {/* FOOT META */}
      <div className="flex flex-col gap-4 border-t border-outline-variant/35 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant/65">
          Terakhir diperbarui{" "}
          {formatDateTime(
            booking.updatedAt,
          )}
        </p>

        {booking.id && (
          <a
            href={`/booking/${booking.id}`}
            className="inline-flex items-center gap-2 font-label-md text-label-md text-secondary transition-colors hover:text-primary"
          >
            Lihat Detail Booking
            <AppIcon
              name="arrow_forward"
              size={18}
            />
          </a>
        )}
      </div>
    </section>
  );
}

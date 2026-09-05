"use client";

import AppIcon from "@/components/global/AppIcon";
import { englishPackageTranslations } from "@/components/packages/PackageListing";
import { useLanguage } from "@/context/LanguageContext";
import BookingCountdowns from "./BookingCountdowns";

const STATUS_CONFIG = {
  pending: {
    labelKey: "statusPendingLabel",
    titleKey: "statusPendingTitle",
    descriptionKey: "statusPendingDescription",
    icon: "hourglass_top",
    accentClass: "text-secondary",
  },

  approved: {
    labelKey: "statusApprovedLabel",
    titleKey: "statusApprovedTitle",
    descriptionKey: "statusApprovedDescription",
    icon: "verified",
    accentClass: "text-primary",
  },

  confirmed: {
    labelKey: "statusConfirmedLabel",
    titleKey: "statusConfirmedTitle",
    descriptionKey: "statusConfirmedDescription",
    icon: "check_circle",
    accentClass: "text-primary",
  },

  in_progress: {
    labelKey: "statusInProgressLabel",
    titleKey: "statusInProgressTitle",
    descriptionKey: "statusInProgressDescription",
    icon: "pending_actions",
    accentClass: "text-secondary",
  },

  completed: {
    labelKey: "statusCompletedLabel",
    titleKey: "statusCompletedTitle",
    descriptionKey: "statusCompletedDescription",
    icon: "task_alt",
    accentClass: "text-primary",
  },

  cancelled: {
    labelKey: "statusCancelledLabel",
    titleKey: "statusCancelledTitle",
    descriptionKey: "statusCancelledDescription",
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

function formatDate(value, language = "id") {
  const date = toDate(value);

  if (!date) return EMPTY_VALUE;

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "id-ID",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(value, language = "id") {
  const date = toDate(value);

  if (!date) return EMPTY_VALUE;

  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "id-ID",
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

function getEventTimeLabel(event, nextDayLabel) {
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
      ? ` (${nextDayLabel})`
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
  const { translate } = useLanguage();
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
            {translate("optional")}
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

function PaymentDocumentCard({
  pdf,
  title,
  subtitle,
  icon,
  highlighted = false,
}) {
  if (!pdf?.url) {
    return null;
  }

  return (
    <a
      href={pdf.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-4 rounded-lg border p-4 transition-colors ${
        highlighted
          ? "border-primary/25 bg-primary/5 hover:border-primary/50"
          : "border-outline-variant/30 hover:border-primary/45"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          highlighted
            ? "bg-primary text-on-primary"
            : "bg-primary/5 text-primary"
        }`}
      >
        <AppIcon
          name={icon}
          size={20}
        />
      </div>

      <div className="min-w-0 grow">
        <p className="font-label-md text-label-md text-on-surface">
          {title}
        </p>

        <p className="mt-1 truncate font-label-sm text-label-sm text-on-surface-variant">
          {subtitle}
          {" • "}
          {formatFileSize(
            pdf.bytes,
          )}
        </p>

        <p className="mt-1 truncate font-body-sm text-[11px] text-on-surface-variant/65">
          {pdf.fileName}
        </p>
      </div>

      <AppIcon
        name="visibility"
        size={19}
        className={`shrink-0 transition-colors ${
          highlighted
            ? "text-primary"
            : "text-secondary group-hover:text-primary"
        }`}
      />
    </a>
  );
}

export default function BookingStatus({
  booking,
  depositInvoice = null,
  finalInvoice = null,
  payments = [],
  receipt = null,
}) {
  const { language, translate } = useLanguage();

  if (!booking) {
    return (
      <section className="flex min-h-100 items-center justify-center px-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {translate("bookingDataUnavailable")}
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
  const packageTranslation =
    language === "en"
      ? englishPackageTranslations[selectedPackage.id]
      : null;
  const displayPackage = packageTranslation
    ? {
        ...selectedPackage,
        description: packageTranslation.description,
        features: packageTranslation.features,
        serviceHighlights: packageTranslation.features,
      }
    : selectedPackage;

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
        displayPackage.price,
      ) || 0,
      0,
    );

  const estimatedTotal =
    packagePrice +
    travelCharge;

  const packageFeatures =
    getPackageFeatures(
      displayPackage,
    );

  const showPartnerName =
    displayPackage
      .bookingSubjectType ===
    "couple";

  const bookingReference =
    booking.bookingCode ||
    booking.id ||
    EMPTY_VALUE;

  const depositInvoicePdf =
    getInvoicePdf(
      depositInvoice,
    );

  const finalInvoicePdf =
    getInvoicePdf(
      finalInvoice,
    );

  const receiptPdf =
    getReceiptPdf(receipt);

  const paymentStatus =
    String(
      booking?.paymentStatus ||
        "",
    )
      .trim()
      .toLowerCase();

  const financialStatus =
    String(
      booking?.financialStatus ||
        "",
    )
      .trim()
      .toLowerCase();

  const isFinalPaymentUnderReview =
    paymentStatus ===
      "final_pending_verification";

  /*
   * Receipt dijadikan fallback tambahan untuk data lama.
   * Kalau kuitansi 100% sudah ada, pembayaran secara bisnis
   * sudah selesai walaupun field status lama belum termigrasi.
   */
  const isFullyPaid =
    paymentStatus ===
      "paid_full" ||
    financialStatus ===
      "paid_full" ||
    Boolean(receiptPdf);

  const displayConfig =
    isFinalPaymentUnderReview
      ? {
          ...statusConfig,
          labelKey: "statusFinalPaymentLabel",
          titleKey: "statusFinalPaymentTitle",
          descriptionKey: "statusFinalPaymentDescription",
          icon:
            "check_circle",
          accentClass:
            "text-primary",
        }
      : isFullyPaid
        ? {
            ...statusConfig,
            labelKey: "statusPaidLabel",
            titleKey: "statusPaidTitle",
            descriptionKey: "statusPaidDescription",
            icon:
              "verified",
            accentClass:
              "text-primary",
          }
        : statusConfig;

  const countdownInvoice =
    finalInvoice ??
    depositInvoice;

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
          {translate(displayConfig.labelKey)}
        </p>

        <h1 className="mt-2 font-headline-lg text-headline-lg tracking-tight text-on-surface">
          {translate(displayConfig.titleKey)}
        </h1>

        <p className="mx-auto mt-3 max-w-2xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {translate(displayConfig.descriptionKey)}
        </p>

        {(isFinalPaymentUnderReview ||
          isFullyPaid) &&
          normalizedStatus ===
            "in_progress" && (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-outline-variant/35 bg-surface-container-low px-4 py-2">
              <AppIcon
                name="pending_actions"
                size={16}
                className="text-secondary"
              />

              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {translate("serviceStatus")}
              </span>
            </div>
          )}

        <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-2 border-y border-outline-variant/35 py-4 sm:flex-row sm:gap-5">
          <div className="flex items-center gap-2">
            <AppIcon
              name="confirmation_number"
              size={18}
              className="text-secondary"
            />

            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {translate("bookingCode")}
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
              {translate("submittedAt")}
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {formatDateTime(
                booking.submittedAt,
                language,
              )}
            </span>
          </div>
        </div>
      </header>

      <BookingCountdowns
        booking={booking}
        invoice={countdownInvoice}
        payments={payments}
      />

      {/* PACKAGE */}
      <section className="border-b border-outline-variant/35 pb-7">
        <SectionHeading
          icon="photo_camera"
          title={translate("packageDetails")}
          description={translate("selectedPackageDescription")}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-headline-md text-headline-md text-on-surface">
              {displayPackage.name ||
                EMPTY_VALUE}
            </p>

            {displayPackage.description && (
              <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {
                  displayPackage.description
                }
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
              {Number(
                displayPackage.durationHours,
              ) > 0 && (
                <span className="inline-flex items-center gap-2">
                  <AppIcon
                    name="schedule"
                    size={16}
                    className="text-secondary"
                  />
                  {
                    displayPackage.durationHours
                  }{" "}
                  {translate("hoursCoverage")}
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
                  ? translate("subjectCouple")
                  : translate("subjectIndividual")}
              </span>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {translate("packagePrice")}
            </p>

            <p className="mt-1 font-headline-md text-headline-md text-primary">
              {getPackagePriceLabel(
                displayPackage,
              )}
            </p>
          </div>
        </div>

        {packageFeatures.length >
          0 && (
          <div className="mt-6 border-t border-outline-variant/25 pt-5">
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              {translate("includedServices")}
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
          title={translate("eventDetails")}
          description={translate("eventDetailsDescription")}
        />

        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <DetailItem
            label={translate("eventDateLabel")}
            value={formatDate(
              event.preferredDate,
              language,
            )}
          />

          <DetailItem
            label={translate("eventTime")}
            value={getEventTimeLabel(event, translate("nextDay"))}
          />

          <DetailItem
            label={translate("eventLocationLabel")}
            value={getLocationLabel(
              eventLocation,
            )}
            fullWidth
          />

          <DetailItem
            label={translate("travelCost")}
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
          title={translate("personalDetails")}
          description={translate("clientDataDescription")}
        />

        <div className="space-y-1">
          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <DetailItem
              label={translate("fullName")}
              value={
                client.fullName
              }
            />

            {showPartnerName && (
              <DetailItem
                label={translate("partnerName")}
                value={
                  client.partnerName
                }
                optional
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            <DetailItem
              label={translate("emailAddress")}
              value={client.email}
            />

            <DetailItem
              label={translate("phoneNumber")}
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
          title={translate("visionAndNotes")}
          description={translate("visionAndNotesDescription")}
        />

        <DetailItem
          label={translate("eventNotes")}
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
          title={translate("costSummary")}
          description={translate("costSummaryDescription")}
        />

        <div className="max-w-xl">
          <div className="flex items-center justify-between gap-5 py-2.5">
            <span className="font-body-md text-body-md text-on-surface-variant">
              {translate("packagePrice")}
            </span>

            <span className="font-label-md text-label-md text-on-surface">
              {formatCurrency(
                packagePrice,
                displayPackage.currency ||
                  "IDR",
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-5 py-2.5">
            <span className="font-body-md text-body-md text-on-surface-variant">
              {translate("travelCost")}
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
                displayPackage.currency ||
                  "IDR",
              )}
            </span>
          </div>

          {(depositInvoicePdf ||
            finalInvoicePdf ||
            receiptPdf) && (
            <div className="mt-6 border-t border-outline-variant/30 pt-6">
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                {translate("paymentDocuments")}
              </p>

              <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant/75">
                {translate("paymentDocumentsDescription")}
              </p>

              <div className="mt-4 space-y-3">
                {depositInvoicePdf && (
                  <PaymentDocumentCard
                    pdf={depositInvoicePdf}
                    title={translate("depositInvoice")}
                    subtitle={
                      depositInvoice?.invoiceNumber ||
                      translate("depositInvoice")
                    }
                    icon="receipt"
                  />
                )}

                {finalInvoicePdf && (
                  <PaymentDocumentCard
                    pdf={finalInvoicePdf}
                    title={translate("finalInvoice")}
                    subtitle={
                      finalInvoice?.invoiceNumber ||
                      translate("finalInvoice")
                    }
                    icon="payments"
                  />
                )}

                {receiptPdf && (
                  <PaymentDocumentCard
                    pdf={receiptPdf}
                    title={translate("paymentReceipt")}
                    subtitle={
                      receipt?.receiptNumber ||
                      translate("fullPayment")
                    }
                    icon="verified"
                    highlighted
                  />
                )}
              </div>
            </div>
          )}

          {normalizedStatus ===
            "pending" && (
            <p className="mt-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant/70">
              {translate("finalAmountNotice")}
            </p>
          )}
        </div>
      </section>

      {/* FOOT META */}
      <div className="flex flex-col gap-4 border-t border-outline-variant/35 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant/65">
          {translate("lastUpdated")} {" "}
          {formatDateTime(
            booking.updatedAt,
            language,
          )}
        </p>
      </div>
    </section>
  );
}

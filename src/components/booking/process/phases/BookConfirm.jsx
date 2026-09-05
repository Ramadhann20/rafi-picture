"use client";

import AppIcon from "@/components/global/AppIcon";
import { englishPackageTranslations } from "@/components/packages/PackageListing";
import {
  normalizeEventLocation,
} from "@/lib/location";
import { useLanguage } from "@/context/LanguageContext";

const EMPTY_VALUE = "Belum diisi";

function getDisplayValue(value) {
  const normalizedValue =
    String(value ?? "").trim();

  return (
    normalizedValue || EMPTY_VALUE
  );
}

function formatEventDate(value) {
  if (!value) return EMPTY_VALUE;

  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

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
  const price =
    Number(value);

  if (
    !Number.isFinite(price)
  ) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(price);
}

function formatRupiah(value) {
  const amount =
    Number(value);

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

function getPackagePrice(
  packageItem,
) {
  if (
    packageItem?.priceLabel
  ) {
    return packageItem.priceLabel;
  }

  return formatCurrency(
    packageItem?.price,
    packageItem?.currency ||
      "IDR",
  );
}

function getPackageHighlights(
  packageItem,
) {
  if (
    Array.isArray(
      packageItem?.serviceHighlights,
    )
  ) {
    return packageItem.serviceHighlights
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  if (
    Array.isArray(
      packageItem?.features,
    )
  ) {
    return packageItem.features
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  return [];
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

function getEventTimeLabel(
  eventData,
) {
  if (
    !eventData?.startTime
  ) {
    return EMPTY_VALUE;
  }

  if (
    !eventData?.endTime
  ) {
    return eventData.startTime;
  }

  return `${eventData.startTime} - ${eventData.endTime}${
    Number(
      eventData.endTimeDayOffset ||
        0,
    ) > 0
      ? " (hari berikutnya)"
      : ""
  }`;
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
        <h3 className="font-headline-sm text-headline-sm text-on-surface">
          {title}
        </h3>

        {description && (
          <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  optional = false,
  fullWidth = false,
  multiline = false,
}) {
  const isEmpty =
    value === EMPTY_VALUE;

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
          <span className="ml-2 normal-case tracking-normal text-on-surface-variant/55">
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
          isEmpty
            ? "italic text-on-surface-variant/55"
            : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function BookConfirm({
  formData,
  selectedPackage,
  submitStatus,
}) {
  const { language, translate } = useLanguage();
  const displayPackage = selectedPackage
    ? englishPackageTranslations[selectedPackage.id] && language === "en"
      ? {
          ...selectedPackage,
          description: englishPackageTranslations[selectedPackage.id].description,
          serviceHighlights: englishPackageTranslations[selectedPackage.id].features,
          features: englishPackageTranslations[selectedPackage.id].features,
        }
      : selectedPackage
    : null;
  const personalData =
    formData?.personal ?? {};
  const eventData =
    formData?.event ?? {};

  const eventLocation =
    normalizeEventLocation(
      eventData.location,
    );

  const travelCharge =
    Number(
      eventLocation
        ?.distanceCharge
        ?.amount,
    ) || 0;

  const packageHighlights = getPackageHighlights(displayPackage);

  const showPartnerName =
    Boolean(displayPackage) &&
    displayPackage.bookingSubjectType !==
      "individual";

  const isSubmitting =
    submitStatus === "loading";
  const isSuccess =
    submitStatus === "success";

  return (
    <div>
      <header className="mb-9">
        <p className="font-label-sm text-[10px] uppercase tracking-[0.24em] text-secondary">
          {translate("confirmation")}
        </p>

        <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">
          {translate("reviewBooking")}
        </h2>

        <p className="mt-2 max-w-2xl font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {translate("reviewBookingDescription")}
        </p>
      </header>

      {/* PACKAGE */}
      <section className="border-b border-outline-variant/35 pb-7">
        <SectionHeading
          icon="photo_camera"
          title={translate("packageDetails")}
          description={translate("selectedPackageDescription")}
        />

        {displayPackage ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="font-headline-md text-headline-md text-on-surface">
                    {displayPackage.name}
                  </p>

                  {displayPackage.featured && (
                    <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary">
                      {translate("mostPopular")}
                    </span>
                  )}
                </div>

                {displayPackage.description && (
                  <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                    {displayPackage.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
                  {Number(
                    displayPackage.durationHours,
                  ) > 0 && (
                    <span>
                      {displayPackage.durationHours} {translate("hoursCoverage")}
                    </span>
                  )}

                  <span>
                    {displayPackage.bookingSubjectType ===
                    "couple"
                      ? translate("subjectCouple")
                      : displayPackage.bookingSubjectType ===
                          "individual"
                        ? translate("subjectIndividual")
                        : translate("subjectUnknown")}
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:text-right">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {translate("packagePrice")}
                </p>

                <p className="mt-1 font-headline-md text-headline-md text-primary">
                  {getPackagePrice(
                    displayPackage,
                  )}
                </p>
              </div>
            </div>

            {packageHighlights.length >
              0 && (
              <div className="mt-6 border-t border-outline-variant/25 pt-5">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {translate("includedServices")}
                </p>

                <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                  {packageHighlights.map(
                    (
                      highlight,
                      index,
                    ) => (
                      <li
                        key={`${highlight}-${index}`}
                        className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface-variant"
                      >
                        <AppIcon
                          name="check"
                          size={17}
                          className="mt-0.5 shrink-0 text-secondary"
                        />

                        <span>
                          {highlight}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="font-body-md text-body-md text-error">
            {translate("packageRequired")}
          </p>
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
          <DetailRow
            label={translate("eventDate")}
            value={formatEventDate(
              eventData.eventDate,
            )}
          />

          <DetailRow
            label={translate("eventTime")}
            value={getEventTimeLabel(
              eventData,
            )}
          />

          <DetailRow
            label={translate("eventLocation")}
            value={getDisplayValue(
              eventLocation.venueName,
            )}
            fullWidth
          />

          <DetailRow
            label={translate("accommodationCost")}
            value={formatRupiah(
              travelCharge,
            )}
            fullWidth
          />
        </div>
      </section>

      {/* PERSONAL */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="person"
          title={translate("personalDetails")}
          description={translate("personalDetailsDescription")}
        />

        <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <DetailRow
            label={translate("fullName")}
            value={getDisplayValue(
              personalData.fullName,
            )}
          />

          {showPartnerName && (
            <DetailRow
              label={translate("partnerName")}
              value={getDisplayValue(
                personalData.partnerName,
              )}
              optional
            />
          )}

          <DetailRow
            label="Email"
            value={getDisplayValue(
              personalData.email,
            )}
          />

          <DetailRow
            label={translate("phoneNumber")}
            value={getDisplayValue(
              personalData.phone,
            )}
          />

          <DetailRow
            label="Instagram"
            value={normalizeInstagram(
              personalData.instagram,
            )}
            optional
            fullWidth
          />
        </div>
      </section>

      {/* VISION */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="auto_awesome"
          title={translate("visionNotes")}
          description={translate("visionNotesDescription")}
        />

        <DetailRow
          label={translate("eventNotes")}
          value={getDisplayValue(
            eventData.vision,
          )}
          optional
          fullWidth
          multiline
        />
      </section>

      {/* IMPORTANT INFO */}
      <section className="pt-7">
        <div className="flex items-start gap-3">
          <AppIcon
            name="info"
            size={20}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <div>
            <h3 className="font-label-md text-label-md text-on-surface">
              Sebelum Mengirim Booking
            </h3>

            <ul className="mt-3 space-y-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              <li>
                Pengiriman formulir belum menjamin ketersediaan tanggal acara.
              </li>
              <li>
                Tim akan meninjau jadwal, lokasi, dan kebutuhan acara terlebih dahulu.
              </li>
              <li>
                Harga paket dapat berubah jika terdapat kebutuhan tambahan.
              </li>
              <li>
                Tim akan menghubungi Anda melalui email atau nomor telepon yang dicantumkan.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {isSubmitting && (
        <div
          role="status"
          className="mt-7 flex items-center gap-3 border-t border-outline-variant/35 pt-5"
        >
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />

          <p className="font-label-md text-label-md text-on-surface-variant">
            Mengirim permintaan booking...
          </p>
        </div>
      )}

      {isSuccess && (
        <div
          role="status"
          className="mt-7 flex items-start gap-3 border-t border-outline-variant/35 pt-5"
        >
          <AppIcon
            name="check_circle"
            size={21}
            className="mt-0.5 shrink-0 text-secondary"
          />

          <div>
            <p className="font-label-md text-label-md text-on-surface">
              Permintaan booking berhasil dikirim.
            </p>

            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Data telah diterima dan akan ditinjau oleh tim.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

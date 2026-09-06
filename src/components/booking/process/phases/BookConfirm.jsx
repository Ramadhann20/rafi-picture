"use client";

import AppIcon from "@/components/global/AppIcon";
import { englishPackageTranslations } from "@/components/packages/PackageListing";
import {
  normalizeEventLocation,
} from "@/lib/location";
import { useLanguage } from "@/context/LanguageContext";

const EMPTY_VALUE = "-";

function getDisplayValue(value) {
  const normalizedValue =
    String(value ?? "").trim();

  return (
    normalizedValue || EMPTY_VALUE
  );
}

function formatEventDate(value, language = "id") {
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
    language === "en" ? "en-US" : "id-ID",
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
  nextDayLabel,
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
      ? ` (${nextDayLabel})`
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
  optionalLabel = "Optional",
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
            {optionalLabel}
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
  selectedPackages = [],
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
  const personalData = formData?.personal ?? {};
  const displayPackages = (selectedPackages.length
    ? selectedPackages
    : displayPackage
      ? [displayPackage]
      : []
  ).map((packageItem) =>
    englishPackageTranslations[packageItem.id] && language === "en"
      ? {
          ...packageItem,
          description: englishPackageTranslations[packageItem.id].description,
          serviceHighlights: englishPackageTranslations[packageItem.id].features,
          features: englishPackageTranslations[packageItem.id].features,
        }
      : packageItem,
  );

  const getPackageEvent = (packageItem, index) =>
    formData?.events?.find(
      (eventItem) => eventItem.packageId === packageItem.id,
    )?.data ?? (index === 0 ? formData?.event ?? {} : {});

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

        {displayPackages.length === 0 ? (
          <p className="font-body-md text-body-md text-error">
            {translate("packageRequired")}
          </p>
        ) : (
          <div className="space-y-6">
            {displayPackages.map((packageItem, packageIndex) => {
              const packageHighlights = getPackageHighlights(packageItem);

              return (
                <article
                  key={`${packageItem.id}-${packageIndex}`}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <p className="font-label-md text-label-md uppercase tracking-wider text-secondary">
                          {translate("packageDetails")} {packageIndex + 1}
                        </p>
                        {packageItem.featured && (
                          <span className="font-label-sm text-[10px] uppercase tracking-widest text-secondary">
                            {translate("mostPopular")}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
                        {packageItem.name}
                      </h3>

                      {packageItem.description && (
                        <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                          {packageItem.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-label-sm text-label-sm text-on-surface-variant">
                        {Number(packageItem.durationHours) > 0 && (
                          <span>
                            {packageItem.durationHours} {translate("hoursCoverage")}
                          </span>
                        )}
                        <span>
                          {packageItem.bookingSubjectType === "couple"
                            ? translate("subjectCouple")
                            : packageItem.bookingSubjectType === "individual"
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
                        {getPackagePrice(packageItem)}
                      </p>
                    </div>
                  </div>

                  {packageHighlights.length > 0 && (
                    <div className="mt-6 border-t border-outline-variant/25 pt-5">
                      <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                        {translate("includedServices")}
                      </p>
                      <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                        {packageHighlights.map((highlight, index) => (
                          <li
                            key={`${highlight}-${index}`}
                            className="flex items-start gap-2.5 font-body-sm text-body-sm text-on-surface-variant"
                          >
                            <AppIcon
                              name="check"
                              size={17}
                              className="mt-0.5 shrink-0 text-secondary"
                            />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
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

        <div className="space-y-6">
          {displayPackages.map((packageItem, index) => {
            const eventData = getPackageEvent(packageItem, index);
            const eventLocation = normalizeEventLocation(eventData.location);
            const accommodationRequest = Math.max(
              Number(eventLocation?.accommodationRequest) || 0,
              0,
            );
            const travelCharge = accommodationRequest > 0
              ? accommodationRequest
              : Number(eventLocation?.distanceCharge?.amount) || 0;

            return (
              <article
                key={`${packageItem.id}-${index}`}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5"
              >
                <h3 className="mb-4 font-headline-md text-headline-md text-primary">
                  {translate("bookingDetails")} {index + 1}: {packageItem.name}
                </h3>
                <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  <DetailRow
                    label={translate("eventDate")}
                    value={formatEventDate(eventData.eventDate, language)}
                  />
                  <DetailRow
                    label={translate("eventTime")}
                    value={getEventTimeLabel(eventData, translate("nextDay"))}
                  />
                  <DetailRow
                    label={translate("eventLocation")}
                    value={getDisplayValue(eventLocation.venueName)}
                    fullWidth
                  />
                  <DetailRow
                    label={translate("accommodationCost")}
                    value={formatRupiah(travelCharge)}
                    fullWidth
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* PERSONAL */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="person"
          title={translate("personalDetails")}
          description={translate("personalDetailsDescription")}
        />

        <div className="space-y-6">
          {selectedPackages.map((packageItem, index) => {
            const packagePersonal =
              formData.personalDetails?.find(
                (entry) => entry.packageId === packageItem.id,
              )?.data ?? personalData;

            return (
              <article
                key={`${packageItem.id}-${index}`}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-5"
              >
                <h3 className="mb-4 font-headline-md text-headline-md text-primary">
                  {translate("personalInformation")} {index + 1}: {packageItem.name}
                </h3>

                <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  <DetailRow
                    label={translate("fullName")}
                    value={getDisplayValue(packagePersonal.fullName)}
                  />

                  {packageItem.bookingSubjectType !== "individual" && (
                    <DetailRow
                      label={translate("partnerName")}
                      value={getDisplayValue(packagePersonal.partnerName)}
                      optional
                      optionalLabel={translate("optional")}
                    />
                  )}

                  <DetailRow
                    label="Email"
                    value={getDisplayValue(packagePersonal.email)}
                  />

                  <DetailRow
                    label={translate("phoneNumber")}
                    value={getDisplayValue(packagePersonal.phone)}
                  />

                  <DetailRow
                    label="Instagram"
                    value={normalizeInstagram(packagePersonal.instagram)}
                    optional
                    optionalLabel={translate("optional")}
                    fullWidth
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* VISION */}
      <section className="border-b border-outline-variant/35 py-7">
        <SectionHeading
          icon="auto_awesome"
          title={translate("visionNotes")}
          description={translate("visionNotesDescription")}
        />

        <div className="space-y-4">
          {selectedPackages.map((packageItem, index) => (
            <DetailRow
              key={`${packageItem.id}-${index}`}
              label={`${translate("eventNotes")} ${index + 1} - ${packageItem.name}`}
              value={getDisplayValue(formData.events?.[index]?.data?.vision)}
              optional
              optionalLabel={translate("optional")}
              fullWidth
              multiline
            />
          ))}
        </div>
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
              {translate("beforeSubmitBooking")}
            </h3>

            <ul className="mt-3 space-y-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              <li>
                {translate("beforeSubmitAvailability")}
              </li>
              <li>
                {translate("beforeSubmitReview")}
              </li>
              <li>
                {translate("beforeSubmitPrice")}
              </li>
              <li>
                {translate("beforeSubmitContact")}
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
            {translate("submittingBooking")}
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
              {translate("bookingSentSuccess")}
            </p>

            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {translate("bookingWillBeReviewed")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

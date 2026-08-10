"use client";

import AppIcon from "@/components/global/AppIcon";

const EMPTY_VALUE = "-";

function toDate(value) {
  if (!value) return null;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return EMPTY_VALUE;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  const date = toDate(value);

  if (!date) return EMPTY_VALUE;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value, currency = "IDR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return EMPTY_VALUE;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getLocationLabel(location) {
  if (typeof location === "string") {
    return location.trim() || EMPTY_VALUE;
  }

  return (
    String(location?.venueName ?? "").trim() ||
    String(location?.addressLabel ?? "").trim() ||
    EMPTY_VALUE
  );
}

function getTravelCharge(booking) {
  return Math.max(
    Number(
      booking?.event?.location?.distanceCharge?.amount,
    ) || 0,
    0,
  );
}

function getEventTimeLabel(event) {
  if (!event?.startTime) return EMPTY_VALUE;

  if (!event?.endTime) {
    return event.startTime;
  }

  return `${event.startTime} - ${event.endTime}${
    Number(event.endTimeDayOffset || 0) > 0
      ? " (next day)"
      : ""
  }`;
}

function getPackageFeatures(packageItem) {
  const features =
    packageItem?.features ??
    packageItem?.serviceHighlights ??
    [];

  return Array.isArray(features)
    ? features
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];
}

function normalizeInstagram(value) {
  const instagram = String(value ?? "").trim();

  if (!instagram) return EMPTY_VALUE;

  return instagram.startsWith("@")
    ? instagram
    : `@${instagram}`;
}

function getSubjectLabel(type) {
  if (type === "couple") {
    return "Couple / Partnered";
  }

  if (type === "individual") {
    return "Individual";
  }

  return EMPTY_VALUE;
}

export default function Review({
  booking,
  statusConfig,
}) {
  const client = booking?.client ?? {};
  const event = booking?.event ?? {};
  const selectedPackage = booking?.package ?? {};

  const showPartnerName =
    selectedPackage.bookingSubjectType === "couple";

  const features =
    getPackageFeatures(selectedPackage);

  const currency =
    selectedPackage.currency ?? "IDR";

  const packageAmount =
    Math.max(
      Number(selectedPackage.price) || 0,
      0,
    );

  const travelCharge =
    getTravelCharge(booking);

  const bookingTotal =
    packageAmount + travelCharge;

  const bookingReference =
    booking?.bookingCode ||
    booking?.id ||
    EMPTY_VALUE;

  return (
    <section aria-labelledby="booking-review-title">
      <div className="mb-stack-md">
        <p className="font-label-md text-label-md uppercase tracking-widest text-secondary">
          Step 01
        </p>

        <h2
          id="booking-review-title"
          className="mt-2 font-headline-lg text-headline-lg text-on-surface"
        >
          Review Booking
        </h2>

        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Review the latest client, event, location, and package snapshot before assigning the crew.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
        <div className="space-y-gutter xl:col-span-8">
          <DetailCard
            icon="person"
            title="Client Information"
          >
            <div className="space-y-1">
              <DetailGrid>
                <DetailItem
                  label="Full Name"
                  value={client.fullName}
                />

                {showPartnerName && (
                  <DetailItem
                    label="Partner Name"
                    value={client.partnerName}
                    optional
                  />
                )}
              </DetailGrid>

              <DetailGrid>
                <DetailItem
                  label="Email"
                  value={client.email}
                />

                <DetailItem
                  label="Phone"
                  value={client.phone}
                />
              </DetailGrid>

              <DetailGrid>
                <DetailItem
                  label="Instagram"
                  value={normalizeInstagram(client.instagram)}
                  optional
                />
              </DetailGrid>
            </div>
          </DetailCard>

          <DetailCard
            icon="calendar_month"
            title="Event Information"
          >
            <DetailGrid>
              <DetailItem
                label="Preferred Date"
                value={formatDate(event.preferredDate)}
              />

              <DetailItem
                label="Event Time"
                value={getEventTimeLabel(event)}
              />

              <DetailItem
                label="Location"
                value={getLocationLabel(event.location)}
                fullWidth
              />

              <DetailItem
                label="Travel Charge"
                value={formatCurrency(travelCharge, currency)}
                fullWidth
                accent={travelCharge > 0}
              />

              <DetailItem
                label="Creative Vision"
                value={event.vision}
                fullWidth
                multiline
                optional
              />
            </DetailGrid>
          </DetailCard>

          <DetailCard
            icon="photo_camera"
            title="Package Information"
          >
            <DetailGrid>
              <DetailItem
                label="Package"
                value={selectedPackage.name}
              />

              <DetailItem
                label="Subject"
                value={getSubjectLabel(
                  selectedPackage.bookingSubjectType,
                )}
              />

              <DetailItem
                label="Duration"
                value={
                  Number(selectedPackage.durationHours) > 0
                    ? `${selectedPackage.durationHours} hours`
                    : EMPTY_VALUE
                }
              />

              <DetailItem
                label="Package Price"
                value={formatCurrency(
                  packageAmount,
                  currency,
                )}
              />

              <div className="sm:col-span-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Features
                </p>

                {features.length > 0 ? (
                  <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {features.map((feature, index) => (
                      <li
                        key={`${feature}-${index}`}
                        className="flex items-start gap-2 font-body-md text-body-md text-on-surface"
                      >
                        <AppIcon
                          name="check"
                          size={18}
                          className="mt-0.5 shrink-0 text-primary"
                        />

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-body-md text-body-md text-on-surface">
                    -
                  </p>
                )}
              </div>
            </DetailGrid>
          </DetailCard>
        </div>

        <aside className="xl:col-span-4">
          <div className="glass-panel rounded-xl p-6">
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
              Booking Summary
            </p>

            <p className="mt-2 break-all font-headline-md text-headline-md text-primary">
              {bookingReference}
            </p>

            <div className="my-6 h-px bg-outline-variant/30" />

            <div className="space-y-5">
              <SummaryItem
                label="Status"
                value={statusConfig?.label}
              />

              <SummaryItem
                label="Submitted"
                value={formatDateTime(booking?.submittedAt)}
              />

              <SummaryItem
                label="Last Updated"
                value={formatDateTime(booking?.updatedAt)}
              />

              <SummaryItem
                label="Package"
                value={formatCurrency(
                  packageAmount,
                  currency,
                )}
              />

              <SummaryItem
                label="Travel Charge"
                value={formatCurrency(
                  travelCharge,
                  currency,
                )}
              />

              <div className="border-t border-outline-variant/30 pt-5">
                <SummaryItem
                  label="Estimated Booking Total"
                  value={formatCurrency(
                    bookingTotal,
                    currency,
                  )}
                  accent
                />
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-surface-container-low px-4 py-3">
              <p className="font-label-sm text-label-sm leading-relaxed text-on-surface-variant">
                {booking?.status === "pending"
                  ? "Confirming this review only unlocks the crew step. No Firestore changes are made until Final Confirmation."
                  : "This booking is displayed in read-only mode."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DetailCard({
  icon,
  title,
  children,
}) {
  return (
    <section className="glass-panel rounded-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
          <AppIcon
            name={icon}
            size={20}
            className="text-primary"
          />
        </div>

        <h3 className="font-headline-md text-headline-md text-primary">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function DetailGrid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {children}
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
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}

        {optional && (
          <span className="ml-2 text-on-surface-variant/50">
            Optional
          </span>
        )}
      </p>

      <p
        className={`mt-1 break-words font-body-md text-body-md font-medium ${
          multiline
            ? "whitespace-pre-wrap leading-relaxed"
            : ""
        } ${
          accent
            ? "text-secondary"
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

function SummaryItem({
  label,
  value,
  accent = false,
}) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>

      <p
        className={`mt-1 break-words font-body-md text-body-md font-medium ${
          accent
            ? "text-primary"
            : "text-on-surface"
        }`}
      >
        {value || EMPTY_VALUE}
      </p>
    </div>
  );
}

/* =========================================================
   details/Review.jsx
========================================================= */
import AppIcon from "@/components/global/AppIcon";

function formatDate(value) {
  if (!value) return "-";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date =
    typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Review({ booking, statusConfig }) {
  const client = booking.client ?? {};
  const event = booking.event ?? {};
  const selectedPackage = booking.package ?? {};

  const features = Array.isArray(selectedPackage.features)
    ? selectedPackage.features
    : [];

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
          Check the client, event, and package information before assigning the
          crew.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
        <div className="space-y-gutter xl:col-span-8">
          <DetailCard icon="person" title="Client Information">
            <DetailGrid>
              <DetailItem label="Full Name" value={client.fullName} />

              <DetailItem label="Partner Name" value={client.partnerName} />

              <DetailItem label="Email" value={client.email} />

              <DetailItem label="Phone" value={client.phone} />

              <DetailItem label="Instagram" value={client.instagram} />
            </DetailGrid>
          </DetailCard>

          <DetailCard icon="calendar_month" title="Event Information">
            <DetailGrid>
              <DetailItem
                label="Preferred Date"
                value={formatDate(event.preferredDate)}
              />

              <DetailItem label="Location" value={event.location} />

              <DetailItem
                label="Creative Vision"
                value={event.vision}
                fullWidth
              />
            </DetailGrid>
          </DetailCard>

          <DetailCard icon="photo_camera" title="Package Information">
            <DetailGrid>
              <DetailItem label="Package" value={selectedPackage.name} />

              <DetailItem
                label="Price"
                value={selectedPackage.priceLabel ?? selectedPackage.price}
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
              #{booking.id}
            </p>

            <div className="my-6 h-px bg-outline-variant/30" />

            <div className="space-y-5">
              <SummaryItem label="Status" value={statusConfig.label} />

              <SummaryItem
                label="Submitted"
                value={formatDateTime(booking.submittedAt)}
              />

              <SummaryItem
                label="Last Updated"
                value={formatDateTime(booking.updatedAt)}
              />

              <SummaryItem
                label="Event Date"
                value={formatDate(event.preferredDate)}
              />
            </div>

            <div className="mt-8 rounded-lg bg-surface-container-low px-4 py-3">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {booking.status === "pending"
                  ? "Confirming this review only unlocks the crew step. No database changes are made until Final Confirmation."
                  : "This booking is displayed in read-only mode."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DetailCard({ icon, title, children }) {
  return (
    <section className="glass-panel rounded-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
          <AppIcon name={icon} size={20} className="text-primary" />
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

function DetailItem({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap break-words font-body-md text-body-md font-medium text-on-surface">
        {value || "-"}
      </p>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>

      <p className="mt-1 break-words font-body-md text-body-md font-medium text-on-surface">
        {value || "-"}
      </p>
    </div>
  );
}

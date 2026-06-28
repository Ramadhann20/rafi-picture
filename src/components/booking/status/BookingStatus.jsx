"use client";

const STATUS_CONFIG = {
  pending: {
    status : "pending",
    label: "Pending Review",
    title: "Thank You for Registering",
    description:
      "Your booking request has been submitted. Our team will review your details and contact you shortly.",
    icon: "hourglass_top",
    iconClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200",
    badgeClass:
      "bg-yellow-100 text-yellow-800 border-yellow-200",
  },

  approved: {
    status : "approved",
    label: "Approved by Admin",
    title: "Your Booking Has Been Approved",
    description:
      "Your booking request has been approved. Please proceed with the deposit Payment.",
    icon: "verified",
    iconClass:
      "bg-blue-100 text-blue-700 border-blue-200",
    badgeClass:
      "bg-blue-100 text-blue-800 border-blue-200",
  },

  confirmed: {
    status : "confirmed",
    label: "Booking Confirmed",
    title: "Admin is Reviewing your payment",
    description:
      "Your booking has been officially confirmed and the admin is reviewing your payment. Please review your booking information below.",
    icon: "check_circle",
    iconClass:
      "bg-green-100 text-green-700 border-green-200",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200",
  },

  in_progress: {
    label: "In Progress",
    title: "Your Booking Is in Progress",
    description:
      "Our team is currently handling your booking and preparing the selected service.",
    icon: "pending_actions",
    iconClass:
      "bg-purple-100 text-purple-700 border-purple-200",
    badgeClass:
      "bg-purple-100 text-purple-800 border-purple-200",
  },

  completed: {
    label: "Completed",
    title: "Booking Completed",
    description:
      "Your booking has been completed. Thank you for choosing our services.",
    icon: "task_alt",
    iconClass:
      "bg-green-100 text-green-700 border-green-200",
    badgeClass:
      "bg-green-100 text-green-800 border-green-200",
  },

  cancelled: {
    label: "Cancelled",
    title: "Booking Cancelled",
    description:
      "This booking has been cancelled. Please contact our team if you need additional information.",
    icon: "cancel",
    iconClass:
      "bg-red-100 text-red-700 border-red-200",
    badgeClass:
      "bg-red-100 text-red-800 border-red-200",
  },
};

function formatDate(value) {
  if (!value) return "-";

  // Mencegah YYYY-MM-DD berubah hari karena timezone.
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function BookingStatus({ booking }) {
  if (!booking) {
    return (
      <section className="flex min-h-100 items-center justify-center">
        <p className="text-on-surface-variant">
          Booking data is not available.
        </p>
      </section>
    );
  }

  const statusConfig =
    STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  const client = booking.client ?? {};
  const event = booking.event ?? {};
  const selectedPackage = booking.package ?? {};

  const packageFeatures = Array.isArray(
    selectedPackage.features
  )
    ? selectedPackage.features
    : [];

  return (
    <section className="relative min-h-160 flex items-center justify-center overflow-hidden py-stack-lg">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full opacity-40 mix-blend-overlay">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBgmqxHsjBiJTfnB_R8i4kz3MqFAQIQuT2jRUrJHwOXa8X6LREmI9OaT8EVrlPES7epYZ1wHJXEttBKNZcGIN26hJQOGBDj2W5wO2VI6pacEvR-Vx4uf0R-ED1r2R_Km6Y-4XegXRdJHjFHe3IgdVvL2PziWzsGIAqjsfk7s2MA4gZaUJ2qpPgKTmUNCE9G1-MlUUi2qYAN4Gz_qKfAVNs_C2yRDeDIBhSF98R2HzMZaFwPdpyZDOJg1CrV-juCSMy-knTianN-5y74")',
            }}
          />
        </div>

        <div className="absolute inset-0 bg-linear-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-200 px-margin-mobile md:px-0 text-center fade-in-up">
        <div className="mb-stack-md flex justify-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center border ${statusConfig.iconClass}`}
          >
            <span className="material-symbols-outlined text-[40px]">
              {statusConfig.icon}
            </span>
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <span
            className={`inline-flex rounded-full border px-4 py-1.5 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <h1 className="font-headline-lg text-headline-lg mb-4 text-primary tracking-tight">
          {statusConfig.title}
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant max-w-135 mx-auto mb-stack-lg leading-relaxed">
          {statusConfig.description}
        </p>

        <div className="glass-panel rounded-xl p-gutter mb-stack-lg text-left max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary">
                receipt_long
              </span>
            </div>

            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Booking Information
              </p>

              <p className="font-label-md text-label-md text-primary break-all">
                Booking ID: {booking.id ?? "-"}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-outline-variant/30 my-4" />

          <InfoSection title="Booking Details">
            <InfoItem
              label="Status"
              value={statusConfig.label}
            />

            <InfoItem
              label="Submitted At"
              value={formatDateTime(booking.submittedAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDateTime(booking.updatedAt)}
            />
          </InfoSection>

          <Divider />

          <InfoSection title="Client Details">
            <InfoItem
              label="Full Name"
              value={client.fullName}
            />

            <InfoItem
              label="Partner Name"
              value={client.partnerName}
            />

            <InfoItem
              label="Email"
              value={client.email}
            />

            <InfoItem
              label="Phone"
              value={client.phone}
            />

            <InfoItem
              label="Instagram"
              value={client.instagram}
            />
          </InfoSection>

          <Divider />

          <InfoSection title="Event Details">
            <InfoItem
              label="Preferred Date"
              value={formatDate(event.preferredDate)}
            />

            <InfoItem
              label="Location"
              value={event.location}
            />

            <InfoItem
              label="Creative Vision"
              value={event.vision}
              fullWidth
            />
          </InfoSection>

          <Divider />

          <InfoSection title="Package Details">
            <InfoItem
              label="Package"
              value={selectedPackage.name}
            />

            <InfoItem
              label="Price"
              value={
                selectedPackage.priceLabel ??
                selectedPackage.price
              }
            />

            <div className="sm:col-span-2">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Features
              </p>

              {packageFeatures.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {packageFeatures.map((feature, index) => (
                    <li
                      key={`${feature}-${index}`}
                      className="flex items-start gap-2 font-body-md text-body-md text-on-surface"
                    >
                      <span className="text-primary">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body-md text-body-md text-on-surface font-medium">
                  -
                </p>
              )}
            </div>
          </InfoSection>
        </div>

        <div className="flex justify-center">
          <a
            className="w-full md:w-auto border border-primary text-primary font-label-md text-label-md px-10 py-3 rounded-lg hover:bg-secondary-container/30 transition-all active:scale-95 text-center"
            href={`/booking/${booking.id}`}
          >
            View My Booking
          </a>
        </div>
      </div>
    </section>
  );
}

function InfoSection({ title, children }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-4">
        {title}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
        {children}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  fullWidth = false,
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </p>

      <p className="font-body-md text-body-md text-on-surface font-medium whitespace-pre-wrap wrap-break-words">
        {value || "-"}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="h-px w-full bg-outline-variant/30 my-6" />
  );
}
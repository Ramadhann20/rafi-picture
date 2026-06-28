"use client";

import { useMemo } from "react";
import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

const DASHBOARD_CURRENCY = "IDR";
const MONTH_COUNT = 6;
const LATEST_BOOKING_LIMIT = 5;

const BOOKING_STATUS = {
  pending: {
    label: "Pending",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  approved: {
    label: "Approved",
    badgeClass: "bg-primary-container text-on-primary-container",
  },

  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-primary text-on-primary",
  },

  in_progress: {
    label: "In Progress",
    badgeClass: "bg-surface-container-highest text-on-surface",
  },

  completed: {
    label: "Completed",
    badgeClass: "bg-secondary-container text-on-secondary-container",
  },

  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-error-container text-error",
  },

  canceled: {
    label: "Cancelled",
    badgeClass: "bg-error-container text-error",
  },
};

const NON_UPCOMING_ASSIGNMENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "void",
  "completed",
]);

const PAID_PAYMENT_STATUSES = new Set([
  "paid",
  "verified",
  "confirmed",
  "completed",
]);

const PENDING_PAYMENT_STATUSES = new Set([
  "pending",
  "pending_verification",
  "waiting_confirmation",
  "waiting_verification",
  "submitted",
]);

const tableHeaders = [
  "Client",
  "Package",
  "Event Date",
  "Amount",
  "Status",
  "Action",
];

/* =========================================================
   DATE HELPERS
========================================================= */

function toDate(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);

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

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function isDateInRange(value, rangeStart, rangeEnd) {
  const date = toDate(value);

  if (!date) return false;

  return date >= rangeStart && date <= rangeEnd;
}

function getBookingCreatedDate(booking) {
  return (
    booking?.submittedAt ??
    booking?.createdAt ??
    booking?.updatedAt ??
    booking?.event?.preferredDate ??
    null
  );
}

function getBookingEventDate(booking) {
  return (
    booking?.event?.preferredDate ?? booking?.eventDate ?? booking?.date ?? null
  );
}

function getAssignmentDate(assignment) {
  return (
    assignment?.eventDate ??
    assignment?.date ??
    assignment?.scheduleDate ??
    null
  );
}

function getPaymentDate(payment) {
  return (
    payment?.verifiedAt ??
    payment?.transferredAt ??
    payment?.submittedAt ??
    payment?.createdAt ??
    payment?.updatedAt ??
    null
  );
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthRange(date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(monthStart)} - ${formatter.format(monthEnd)}`;
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getPaymentStatus(payment) {
  return normalizeStatus(
    payment?.status ??
      payment?.verificationStatus ??
      payment?.paymentStatus ??
      "pending",
  );
}

function getPaymentAmount(payment) {
  return (
    Number(
      payment?.amount ??
        payment?.nominal ??
        payment?.total ??
        payment?.paymentAmount,
    ) || 0
  );
}

function getPaymentCurrency(payment) {
  return payment?.currency ?? payment?.currencyCode ?? DASHBOARD_CURRENCY;
}

function getClientDisplayName(client) {
  const fullName = client?.fullName?.trim();

  const partnerName = client?.partnerName?.trim();

  if (!fullName) return "Unnamed Client";
  if (!partnerName) return fullName;

  return `${fullName} & ${partnerName}`;
}

function getClientInitials(client) {
  const initials = [client?.fullName, client?.partnerName]
    .filter(Boolean)
    .map((name) => name.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "?";
}

function getBookingAmount(booking) {
  return (
    Number(booking?.package?.price ?? booking?.amount ?? booking?.total) || 0
  );
}

function getBookingCurrency(booking) {
  return booking?.package?.currency ?? booking?.currency ?? DASHBOARD_CURRENCY;
}

function formatCurrency(value, currency = DASHBOARD_CURRENCY) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateTrend(currentValue, previousValue) {
  if (currentValue === 0 && previousValue === 0) {
    return null;
  }

  if (previousValue === 0) {
    return currentValue > 0 ? "+100%" : null;
  }

  const percentage = ((currentValue - previousValue) / previousValue) * 100;

  const rounded = Math.round(percentage);

  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function escapeCsvCell(value) {
  const stringValue = String(value ?? "");

  return `"${stringValue.replaceAll('"', '""')}"`;
}

/* =========================================================
   MONTHLY CHART HELPERS
========================================================= */

function createMonthBuckets(referenceDate, monthCount) {
  return Array.from({ length: monthCount }, (_, index) => {
    const offset = index - (monthCount - 1);

    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + offset,
      1,
    );

    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`,

      label: new Intl.DateTimeFormat("en-GB", {
        month: "short",
      }).format(date),

      year: date.getFullYear(),
      month: date.getMonth(),
      total: 0,
    };
  });
}

function getMonthKey(value) {
  const date = toDate(value);

  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const db = useDb();

  const now = useMemo(() => new Date(), []);

  const currentMonthStart = useMemo(() => startOfMonth(now), [now]);

  const currentMonthEnd = useMemo(() => endOfMonth(now), [now]);

  const previousMonthDate = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    [now],
  );

  const previousMonthStart = useMemo(
    () => startOfMonth(previousMonthDate),
    [previousMonthDate],
  );

  const previousMonthEnd = useMemo(
    () => endOfMonth(previousMonthDate),
    [previousMonthDate],
  );

  /* ---------------------------------------------------------
     FIRESTORE DATA
  --------------------------------------------------------- */

  const {
    rows: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useCollection(() => db.query(db.colRef("Bookings")), []);

  /*
   * Assignment tidak memakai orderBy agar data lama
   * yang masih memakai field `date` tetap ikut terbaca.
   */
  const {
    rows: assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useCollection(() => db.query(db.colRef("CrewAssignments")), []);

  /*
   * Payment dinormalisasi di client karena data lama
   * dapat memakai `verificationStatus`, sedangkan data
   * baru dapat memakai `status`.
   */
  const {
    rows: payments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useCollection(() => db.query(db.colRef("Payments")), []);

  /* ---------------------------------------------------------
     BOOKING METRICS
  --------------------------------------------------------- */

  const currentMonthBookings = useMemo(() => {
    return bookings.filter((booking) =>
      isDateInRange(
        getBookingCreatedDate(booking),
        currentMonthStart,
        currentMonthEnd,
      ),
    );
  }, [bookings, currentMonthStart, currentMonthEnd]);

  const previousMonthBookings = useMemo(() => {
    return bookings.filter((booking) =>
      isDateInRange(
        getBookingCreatedDate(booking),
        previousMonthStart,
        previousMonthEnd,
      ),
    );
  }, [bookings, previousMonthStart, previousMonthEnd]);

  const upcomingAssignments = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return assignments.filter((assignment) => {
      const status = normalizeStatus(assignment.status);

      if (NON_UPCOMING_ASSIGNMENT_STATUSES.has(status)) {
        return false;
      }

      const eventDate = toDate(getAssignmentDate(assignment));

      return eventDate && eventDate >= today;
    });
  }, [assignments, now]);

  /* ---------------------------------------------------------
     PAYMENT METRICS
  --------------------------------------------------------- */

  const normalizedPayments = useMemo(() => {
    return payments.map((payment) => ({
      ...payment,

      normalizedStatus: getPaymentStatus(payment),

      normalizedAmount: getPaymentAmount(payment),

      normalizedCurrency: getPaymentCurrency(payment),

      normalizedDate: getPaymentDate(payment),
    }));
  }, [payments]);

  const currentMonthPayments = useMemo(() => {
    return normalizedPayments.filter((payment) =>
      isDateInRange(payment.normalizedDate, currentMonthStart, currentMonthEnd),
    );
  }, [normalizedPayments, currentMonthStart, currentMonthEnd]);

  const previousMonthPayments = useMemo(() => {
    return normalizedPayments.filter((payment) =>
      isDateInRange(
        payment.normalizedDate,
        previousMonthStart,
        previousMonthEnd,
      ),
    );
  }, [normalizedPayments, previousMonthStart, previousMonthEnd]);

  const monthlyRevenue = useMemo(() => {
    return currentMonthPayments
      .filter(
        (payment) =>
          PAID_PAYMENT_STATUSES.has(payment.normalizedStatus) &&
          payment.normalizedCurrency === DASHBOARD_CURRENCY,
      )
      .reduce((total, payment) => total + payment.normalizedAmount, 0);
  }, [currentMonthPayments]);

  const previousMonthlyRevenue = useMemo(() => {
    return previousMonthPayments
      .filter(
        (payment) =>
          PAID_PAYMENT_STATUSES.has(payment.normalizedStatus) &&
          payment.normalizedCurrency === DASHBOARD_CURRENCY,
      )
      .reduce((total, payment) => total + payment.normalizedAmount, 0);
  }, [previousMonthPayments]);

  const pendingPayments = useMemo(() => {
    return normalizedPayments.filter((payment) =>
      PENDING_PAYMENT_STATUSES.has(payment.normalizedStatus),
    );
  }, [normalizedPayments]);

  const paymentDistribution = useMemo(() => {
    return currentMonthPayments.reduce(
      (summary, payment) => {
        if (payment.normalizedCurrency !== DASHBOARD_CURRENCY) {
          return summary;
        }

        if (PAID_PAYMENT_STATUSES.has(payment.normalizedStatus)) {
          summary.paid += payment.normalizedAmount;
        } else if (PENDING_PAYMENT_STATUSES.has(payment.normalizedStatus)) {
          summary.pending += payment.normalizedAmount;
        }

        return summary;
      },
      {
        paid: 0,
        pending: 0,
      },
    );
  }, [currentMonthPayments]);

  const totalPaymentDistribution =
    paymentDistribution.paid + paymentDistribution.pending;

  const fulfilledPercentage =
    totalPaymentDistribution > 0
      ? Math.round((paymentDistribution.paid / totalPaymentDistribution) * 100)
      : 0;

  /* ---------------------------------------------------------
     DASHBOARD VIEW MODELS
  --------------------------------------------------------- */

  const stats = useMemo(() => {
    return [
      {
        label: "Total Orders",
        value: bookings.length,
        icon: "shopping_bag",
        trend: calculateTrend(
          currentMonthBookings.length,
          previousMonthBookings.length,
        ),
        iconClass: "bg-primary-container text-on-primary-container",
      },

      {
        label: "Upcoming Schedules",
        value: upcomingAssignments.length,
        icon: "calendar_month",
        trend: null,
        iconClass: "bg-secondary-container text-on-secondary-container",
      },

      {
        label: "Monthly Revenue",
        value: formatCurrency(monthlyRevenue),
        icon: "payments",
        trend: calculateTrend(monthlyRevenue, previousMonthlyRevenue),
        iconClass: "bg-primary-container text-on-primary-container",
      },

      {
        label: "Pending Payments",
        value: pendingPayments.length,
        icon: "receipt",
        trend: null,
        iconClass: "bg-error-container text-error",
      },
    ];
  }, [
    bookings.length,
    currentMonthBookings.length,
    monthlyRevenue,
    pendingPayments.length,
    previousMonthBookings.length,
    previousMonthlyRevenue,
    upcomingAssignments.length,
  ]);

  const bookingBars = useMemo(() => {
    const buckets = createMonthBuckets(now, MONTH_COUNT);

    const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    bookings.forEach((booking) => {
      const monthKey = getMonthKey(getBookingCreatedDate(booking));

      const bucket = bucketByKey.get(monthKey);

      if (bucket) {
        bucket.total += 1;
      }
    });

    const maxTotal = Math.max(1, ...buckets.map((bucket) => bucket.total));

    return buckets.map((bucket) => ({
      ...bucket,

      heightPercentage:
        bucket.total === 0 ? 4 : Math.max(10, (bucket.total / maxTotal) * 100),

      active:
        bucket.year === now.getFullYear() && bucket.month === now.getMonth(),
    }));
  }, [bookings, now]);

  const latestBookings = useMemo(() => {
    return [...bookings]
      .sort((first, second) => {
        const firstDate = toDate(getBookingCreatedDate(first))?.getTime() ?? 0;

        const secondDate =
          toDate(getBookingCreatedDate(second))?.getTime() ?? 0;

        return secondDate - firstDate;
      })
      .slice(0, LATEST_BOOKING_LIMIT);
  }, [bookings]);

  const paymentSummary = [
    {
      label: "Verified",
      value: formatCurrency(paymentDistribution.paid),
      dotClass: "bg-primary",
    },

    {
      label: "Pending",
      value: formatCurrency(paymentDistribution.pending),
      dotClass: "bg-error",
    },
  ];

  /* ---------------------------------------------------------
     ACTIONS
  --------------------------------------------------------- */

  const handleGenerateReport = () => {
    const header = [
      "Booking ID",
      "Client",
      "Package",
      "Event Date",
      "Amount",
      "Currency",
      "Status",
    ];

    const rows = bookings.map((booking) => [
      booking.id,
      getClientDisplayName(booking.client),
      booking.package?.name ?? "",
      formatDate(getBookingEventDate(booking)),
      getBookingAmount(booking),
      getBookingCurrency(booking),
      booking.status ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = `studio-bookings-${now.toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
  };

  /* ---------------------------------------------------------
     LOADING / ERROR STATE
  --------------------------------------------------------- */

  const loading = bookingsLoading || assignmentsLoading || paymentsLoading;

  const error = bookingsError || assignmentsError || paymentsError;

  if (loading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <section className="glass-panel rounded-xl p-stack-md text-center">
        <AppIcon name="block" size={32} className="mx-auto text-error" />

        <h1 className="mt-4 font-headline-md text-headline-md text-error">
          Failed to load dashboard
        </h1>

        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Booking, assignment, or payment data could not be loaded.
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="mb-stack-lg flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
            Overview
          </p>

          <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Studio Dashboard
          </h1>

          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Live summary from bookings, crew schedules, and payments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={bookings.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-6 py-2.5 font-label-md text-label-md text-primary transition-all hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
          >
            <AppIcon name="download" size={18} />
            Generate Report
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-on-surface-variant">
            <AppIcon name="calendar_month" size={19} />

            <span className="font-label-md text-label-md">
              {formatMonthRange(now)}
            </span>
          </div>
        </div>
      </header>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="mb-stack-lg grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="glass-panel rounded-xl p-stack-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconClass}`}
              >
                <AppIcon name={item.icon} size={21} />
              </div>

              {item.trend && (
                <span
                  className={`rounded px-2 py-1 font-label-sm text-label-sm ${
                    item.trend.startsWith("-")
                      ? "bg-error-container text-error"
                      : "bg-primary-container text-primary"
                  }`}
                >
                  {item.trend}
                </span>
              )}
            </div>

            <h2 className="font-label-md text-label-md text-on-surface-variant">
              {item.label}
            </h2>

            <p className="mt-1 font-headline-md text-headline-md text-primary">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      {/* =====================================================
          ANALYTICS
      ===================================================== */}

      <section className="mb-stack-lg grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <article className="glass-panel rounded-xl p-stack-md lg:col-span-2">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">
                Monthly Bookings
              </h2>

              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Booking requests submitted during the last six months.
              </p>
            </div>

            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Last {MONTH_COUNT} months
            </span>
          </div>

          <div className="flex h-64 items-end justify-between gap-3 border-b border-outline-variant px-2 pb-8 sm:px-4">
            {bookingBars.map((item) => (
              <div
                key={item.key}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className="mb-2 rounded bg-primary px-2 py-1 text-xs text-on-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {item.total}
                </span>

                <div
                  title={`${item.label}: ${item.total} bookings`}
                  className={`w-full max-w-10 rounded-t-lg transition-transform group-hover:scale-y-105 ${
                    item.active ? "bg-primary" : "bg-primary-container"
                  }`}
                  style={{
                    height: `${item.heightPercentage}%`,
                    transformOrigin: "bottom",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between gap-3 px-2 font-label-sm text-label-sm text-on-surface-variant sm:px-4">
            {bookingBars.map((item) => (
              <span key={item.key} className="min-w-0 flex-1 text-center">
                {item.label}
              </span>
            ))}
          </div>
        </article>

        <article className="glass-panel rounded-xl p-stack-md">
          <h2 className="font-headline-md text-headline-md text-primary">
            Payment Distribution
          </h2>

          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            Verified and pending payments this month.
          </p>

          <div className="flex items-center justify-center py-6">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg
                className="h-40 w-40 -rotate-90"
                viewBox="0 0 120 120"
                role="img"
                aria-label={`${fulfilledPercentage}% fulfilled`}
              >
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-surface-container-highest"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={`${(
                    (fulfilledPercentage / 100) *
                    289
                  ).toFixed(2)} 289`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-500"
                />
              </svg>

              <div className="absolute text-center">
                <p className="font-headline-md text-headline-md text-primary">
                  {fulfilledPercentage}%
                </p>

                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Fulfilled
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {paymentSummary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${item.dotClass}`} />

                  <span className="font-body-md text-body-md text-on-surface">
                    {item.label}
                  </span>
                </div>

                <span className="text-right font-label-md text-label-md text-on-surface">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* =====================================================
          LATEST BOOKINGS
      ===================================================== */}

      <section className="glass-panel overflow-hidden rounded-xl">
        <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-stack-md py-stack-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Latest Bookings
            </h2>

            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
              Most recently submitted booking requests.
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="shrink-0 font-label-md text-label-md text-primary underline decoration-primary underline-offset-4"
          >
            View All
          </Link>
        </div>

        {latestBookings.length === 0 ? (
          <EmptyBookings />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  {tableHeaders.map((head) => (
                    <th
                      key={head}
                      className={`px-stack-md py-4 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant ${
                        head === "Action" ? "text-right" : ""
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant">
                {latestBookings.map((booking) => {
                  const status = normalizeStatus(booking.status);

                  const statusConfig =
                    BOOKING_STATUS[status] ?? BOOKING_STATUS.pending;

                  return (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-stack-md py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container font-label-sm text-label-sm font-bold text-on-secondary-container">
                            {getClientInitials(booking.client)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-body-md text-body-md font-medium text-on-surface">
                              {getClientDisplayName(booking.client)}
                            </p>

                            <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                              {booking.client?.email ?? booking.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-stack-md py-5 font-body-md text-body-md text-on-surface">
                        {booking.package?.name ?? "-"}
                      </td>

                      <td className="px-stack-md py-5 font-body-md text-body-md text-on-surface-variant">
                        {formatDate(getBookingEventDate(booking))}
                      </td>

                      <td className="px-stack-md py-5 font-body-md text-body-md text-on-surface">
                        {formatCurrency(
                          getBookingAmount(booking),
                          getBookingCurrency(booking),
                        )}
                      </td>

                      <td className="px-stack-md py-5">
                        <span
                          className={`rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="px-stack-md py-5 text-right">
                        <Link
                          href="/admin/orders"
                          aria-label={`Open booking ${booking.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                        >
                          <AppIcon name="more_vert" size={20} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

/* =========================================================
   UI STATES
========================================================= */

function DashboardLoading() {
  return (
    <section>
      <div className="mb-stack-lg">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container-high" />
        <div className="mt-3 h-10 w-72 max-w-full animate-pulse rounded bg-surface-container-high" />
      </div>

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="glass-panel h-36 animate-pulse rounded-xl bg-surface-container-low"
          />
        ))}
      </div>

      <div className="mt-stack-lg grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="glass-panel h-96 animate-pulse rounded-xl bg-surface-container-low lg:col-span-2" />
        <div className="glass-panel h-96 animate-pulse rounded-xl bg-surface-container-low" />
      </div>
    </section>
  );
}

function EmptyBookings() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
        <AppIcon
          name="shopping_bag"
          size={27}
          className="text-on-surface-variant"
        />
      </div>

      <h3 className="mt-4 font-headline-md text-headline-md text-on-surface">
        No bookings yet
      </h3>

      <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
        New booking requests will appear here after clients submit the booking
        form.
      </p>
    </div>
  );
}

"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppIcon from "@/components/global/AppIcon";

import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import {
  getPaymentProofUrl,
} from "@/lib/paymentProofDb";

const PAYMENT_FILTERS = [
  {
    id: "pending",
    label: "Pending Review",
  },
  {
    id: "verified",
    label: "Verified",
  },
  {
    id: "rejected",
    label: "Rejected",
  },
  {
    id: "all",
    label: "All Payments",
  },
];

const PAYMENT_STATUS = {
  pending: {
    label: "Pending Review",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  pending_verification: {
    label: "Pending Review",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  verified: {
    label: "Verified",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },

  paid: {
    label: "Verified",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },

  rejected: {
    label: "Rejected",
    badgeClass:
      "bg-error-container text-error",
  },
};

function normalizePaymentStatus(status) {
  const normalizedStatus = String(
    status ?? "pending_verification",
  ).toLowerCase();

  const statusMap = {
    pending: "pending_verification",
    submitted: "pending_verification",
    waiting_verification:
      "pending_verification",
    waiting_confirmation:
      "pending_verification",

    paid: "verified",
    confirmed: "verified",
    completed: "verified",

    declined: "rejected",
    failed: "rejected",
  };

  return (
    statusMap[normalizedStatus] ??
    normalizedStatus
  );
}

function toDate(value) {
  if (!value) return null;

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

function formatDateTime(value) {
  const date = toDate(value);

  if (!date) return "-";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function formatRelativeTime(value) {
  const date = toDate(value);

  if (!date) return "-";

  const differenceInMinutes =
    Math.round(
      (date.getTime() - Date.now()) /
        60000,
    );

  const formatter =
    new Intl.RelativeTimeFormat(
      "en",
      {
        numeric: "auto",
      },
    );

  if (
    Math.abs(differenceInMinutes) <
    60
  ) {
    return formatter.format(
      differenceInMinutes,
      "minute",
    );
  }

  const differenceInHours =
    Math.round(
      differenceInMinutes / 60,
    );

  if (
    Math.abs(differenceInHours) <
    24
  ) {
    return formatter.format(
      differenceInHours,
      "hour",
    );
  }

  return formatter.format(
    Math.round(
      differenceInHours / 24,
    ),
    "day",
  );
}

function formatCurrency(
  amount,
  currency = "IDR",
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(Number(amount) || 0);
}

function getClientDisplayName(client) {
  const fullName =
    client?.fullName ??
    client?.name ??
    null;

  if (!fullName) {
    return "Unnamed client";
  }

  if (!client?.partnerName) {
    return fullName;
  }

  return `${fullName} & ${client.partnerName}`;
}

function getClientInitials(client) {
  const fullName =
    client?.fullName ??
    client?.name ??
    "";

  return [
    fullName,
    client?.partnerName,
  ]
    .filter(Boolean)
    .map((name) =>
      String(name)
        .trim()
        .charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getInvoiceLabel(invoice) {
  return (
    invoice?.invoiceNumber ??
    invoice?.id ??
    "Payment submission"
  );
}

function getSelectedPaymentFromUrl() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const params =
    new URLSearchParams(
      window.location.search,
    );

  return (
    params.get("paymentId") ??
    null
  );
}

export default function Payments() {
  const db = useDb();

  const [activeFilter, setActiveFilter] =
    useState("pending");

  const [search, setSearch] =
    useState("");

  const [
    sortDirection,
    setSortDirection,
  ] = useState("desc");

  const [
    selectedPaymentId,
    setSelectedPaymentId,
  ] = useState(null);

  const [
    requestedPaymentId,
    setRequestedPaymentId,
  ] = useState(null);

  const [
    processingAction,
    setProcessingAction,
  ] = useState(null);

  const [
    actionError,
    setActionError,
  ] = useState(null);

  const [
    proofUrl,
    setProofUrl,
  ] = useState(null);

  const [
    proofLoading,
    setProofLoading,
  ] = useState(false);

  const [
    proofError,
    setProofError,
  ] = useState(null);

  /* =========================================================
     FIRESTORE DATA
  ========================================================= */

  const {
    rows: payments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Payments"),
        db.orderBy(
          "submittedAt",
          "desc",
        ),
      ),
    [],
  );

  const {
    rows: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Bookings"),
      ),
    [],
  );

  const {
    rows: invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Invoices"),
      ),
    [],
  );

  const {
    rows: schedules,
    loading: schedulesLoading,
    error: schedulesError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Schedules"),
      ),
    [],
  );

  /* =========================================================
     LOOKUP MAPS
  ========================================================= */

  const bookingById =
    useMemo(
      () =>
        new Map(
          bookings.map(
            (booking) => [
              booking.id,
              booking,
            ],
          ),
        ),
      [bookings],
    );

  const invoiceById =
    useMemo(
      () =>
        new Map(
          invoices.map(
            (invoice) => [
              invoice.id,
              invoice,
            ],
          ),
        ),
      [invoices],
    );

  /* =========================================================
     URL SELECTION
  ========================================================= */

  useEffect(() => {
    setRequestedPaymentId(
      getSelectedPaymentFromUrl(),
    );
  }, []);

  useEffect(() => {
    if (!requestedPaymentId) {
      return;
    }

    const paymentExists =
      payments.some(
        (payment) =>
          payment.id ===
          requestedPaymentId,
      );

    if (paymentExists) {
      setSelectedPaymentId(
        requestedPaymentId,
      );
    }
  }, [
    requestedPaymentId,
    payments,
  ]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filterCounts =
    useMemo(() => {
      const countByStatus =
        (status) =>
          payments.filter(
            (payment) =>
              normalizePaymentStatus(
                payment.status ??
                  payment.verificationStatus,
              ) === status,
          ).length;

      return {
        pending:
          countByStatus(
            "pending_verification",
          ),

        verified:
          countByStatus(
            "verified",
          ),

        rejected:
          countByStatus(
            "rejected",
          ),

        all: payments.length,
      };
    }, [payments]);

  const filteredPayments =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const result =
        payments.filter(
          (payment) => {
            const booking =
              bookingById.get(
                payment.bookingId,
              );

            const invoice =
              invoiceById.get(
                payment.invoiceId,
              );

            const paymentStatus =
              normalizePaymentStatus(
                payment.status ??
                  payment.verificationStatus,
              );

            const searchableText = [
              payment.id,
              payment.referenceNumber,
              payment.proofFileName,
              invoice?.invoiceNumber,
              booking?.client
                ?.fullName,
              booking?.client
                ?.partnerName,
              booking?.client
                ?.email,
              booking?.package
                ?.name,
              booking?.event
                ?.location,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const matchesSearch =
              normalizedSearch ===
                "" ||
              searchableText.includes(
                normalizedSearch,
              );

            let matchesFilter =
              true;

            if (
              activeFilter ===
              "pending"
            ) {
              matchesFilter =
                paymentStatus ===
                "pending_verification";
            }

            if (
              activeFilter ===
              "verified"
            ) {
              matchesFilter =
                paymentStatus ===
                "verified";
            }

            if (
              activeFilter ===
              "rejected"
            ) {
              matchesFilter =
                paymentStatus ===
                "rejected";
            }

            return (
              matchesSearch &&
              matchesFilter
            );
          },
        );

      return [...result].sort(
        (first, second) => {
          const firstTime =
            toDate(
              first.submittedAt ??
                first.createdAt,
            )?.getTime() ?? 0;

          const secondTime =
            toDate(
              second.submittedAt ??
                second.createdAt,
            )?.getTime() ?? 0;

          return sortDirection ===
            "asc"
            ? firstTime -
                secondTime
            : secondTime -
                firstTime;
        },
      );
    }, [
      payments,
      bookingById,
      invoiceById,
      search,
      activeFilter,
      sortDirection,
    ]);

  /* =========================================================
     SELECTED PAYMENT
  ========================================================= */

  const selectedPayment =
    useMemo(
      () =>
        payments.find(
          (payment) =>
            payment.id ===
            selectedPaymentId,
        ) ?? null,
      [
        payments,
        selectedPaymentId,
      ],
    );

  const selectedBooking =
    selectedPayment
      ? bookingById.get(
          selectedPayment.bookingId,
        ) ?? null
      : null;

  const selectedInvoice =
    selectedPayment
      ? invoiceById.get(
          selectedPayment.invoiceId,
        ) ?? null
      : null;

  const selectedPaymentStatus =
    selectedPayment
      ? normalizePaymentStatus(
          selectedPayment.status ??
            selectedPayment.verificationStatus,
        )
      : null;

  const selectedStatusConfig =
    selectedPaymentStatus
      ? PAYMENT_STATUS[
          selectedPaymentStatus
        ] ??
        PAYMENT_STATUS.pending_verification
      : null;

  /* =========================================================
     INDEXEDDB PROOF
  ========================================================= */

  useEffect(() => {
    let localObjectUrl =
      null;

    let cancelled = false;

    async function loadProof() {
      setProofUrl(null);
      setProofError(null);

      if (!selectedPayment) {
        setProofLoading(false);
        return;
      }

      if (
        selectedPayment.proofUrl
      ) {
        setProofUrl(
          selectedPayment.proofUrl,
        );
        setProofLoading(false);
        return;
      }

      if (
        !selectedPayment.proofStorageKey
      ) {
        setProofError(
          "Payment proof key is not available.",
        );
        setProofLoading(false);
        return;
      }

      setProofLoading(true);

      try {
        localObjectUrl =
          await getPaymentProofUrl(
            selectedPayment.proofStorageKey,
          );

        if (cancelled) {
          return;
        }

        if (!localObjectUrl) {
          setProofError(
            "Payment proof was not found in this browser.",
          );
          return;
        }

        setProofUrl(
          localObjectUrl,
        );
      } catch (error) {
        console.error(
          "LOAD PAYMENT PROOF ERROR:",
          error,
        );

        if (!cancelled) {
          setProofError(
            "Failed to load payment proof.",
          );
        }
      } finally {
        if (!cancelled) {
          setProofLoading(false);
        }
      }
    }

    loadProof();

    return () => {
      cancelled = true;

      if (localObjectUrl) {
        URL.revokeObjectURL(
          localObjectUrl,
        );
      }
    };
  }, [
    selectedPayment?.id,
    selectedPayment
      ?.proofStorageKey,
    selectedPayment?.proofUrl,
  ]);

  /* =========================================================
     UI HANDLERS
  ========================================================= */

  const handleFilterChange =
    (filterId) => {
      setActiveFilter(filterId);
      setSelectedPaymentId(null);
      setActionError(null);
    };

  const handleCloseDetail =
    () => {
      setSelectedPaymentId(null);
      setActionError(null);

      if (
        typeof window !==
        "undefined"
      ) {
        const url =
          new URL(
            window.location.href,
          );

        url.searchParams.delete(
          "paymentId",
        );

        window.history.replaceState(
          null,
          "",
          `${url.pathname}${url.search}`,
        );
      }
    };

  const handleSelectPayment =
    (paymentId) => {
      setSelectedPaymentId(
        paymentId,
      );

      setActionError(null);
    };

  const handleOpenProof =
    () => {
      if (!proofUrl) {
        return;
      }

      window.open(
        proofUrl,
        "_blank",
        "noopener,noreferrer",
      );
    };

  /* =========================================================
     PAYMENT REVIEW
  ========================================================= */

  const handleApprovePayment =
    async () => {
      if (
        !selectedPayment ||
        !selectedBooking
      ) {
        return;
      }

      setProcessingAction(
        "approve",
      );

      setActionError(null);

      try {
        const existingSchedule =
          schedules.find(
            (schedule) =>
              schedule.bookingId ===
                selectedBooking.id &&
              schedule.status !==
                "cancelled",
          );

        /*
         * Payment menjadi verified.
         */
        await db.updateDoc(
          "Payments",
          selectedPayment.id,
          {
            status: "verified",
            verificationStatus:
              "verified",

            verifiedAt:
              db.serverTimestamp(),

            reviewedAt:
              db.serverTimestamp(),

            updatedAt:
              db.serverTimestamp(),
          },
        );

        /*
         * Invoice terkait menjadi paid.
         */
        if (
          selectedInvoice?.id
        ) {
          await db.updateDoc(
            "Invoices",
            selectedInvoice.id,
            {
              status: "paid",

              paidAt:
                db.serverTimestamp(),

              updatedAt:
                db.serverTimestamp(),
            },
          );
        }

        /*
         * Booking masuk tahap produksi.
         */
        await db.updateDoc(
          "Bookings",
          selectedBooking.id,
          {
            status: "in_progress",

            paymentStatus:
              "verified",

            paymentVerifiedAt:
              db.serverTimestamp(),

            updatedAt:
              db.serverTimestamp(),
          },
        );

        /*
         * Satu booking hanya dibuatkan satu
         * schedule aktif.
         */
        if (!existingSchedule) {
          await db.addDoc(
            "Schedules",
            {
              bookingId:
                selectedBooking.id,

              clientId:
                selectedBooking.client
                  ?.uid ?? null,

              paymentId:
                selectedPayment.id,

              eventDate:
                selectedBooking.event
                  ?.preferredDate ??
                null,

              location:
                selectedBooking.event
                  ?.location ??
                null,

              status: "draft",

              source:
                "payment_verification",

              createdAt:
                db.serverTimestamp(),

              updatedAt:
                db.serverTimestamp(),
            },
          );
        }
      } catch (error) {
        console.error(
          "APPROVE PAYMENT ERROR:",
          error,
        );

        setActionError(
          error?.message ??
            "Failed to approve payment.",
        );
      } finally {
        setProcessingAction(
          null,
        );
      }
    };

  const handleRejectPayment =
    async () => {
      if (
        !selectedPayment ||
        !selectedBooking
      ) {
        return;
      }

      setProcessingAction(
        "reject",
      );

      setActionError(null);

      try {
        await db.updateDoc(
          "Payments",
          selectedPayment.id,
          {
            status: "rejected",

            verificationStatus:
              "rejected",

            rejectedAt:
              db.serverTimestamp(),

            reviewedAt:
              db.serverTimestamp(),

            updatedAt:
              db.serverTimestamp(),
          },
        );

        /*
         * Invoice tetap dapat dibayar ulang.
         */
        if (
          selectedInvoice?.id
        ) {
          await db.updateDoc(
            "Invoices",
            selectedInvoice.id,
            {
              status: "issued",

              updatedAt:
                db.serverTimestamp(),
            },
          );
        }

        /*
         * Booking dikembalikan ke approved agar
         * client dapat mengunggah bukti baru.
         */
        await db.updateDoc(
          "Bookings",
          selectedBooking.id,
          {
            status: "approved",

            paymentStatus:
              "rejected",

            paymentRejectedAt:
              db.serverTimestamp(),

            updatedAt:
              db.serverTimestamp(),
          },
        );
      } catch (error) {
        console.error(
          "REJECT PAYMENT ERROR:",
          error,
        );

        setActionError(
          error?.message ??
            "Failed to reject payment.",
        );
      } finally {
        setProcessingAction(
          null,
        );
      }
    };

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const loading =
    paymentsLoading ||
    bookingsLoading ||
    invoicesLoading ||
    schedulesLoading;

  const dataError =
    paymentsError ||
    bookingsError ||
    invoicesError ||
    schedulesError;

  if (loading) {
    return (
      <PageState>
        Loading payment data...
      </PageState>
    );
  }

  if (dataError) {
    return (
      <PageState error>
        Failed to load payment data.
      </PageState>
    );
  }

  return (
    <section>
      <header className="mb-stack-lg">
        <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
          Payments
        </p>

        <h1 className="font-display-lg text-display-lg text-primary">
          Payment Verification
        </h1>

        <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Review payment proofs submitted by clients and
          continue approved bookings into production.
        </p>
      </header>

      <section className="glass-panel h-[calc(100dvh-32px)] overflow-hidden rounded-xl">
        <div className="flex h-full min-h-0 flex-col lg:flex-row">
          {/* ===============================================
              PAYMENT LIST
          =============================================== */}

          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl transition-[border-radius] duration-500 ${
              selectedPayment
                ? "lg:rounded-r-none"
                : ""
            }`}
          >
            <div className="shrink-0 border-b border-outline-variant/20 p-4 sm:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <nav
                  aria-label="Payment filters"
                  className="hide-scrollbar flex overflow-x-auto rounded-lg bg-surface-container-high p-1"
                >
                  {PAYMENT_FILTERS.map(
                    (filter) => {
                      const isActive =
                        filter.id ===
                        activeFilter;

                      return (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() =>
                            handleFilterChange(
                              filter.id,
                            )
                          }
                          className={`shrink-0 rounded-md px-4 py-2.5 font-label-md text-label-md transition-all duration-200 sm:px-5 ${
                            isActive
                              ? "bg-surface-bright text-primary shadow-sm"
                              : "text-on-surface-variant hover:text-primary"
                          }`}
                        >
                          {filter.label}

                          <span className="ml-1.5 opacity-60">
                            (
                            {
                              filterCounts[
                                filter.id
                              ]
                            }
                            )
                          </span>
                        </button>
                      );
                    },
                  )}
                </nav>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-0 sm:w-64">
                    <AppIcon
                      name="search"
                      size={19}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                    />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Search payment..."
                      className="w-full rounded-lg border-none bg-surface-container-high py-2.5 pl-10 pr-4 font-label-md text-label-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSortDirection(
                        (
                          currentDirection,
                        ) =>
                          currentDirection ===
                          "desc"
                            ? "asc"
                            : "desc",
                      )
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant/40 px-4 py-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-primary"
                  >
                    <AppIcon
                      name="filter_list"
                      size={18}
                    />

                    {sortDirection ===
                    "desc"
                      ? "Newest First"
                      : "Oldest First"}
                  </button>
                </div>
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {filteredPayments.map(
                (payment) => {
                  const booking =
                    bookingById.get(
                      payment.bookingId,
                    );

                  const invoice =
                    invoiceById.get(
                      payment.invoiceId,
                    );

                  const paymentStatus =
                    normalizePaymentStatus(
                      payment.status ??
                        payment.verificationStatus,
                    );

                  const statusConfig =
                    PAYMENT_STATUS[
                      paymentStatus
                    ] ??
                    PAYMENT_STATUS.pending_verification;

                  const isSelected =
                    payment.id ===
                    selectedPaymentId;

                  return (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() =>
                        handleSelectPayment(
                          payment.id,
                        )
                      }
                      className={`group block w-full rounded-xl p-5 text-left transition-all duration-300 sm:p-6 ${
                        isSelected
                          ? "border-2 border-primary bg-surface-container-lowest shadow-xl"
                          : "border border-outline-variant/25 bg-surface-bright/60 hover:-translate-y-0.5 hover:border-outline-variant/60 hover:bg-surface-bright hover:shadow-lg"
                      }`}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isSelected
                                ? "bg-secondary-container text-secondary"
                                : "bg-surface-container-high text-on-surface-variant group-hover:bg-secondary-container group-hover:text-secondary"
                            }`}
                          >
                            {booking ? (
                              <span className="font-label-md text-label-md">
                                {getClientInitials(
                                  booking.client,
                                )}
                              </span>
                            ) : (
                              <AppIcon
                                name="person"
                                size={20}
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate font-label-md text-label-md text-on-surface">
                              {booking
                                ? getClientDisplayName(
                                    booking.client,
                                  )
                                : "Unknown client"}
                            </h2>

                            <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                              Invoice: #
                              {getInvoiceLabel(
                                invoice,
                              )}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded bg-surface-container-high px-2 py-1 font-label-sm text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                {booking
                                  ?.package
                                  ?.name ??
                                  "Bank Transfer"}
                              </span>

                              <span className="font-label-sm text-label-sm text-on-surface-variant/60">
                                •{" "}
                                {formatRelativeTime(
                                  payment.submittedAt ??
                                    payment.createdAt,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="font-headline-md text-headline-md text-primary">
                            {formatCurrency(
                              payment.amount,
                              payment.currency,
                            )}
                          </p>

                          <span
                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 font-label-sm text-[11px] ${statusConfig.badgeClass}`}
                          >
                            {
                              statusConfig.label
                            }
                          </span>

                          <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
                            {
                              payment.referenceNumber ??
                              "Bank transfer"
                            }
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-5 flex justify-end border-t border-outline-variant/20 pt-4">
                          <span className="border-b border-primary pb-0.5 font-label-sm text-label-sm font-bold text-primary">
                            Review payment
                          </span>
                        </div>
                      )}
                    </button>
                  );
                },
              )}

              {filteredPayments.length ===
                0 && (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/30 px-6 text-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                    <AppIcon
                      name="receipt"
                      size={27}
                    />
                  </span>

                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    No payments found
                  </h2>

                  <p className="mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
                    Client payment submissions will appear here
                    after a proof has been uploaded.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ===============================================
              EXISTING SLIDE REVIEW PANEL
          =============================================== */}

          <aside
            aria-hidden={
              !selectedPayment
            }
            className={`min-h-0 shrink-0 overflow-hidden bg-surface-container-lowest transition-[width,max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              selectedPayment
                ? "max-h-[2000px] translate-x-0 border-t border-outline-variant/20 opacity-100 lg:h-full lg:w-[420px] lg:rounded-r-xl lg:border-l lg:border-t-0"
                : "pointer-events-none max-h-0 translate-x-12 border-transparent opacity-0 lg:h-full lg:w-0"
            }`}
          >
            <div className="custom-scrollbar h-full w-full overflow-y-auto overscroll-contain lg:w-[420px]">
              {selectedPayment &&
                selectedBooking && (
                  <>
                    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-outline-variant/20 bg-surface-container-lowest/95 px-6 py-5 backdrop-blur-xl sm:px-8">
                      <div className="min-w-0">
                        <p className="mb-1 font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                          Verification Detail
                        </p>

                        <h2 className="truncate font-headline-md text-headline-md text-on-surface">
                          {getInvoiceLabel(
                            selectedInvoice,
                          )}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleCloseDetail
                        }
                        aria-label="Close payment detail"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
                      >
                        <AppIcon
                          name="close"
                          size={22}
                        />
                      </button>
                    </header>

                    <div className="space-y-7 p-6 sm:p-8">
                      <section className="rounded-xl bg-surface-container-low p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container font-label-md text-label-md text-on-secondary-container">
                            {getClientInitials(
                              selectedBooking.client,
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-label-md text-label-md text-on-surface">
                              {getClientDisplayName(
                                selectedBooking.client,
                              )}
                            </p>

                            <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
                              {selectedBooking
                                .package?.name ??
                                "Package"}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-high">
                        {proofLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              Loading payment proof...
                            </p>
                          </div>
                        )}

                        {!proofLoading &&
                          proofError && (
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                              <div>
                                <AppIcon
                                  name="receipt"
                                  size={36}
                                  className="mx-auto text-on-surface-variant opacity-40"
                                />

                                <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
                                  {proofError}
                                </p>
                              </div>
                            </div>
                          )}

                        {proofUrl && (
                          <>
                            <img
                              src={
                                proofUrl
                              }
                              alt={`Payment proof ${selectedPayment.referenceNumber ?? selectedPayment.id}`}
                              className="relative z-[1] h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-primary/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={
                                  handleOpenProof
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-on-primary/30 bg-on-primary/15 px-5 py-3 font-label-md text-label-md text-on-primary backdrop-blur-md transition-colors hover:bg-on-primary/25"
                              >
                                <AppIcon
                                  name="zoom_in"
                                  size={19}
                                />

                                Open Full Image
                              </button>
                            </div>
                          </>
                        )}
                      </section>

                      {selectedStatusConfig && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Verification status
                          </span>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${selectedStatusConfig.badgeClass}`}
                          >
                            {
                              selectedStatusConfig.label
                            }
                          </span>
                        </div>
                      )}

                      <dl className="divide-y divide-outline-variant/20">
                        <DetailRow
                          label="Reference Number"
                          value={
                            selectedPayment.referenceNumber ??
                            "-"
                          }
                        />

                        <DetailRow
                          label="Submitted At"
                          value={formatDateTime(
                            selectedPayment.submittedAt ??
                              selectedPayment.createdAt,
                          )}
                        />

                        <DetailRow
                          label="File Name"
                          value={
                            selectedPayment.proofFileName ??
                            "-"
                          }
                        />

                        <DetailRow
                          label="File Type"
                          value={
                            selectedPayment.proofMimeType ??
                            "-"
                          }
                        />

                        <DetailRow
                          label="Payment Method"
                          value={
                            selectedPayment.method ??
                            "bank_transfer"
                          }
                        />

                        <DetailRow
                          label="Amount"
                          value={formatCurrency(
                            selectedPayment.amount,
                            selectedPayment.currency,
                          )}
                          strong
                        />

                        <DetailRow
                          label="Event Date"
                          value={
                            selectedBooking.event
                              ?.preferredDate ??
                            "-"
                          }
                        />

                        <DetailRow
                          label="Location"
                          value={
                            selectedBooking.event
                              ?.location ??
                            "-"
                          }
                        />
                      </dl>

                      {actionError && (
                        <div
                          role="alert"
                          className="rounded-xl border border-error/20 bg-error-container/50 p-4 font-body-md text-body-md text-error"
                        >
                          {actionError}
                        </div>
                      )}

                      {selectedPaymentStatus ===
                        "pending_verification" && (
                        <div className="space-y-3 pb-2 pt-2">
                          <button
                            type="button"
                            onClick={
                              handleApprovePayment
                            }
                            disabled={
                              processingAction !==
                              null
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-4 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/10 transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
                          >
                            <AppIcon
                              name="verified"
                              size={20}
                            />

                            {processingAction ===
                            "approve"
                              ? "Processing..."
                              : "Terima Pembayaran"}
                          </button>

                          <button
                            type="button"
                            onClick={
                              handleRejectPayment
                            }
                            disabled={
                              processingAction !==
                              null
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 bg-surface-bright px-5 py-4 font-label-md text-label-md text-error transition-all hover:bg-error-container/50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
                          >
                            <AppIcon
                              name="block"
                              size={20}
                            />

                            {processingAction ===
                            "reject"
                              ? "Rejecting..."
                              : "Tolak Pembayaran"}
                          </button>
                        </div>
                      )}

                      {selectedPaymentStatus ===
                        "verified" && (
                        <ReviewResult
                          icon="verified"
                          title="Payment accepted"
                          description="The payment, invoice, and booking have been updated. A schedule has also been created for this booking."
                        />
                      )}

                      {selectedPaymentStatus ===
                        "rejected" && (
                        <ReviewResult
                          icon="block"
                          title="Payment rejected"
                          description="The booking has been returned to approved so the client can upload a new proof."
                          error
                        />
                      )}
                    </div>
                  </>
                )}
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">
        {label}
      </dt>

      <dd
        className={`max-w-[60%] break-words text-right font-label-md text-label-md ${
          strong
            ? "font-bold text-primary"
            : "text-on-surface"
        }`}
      >
        {value || "-"}
      </dd>
    </div>
  );
}

function ReviewResult({
  icon,
  title,
  description,
  error = false,
}) {
  return (
    <section
      className={`rounded-xl border p-4 ${
        error
          ? "border-error/20 bg-error-container/50"
          : "border-secondary/20 bg-secondary-container/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <AppIcon
          name={icon}
          size={21}
          className={`mt-0.5 shrink-0 ${
            error
              ? "text-error"
              : "text-secondary"
          }`}
        />

        <div>
          <p
            className={`font-label-md text-label-md ${
              error
                ? "text-error"
                : "text-secondary"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}

function PageState({
  children,
  error = false,
}) {
  return (
    <div className="flex min-h-80 items-center justify-center px-margin-mobile text-center">
      <p
        className={
          error
            ? "font-body-md text-body-md text-error"
            : "font-body-md text-body-md text-on-surface-variant"
        }
      >
        {children}
      </p>
    </div>
  );
}

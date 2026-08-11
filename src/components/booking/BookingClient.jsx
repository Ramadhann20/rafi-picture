"use client";

import {
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import { CODE_PREFIXES, generateCode } from "@/lib/codefication";
import { normalizeEventLocation } from "@/lib/location";

import BookingProcess from "./process/BookingProcess";
import BookingStatus from "./status/BookingStatus";
import BookingPaymentPage from "./status/BookingPaymentPage";

const BOOKING_STATUSES = [
  "pending",
  "approved",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",

  /*
   * Compatibility sementara untuk dokumen lama.
   */
  "awaiting_payment",
];

const ACTIVE_PAYMENT_STATUSES = new Set([
  "pending",
  "pending_verification",
  "verified",
  "paid",
]);

const BOOKING_POLICY = {
  allowMultiple: false,
  queryLimit: 1,
};

function normalizeBookingStatus(status) {
  const normalizedStatus = String(
    status ?? "pending",
  ).toLowerCase();

  if (
    normalizedStatus ===
    "awaiting_payment"
  ) {
    return "approved";
  }

  return normalizedStatus;
}

function normalizePaymentStatus(status) {
  return String(
    status ?? "pending_verification",
  ).toLowerCase();
}

function toTimestampValue(value) {
  if (!value) return 0;

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime();
}

function sortLatestInvoice(
  invoices,
) {
  return [...invoices]
    .sort(
      (
        first,
        second,
      ) => {
        const revisionDifference =
          (Number(
            second.revision,
          ) || 1) -
          (Number(
            first.revision,
          ) || 1);

        if (
          revisionDifference !==
          0
        ) {
          return revisionDifference;
        }

        return (
          toTimestampValue(
            second.issuedAt ??
              second.createdAt,
          ) -
          toTimestampValue(
            first.issuedAt ??
              first.createdAt,
          )
        );
      },
    );
}

function getLatestInvoiceByType(
  invoices,
  type,
) {
  return (
    sortLatestInvoice(
      invoices.filter(
        (invoice) =>
          invoice.type ===
            type &&
          invoice.status !==
            "void",
      ),
    )[0] ?? null
  );
}

function getLatestDepositInvoice(
  invoices,
) {
  return getLatestInvoiceByType(
    invoices,
    "deposit",
  );
}

function getLatestFinalInvoice(
  invoices,
) {
  return getLatestInvoiceByType(
    invoices,
    "final",
  );
}

function isInvoicePayable(
  invoice,
) {
  return Boolean(
    invoice?.id &&
      [
        "issued",
        "overdue",
      ].includes(
        String(
          invoice.status ||
            "",
        ).toLowerCase(),
      ) &&
      Number(
        invoice.amountDue ??
          invoice.amount,
      ) > 0,
  );
}



const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function normalizePackageId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim() || null;
  }

  return String(value ?? "").trim() || null;
}

function normalizePackageRecord(packageRecord) {
  const features = Array.isArray(packageRecord?.features)
    ? packageRecord.features
    : Array.isArray(packageRecord?.serviceHighlights)
      ? packageRecord.serviceHighlights
      : [];

  const numericPrice = Number(packageRecord?.price);
  const price = Number.isFinite(numericPrice) ? numericPrice : 0;

  return {
    ...packageRecord,
    price,
    currency: packageRecord?.currency ?? "IDR",
    priceLabel:
      packageRecord?.priceLabel ?? idrFormatter.format(price),
    features,
    badge:
      packageRecord?.badge ??
      (packageRecord?.featured ? "Unggulan" : null),
  };
}

export default function BookingClient({ packageId = null }) {
  const {
    user,
    loading: authLoading,
    profileLoading,
  } = useAuth();

  const db = useDb();

  const userId = user?.uid ?? null;

  const [submitStatus, setSubmitStatus] =
    useState("idle");

  const [submitError, setSubmitError] =
    useState(null);

  /*
   * Dipakai sementara setelah addDoc berhasil,
   * sebelum realtime listener Firestore mengembalikan data.
   */
  const [createdBooking, setCreatedBooking] =
    useState(null);


  const initialPackageId = useMemo(
    () => normalizePackageId(packageId),
    [packageId],
  );

  /* =========================================================
     ACTIVE PACKAGES FROM FIRESTORE
  ========================================================= */

  const {
    rows: packageRows,
    loading: packagesLoading,
    error: packagesError,
  } = useCollection(
    () => {
      if (!userId) return null;

      return db.query(
        db.colRef("Packages"),
        db.where("status", "==", "active"),
      );
    },
    [userId],
    {
      enabled: Boolean(userId),
    },
  );

  const packageOptions = useMemo(() => {
    return [...packageRows]
      .sort(
        (first, second) =>
          (Number(first.sortOrder) || 0) -
          (Number(second.sortOrder) || 0),
      )
      .map(normalizePackageRecord);
  }, [packageRows]);

  /* =========================================================
     USER BOOKING
  ========================================================= */

  const {
    rows: userBookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useCollection(
    () => {
      if (!userId) return null;

      return db.query(
        db.colRef("Bookings"),
        db.where(
          "client.uid",
          "==",
          userId,
        ),
        db.orderBy(
          "submittedAt",
          "desc",
        ),
        db.limit(
          BOOKING_POLICY.queryLimit,
        ),
      );
    },
    [userId],
    {
      enabled: Boolean(userId),
    },
  );

  /*
   * Karena query memakai limit(1), array hanya
   * berisi booking terbaru milik user.
   */
  const persistedBooking = useMemo(() => {
    return (
      userBookings.find((booking) =>
        BOOKING_STATUSES.includes(
          String(
            booking.status ?? "",
          ).toLowerCase(),
        ),
      ) ?? null
    );
  }, [userBookings]);

  /*
   * Data Firestore diprioritaskan.
   * createdBooking hanya dipakai sesaat setelah submit.
   */
  const bookingRecord =
    persistedBooking ?? createdBooking;

  const bookingId =
    bookingRecord?.id ?? null;

  const normalizedBookingStatus =
    normalizeBookingStatus(
      bookingRecord?.status,
    );

  /* =========================================================
     INVOICE / PAYMENT / RECEIPT DATA
  ========================================================= */

  /*
   * Financial data tetap realtime setelah booking keluar dari pending.
   * Ini dibutuhkan untuk:
   * - DP invoice
   * - invoice pelunasan
   * - proof pending verification
   * - receipt setelah lunas
   */
  const shouldLoadFinancials =
    Boolean(bookingId) &&
    normalizedBookingStatus !==
      "pending";

  const {
    rows: bookingInvoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useCollection(
    () => {
      if (
        !bookingId ||
        !shouldLoadFinancials
      ) {
        return null;
      }

      return db.query(
        db.colRef("Invoices"),
        db.where(
          "bookingId",
          "==",
          bookingId,
        ),
      );
    },
    [
      bookingId,
      shouldLoadFinancials,
    ],
    {
      enabled:
        shouldLoadFinancials,
    },
  );

  const {
    rows: bookingPayments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useCollection(
    () => {
      if (
        !bookingId ||
        !shouldLoadFinancials
      ) {
        return null;
      }

      return db.query(
        db.colRef("Payments"),
        db.where(
          "bookingId",
          "==",
          bookingId,
        ),
      );
    },
    [
      bookingId,
      shouldLoadFinancials,
    ],
    {
      enabled:
        shouldLoadFinancials,
    },
  );

  const depositInvoice =
    useMemo(
      () =>
        getLatestDepositInvoice(
          bookingInvoices,
        ),
      [bookingInvoices],
    );

  const finalInvoice =
    useMemo(
      () =>
        getLatestFinalInvoice(
          bookingInvoices,
        ),
      [bookingInvoices],
    );

  const receipt =
    bookingRecord?.receipt ??
    null;

  /*
   * Pelunasan selalu diprioritaskan jika sudah diterbitkan.
   * Kalau belum ada, gunakan invoice DP.
   */
  const payableInvoice =
    useMemo(
      () => {
        if (
          isInvoicePayable(
            finalInvoice,
          )
        ) {
          return finalInvoice;
        }

        if (
          isInvoicePayable(
            depositInvoice,
          )
        ) {
          return depositInvoice;
        }

        return null;
      },
      [
        finalInvoice,
        depositInvoice,
      ],
    );

  const activePaymentForInvoice =
    useMemo(
      () => {
        if (
          !payableInvoice?.id
        ) {
          return null;
        }

        return (
          bookingPayments.find(
            (payment) =>
              payment.invoiceId ===
                payableInvoice.id &&
              ACTIVE_PAYMENT_STATUSES.has(
                normalizePaymentStatus(
                  payment.status,
                ),
              ),
          ) ?? null
        );
      },
      [
        bookingPayments,
        payableInvoice?.id,
      ],
    );

  /*
   * Payment page tampil ketika ada invoice issued/overdue yang
   * masih harus dibayar dan belum ada proof aktif untuk invoice itu.
   *
   * Dengan ini:
   * approved + DP issued -> payment page
   * in_progress + final issued -> payment page
   */
  const showPaymentPage =
    Boolean(
      payableInvoice &&
        !activePaymentForInvoice,
    );

  /* =========================================================
     CREATE BOOKING
  ========================================================= */

  const buildBookingPayload = ({
    formData,
    selectedPackage,
  }) => {
    if (!userId) {
      throw new Error(
        "User belum login.",
      );
    }

    if (
      !formData?.personal ||
      !formData?.event ||
      !formData?.package
    ) {
      throw new Error(
        "Data formulir booking tidak lengkap.",
      );
    }

    if (!selectedPackage?.id) {
      throw new Error(
        "Paket belum dipilih.",
      );
    }

    return {
      client: {
        uid: userId,

        fullName:
          formData.personal.fullName.trim(),

        partnerName:
          selectedPackage.bookingSubjectType === "individual"
            ? null
            : formData.personal.partnerName?.trim() || null,

        email:
          formData.personal.email
            .trim()
            .toLowerCase(),

        phone:
          formData.personal.phone.trim(),

        instagram:
          formData.personal.instagram?.trim() ||
          null,
      },

      event: {
        preferredDate:
          formData.event.eventDate,

        startTime:
          formData.event.startTime ||
          null,

        endTime:
          formData.event.endTime ||
          null,

        endTimeDayOffset:
          Number(
            formData.event.endTimeDayOffset ||
            0,
          ) || 0,

        location: normalizeEventLocation(
          formData.event.location,
        ),

        vision:
          formData.event.vision?.trim() ||
          null,
      },

      package: {
        id: selectedPackage.id,
        packageCode: selectedPackage.packageCode ?? null,
        packageCategoryId:
          selectedPackage.packageCategoryId ?? null,
        bookingSubjectType:
          selectedPackage.bookingSubjectType ?? null,
        name: selectedPackage.name,
        description:
          selectedPackage.description ?? null,
        price: Number(selectedPackage.price) || 0,
        durationHours:
          Number(selectedPackage.durationHours) || null,

        currency:
          selectedPackage.currency ??
          "IDR",

        priceLabel:
          selectedPackage.priceLabel ?? null,

        features:
          selectedPackage.features ??
          selectedPackage.serviceHighlights ??
          [],
      },

      status: "pending",
      source: "website_booking_form",
    };
  };

  const handleSubmitBooking = async (
    bookingDraft,
  ) => {
    if (
      submitStatus === "loading"
    ) {
      return;
    }

    /*
     * Untuk sementara satu user hanya boleh
     * memiliki satu booking.
     */
    if (
      !BOOKING_POLICY.allowMultiple &&
      persistedBooking
    ) {
      setSubmitStatus("error");

      setSubmitError(
        "Kamu sudah memiliki booking.",
      );

      return;
    }

    setSubmitStatus("loading");
    setSubmitError(null);

    try {
      const bookingPayload =
        buildBookingPayload(
          bookingDraft,
        );

      const bookingCode = generateCode({
        prefix: CODE_PREFIXES.booking,
        categoryId:
          bookingPayload.package.packageCategoryId || "",
      });

      const documentReference =
        await db.addDoc("Bookings", {
          ...bookingPayload,
          bookingCode,

          submittedAt:
            db.serverTimestamp(),

          updatedAt:
            db.serverTimestamp(),
        });

      const currentTime =
        new Date().toISOString();

      const newBooking = {
        id: documentReference.id,
        ...bookingPayload,
        bookingCode,
        submittedAt: currentTime,
        updatedAt: currentTime,
      };

      setCreatedBooking(newBooking);
      setSubmitStatus("success");

      /*
       * Booking tetap dianggap sukses walaupun email/notifikasi admin
       * sedang bermasalah. Endpoint memakai event key deterministic,
       * jadi retry tidak mengirim email duplicate.
       */
      void (async () => {
        try {
          const idToken =
            await user.getIdToken();

          const response =
            await fetch(
              "/api/notifications/admin/booking-created",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${idToken}`,
                },

                body:
                  JSON.stringify({
                    bookingId:
                      documentReference.id,
                  }),

                keepalive:
                  true,
              },
            );

          if (!response.ok) {
            const result =
              await response
                .json()
                .catch(
                  () => null,
                );

            console.error(
              "BOOKING ADMIN NOTIFICATION FAILED:",
              result?.message ||
                response.status,
            );
          }
        } catch (notificationError) {
          console.error(
            "BOOKING ADMIN NOTIFICATION ERROR:",
            notificationError,
          );
        }
      })();
    } catch (error) {
      console.error(
        "CREATE BOOKING ERROR:",
        error,
      );

      setSubmitStatus("error");

      setSubmitError(
        error?.message ||
          "Booking gagal dikirim. Silakan coba kembali.",
      );
    }
  };

  /* =========================================================
     SUBMIT PAYMENT PROOF
  ========================================================= */

  const handleSubmitPayment = async ({
    bookingId: submittedBookingId,
    invoiceId,
    amount,
    currency,
    proofFile,
  }) => {
    if (!bookingRecord?.id) {
      throw new Error(
        "Data booking tidak tersedia.",
      );
    }

    if (
      submittedBookingId !==
      bookingRecord.id
    ) {
      throw new Error(
        "Booking pembayaran tidak sesuai.",
      );
    }

    if (
      !payableInvoice?.id ||
      invoiceId !==
        payableInvoice.id
    ) {
      throw new Error(
        "Invoice pembayaran tidak sesuai atau sudah tidak aktif.",
      );
    }

    const invoiceType =
      String(
        payableInvoice.type ||
          "deposit",
      ).toLowerCase();

    const statusAllowed =
      invoiceType === "final"
        ? normalizedBookingStatus ===
          "in_progress"
        : normalizedBookingStatus ===
          "approved";

    if (!statusAllowed) {
      throw new Error(
        invoiceType === "final"
          ? "Pelunasan belum dapat dikirim pada status booking saat ini."
          : "DP belum dapat dikirim pada status booking saat ini.",
      );
    }

    /*
     * Mencegah client mengirim payment aktif kedua
     * untuk invoice yang sama.
     */
    const existingActivePayment =
      bookingPayments.find(
        (payment) =>
          payment.invoiceId ===
            invoiceId &&
          ACTIVE_PAYMENT_STATUSES.has(
            normalizePaymentStatus(
              payment.status,
            ),
          ),
      );

    if (existingActivePayment) {
      throw new Error(
        "Bukti pembayaran untuk invoice ini sudah pernah dikirim.",
      );
    }

    if (!proofFile) {
      throw new Error(
        "Foto bukti pembayaran belum dipilih.",
      );
    }

    if (
      !["image/png", "image/jpeg"].includes(
        proofFile.type,
      )
    ) {
      throw new Error(
        "Bukti pembayaran harus berupa foto PNG, JPG, atau JPEG.",
      );
    }

    if (!user) {
      throw new Error(
        "Sesi pengguna tidak tersedia.",
      );
    }

    const idToken =
      await user.getIdToken(
        true,
      );

    const payload =
      new FormData();

    payload.append(
      "bookingId",
      bookingRecord.id,
    );

    payload.append(
      "invoiceId",
      invoiceId,
    );

    payload.append(
      "proof",
      proofFile,
    );

    const response =
      await fetch(
        "/api/payments/submit-proof",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },
          body: payload,
        },
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message ||
          "Bukti pembayaran gagal dikirim.",
      );
    }

    return (
      result?.data ??
      null
    );

  };

  /* =========================================================
     UI STATE
  ========================================================= */

  if (
    authLoading ||
    profileLoading ||
    (userId && bookingsLoading)
  ) {
    return (
      <PageState>
        Memuat data booking...
      </PageState>
    );
  }

  if (!userId) {
    return (
      <PageState>
        Silakan login terlebih dahulu
        untuk membuat booking.
      </PageState>
    );
  }

  if (bookingsError) {
    return (
      <PageState error>
        Gagal mengambil data booking.
      </PageState>
    );
  }

  if (
    bookingRecord &&
    shouldLoadFinancials &&
    (
      invoicesLoading ||
      paymentsLoading
    )
  ) {
    return (
      <PageState>
        Memuat data pembayaran...
      </PageState>
    );
  }

  if (
    bookingRecord &&
    (
      invoicesError ||
      paymentsError
    )
  ) {
    return (
      <PageState error>
        Gagal mengambil data invoice atau
        pembayaran.
      </PageState>
    );
  }

  if (
    bookingRecord &&
    showPaymentPage
  ) {
    return (
      <BookingPaymentPage
        booking={bookingRecord}
        invoice={payableInvoice}
        payments={bookingPayments}
        onSubmitPayment={
          handleSubmitPayment
        }
      />
    );
  }

  if (bookingRecord) {
    return (
      <BookingStatus
        booking={bookingRecord}
        invoice={
          finalInvoice ??
          depositInvoice
        }
        payments={bookingPayments}
        receipt={receipt}
      />
    );
  }

  return (
    <BookingProcess
      packageOptions={packageOptions}
      initialPackageId={initialPackageId}
      packagesLoading={packagesLoading}
      packagesError={packagesError}
      submitStatus={submitStatus}
      submitError={submitError}
      onSubmitBooking={
        handleSubmitBooking
      }
    />
  );
}

function PageState({
  children,
  error = false,
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center px-margin-mobile text-center">
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
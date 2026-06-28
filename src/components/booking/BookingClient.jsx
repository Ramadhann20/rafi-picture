"use client";

import {
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import {
  deletePaymentProof,
  savePaymentProof,
} from "@/lib/paymentProofDb";

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

function getLatestDepositInvoice(invoices) {
  return (
    [...invoices]
      .filter(
        (invoice) =>
          invoice.type === "deposit" &&
          invoice.status !== "void",
      )
      .sort((first, second) => {
        const revisionDifference =
          (Number(second.revision) || 1) -
          (Number(first.revision) || 1);

        if (revisionDifference !== 0) {
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
      })[0] ?? null
  );
}

function createPaymentReference() {
  const timestamp = Date.now()
    .toString()
    .slice(-8);

  return `PAY-${timestamp}`;
}

export default function BookingClient() {
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

  /*
   * Flow tampilan dibuat langsung berdasarkan status:
   *
   * pending  -> BookingStatus
   * approved -> BookingPaymentPage
   *
   * Status selain approved tetap memakai BookingStatus.
   */
  const showPaymentPage =
    normalizedBookingStatus === "approved";

  /* =========================================================
     INVOICE AND PAYMENT DATA
  ========================================================= */

  /*
   * Invoice dan payment hanya dibaca saat booking approved.
   * Ini mengurangi query yang tidak diperlukan ketika status
   * booking masih pending atau sudah masuk tahap berikutnya.
   */
  const {
    rows: bookingInvoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useCollection(
    () => {
      if (
        !bookingId ||
        !showPaymentPage
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
      showPaymentPage,
    ],
    {
      enabled:
        Boolean(bookingId) &&
        showPaymentPage,
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
        !showPaymentPage
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
      showPaymentPage,
    ],
    {
      enabled:
        Boolean(bookingId) &&
        showPaymentPage,
    },
  );

  const depositInvoice = useMemo(() => {
    return getLatestDepositInvoice(
      bookingInvoices,
    );
  }, [bookingInvoices]);

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
          formData.personal.partnerName?.trim() ||
          null,

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

        location:
          formData.event.location.trim(),

        vision:
          formData.event.vision?.trim() ||
          null,
      },

      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,

        currency:
          selectedPackage.currency ??
          "IDR",

        priceLabel:
          selectedPackage.priceLabel,

        features:
          selectedPackage.features ?? [],
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

      const documentReference =
        await db.addDoc("Bookings", {
          ...bookingPayload,

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
        submittedAt: currentTime,
        updatedAt: currentTime,
      };

      setCreatedBooking(newBooking);
      setSubmitStatus("success");
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
      normalizedBookingStatus !==
      "approved"
    ) {
      throw new Error(
        "Bukti pembayaran hanya dapat dikirim saat booking berstatus approved.",
      );
    }

    if (
      !depositInvoice?.id ||
      invoiceId !== depositInvoice.id
    ) {
      throw new Error(
        "Invoice deposit tidak sesuai atau belum tersedia.",
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

    const proofStorageKey = [
      "payment-proof",
      bookingRecord.id,
      invoiceId,
      Date.now(),
    ].join("-");

    /*
     * File foto disimpan ke IndexedDB.
     * Firestore hanya menyimpan metadata dan key file.
     */
    await savePaymentProof({
      key: proofStorageKey,
      file: proofFile,
    });

    const referenceNumber =
      createPaymentReference();

    let paymentDocument;

    try {
      paymentDocument =
        await db.addDoc("Payments", {
        bookingId:
          bookingRecord.id,

        invoiceId,

        clientId: userId,

        amount:
          Number(amount) || 0,

        currency:
          currency ?? "IDR",

        method: "bank_transfer",

        referenceNumber,

        proofStorageType:
          "indexeddb",

        proofStorageKey,

        proofFileName:
          proofFile.name,

        proofMimeType:
          proofFile.type,

        proofFileSize:
          proofFile.size,

        status:
          "pending_verification",

        submittedAt:
          db.serverTimestamp(),

        createdAt:
          db.serverTimestamp(),

        updatedAt:
          db.serverTimestamp(),
      });
    } catch (error) {
      /*
       * Jika dokumen Payments gagal dibuat,
       * file lokal dihapus agar tidak menjadi orphan.
       */
      try {
        await deletePaymentProof(
          proofStorageKey,
        );
      } catch (cleanupError) {
        console.error(
          "DELETE ORPHAN PAYMENT PROOF ERROR:",
          cleanupError,
        );
      }

      throw error;
    }

    try {
      /*
       * approved -> upload bukti -> confirmed
       *
       * Setelah realtime listener menerima status
       * confirmed, BookingClient otomatis kembali
       * menampilkan BookingStatus.
       */
      await db.updateDoc(
        "Bookings",
        bookingRecord.id,
        {
          status: "confirmed",

          latestPaymentId:
            paymentDocument.id,

          paymentProofSubmittedAt:
            db.serverTimestamp(),

          updatedAt:
            db.serverTimestamp(),
        },
      );
    } catch (error) {
      console.error(
        "UPDATE BOOKING AFTER PAYMENT ERROR:",
        error,
      );

      throw new Error(
        "Bukti pembayaran tersimpan, tetapi status booking gagal diperbarui.",
      );
    }
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

  /*
   * Status approved langsung menampilkan
   * BookingPaymentPage.
   */
  if (
    bookingRecord &&
    showPaymentPage
  ) {
    if (
      invoicesLoading ||
      paymentsLoading
    ) {
      return (
        <PageState>
          Memuat data pembayaran...
        </PageState>
      );
    }

    if (
      invoicesError ||
      paymentsError
    ) {
      return (
        <PageState error>
          Gagal mengambil invoice atau
          riwayat pembayaran.
        </PageState>
      );
    }

    return (
      <BookingPaymentPage
        booking={bookingRecord}
        invoice={depositInvoice}
        payments={bookingPayments}
        onSubmitPayment={
          handleSubmitPayment
        }
      />
    );
  }

  /*
   * Pending dan semua status selain approved
   * menampilkan BookingStatus.
   */
  if (bookingRecord) {
    return (
      <BookingStatus
        booking={bookingRecord}
      />
    );
  }

  return (
    <BookingProcess
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

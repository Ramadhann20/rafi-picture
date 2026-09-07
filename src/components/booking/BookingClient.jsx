"use client";

import {
  useMemo,
  useState,
} from "react";
import { doc, writeBatch } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { useDb } from "@/context/DbContext";
import { useLanguage } from "@/context/LanguageContext";
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
    sessions: Array.isArray(packageRecord?.sessions)
      ? packageRecord.sessions
          .map((session, index) => ({
            id: String(session?.id || `session-${index + 1}`),
            name: String(session?.name || `Session ${index + 1}`),
            durationHours:
              Number(session?.durationHours) || Number(packageRecord?.durationHours) || 0,
          }))
          .filter((session) => session.name)
      : [],
    badge:
      packageRecord?.badge ??
      (packageRecord?.featured ? "Unggulan" : null),
  };
}

export default function BookingClient({ packageId = null }) {
  const { translate } = useLanguage();

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
      );
    },
    [userId],
    {
      enabled: Boolean(userId),
    },
  );

  /*
   * Semua child booking inquiry dibaca agar customer dapat melihat satu
   * inquiry gabungan, sementara Admin tetap menerima satu record per paket.
   */
  const persistedBooking = useMemo(() => {
    const latestBooking = userBookings.find((booking) =>
      BOOKING_STATUSES.includes(
        String(booking.status ?? "").toLowerCase(),
      ),
    );

    if (!latestBooking) return null;

    const inquiryBookings = latestBooking.inquiryId
      ? userBookings.filter(
          (booking) => booking.inquiryId === latestBooking.inquiryId,
        )
      : [latestBooking];
    const orderedInquiryBookings = [...inquiryBookings].sort(
      (first, second) =>
        (Number(first.inquiryIndex) || 0) -
        (Number(second.inquiryIndex) || 0),
    );
    const canonicalBooking = orderedInquiryBookings[0] ?? latestBooking;

    if (inquiryBookings.length <= 1) return latestBooking;

    return {
      ...latestBooking,
      id: canonicalBooking.id,
      packages: Array.from(
        new Map(
          orderedInquiryBookings
            .map((booking) => booking.package
              ? [booking.package.id, booking.package]
              : null)
            .filter(Boolean),
        ).values(),
      ),
      events: orderedInquiryBookings.map((booking) => ({
        ...(booking.event ?? {}),
        packageId: booking.package?.id ?? null,
      })),
      personalDetails: orderedInquiryBookings.flatMap(
        (booking) => booking.personalDetails ?? [],
      ),
      inquiryBookingIds: orderedInquiryBookings.map((booking) => booking.id),
    };
  }, [userBookings]);

  /*
   * Data Firestore diprioritaskan.
   * createdBooking hanya dipakai sesaat setelah submit.
   */
  const bookingRecord =
    persistedBooking ?? createdBooking;

  const bookingId =
    bookingRecord?.id ?? null;

  const financialBookingIds = useMemo(() => {
    const inquiryBookingIds = Array.isArray(bookingRecord?.inquiryBookingIds)
      ? bookingRecord.inquiryBookingIds
      : [];

    return Array.from(
      new Set(
        [bookingId, ...inquiryBookingIds].filter(Boolean),
      ),
    );
  }, [bookingId, bookingRecord?.inquiryBookingIds]);

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
      financialBookingIds.length > 0 &&
    normalizedBookingStatus !==
      "pending";

  const {
    rows: bookingInvoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useCollection(
    () => {
      if (
        !financialBookingIds.length ||
        !shouldLoadFinancials
      ) {
        return null;
      }

      return db.query(
        db.colRef("Invoices"),
        db.where(
          "bookingId",
          "in",
          financialBookingIds,
        ),
      );
    },
    [
      financialBookingIds,
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
        !financialBookingIds.length ||
        !shouldLoadFinancials
      ) {
        return null;
      }

      return db.query(
        db.colRef("Payments"),
        db.where(
          "bookingId",
          "in",
          financialBookingIds,
        ),
      );
    },
    [
      financialBookingIds,
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
    selectedPackages = [],
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

    const packageRecords = selectedPackages.length
      ? selectedPackages
      : [selectedPackage];

    const serializePackage = (packageItem) => ({
      id: packageItem.id,
      packageCode: packageItem.packageCode ?? null,
      packageCategoryId: packageItem.packageCategoryId ?? null,
      bookingSubjectType: packageItem.bookingSubjectType ?? null,
      name: packageItem.name,
      description: packageItem.description ?? null,
      price: Number(packageItem.price) || 0,
      durationHours: Number(packageItem.durationHours) || null,
      requiredCrewCount:
        Number(packageItem.requiredCrewCount ?? packageItem.crewCount) || 1,
      crewRequirements: Array.isArray(packageItem.crewRequirements)
        ? packageItem.crewRequirements
        : [],
      currency: packageItem.currency ?? "IDR",
      priceLabel: packageItem.priceLabel ?? null,
      features: packageItem.features ?? packageItem.serviceHighlights ?? [],
    });

    const eventRecords = (formData.events?.length
      ? formData.events
      : [{ packageId: selectedPackage.id, data: formData.event }]
    ).map(({ packageId, sessionId = "main", sessionName = null, data }) => ({
      packageId,
      sessionId,
      sessionName,
      preferredDate: data.eventDate,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      endTimeDayOffset: Number(data.endTimeDayOffset || 0) || 0,
      location: normalizeEventLocation(data.location),
      vision: data.vision?.trim() || null,
    }));

    const personalRecords = packageRecords.map((packageItem, index) => {
      const personalEntry = formData.personalDetails?.find(
        (entry) => entry.packageId === packageItem.id,
      );
      const personal = personalEntry?.data ?? formData.personal;

      return {
        packageId: packageItem.id,
        fullName: personal.fullName?.trim() || "",
        partnerName:
          packageItem.bookingSubjectType === "individual"
            ? null
            : personal.partnerName?.trim() || null,
        email: personal.email?.trim().toLowerCase() || "",
        phone: personal.phone?.trim() || "",
        instagram: personal.instagram?.trim() || null,
        useMyData: Boolean(personal.useMyData),
        eventIndex: index,
      };
    });

    const primaryPersonal = personalRecords[0] ?? {
      fullName: formData.personal.fullName.trim(),
      partnerName: formData.personal.partnerName?.trim() || null,
      email: formData.personal.email.trim().toLowerCase(),
      phone: formData.personal.phone.trim(),
      instagram: formData.personal.instagram?.trim() || null,
    };

    const primaryEvent = eventRecords[0] ?? {
      preferredDate: null,
      startTime: null,
      endTime: null,
      endTimeDayOffset: 0,
      location: normalizeEventLocation(null),
      vision: null,
    };

    return {
      client: {
        uid: userId,

        fullName: primaryPersonal.fullName,

        partnerName:
          primaryPersonal.partnerName,

        email: primaryPersonal.email,

        phone: primaryPersonal.phone,

        instagram: primaryPersonal.instagram,
      },

      event: {
        preferredDate: primaryEvent.preferredDate,
        startTime: primaryEvent.startTime,
        endTime: primaryEvent.endTime,
        endTimeDayOffset: primaryEvent.endTimeDayOffset,
        location: primaryEvent.location,
        vision: primaryEvent.vision,
      },

      package: serializePackage(selectedPackage),
      packages: packageRecords.map(serializePackage),
      events: eventRecords,
      personalDetails: personalRecords,

      status: "pending",
      source: "website_booking_form",
    };
  };

  const buildPackageBookingPayloads = ({
    bookingPayload,
    bookingCode,
    inquiryId,
  }) => {
    const packages = bookingPayload.packages?.length
      ? bookingPayload.packages
      : [bookingPayload.package];
    const totalBookingCount = packages.reduce((total, packageItem) => {
      const eventCount = bookingPayload.events?.filter(
        (eventItem) => eventItem.packageId === packageItem.id,
      ).length;

      return total + (eventCount || 1);
    }, 0);
    let payloadIndex = 0;

    return packages.flatMap((packageItem, index) => {
      const packageId = packageItem.id;
      const packageEvents = bookingPayload.events?.filter(
        (eventItem) => eventItem.packageId === packageId,
      );
      const events = packageEvents?.length
        ? packageEvents
        : [bookingPayload.event];

      return events.map((packageEvent, eventIndex) => {
      const currentPayloadIndex = payloadIndex;
      payloadIndex += 1;
      const packagePersonal =
        bookingPayload.personalDetails?.find(
          (entry) => entry.packageId === packageId,
        ) ?? bookingPayload.personalDetails?.[index];

      const client = {
        ...bookingPayload.client,
        fullName: packagePersonal?.fullName ?? bookingPayload.client.fullName,
        partnerName: packagePersonal?.partnerName ?? bookingPayload.client.partnerName,
        email: packagePersonal?.email ?? bookingPayload.client.email,
        phone: packagePersonal?.phone ?? bookingPayload.client.phone,
        instagram: packagePersonal?.instagram ?? bookingPayload.client.instagram,
      };

      return {
        ...bookingPayload,
        inquiryId,
        inquiryBookingCount: totalBookingCount,
        inquiryIndex: currentPayloadIndex + 1,
        bookingCode: `${bookingCode}-${currentPayloadIndex + 1}`,
        client,
        package: packageItem,
        packages: [packageItem],
        event: packageEvent,
        events: [packageEvent],
        serviceId: packageEvent.sessionId ?? null,
        serviceName: packageEvent.sessionName ?? null,
        personalDetails: packagePersonal
          ? [{ ...packagePersonal }]
          : [],
      };
      });
    });
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

      const bookingsCollection = db.colRef("Bookings");
      const inquiryId = doc(bookingsCollection).id;
      const packageBookingPayloads = buildPackageBookingPayloads({
        bookingPayload,
        bookingCode,
        inquiryId,
      });
      const batch = writeBatch(db.db);
      const bookingReferences = packageBookingPayloads.map(() =>
        doc(bookingsCollection),
      );
      const timestamp = db.serverTimestamp();

      packageBookingPayloads.forEach((packageBooking, index) => {
        batch.set(bookingReferences[index], {
          ...packageBooking,
          submittedAt: timestamp,
          updatedAt: timestamp,
        });
      });

      await batch.commit();

      const currentTime =
        new Date().toISOString();

      const newBooking = {
        id: bookingReferences[0]?.id ?? inquiryId,
        ...packageBookingPayloads[0],
        inquiryId,
        inquiryBookingIds: bookingReferences.map((reference) => reference.id),
        packages: packageBookingPayloads.map((packageBooking) => packageBooking.package),
        events: packageBookingPayloads.map((packageBooking) => packageBooking.event),
        personalDetails: packageBookingPayloads.flatMap(
          (packageBooking) => packageBooking.personalDetails ?? [],
        ),
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
                      bookingReferences[0]?.id,
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
          translate("bookingSubmitFailed"),
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
        translate("bookingDataUnavailable"),
      );
    }

    if (
      submittedBookingId !==
      bookingRecord.id
    ) {
      throw new Error(
        translate("paymentBookingMismatch"),
      );
    }

    if (
      !payableInvoice?.id ||
      invoiceId !==
        payableInvoice.id
    ) {
      throw new Error(
        translate("paymentInvoiceUnavailable"),
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
        depositInvoice={depositInvoice}
        finalInvoice={finalInvoice}
        payments={bookingPayments}
        receipt={receipt}
      />
    );
  }

  return (
    <BookingProcess
      packageOptions={packageOptions}
      initialPackageId={initialPackageId}
      accountData={{
        fullName: user?.displayName ?? "",
        email: user?.email ?? "",
      }}
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
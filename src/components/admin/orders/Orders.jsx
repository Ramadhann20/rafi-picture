"use client";

import { useEffect, useMemo, useState } from "react";

import AppIcon from "@/components/global/AppIcon";
import { useDb } from "@/context/DbContext";
import { useCollection } from "@/hooks/useCollection";

import ScheduleOrder from "./details/ScheduleOrder";

/* =========================================================
   BOOKING STATUS
========================================================= */

const BOOKING_STATUS = {
  pending: {
    label: "Pending Review",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  approved: {
    label: "Approved",
    badgeClass:
      "bg-primary-container text-on-primary-container",
  },

  confirmed: {
    label: "Confirmed",
    badgeClass:
      "bg-primary text-on-primary",
  },

  in_progress: {
    label: "In Progress",
    badgeClass:
      "bg-surface-container-highest text-on-surface",
  },

  completed: {
    label: "Completed",
    badgeClass:
      "bg-secondary-container text-on-secondary-container",
  },

  cancelled: {
    label: "Cancelled",
    badgeClass:
      "bg-error-container text-error",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function getClientDisplayName(client) {
  const fullName = client?.fullName?.trim();
  const partnerName = client?.partnerName?.trim();

  if (!fullName) return "Unnamed client";
  if (!partnerName) return fullName;

  return `${fullName} & ${partnerName}`;
}

function getClientInitials(client) {
  return [
    client?.fullName,
    client?.partnerName,
  ]
    .filter(Boolean)
    .map((name) => name.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatBookingDate(value) {
  if (!value) return "-";

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] = value
      .split("-")
      .map(Number);

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPaginationItems(
  currentPage,
  totalPages
) {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 3) {
    return [
      1,
      2,
      3,
      4,
      "...",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}


function normalizePaymentStatus(status) {
  const normalizedStatus = String(
    status ?? "unpaid"
  ).toLowerCase();

  const statusMap = {
    verified: "paid",
    confirmed: "paid",
    completed: "paid",

    waiting_confirmation:
      "pending_verification",
    waiting_verification:
      "pending_verification",
    submitted: "pending_verification",
    pending: "pending_verification",

    failed: "rejected",
    declined: "rejected",
  };

  return (
    statusMap[normalizedStatus] ??
    normalizedStatus
  );
}

/*
 * Adapter sementara untuk membaca struktur Payments lama.
 * Setelah data lama dimigrasikan, query dapat langsung
 * memakai field bookingId dan adapter ini dapat dihapus.
 */
function normalizeLegacyPayment(payment) {
  return {
    ...payment,

    id: payment.id,

    bookingId:
      payment.bookingId ??
      payment.booking_id ??
      payment.orderId ??
      payment.order_id ??
      payment.booking?.id ??
      null,

    invoiceId:
      payment.invoiceId ??
      payment.invoice_id ??
      payment.invoice?.id ??
      null,

    amount:
      Number(
        payment.amount ??
          payment.nominal ??
          payment.total ??
          payment.paymentAmount
      ) || 0,

    currency:
      payment.currency ??
      payment.currencyCode ??
      "IDR",

    method:
      payment.method ??
      payment.paymentMethod ??
      "bank_transfer",

    status: normalizePaymentStatus(
      payment.status ??
        payment.paymentStatus
    ),

    senderName:
      payment.senderName ??
      payment.accountName ??
      payment.payerName ??
      null,

    proofUrl:
      payment.proofUrl ??
      payment.paymentProofUrl ??
      payment.paymentProof ??
      payment.proof?.url ??
      null,

    submittedAt:
      payment.submittedAt ??
      payment.createdAt ??
      payment.uploadedAt ??
      null,
  };
}

function calculateTotalPaid(payments) {
  return payments
    .filter(
      (payment) =>
        payment.status === "paid"
    )
    .reduce(
      (total, payment) =>
        total +
        (Number(payment.amount) || 0),
      0
    );
}

function getNextInvoiceRevision(
  invoices,
  type
) {
  const revisions = invoices
    .filter(
      (invoice) =>
        invoice.type === type
    )
    .map(
      (invoice) =>
        Number(invoice.revision) || 1
    );

  return revisions.length === 0
    ? 1
    : Math.max(...revisions) + 1;
}

function createInvoiceNumber(invoice) {
  const year = new Date().getFullYear();

  const typeCode =
    invoice.type === "deposit"
      ? "DP"
      : "FINAL";

  const shortId = String(invoice.id)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

  return `INV-${year}-${typeCode}-${shortId}`;
}

function toDateInputValue(date) {
  if (!(date instanceof Date)) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultInvoiceDueDate(
  type,
  eventDate
) {
  if (
    type === "final" &&
    typeof eventDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
  ) {
    const [year, month, day] = eventDate
      .split("-")
      .map(Number);

    const dueDate = new Date(
      year,
      month - 1,
      day
    );

    dueDate.setDate(dueDate.getDate() - 3);

    return toDateInputValue(dueDate);
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);

  return toDateInputValue(dueDate);
}

/* =========================================================
   ORDERS
========================================================= */

export default function Orders() {
  const db = useDb();

  /* ---------------------------------------------------------
     FIRESTORE DATA
  --------------------------------------------------------- */

  const {
    rows: bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Bookings"),
        db.orderBy("submittedAt", "desc")
      ),
    []
  );

  const {
    rows: crewMembers,
    loading: crewLoading,
    error: crewError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("Crews"),
        db.orderBy("name", "asc")
      ),
    []
  );

  const {
    rows: assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useCollection(
    () =>
      db.query(
        db.colRef("CrewAssignments"),
        db.orderBy("createdAt", "desc")
      ),
    []
  );

  /* ---------------------------------------------------------
     LOCAL UI STATE
  --------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedBookingId, setSelectedBookingId] =
    useState(null);

  /*
   * Membuka detail pesanan dari URL:
   * /admin/orders?bookingId={bookingId}
   */
  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const requestedBookingId =
      params.get("bookingId");

    if (!requestedBookingId) {
      return;
    }

    const bookingExists =
      bookings.some(
        (booking) =>
          booking.id ===
          requestedBookingId,
      );

    if (bookingExists) {
      setSelectedBookingId(
        requestedBookingId,
      );
    }
  }, [bookings]);

  const [
    savingAssignment,
    setSavingAssignment,
  ] = useState(false);

  const [
    processingBillingId,
    setProcessingBillingId,
  ] = useState(null);

  const perPage = 5;

  /* ---------------------------------------------------------
     DETAIL BILLING DATA
  --------------------------------------------------------- */

  /*
   * Collection Invoices boleh belum ada atau belum
   * memiliki dokumen. Firestore akan mengembalikan
   * snapshot kosong.
   */
  const {
    rows: bookingInvoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useCollection(
    () => {
      if (!selectedBookingId) return null;

      return db.query(
        db.colRef("Invoices"),
        db.where(
          "bookingId",
          "==",
          selectedBookingId
        )
      );
    },
    [selectedBookingId],
    {
      enabled: Boolean(
        selectedBookingId
      ),
    }
  );

  /*
   * Payments masih memakai struktur lama.
   * Sementara baca koleksi ketika detail terbuka,
   * normalisasi field, lalu filter berdasarkan
   * bookingId.
   */
  const {
    rows: legacyPayments,
    loading: paymentsLoading,
    error: paymentsError,
  } = useCollection(
    () => {
      if (!selectedBookingId) return null;

      return db.query(
        db.colRef("Payments")
      );
    },
    [selectedBookingId],
    {
      enabled: Boolean(
        selectedBookingId
      ),
    }
  );

  /* ---------------------------------------------------------
     SELECTED DETAIL DATA
  --------------------------------------------------------- */

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId) return null;

    return (
      bookings.find(
        (booking) =>
          booking.id === selectedBookingId
      ) ?? null
    );
  }, [bookings, selectedBookingId]);

  const selectedAssignment = useMemo(() => {
    if (!selectedBookingId) return null;

    return (
      assignments.find(
        (assignment) =>
          assignment.bookingId ===
            selectedBookingId &&
          assignment.status !==
            "cancelled"
      ) ?? null
    );
  }, [assignments, selectedBookingId]);

  const bookingPayments = useMemo(() => {
    if (!selectedBookingId) return [];

    return legacyPayments
      .map(normalizeLegacyPayment)
      .filter(
        (payment) =>
          payment.bookingId ===
          selectedBookingId
      );
  }, [
    legacyPayments,
    selectedBookingId,
  ]);

  /* ---------------------------------------------------------
     SUMMARY STATISTICS
  --------------------------------------------------------- */

  const bookingStats = useMemo(() => {
    const countByStatus = (bookingStatus) =>
      bookings.filter(
        (booking) =>
          booking.status === bookingStatus
      ).length;

    return [
      {
        id: "total",
        label: "Total Requests",
        value: bookings.length,
        cardClass: "",
      },
      {
        id: "pending",
        label: "Pending Review",
        value: countByStatus("pending"),
        cardClass:
          "border-l-4 border-l-secondary",
      },
      {
        id: "approved",
        label: "Approved",
        value: countByStatus("approved"),
        cardClass:
          "border-l-4 border-l-primary",
      },
      {
        id: "completed",
        label: "Completed",
        value: countByStatus("completed"),
        cardClass:
          "border-l-4 border-l-outline",
      },
    ];
  }, [bookings]);

  /* ---------------------------------------------------------
     SEARCH AND FILTER
  --------------------------------------------------------- */

  const filteredBookings = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const searchableText = [
        booking.id,
        booking.client?.fullName,
        booking.client?.partnerName,
        booking.client?.phone,
        booking.client?.email,
        booking.client?.instagram,
        booking.event?.location,
        booking.event?.vision,
        booking.package?.name,
        booking.package?.priceLabel,
        booking.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        searchableText.includes(
          normalizedSearch
        );

      const matchesStatus =
        status === "all" ||
        booking.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, status]);

  /* ---------------------------------------------------------
     PAGINATION
  --------------------------------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredBookings.length / perPage
    )
  );

  const paginatedBookings = useMemo(() => {
    const startIndex =
      (page - 1) * perPage;

    return filteredBookings.slice(
      startIndex,
      startIndex + perPage
    );
  }, [filteredBookings, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginationItems =
    getPaginationItems(page, totalPages);

  const firstVisibleItem =
    filteredBookings.length === 0
      ? 0
      : (page - 1) * perPage + 1;

  const lastVisibleItem = Math.min(
    page * perPage,
    filteredBookings.length
  );

  /* ---------------------------------------------------------
     HANDLERS
  --------------------------------------------------------- */

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleOpenDetail = (booking) => {
    setSelectedBookingId(
      booking.id,
    );

    if (
      typeof window !==
      "undefined"
    ) {
      const url =
        new URL(
          window.location.href,
        );

      url.searchParams.set(
        "bookingId",
        booking.id,
      );

      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}`,
      );
    }
  };

  const handleBackToList = () => {
    setSelectedBookingId(null);

    if (
      typeof window !==
      "undefined"
    ) {
      const url =
        new URL(
          window.location.href,
        );

      url.searchParams.delete(
        "bookingId",
      );

      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}`,
      );
    }
  };

  const handleCreateBooking = () => {
    console.log("OPEN_CREATE_BOOKING");
  };

  const handleAdvancedFilter = () => {
    console.log("OPEN_ADVANCED_FILTER");
  };

  const handleDownload = () => {
    console.log(
      "DOWNLOAD_BOOKINGS",
      filteredBookings
    );
  };

  const handleSaveAssignment = async (
    assignmentPayload
  ) => {
    setSavingAssignment(true);

    try {
      if (assignmentPayload.id) {
        const {
          id,
          ...assignmentData
        } = assignmentPayload;

        await db.updateDoc(
          "CrewAssignments",
          id,
          {
            ...assignmentData,
            updatedAt:
              db.serverTimestamp(),
          }
        );

        return;
      }

      await db.addDoc(
        "CrewAssignments",
        {
          ...assignmentPayload,
          createdAt:
            db.serverTimestamp(),
          updatedAt:
            db.serverTimestamp(),
        }
      );
    } finally {
      setSavingAssignment(false);
    }
  };


  /*
   * Finalisasi seluruh preparation dalam satu aksi.
   *
   * Urutan sengaja dibuat:
   * 1. Publish crew assignment
   * 2. Issue deposit invoice
   * 3. Ubah booking menjadi approved
   *
   * Dengan begitu, booking tidak akan berstatus approved
   * sebelum assignment dan invoice siap dilihat client.
   */
  const handleSubmitAndSend = async ({
    booking,
    assignment,
    depositInvoice,
    preparation,
  }) => {
    const currentBooking =
      selectedBooking?.id === booking?.id
        ? selectedBooking
        : booking;

    if (!currentBooking?.id) {
      throw new Error(
        "Booking tidak ditemukan."
      );
    }

    if (
      currentBooking.status !== "pending"
    ) {
      throw new Error(
        "Booking ini sudah pernah dikirim kepada client."
      );
    }

    const currentAssignment =
      assignment ?? selectedAssignment;

    if (
      !currentAssignment?.id ||
      !Array.isArray(
        currentAssignment.crewIds
      ) ||
      currentAssignment.crewIds.length === 0
    ) {
      throw new Error(
        "Crew assignment belum lengkap."
      );
    }

    const currentDepositInvoice =
      depositInvoice ??
      bookingInvoices.find(
        (invoice) =>
          invoice.type === "deposit" &&
          invoice.status !== "void"
      );

    if (!currentDepositInvoice?.id) {
      throw new Error(
        "Deposit invoice belum dibuat."
      );
    }

    if (
      !["draft", "issued"].includes(
        currentDepositInvoice.status
      )
    ) {
      throw new Error(
        "Deposit invoice tidak dapat diterbitkan."
      );
    }

    const allStepsCompleted =
      preparation?.reviewCompleted === true &&
      preparation?.crewCompleted === true &&
      preparation?.billingCompleted === true;

    if (!allStepsCompleted) {
      throw new Error(
        "Semua preparation step harus dikonfirmasi."
      );
    }

    setProcessingBillingId(
      currentDepositInvoice.id
    );

    try {
      /*
       * Publish assignment terlebih dahulu.
       */
      if (
        currentAssignment.status !==
        "published"
      ) {
        await db.updateDoc(
          "CrewAssignments",
          currentAssignment.id,
          {
            status: "published",
            publishedAt:
              db.serverTimestamp(),
            updatedAt:
              db.serverTimestamp(),
          }
        );
      }

      /*
       * Invoice deposit baru diterbitkan pada final submit.
       */
      if (
        currentDepositInvoice.status !==
        "issued"
      ) {
        await db.updateDoc(
          "Invoices",
          currentDepositInvoice.id,
          {
            status: "issued",

            invoiceNumber:
              currentDepositInvoice.invoiceNumber ??
              createInvoiceNumber(
                currentDepositInvoice
              ),

            issuedAt:
              db.serverTimestamp(),

            updatedAt:
              db.serverTimestamp(),
          }
        );
      }

      /*
       * Booking diubah terakhir agar status approved selalu
       * berarti crew dan invoice sudah tersedia.
       */
      await db.updateDoc(
        "Bookings",
        currentBooking.id,
        {
          status: "approved",

          preparation: {
            reviewCompleted: true,
            crewCompleted: true,
            billingCompleted: true,
            completedAt:
              db.serverTimestamp(),
          },

          approvedAt:
            db.serverTimestamp(),

          sentToClientAt:
            db.serverTimestamp(),

          updatedAt:
            db.serverTimestamp(),
        }
      );

      /*
       * Pengiriman email/notifikasi client sebaiknya
       * dilakukan melalui Cloud Function atau backend.
       */
      console.log(
        "BOOKING READY TO SEND:",
        {
          bookingId: currentBooking.id,
          assignmentId:
            currentAssignment.id,
          invoiceId:
            currentDepositInvoice.id,
        }
      );
    } finally {
      setProcessingBillingId(null);
    }
  };


  const handleCreateInvoice = async ({
    type,
  }) => {
    if (!selectedBooking?.id) return null;

    if (
      type !== "deposit" &&
      type !== "final"
    ) {
      throw new Error(
        "Invoice type tidak valid."
      );
    }

    /*
     * Jangan membuat invoice aktif kedua untuk
     * booking dan type yang sama.
     */
    const existingInvoice =
      bookingInvoices.find(
        (invoice) =>
          invoice.type === type &&
          invoice.status !== "void"
      );

    if (existingInvoice) {
      return existingInvoice;
    }

    const packageTotal =
      Number(
        selectedBooking.package?.price
      ) || 0;

    const totalPaid =
      calculateTotalPaid(
        bookingPayments
      );

    const amount =
      type === "deposit"
        ? packageTotal * 0.3
        : Math.max(
            0,
            packageTotal - totalPaid
          );

    let revision =
      getNextInvoiceRevision(
        bookingInvoices,
        type
      );

    let invoiceId =
      `${selectedBooking.id}_${type}_v${revision}`;

    /*
     * Cek langsung ke Firestore agar invoice
     * versi yang sama tidak tertimpa.
     */
    let invoiceSnapshot =
      await db.getDoc(
        "Invoices",
        invoiceId
      );

    while (invoiceSnapshot.exists()) {
      const existingData =
        invoiceSnapshot.data();

      if (
        existingData.bookingId ===
          selectedBooking.id &&
        existingData.type === type &&
        existingData.status !== "void"
      ) {
        return {
          id: invoiceSnapshot.id,
          ...existingData,
        };
      }

      revision += 1;
      invoiceId =
        `${selectedBooking.id}_${type}_v${revision}`;

      invoiceSnapshot =
        await db.getDoc(
          "Invoices",
          invoiceId
        );
    }

    const invoicePayload = {
      bookingId: selectedBooking.id,

      clientId:
        selectedBooking.client?.uid ??
        null,

      type,
      revision,

      invoiceNumber: null,

      packageTotal,
      amount,

      currency:
        selectedBooking.package
          ?.currency ?? "IDR",

      dueAt:
        getDefaultInvoiceDueDate(
          type,
          selectedBooking.event
            ?.preferredDate
        ),

      status: "draft",
      note:
        type === "deposit"
          ? "30% booking deposit"
          : "Remaining booking balance",

      pdfUrl: null,
      issuedAt: null,

      createdAt:
        db.serverTimestamp(),
      updatedAt:
        db.serverTimestamp(),
    };

    setProcessingBillingId(invoiceId);

    try {
      await db.setDoc(
        "Invoices",
        invoiceId,
        invoicePayload
      );

      return {
        id: invoiceId,
        ...invoicePayload,
      };
    } finally {
      setProcessingBillingId(null);
    }
  };

  const handleEditInvoice = (invoice) => {
    /*
     * Hubungkan ke modal/form edit invoice.
     * Draft tetap terbaca dari Firestore dan tidak
     * akan dibuat ulang.
     */
    console.log(
      "OPEN_EDIT_INVOICE:",
      invoice
    );
  };

  const handleIssueInvoice = async (
    invoice
  ) => {
    if (!invoice?.id) return;

    /*
     * Deposit invoice untuk booking pending hanya boleh
     * diterbitkan melalui Submit & Send to Client.
     */
    if (
      selectedBooking?.status === "pending" &&
      invoice.type === "deposit"
    ) {
      console.warn(
        "Deposit invoice is issued through Submit & Send to Client."
      );

      return;
    }

    if (invoice.status !== "draft") {
      return;
    }

    setProcessingBillingId(invoice.id);

    try {
      await db.updateDoc(
        "Invoices",
        invoice.id,
        {
          status: "issued",

          invoiceNumber:
            invoice.invoiceNumber ??
            createInvoiceNumber(invoice),

          issuedAt:
            db.serverTimestamp(),

          updatedAt:
            db.serverTimestamp(),
        }
      );
    } finally {
      setProcessingBillingId(null);
    }
  };

  const handleVoidInvoice = async (
    invoice
  ) => {
    if (!invoice?.id) return;

    setProcessingBillingId(invoice.id);

    try {
      await db.updateDoc(
        "Invoices",
        invoice.id,
        {
          status: "void",
          voidedAt:
            db.serverTimestamp(),
          updatedAt:
            db.serverTimestamp(),
        }
      );
    } finally {
      setProcessingBillingId(null);
    }
  };

  const handleDownloadInvoice = (
    invoice
  ) => {
    if (!invoice?.pdfUrl) {
      console.log(
        "INVOICE PDF NOT AVAILABLE:",
        invoice
      );

      return;
    }

    window.open(
      invoice.pdfUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleResendInvoice = (
    invoice
  ) => {
    /*
     * Pengiriman email/notification sebaiknya
     * dilakukan melalui server atau Cloud Function.
     */
    console.log(
      "RESEND_INVOICE:",
      invoice
    );
  };

  const handleViewPaymentProof = (
    payment
  ) => {
    if (!payment?.proofUrl) return;

    window.open(
      payment.proofUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleConfirmPayment = async (
    payment
  ) => {
    if (!payment?.id) return;

    setProcessingBillingId(payment.id);

    try {
      await db.updateDoc(
        "Payments",
        payment.id,
        {
          status: "paid",
          verifiedAt:
            db.serverTimestamp(),
          updatedAt:
            db.serverTimestamp(),
        }
      );

      const relatedInvoice =
        bookingInvoices.find(
          (invoice) =>
            invoice.id ===
            payment.invoiceId
        );

      /*
       * Konfirmasi DP mengubah booking menjadi
       * confirmed. Nanti idealnya dipindahkan ke
       * transaction atau Cloud Function.
       */
      if (
        relatedInvoice?.type ===
          "deposit" &&
        selectedBooking.status ===
          "approved"
      ) {
        await db.updateDoc(
          "Bookings",
          selectedBooking.id,
          {
            status: "confirmed",
            confirmedAt:
              db.serverTimestamp(),
            updatedAt:
              db.serverTimestamp(),
          }
        );
      }
    } finally {
      setProcessingBillingId(null);
    }
  };

  const handleRejectPayment = async (
    payment
  ) => {
    if (!payment?.id) return;

    setProcessingBillingId(payment.id);

    try {
      await db.updateDoc(
        "Payments",
        payment.id,
        {
          status: "rejected",
          rejectedAt:
            db.serverTimestamp(),
          updatedAt:
            db.serverTimestamp(),
        }
      );
    } finally {
      setProcessingBillingId(null);
    }
  };

  /* ---------------------------------------------------------
     DETAIL VIEW
  --------------------------------------------------------- */

  if (selectedBookingId) {
    if (
      bookingsLoading ||
      crewLoading ||
      assignmentsLoading ||
      invoicesLoading ||
      paymentsLoading
    ) {
      return (
        <div className="flex min-h-80 items-center justify-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Loading booking details...
          </p>
        </div>
      );
    }

    if (
      bookingsError ||
      crewError ||
      assignmentsError ||
      invoicesError ||
      paymentsError
    ) {
      return (
        <div className="glass-panel rounded-xl p-stack-md text-center">
          <p className="font-headline-md text-headline-md text-error">
            Failed to load booking detail
          </p>

          <button
            type="button"
            onClick={handleBackToList}
            className="mt-6 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary"
          >
            Back to Bookings
          </button>
        </div>
      );
    }

    if (!selectedBooking) {
      return (
        <div className="glass-panel rounded-xl p-stack-md text-center">
          <p className="font-headline-md text-headline-md text-on-surface">
            Booking not found
          </p>

          <button
            type="button"
            onClick={handleBackToList}
            className="mt-6 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary"
          >
            Back to Bookings
          </button>
        </div>
      );
    }

    return (
      <ScheduleOrder
        booking={selectedBooking}
        crewMembers={crewMembers}
        existingAssignment={
          selectedAssignment
        }
        savingAssignment={
          savingAssignment
        }
        invoices={bookingInvoices}
        payments={bookingPayments}
        processingBillingId={
          processingBillingId
        }
        onBack={handleBackToList}
        onSaveAssignment={
          handleSaveAssignment
        }
        onSubmitAndSend={
          handleSubmitAndSend
        }
        onCreateInvoice={
          handleCreateInvoice
        }
        onEditInvoice={
          handleEditInvoice
        }
        onIssueInvoice={
          handleIssueInvoice
        }
        onVoidInvoice={
          handleVoidInvoice
        }
        onDownloadInvoice={
          handleDownloadInvoice
        }
        onResendInvoice={
          handleResendInvoice
        }
        onViewPaymentProof={
          handleViewPaymentProof
        }
        onConfirmPayment={
          handleConfirmPayment
        }
        onRejectPayment={
          handleRejectPayment
        }
      />
    );
  }

  /* ---------------------------------------------------------
     LIST VIEW
  --------------------------------------------------------- */

  return (
    <section>
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="mb-stack-lg">
        <div className="flex flex-col gap-stack-md lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-secondary">
              Bookings
            </p>

            <h1 className="font-display-lg text-display-lg text-primary">
              Booking Management
            </h1>

            <p className="mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
              Review incoming booking requests,
              monitor their status, and manage
              photography orders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateBooking}
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            <AppIcon
              name="add"
              size={20}
            />

            New Booking
          </button>
        </div>
      </header>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section
        aria-label="Booking summary"
        className="mb-stack-md grid grid-cols-1 gap-stack-sm sm:grid-cols-2 xl:grid-cols-4 xl:gap-gutter"
      >
        {bookingStats.map((stat) => (
          <article
            key={stat.id}
            className={`glass-panel rounded-xl p-6 ${stat.cardClass}`}
          >
            <p className="mb-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              {stat.label}
            </p>

            <p className="font-headline-md text-headline-md text-primary">
              {stat.value.toLocaleString(
                "en-US"
              )}
            </p>
          </article>
        ))}
      </section>

      {/* =====================================================
          FILTER TOOLBAR
      ===================================================== */}

      <section
        aria-label="Booking filters"
        className="glass-panel flex flex-col gap-4 rounded-t-xl p-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <AppIcon
              name="search"
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60"
            />

            <input
              type="search"
              value={search}
              onChange={
                handleSearchChange
              }
              placeholder="Search client, package, or location..."
              className="w-full rounded-lg border-none bg-surface-container-low py-2.5 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={status}
            onChange={
              handleStatusChange
            }
            aria-label="Filter booking status"
            className="min-w-48 rounded-lg border-none bg-surface-container-low px-4 py-2.5 font-label-sm text-label-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">
              All Statuses
            </option>

            {Object.entries(
              BOOKING_STATUS
            ).map(
              ([
                statusValue,
                statusConfig,
              ]) => (
                <option
                  key={statusValue}
                  value={statusValue}
                >
                  {statusConfig.label}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={
              handleAdvancedFilter
            }
            aria-label="Open advanced filters"
            title="Advanced filters"
            className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-surface-variant/60 hover:text-primary"
          >
            <AppIcon
              name="filter_list"
              size={20}
            />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download booking data"
            title="Download data"
            className="rounded-lg p-2.5 text-on-surface-variant transition-colors hover:bg-surface-variant/60 hover:text-primary"
          >
            <AppIcon
              name="download"
              size={20}
            />
          </button>
        </div>
      </section>

      {/* =====================================================
          BOOKINGS TABLE
      ===================================================== */}

      <section className="glass-panel overflow-hidden rounded-b-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-high/50 text-left">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Client
                </th>

                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Package
                </th>

                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Event Date
                </th>

                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Status
                </th>

                <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">
                  Detail
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/20">
              {bookingsLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-stack-lg text-center"
                  >
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Loading bookings...
                    </p>
                  </td>
                </tr>
              )}

              {!bookingsLoading &&
                bookingsError && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-stack-lg text-center"
                    >
                      <p className="font-headline-md text-headline-md text-error">
                        Failed to load bookings
                      </p>

                      <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
                        Please check your
                        Firestore connection and
                        security rules.
                      </p>
                    </td>
                  </tr>
                )}

              {!bookingsLoading &&
                !bookingsError &&
                paginatedBookings.map(
                  (booking) => {
                    const statusConfig =
                      BOOKING_STATUS[
                        booking.status
                      ] ??
                      BOOKING_STATUS.pending;

                    return (
                      <tr
                        key={booking.id}
                        className="group transition-colors hover:bg-surface-container-low/60"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface transition-colors group-hover:bg-primary group-hover:text-on-primary">
                              {getClientInitials(
                                booking.client
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-label-md text-label-md text-on-surface">
                                {getClientDisplayName(
                                  booking.client
                                )}
                              </p>

                              <p className="mt-0.5 truncate font-label-sm text-label-sm text-on-surface-variant">
                                {booking.event
                                  ?.location ??
                                  "Location not provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-body-md text-body-md text-on-surface">
                            {booking.package
                              ?.name ??
                              "Package not found"}
                          </p>

                          {booking.package
                            ?.priceLabel && (
                            <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                              {
                                booking.package
                                  .priceLabel
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                          {formatBookingDate(
                            booking.event
                              ?.preferredDate
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 font-label-sm text-label-sm ${statusConfig.badgeClass}`}
                          >
                            {
                              statusConfig.label
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDetail(
                                booking
                              )
                            }
                            aria-label={`Open booking detail for ${getClientDisplayName(
                              booking.client
                            )}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-all hover:bg-surface-variant active:scale-95"
                          >
                            <AppIcon
                              name="chevron_right"
                              size={20}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}

              {!bookingsLoading &&
                !bookingsError &&
                paginatedBookings.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-stack-lg text-center"
                    >
                      <p className="font-headline-md text-headline-md text-on-surface">
                        No bookings found
                      </p>

                      <p className="mx-auto mt-2 max-w-md font-body-md text-body-md text-on-surface-variant">
                        Try using a different
                        search term or changing
                        the booking status filter.
                      </p>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* ===================================================
            PAGINATION
        =================================================== */}

        <div className="flex flex-col gap-4 border-t border-outline-variant/30 bg-surface-container-low/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Showing {firstVisibleItem}–
            {lastVisibleItem} of{" "}
            {filteredBookings.length.toLocaleString(
              "en-US"
            )}{" "}
            bookings
          </p>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() =>
                setPage(
                  (currentPage) =>
                    Math.max(
                      currentPage - 1,
                      1
                    )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AppIcon
                name="chevron_left"
                size={16}
              />
            </button>

            {paginationItems.map(
              (item, index) => {
                if (item === "...") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-8 min-w-8 items-center justify-center px-1 font-label-sm text-label-sm text-on-surface-variant"
                    >
                      ...
                    </span>
                  );
                }

                const isActive =
                  item === page;

                return (
                  <button
                    key={item}
                    type="button"
                    aria-current={
                      isActive
                        ? "page"
                        : undefined
                    }
                    onClick={() =>
                      setPage(item)
                    }
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-label-sm text-label-sm transition-colors ${
                      isActive
                        ? "bg-primary text-on-primary"
                        : "text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    {item}
                  </button>
                );
              }
            )}

            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() =>
                setPage(
                  (currentPage) =>
                    Math.min(
                      currentPage + 1,
                      totalPages
                    )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AppIcon
                name="chevron_right"
                size={16}
              />
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}


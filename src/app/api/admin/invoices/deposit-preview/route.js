import {
  adminDb,
} from "@/lib/firebase-admin";

import {
  AdminRequestError,
  requireAdminRequest,
} from "@/lib/require-admin";

import {
  buildDepositInvoiceFileName,
  buildDepositInvoiceNumber,
} from "@/lib/pdf/invoiceIdentity";

import {
  generateDepositInvoicePdf,
} from "@/lib/pdf/depositInvoicePdf";

import {
  getDefaultJakartaDueDate,
  getJakartaDateKey,
} from "@/lib/jakartaDate";

export const runtime =
  "nodejs";

function jsonError(
  message,
  status = 400,
) {
  return Response.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

function normalizeDueDate(
  value,
) {
  const normalized =
    String(value || "")
      .trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return normalized;
  }

  return getDefaultJakartaDueDate(3);
}

function isBundlePackageItem(packageItem) {
  const packageName = String(
    packageItem?.name ?? packageItem?.packageName ?? packageItem?.title ?? "",
  ).toLowerCase();
  const normalizedPackageName = packageName
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return Boolean(
    packageItem?.packageCategoryId === "bundle" ||
      (
        normalizedPackageName.includes("prewedding") &&
        normalizedPackageName.includes("wedding") &&
        (
          normalizedPackageName.includes("bundle") ||
          normalizedPackageName.includes("plus") ||
          normalizedPackageName.includes("+")
        )
      ),
  );
}

function getBillingPackageItems(booking) {
  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];

  const bundlePackage = packageItems.find((packageItem) => isBundlePackageItem(packageItem));

  const billingItems = bundlePackage
    ? [bundlePackage, ...packageItems.filter((packageItem) => packageItem !== bundlePackage)]
    : packageItems;
  return Array.from(
    new Map(billingItems.map((packageItem, index) => [
      String(packageItem?.id ?? index),
      packageItem,
    ])).values(),
  );
}

function isCombinedPayment(booking) {
  return String(booking?.paymentArrangement ?? "separate").toLowerCase() === "combined";
}

function getCombinedInvoiceItems(booking, type = "deposit") {
  const packageItems = getBillingPackageItems(booking);

  return packageItems.map((packageItem, index) => ({
    id: `package-service-${packageItem?.id ?? index}`,
    label: `${type === "deposit" ? "Down Payment" : "Final Payment"} Package ${index + 1} for ${packageItem?.name || "Package Service"}`,
    amount: Math.max(Number(packageItem?.price) || 0, 0),
  }));
}

function getBookingAmounts(
  booking,
) {
  const packageItems = getBillingPackageItems(booking);
  const packageAmount = packageItems.reduce(
    (total, packageItem) => total + Math.max(Number(packageItem?.price) || 0, 0),
    0,
  );

  const travelCharge =
    Math.max(
      Number(
        booking?.event
          ?.location
          ?.distanceCharge
          ?.amount,
      ) || 0,
      0,
    );

  return {
    packageAmount,
    travelCharge,
    bookingTotal:
      packageAmount +
      travelCharge,
  };
}

export async function POST(
  request,
) {
  try {
    await requireAdminRequest(
      request,
    );

    const body =
      await request.json();

    const bookingId =
      String(
        body?.bookingId ||
          "",
      ).trim();

    if (!bookingId) {
      return jsonError(
        "Booking ID tidak tersedia.",
      );
    }

    const bookingSnapshot =
      await adminDb
        .collection(
          "Bookings",
        )
        .doc(bookingId)
        .get();

    if (
      !bookingSnapshot.exists
    ) {
      return jsonError(
        "Booking tidak ditemukan.",
        404,
      );
    }

    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    };

    if (isCombinedPayment(booking) && booking.inquiryId) {
      const inquirySnapshot = await adminDb
        .collection("Bookings")
        .where("inquiryId", "==", booking.inquiryId)
        .get();
      const inquiryBookings = inquirySnapshot.docs.map((document) => document.data());

      if (inquiryBookings.length > 1) {
        booking.packages = inquiryBookings.map((item) => item.package).filter(Boolean);
        booking.events = inquiryBookings.map((item) => item.event).filter(Boolean);
        booking.package = booking.packages[0] ?? booking.package;
        booking.event = booking.events[0] ?? booking.event;
      }
    }

    const packageId = String(body?.packageId || "").trim();
    const selectedPackage = packageId
      ? (booking.packages || []).find((item) => item.id === packageId)
      : null;
    const isBundle = selectedPackage?.packageCategoryId === "bundle";
    const selectedEvent = packageId
      ? (booking.events || []).find((item) => item.packageId === packageId)
      : null;
    const scopedBooking = selectedPackage && !isBundle && !isCombinedPayment(booking)
      ? {
          ...booking,
          package: selectedPackage,
          event: selectedEvent || booking.event,
          packages: [selectedPackage],
          events: selectedEvent ? [selectedEvent] : booking.events,
        }
      : booking;

    if (
      booking.status !==
      "pending"
    ) {
      return jsonError(
        "PDF preview hanya dapat dibuat saat booking masih pending.",
        409,
      );
    }

    const {
      packageAmount,
      travelCharge,
      bookingTotal,
    } = getBookingAmounts(scopedBooking);

    const requestedAmount =
      Number(
        body?.invoiceDraft
          ?.amount,
      );

    const amount =
      Number.isFinite(
        requestedAmount,
      )
        ? requestedAmount
        : Math.round(
            bookingTotal *
              0.3,
          );

    if (
      amount <= 0 ||
      amount >
        bookingTotal
    ) {
      return jsonError(
        "Nominal DP tidak valid.",
      );
    }

    const invoiceNumber =
      buildDepositInvoiceNumber(
        scopedBooking,
      );

    const fileName =
      buildDepositInvoiceFileName(
        invoiceNumber,
      );

    const invoiceDate =
      getJakartaDateKey();

    const invoice = {
      type: "deposit",
      packageId: packageId || scopedBooking.package?.id || null,
      packageTotal:
        bookingTotal,
      packageAmount,
      travelCharge,
      bookingTotal,
      amount,
      currency:
        scopedBooking?.package
          ?.currency ||
        "IDR",
      dueAt:
        normalizeDueDate(
          body?.invoiceDraft
            ?.dueAt,
        ),
      invoiceDate,
      items: isCombinedPayment(scopedBooking)
        ? getCombinedInvoiceItems(scopedBooking, "deposit")
        : undefined,
      note:
        String(
          body?.invoiceDraft
            ?.note ||
            "30% booking deposit",
        )
          .trim()
          .slice(
            0,
            1000,
          ),
    };

    const pdfBuffer =
      await generateDepositInvoicePdf({
        booking: scopedBooking,
        invoice,
        invoiceNumber,
        invoiceDate,
        totalPaid: 0,
      });

    /*
     * Preview sengaja TIDAK dikirim sebagai binary Response.
     *
     * Pada mode development Next.js/Turbopack di beberapa environment,
     * body binary dari Route Handler dapat terbaca kosong / tidak konsisten
     * oleh fetch client walaupun file PDF yang sama valid saat didownload.
     *
     * Untuk preview invoice 1 halaman, base64 JSON jauh lebih deterministik:
     *
     * pdf Buffer
     *   -> validate
     *   -> base64
     *   -> JSON
     *   -> browser decode
     *   -> Blob(application/pdf)
     */
    const signature =
      pdfBuffer
        .subarray(
          0,
          5,
        )
        .toString(
          "ascii",
        );

    if (
      signature !== "%PDF-"
    ) {
      throw new Error(
        "[PDF] Output generator bukan file PDF yang valid.",
      );
    }

    if (
      pdfBuffer.length <= 5
    ) {
      throw new Error(
        "[PDF] Output generator kosong.",
      );
    }

    return Response.json(
      {
        ok: true,
        data: {
          mimeType:
            "application/pdf",
          fileName,
          invoiceNumber,
          invoiceDate,
          dueAt:
            invoice.dueAt,
          size:
            pdfBuffer.length,
          pdfBase64:
            pdfBuffer.toString(
              "base64",
            ),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "DEPOSIT INVOICE PREVIEW ERROR:",
      error,
    );

    if (
      error instanceof
      AdminRequestError
    ) {
      return jsonError(
        error.message,
        error.status,
      );
    }

    return jsonError(
      error?.message ||
        "PDF preview gagal dibuat.",
      500,
    );
  }
}

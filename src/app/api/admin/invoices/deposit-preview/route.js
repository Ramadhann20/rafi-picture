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

function getBookingAmounts(
  booking,
) {
  const packageAmount =
    Math.max(
      Number(
        booking?.package?.price,
      ) || 0,
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
      id:
        bookingSnapshot.id,
      ...bookingSnapshot.data(),
    };

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
    } = getBookingAmounts(
      booking,
    );

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
        booking,
      );

    const fileName =
      buildDepositInvoiceFileName(
        invoiceNumber,
      );

    const invoiceDate =
      getJakartaDateKey();

    const invoice = {
      type: "deposit",
      packageTotal:
        bookingTotal,
      packageAmount,
      travelCharge,
      bookingTotal,
      amount,
      currency:
        booking?.package
          ?.currency ||
        "IDR",
      dueAt:
        normalizeDueDate(
          body?.invoiceDraft
            ?.dueAt,
        ),
      invoiceDate,
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
        booking,
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

import {
  adminDb,
} from "@/lib/firebase-admin";

import {
  AdminRequestError,
  requireAdminRequest,
} from "@/lib/require-admin";

import {
  buildMainInvoiceFileName,
  buildMainInvoiceNumber,
} from "@/lib/pdf/invoiceIdentity";

import {
  generateMainInvoicePdf,
} from "@/lib/pdf/mainInvoicePdf";

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

function getBookingAmounts(
  booking,
) {
  const packageAmount =
    Math.max(
      Number(
        booking?.package
          ?.price,
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

function normalizeDueDate(
  value,
) {
  const normalized =
    String(
      value || "",
    ).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return normalized;
  }

  return getDefaultJakartaDueDate(3);
}

function getPaidAmount(
  invoice,
) {
  return Math.max(
    Number(
      invoice?.totalPaid ??
        invoice?.amount,
    ) || 0,
    0,
  );
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

    const bookingRef =
      adminDb
        .collection(
          "Bookings",
        )
        .doc(
          bookingId,
        );

    const [
      bookingSnapshot,
      invoiceSnapshot,
    ] = await Promise.all([
      bookingRef.get(),

      adminDb
        .collection(
          "Invoices",
        )
        .where(
          "bookingId",
          "==",
          bookingId,
        )
        .get(),
    ]);

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
      "in_progress"
    ) {
      return jsonError(
        "Invoice pelunasan hanya dapat dibuat setelah DP terverifikasi.",
        409,
      );
    }

    const invoices =
      invoiceSnapshot.docs.map(
        (document) => ({
          id:
            document.id,
          ...document.data(),
        }),
      );

    const depositInvoice =
      invoices
        .filter(
          (invoice) =>
            invoice.type ===
              "deposit" &&
            invoice.status ===
              "paid",
        )
        .sort(
          (
            first,
            second,
          ) =>
            (Number(
              second.revision,
            ) || 1) -
            (Number(
              first.revision,
            ) || 1),
        )[0] ||
      null;

    if (!depositInvoice) {
      return jsonError(
        "DP belum terverifikasi atau invoice DP belum berstatus paid.",
        409,
      );
    }

    const existingFinal =
      invoices.find(
        (invoice) =>
          invoice.type ===
            "final" &&
          invoice.status !==
            "void",
      );

    if (existingFinal) {
      return jsonError(
        "Invoice pelunasan sudah pernah diterbitkan untuk booking ini.",
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

    const depositPaid =
      Math.min(
        bookingTotal,
        getPaidAmount(
          depositInvoice,
        ),
      );

    const amount =
      Math.max(
        0,
        bookingTotal -
          depositPaid,
      );

    if (amount <= 0) {
      return jsonError(
        "Booking sudah tidak memiliki sisa pembayaran.",
        409,
      );
    }

    const invoiceNumber =
      buildMainInvoiceNumber(
        booking,
      );

    const fileName =
      buildMainInvoiceFileName(
        invoiceNumber,
      );

    const invoiceDraft =
      body?.invoiceDraft ||
      {};

    const invoiceDate =
      getJakartaDateKey();

    const invoice = {
      bookingId,
      clientId:
        booking?.client?.uid ||
        null,

      type:
        "final",

      revision: 1,
      invoiceNumber,

      packageTotal:
        bookingTotal,
      packageAmount,
      travelCharge,
      bookingTotal,

      items: [
        {
          id:
            "package-service",
          label:
            booking?.package?.name ||
            "Package Service",
          amount:
            packageAmount,
        },
        ...(travelCharge > 0
          ? [
              {
                id:
                  "travel-charge",
                label:
                  "Travel Charge",
                amount:
                  travelCharge,
              },
            ]
          : []),
      ],

      depositInvoiceId:
        depositInvoice.id,
      depositInvoiceNumber:
        depositInvoice.invoiceNumber ||
        null,
      depositPaid,

      amount,
      totalPaid: 0,
      amountDue:
        amount,

      currency:
        booking?.package
          ?.currency ||
        "IDR",

      dueAt:
        normalizeDueDate(
          invoiceDraft?.dueAt,
        ),

      invoiceDate,

      note:
        String(
          invoiceDraft?.note ||
            "Final payment / pelunasan",
        )
          .trim()
          .slice(
            0,
            1000,
          ),

      status:
        "draft",
    };

    const pdfBuffer =
      await generateMainInvoicePdf({
        booking,
        invoice,
        invoiceNumber,
        invoiceDate,
        depositInvoice,
      });

    if (
      pdfBuffer
        .subarray(
          0,
          5,
        )
        .toString(
          "ascii",
        ) !== "%PDF-"
    ) {
      throw new Error(
        "Generator invoice pelunasan tidak menghasilkan PDF yang valid.",
      );
    }

    return Response.json({
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
        amount,
        bookingTotal,
        depositPaid,
        pdfBase64:
          pdfBuffer.toString(
            "base64",
          ),
      },
    });
  } catch (error) {
    console.error(
      "FINAL INVOICE PREVIEW ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Preview invoice pelunasan gagal dibuat.",
      error instanceof
      AdminRequestError
        ? error.status
        : Number(
            error?.status,
          ) || 500,
    );
  }
}

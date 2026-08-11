import {
  FieldValue,
} from "firebase-admin/firestore";

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
  deletePdfAsset,
  uploadPdfBuffer,
} from "@/lib/cloudinary";

import {
  sendBookingDocumentEmail,
} from "@/lib/email/systemEmail";

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

  const date =
    new Date();

  date.setDate(
    date.getDate() + 3,
  );

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
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

function getPaidAmount(
  invoice,
) {
  const penaltyAmount =
    Math.max(
      Number(
        invoice?.penalty
          ?.appliedAmount ??
          invoice?.penaltyAmount,
      ) || 0,
      0,
    );

  const principalAmount =
    Number(
      invoice?.principalAmount ??
        invoice?.baseAmount,
    );

  if (
    Number.isFinite(
      principalAmount,
    ) &&
    principalAmount >= 0
  ) {
    return principalAmount;
  }

  return Math.max(
    (Number(
      invoice?.totalPaid ??
        invoice?.amount,
    ) || 0) -
      penaltyAmount,
    0,
  );
}

export async function POST(
  request,
) {
  let uploadedPdf =
    null;

  try {
    const admin =
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

    if (
      body?.pdfReviewed !==
      true
    ) {
      return jsonError(
        "Invoice pelunasan harus direview sebelum diterbitkan.",
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
        "Invoice pelunasan hanya dapat diterbitkan setelah DP terverifikasi.",
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
        "DP belum berstatus paid.",
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
        "Invoice pelunasan sudah diterbitkan.",
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
        "Booking sudah lunas.",
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

    const invoiceId =
      `${bookingId}_final_v1`;

    const invoiceDraft =
      body?.invoiceDraft ||
      {};

    const dueAt =
      normalizeDueDate(
        invoiceDraft?.dueAt,
      );

    const note =
      String(
        invoiceDraft?.note ||
          "Final payment / pelunasan",
      )
        .trim()
        .slice(
          0,
          1000,
        );

    const invoice = {
      id:
        invoiceId,
      bookingId,
      clientId:
        booking?.client?.uid ||
        null,

      type:
        "final",

      revision: 1,
      invoiceNumber,
      rootInvoiceId:
        invoiceId,
      rootInvoiceNumber:
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

      principalAmount:
        amount,
      penaltyAmount: 0,
      amount,
      totalPaid: 0,
      amountDue:
        amount,

      currency:
        booking?.package
          ?.currency ||
        "IDR",

      dueAt,
      note,

      status:
        "issued",
    };

    const pdfBuffer =
      await generateMainInvoicePdf({
        booking,
        invoice,
        invoiceNumber,
        invoiceDate:
          new Date(),
        depositInvoice,
      });

    uploadedPdf =
      await uploadPdfBuffer({
        buffer:
          pdfBuffer,
        fileName,
        publicId:
          invoiceNumber,
        folder:
          "rafi-picture/invoices",
        overwrite:
          true,
        tags: [
          "final-invoice",
          "settlement",
          "issued",
          bookingId,
        ],
        context: {
          booking_id:
            bookingId,
          booking_code:
            booking.bookingCode ||
            "",
          invoice_number:
            invoiceNumber,
          invoice_type:
            "final",
          deposit_invoice:
            depositInvoice
              .invoiceNumber ||
            "",
        },
      });

    const invoiceRef =
      adminDb
        .collection(
          "Invoices",
        )
        .doc(
          invoiceId,
        );

    const timestamp =
      FieldValue.serverTimestamp();

    const batch =
      adminDb.batch();

    batch.set(
      invoiceRef,
      {
        ...invoice,

        pdfUrl:
          uploadedPdf.secureUrl,

        pdf: {
          publicId:
            uploadedPdf.publicId,
          assetId:
            uploadedPdf.assetId,
          url:
            uploadedPdf.secureUrl,
          fileName:
            uploadedPdf.fileName,
          bytes:
            uploadedPdf.bytes,
          version:
            uploadedPdf.version,
          resourceType:
            uploadedPdf.resourceType,
        },

        issuedAt:
          timestamp,
        createdAt:
          timestamp,
        updatedAt:
          timestamp,
      },
      {
        merge: true,
      },
    );

    batch.update(
      bookingRef,
      {
        finalInvoiceId:
          invoiceId,

        paymentStatus:
          "final_due",

        financialStatus:
          "partially_paid",

        finalInvoiceIssuedAt:
          timestamp,

        updatedAt:
          timestamp,
      },
    );

    try {
      await batch.commit();
    } catch (error) {
      try {
        await deletePdfAsset(
          uploadedPdf.publicId,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "FINAL INVOICE CLOUDINARY CLEANUP ERROR:",
          cleanupError,
        );
      }

      uploadedPdf = null;

      throw error;
    }

    const message =
`Halo ${booking?.client?.fullName || "Client"},

Invoice pelunasan untuk booking ${booking.bookingCode || booking.id} sudah diterbitkan.

Paket: ${booking?.package?.name || "-"}
Total Booking: Rp ${new Intl.NumberFormat("id-ID").format(bookingTotal)}
DP Terbayar: Rp ${new Intl.NumberFormat("id-ID").format(depositPaid)}
Pelunasan: Rp ${new Intl.NumberFormat("id-ID").format(amount)}
Jatuh Tempo: ${dueAt}

Silakan lakukan pembayaran pelunasan sesuai invoice terlampir, lalu unggah bukti pembayaran melalui halaman booking Anda.

Terima kasih,
Rafi Picture`;

    const email =
      await sendBookingDocumentEmail({
        booking,
        sentBy:
          admin.uid,
        templateKey:
          "final_invoice_issued",
        subject:
          `Invoice Pelunasan ${invoiceNumber}`,
        message,
        attachment: {
          fileName:
            uploadedPdf.fileName,
          mimeType:
            "application/pdf",
          bytes:
            uploadedPdf.bytes,
          publicId:
            uploadedPdf.publicId,
          url:
            uploadedPdf.secureUrl,
          content:
            pdfBuffer,
        },
      });

    try {
      await bookingRef.update({
        finalInvoiceEmail: {
          status:
            email.sent
              ? "sent"
              : "failed",
          recipient:
            email.recipient ||
            null,
          logId:
            email.logId ||
            null,
          sentAt:
            email.sent
              ? FieldValue.serverTimestamp()
              : null,
          error:
            email.error ||
            null,
        },
        updatedAt:
          FieldValue.serverTimestamp(),
      });
    } catch (
      metadataError
    ) {
      console.error(
        "FINAL INVOICE EMAIL METADATA ERROR:",
        metadataError,
      );
    }

    return Response.json({
      ok: true,
      message:
        email.sent
          ? "Invoice pelunasan berhasil diterbitkan dan dikirim ke client."
          : "Invoice pelunasan berhasil diterbitkan, tetapi email belum terkirim.",
      data: {
        invoiceId,
        invoiceNumber,
        amount,
        depositPaid,
        bookingTotal,
        pdf: {
          url:
            uploadedPdf.secureUrl,
          publicId:
            uploadedPdf.publicId,
          fileName:
            uploadedPdf.fileName,
          bytes:
            uploadedPdf.bytes,
        },
        email,
      },
    });
  } catch (error) {
    console.error(
      "FINAL INVOICE ISSUE ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Invoice pelunasan gagal diterbitkan.",
      error instanceof
      AdminRequestError
        ? error.status
        : Number(
            error?.status,
          ) || 500,
    );
  }
}

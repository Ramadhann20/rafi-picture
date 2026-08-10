import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

import {
  buildPaymentReceiptFileName,
  buildPaymentReceiptNumber,
} from "@/lib/pdf/invoiceIdentity";

import {
  generatePaymentReceiptPdf,
} from "@/lib/pdf/paymentReceiptPdf";

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
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    },
  );
}

function getBearerToken(
  request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

function normalizePaymentStatus(
  status,
) {
  const normalized =
    String(
      status ??
        "pending_verification",
    ).toLowerCase();

  const map = {
    pending:
      "pending_verification",
    submitted:
      "pending_verification",
    waiting_verification:
      "pending_verification",
    waiting_confirmation:
      "pending_verification",

    paid:
      "verified",
    confirmed:
      "verified",
    completed:
      "verified",

    declined:
      "rejected",
    failed:
      "rejected",
  };

  return (
    map[normalized] ??
    normalized
  );
}

function getLocationLabel(
  location,
) {
  if (
    typeof location ===
    "string"
  ) {
    return (
      location.trim() ||
      null
    );
  }

  return (
    String(
      location?.venueName ??
        location?.addressLabel ??
        "",
    ).trim() ||
    null
  );
}

function getNumber(
  value,
  fallback = 0,
) {
  const numeric =
    Number(value);

  return Number.isFinite(
    numeric,
  )
    ? numeric
    : fallback;
}

function getBookingTotal(
  booking,
  invoice,
) {
  const packageAmount =
    Math.max(
      getNumber(
        invoice?.packageAmount ??
          booking?.package
            ?.price,
      ),
      0,
    );

  const travelCharge =
    Math.max(
      getNumber(
        invoice?.travelCharge ??
          booking?.event
            ?.location
            ?.distanceCharge
            ?.amount,
      ),
      0,
    );

  return Math.max(
    getNumber(
      invoice?.bookingTotal ??
        invoice?.packageTotal,
      packageAmount +
        travelCharge,
    ),
    0,
  );
}

async function requireAdmin(
  request,
) {
  const idToken =
    getBearerToken(
      request,
    );

  if (!idToken) {
    throw Object.assign(
      new Error(
        "Admin session is not available.",
      ),
      {
        status: 401,
      },
    );
  }

  let decodedToken;

  try {
    decodedToken =
      await adminAuth
        .verifyIdToken(
          idToken,
        );
  } catch {
    throw Object.assign(
      new Error(
        "Admin session is invalid or expired.",
      ),
      {
        status: 401,
      },
    );
  }

  const adminSnapshot =
    await adminDb
      .collection("Users")
      .doc(decodedToken.uid)
      .get();

  const adminUser =
    adminSnapshot.exists
      ? adminSnapshot.data()
      : null;

  if (
    adminUser?.role !==
    "admin"
  ) {
    throw Object.assign(
      new Error(
        "Admin access is required.",
      ),
      {
        status: 403,
      },
    );
  }

  return {
    uid:
      decodedToken.uid,
    profile:
      adminUser,
  };
}

function buildReviewedBy(
  admin,
) {
  return {
    uid:
      admin.uid,
    name:
      admin.profile
        ?.displayName ??
      admin.profile
        ?.fullName ??
      admin.profile
        ?.name ??
      null,
    email:
      admin.profile
        ?.email ??
      null,
  };
}

function buildSchedulePayload({
  booking,
  paymentId,
  invoiceId,
  timestamp,
}) {
  const event =
    booking?.event ?? {};

  const selectedPackage =
    booking?.package ?? {};

  return {
    bookingId:
      booking.id,

    bookingCode:
      booking?.bookingCode ??
      null,

    clientId:
      booking?.client?.uid ??
      null,

    clientName:
      booking?.client
        ?.fullName ??
      null,

    paymentId,
    invoiceId,

    packageId:
      selectedPackage?.id ??
      null,

    packageName:
      selectedPackage?.name ??
      null,

    date:
      event?.preferredDate ??
      null,

    eventDate:
      event?.preferredDate ??
      null,

    startTime:
      event?.startTime ??
      null,

    endTime:
      event?.endTime ??
      null,

    endTimeDayOffset:
      Number(
        event
          ?.endTimeDayOffset ??
          0,
      ) || 0,

    location:
      event?.location ??
      null,

    venueName:
      getLocationLabel(
        event?.location,
      ),

    scheduleStatus:
      "booked",

    status:
      "booked",

    source:
      "payment_verification",

    updatedAt:
      timestamp,
  };
}

export async function POST(
  request,
) {
  let uploadedReceipt =
    null;

  try {
    const admin =
      await requireAdmin(
        request,
      );

    const payload =
      await request.json();

    const paymentId =
      String(
        payload?.paymentId ??
        "",
      ).trim();

    const action =
      String(
        payload?.action ??
        "",
      )
        .trim()
        .toLowerCase();

    if (!paymentId) {
      return jsonError(
        "Payment ID is required.",
      );
    }

    if (
      ![
        "approve",
        "reject",
      ].includes(
        action,
      )
    ) {
      return jsonError(
        "Payment action is not valid.",
      );
    }

    const paymentRef =
      adminDb
        .collection(
          "Payments",
        )
        .doc(
          paymentId,
        );

    const paymentSnapshot =
      await paymentRef.get();

    if (
      !paymentSnapshot.exists
    ) {
      return jsonError(
        "Payment was not found.",
        404,
      );
    }

    const payment = {
      id:
        paymentSnapshot.id,
      ...paymentSnapshot.data(),
    };

    const paymentStatus =
      normalizePaymentStatus(
        payment?.status ??
          payment
            ?.verificationStatus,
      );

    if (
      paymentStatus !==
      "pending_verification"
    ) {
      return jsonError(
        "This payment has already been reviewed.",
        409,
      );
    }

    const bookingId =
      String(
        payment?.bookingId ??
        "",
      ).trim();

    const invoiceId =
      String(
        payment?.invoiceId ??
        "",
      ).trim();

    if (
      !bookingId ||
      !invoiceId
    ) {
      return jsonError(
        "Payment is not linked to a valid booking and invoice.",
        409,
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

    const invoiceRef =
      adminDb
        .collection(
          "Invoices",
        )
        .doc(
          invoiceId,
        );

    const [
      bookingSnapshot,
      invoiceSnapshot,
      scheduleSnapshot,
      paymentQuerySnapshot,
      invoiceQuerySnapshot,
    ] = await Promise.all([
      bookingRef.get(),
      invoiceRef.get(),

      adminDb
        .collection(
          "Schedules",
        )
        .where(
          "bookingId",
          "==",
          bookingId,
        )
        .get(),

      adminDb
        .collection(
          "Payments",
        )
        .where(
          "bookingId",
          "==",
          bookingId,
        )
        .get(),

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
        "Booking was not found.",
        404,
      );
    }

    if (
      !invoiceSnapshot.exists
    ) {
      return jsonError(
        "Invoice was not found.",
        404,
      );
    }

    const booking = {
      id:
        bookingSnapshot.id,
      ...bookingSnapshot.data(),
    };

    const invoice = {
      id:
        invoiceSnapshot.id,
      ...invoiceSnapshot.data(),
    };

    if (
      invoice?.bookingId !==
      bookingId
    ) {
      return jsonError(
        "Invoice does not belong to this booking.",
        409,
      );
    }

    const invoiceType =
      String(
        invoice?.type ||
        payment?.invoiceType ||
        "deposit",
      ).toLowerCase();

    if (
      ![
        "deposit",
        "final",
      ].includes(
        invoiceType,
      )
    ) {
      return jsonError(
        "Unsupported invoice type.",
        409,
      );
    }

    const timestamp =
      FieldValue.serverTimestamp();

    const reviewedBy =
      buildReviewedBy(
        admin,
      );

    /*
     * REJECT
     */
    if (
      action === "reject"
    ) {
      const batch =
        adminDb.batch();

      batch.update(
        paymentRef,
        {
          status:
            "rejected",

          verificationStatus:
            "rejected",

          rejectedAt:
            timestamp,

          reviewedAt:
            timestamp,

          reviewedBy,

          updatedAt:
            timestamp,
        },
      );

      batch.update(
        invoiceRef,
        {
          status:
            "issued",

          updatedAt:
            timestamp,
        },
      );

      batch.update(
        bookingRef,
        invoiceType ===
          "final"
          ? {
              status:
                "in_progress",

              paymentStatus:
                "final_rejected",

              latestPaymentId:
                null,

              finalPaymentProofSubmittedAt:
                null,

              finalPaymentRejectedAt:
                timestamp,

              updatedAt:
                timestamp,
            }
          : {
              status:
                "approved",

              paymentStatus:
                "deposit_rejected",

              latestPaymentId:
                null,

              paymentProofSubmittedAt:
                null,

              paymentRejectedAt:
                timestamp,

              updatedAt:
                timestamp,
            },
      );

      await batch.commit();

      return NextResponse.json({
        ok: true,
        message:
          invoiceType ===
            "final"
            ? "Pelunasan ditolak. Client dapat mengunggah bukti pelunasan baru."
            : "DP ditolak. Client dapat mengunggah bukti DP baru.",
        data: {
          paymentId,
          bookingId,
          invoiceId,
          invoiceType,
          paymentStatus:
            "rejected",
          bookingStatus:
            invoiceType ===
              "final"
              ? "in_progress"
              : "approved",
          invoiceStatus:
            "issued",
        },
      });
    }

    /*
     * APPROVE
     */
    const paymentAmount =
      Math.max(
        getNumber(
          payment?.amount,
        ),
        0,
      );

    if (
      paymentAmount <= 0
    ) {
      return jsonError(
        "Payment amount is invalid.",
        409,
      );
    }

    const invoiceAmount =
      Math.max(
        getNumber(
          invoice?.amount,
          paymentAmount,
        ),
        0,
      );

    const nextTotalPaid =
      Math.min(
        invoiceAmount,
        Math.max(
          getNumber(
            invoice?.totalPaid,
          ),
          0,
        ) +
          paymentAmount,
      );

    const amountDue =
      Math.max(
        0,
        invoiceAmount -
          nextTotalPaid,
      );

    if (
      invoiceType ===
      "deposit"
    ) {
      const batch =
        adminDb.batch();

      batch.update(
        paymentRef,
        {
          status:
            "verified",
          verificationStatus:
            "verified",
          verifiedAt:
            timestamp,
          reviewedAt:
            timestamp,
          reviewedBy,
          updatedAt:
            timestamp,
        },
      );

      batch.update(
        invoiceRef,
        {
          status:
            amountDue <= 0
              ? "paid"
              : "issued",

          totalPaid:
            nextTotalPaid,

          amountDue,

          paidAt:
            amountDue <= 0
              ? timestamp
              : null,

          updatedAt:
            timestamp,
        },
      );

      batch.update(
        bookingRef,
        {
          status:
            "in_progress",

          paymentStatus:
            "deposit_verified",

          financialStatus:
            "partially_paid",

          depositPaymentId:
            paymentId,

          depositVerifiedAt:
            timestamp,

          paymentVerifiedAt:
            timestamp,

          updatedAt:
            timestamp,
        },
      );

      const activeScheduleDoc =
        scheduleSnapshot.docs.find(
          (document) => {
            const schedule =
              document.data();

            return (
              schedule?.status !==
                "cancelled" &&
              schedule
                ?.scheduleStatus !==
                "cancelled"
            );
          },
        );

      const schedulePayload =
        buildSchedulePayload({
          booking,
          paymentId,
          invoiceId,
          timestamp,
        });

      if (
        activeScheduleDoc
      ) {
        batch.update(
          activeScheduleDoc.ref,
          schedulePayload,
        );
      } else {
        const scheduleRef =
          adminDb
            .collection(
              "Schedules",
            )
            .doc();

        batch.set(
          scheduleRef,
          {
            ...schedulePayload,
            createdAt:
              timestamp,
          },
        );
      }

      await batch.commit();

      return NextResponse.json({
        ok: true,
        message:
          "DP berhasil diverifikasi. Booking masuk tahap in progress dan invoice pelunasan dapat dibuat dari Booking Detail.",
        data: {
          paymentId,
          bookingId,
          invoiceId,
          invoiceType:
            "deposit",
          paymentStatus:
            "verified",
          invoiceStatus:
            amountDue <= 0
              ? "paid"
              : "issued",
          bookingStatus:
            "in_progress",
          nextAction:
            "create_final_invoice",
        },
      });
    }

    /*
     * FINAL PAYMENT:
     * Setelah ACC, generate kuitansi 100% booking total.
     */
    const allPayments =
      paymentQuerySnapshot.docs.map(
        (document) => ({
          id:
            document.id,
          ...document.data(),
        }),
      );

    const existingVerifiedTotal =
      allPayments
        .filter(
          (item) =>
            item.id !==
              paymentId &&
            normalizePaymentStatus(
              item?.status ??
                item
                  ?.verificationStatus,
            ) ===
              "verified",
        )
        .reduce(
          (
            total,
            item,
          ) =>
            total +
            Math.max(
              getNumber(
                item?.amount,
              ),
              0,
            ),
          0,
        );

    const bookingTotal =
      getBookingTotal(
        booking,
        invoice,
      );

    const totalAfterApproval =
      existingVerifiedTotal +
      paymentAmount;

    if (
      bookingTotal <= 0
    ) {
      return jsonError(
        "Booking total is invalid.",
        409,
      );
    }

    if (
      totalAfterApproval <
      bookingTotal
    ) {
      return jsonError(
        "Total DP + pelunasan belum mencapai 100% booking total.",
        409,
      );
    }

    const allInvoices =
      invoiceQuerySnapshot.docs.map(
        (document) => ({
          id:
            document.id,
          ...document.data(),
        }),
      );

    const depositInvoice =
      allInvoices.find(
        (item) =>
          item.type ===
            "deposit" &&
          item.status ===
            "paid",
      ) ||
      null;

    const depositPaid =
      Math.max(
        getNumber(
          depositInvoice
            ?.totalPaid ??
            depositInvoice
              ?.amount,
        ),
        0,
      );

    const receiptNumber =
      buildPaymentReceiptNumber(
        booking,
      );

    const receiptFileName =
      buildPaymentReceiptFileName(
        receiptNumber,
      );

    const receiptId =
      `${bookingId}_receipt_v1`;

    const receiptData = {
      id:
        receiptId,
      bookingId,
      clientId:
        booking?.client?.uid ??
        null,

      type:
        "full_payment_receipt",

      receiptNumber,

      invoiceId:
        invoice.id,

      invoiceNumber:
        invoice.invoiceNumber ||
        null,

      depositInvoiceId:
        depositInvoice?.id ||
        null,

      depositPaid,

      finalPaymentId:
        paymentId,

      finalPaid:
        paymentAmount,

      /*
       * Sesuai requirement:
       * nominal kuitansi = 100% TOTAL BOOKING,
       * bukan hanya nominal transfer pelunasan.
       */
      amount:
        bookingTotal,

      totalPaid:
        bookingTotal,

      currency:
        invoice?.currency ??
        booking?.package
          ?.currency ??
        "IDR",

      status:
        "issued",
    };

    const receiptPdfBuffer =
      await generatePaymentReceiptPdf({
        booking,
        receipt:
          receiptData,
        invoice,
        receiptNumber,
        receiptDate:
          new Date(),
      });

    uploadedReceipt =
      await uploadPdfBuffer({
        buffer:
          receiptPdfBuffer,

        publicId:
          receiptNumber,

        fileName:
          receiptFileName,

        folder:
          "rafi-picture/receipts",

        overwrite:
          true,

        tags: [
          "receipt",
          "full-payment",
          bookingId,
          paymentId,
        ],

        context: {
          booking_id:
            bookingId,
          booking_code:
            booking.bookingCode ||
            "",
          payment_id:
            paymentId,
          invoice_id:
            invoice.id,
          invoice_number:
            invoice.invoiceNumber ||
            "",
          receipt_number:
            receiptNumber,
        },
      });

    const receiptRef =
      adminDb
        .collection(
          "Receipts",
        )
        .doc(
          receiptId,
        );

    const batch =
      adminDb.batch();

    batch.update(
      paymentRef,
      {
        status:
          "verified",
        verificationStatus:
          "verified",
        verifiedAt:
          timestamp,
        reviewedAt:
          timestamp,
        reviewedBy,

        receiptId,
        receiptNumber,
        receiptUrl:
          uploadedReceipt
            .secureUrl,

        receipt: {
          publicId:
            uploadedReceipt
              .publicId,
          assetId:
            uploadedReceipt
              .assetId,
          url:
            uploadedReceipt
              .secureUrl,
          fileName:
            uploadedReceipt
              .fileName,
          bytes:
            uploadedReceipt
              .bytes,
          version:
            uploadedReceipt
              .version,
          resourceType:
            uploadedReceipt
              .resourceType,
        },

        updatedAt:
          timestamp,
      },
    );

    batch.update(
      invoiceRef,
      {
        status:
          "paid",

        totalPaid:
          invoiceAmount,

        amountDue: 0,

        paidAt:
          timestamp,

        updatedAt:
          timestamp,
      },
    );

    batch.set(
      receiptRef,
      {
        ...receiptData,

        pdfUrl:
          uploadedReceipt
            .secureUrl,

        pdf: {
          publicId:
            uploadedReceipt
              .publicId,
          assetId:
            uploadedReceipt
              .assetId,
          url:
            uploadedReceipt
              .secureUrl,
          fileName:
            uploadedReceipt
              .fileName,
          bytes:
            uploadedReceipt
              .bytes,
          version:
            uploadedReceipt
              .version,
          resourceType:
            uploadedReceipt
              .resourceType,
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
        status:
          "in_progress",

        paymentStatus:
          "paid_full",

        financialStatus:
          "paid_full",

        finalPaymentId:
          paymentId,

        receiptId,

        receipt: {
          id:
            receiptId,
          receiptNumber,
          amount:
            bookingTotal,
          currency:
            receiptData.currency,
          pdfUrl:
            uploadedReceipt.secureUrl,
          pdf: {
            publicId:
              uploadedReceipt.publicId,
            assetId:
              uploadedReceipt.assetId,
            url:
              uploadedReceipt.secureUrl,
            fileName:
              uploadedReceipt.fileName,
            bytes:
              uploadedReceipt.bytes,
            version:
              uploadedReceipt.version,
            resourceType:
              uploadedReceipt.resourceType,
          },
        },

        finalPaymentVerifiedAt:
          timestamp,

        fullyPaidAt:
          timestamp,

        paymentVerifiedAt:
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
          uploadedReceipt.publicId,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "RECEIPT CLOUDINARY CLEANUP ERROR:",
          cleanupError,
        );
      }

      uploadedReceipt =
        null;

      throw error;
    }

    const message =
`Halo ${booking?.client?.fullName || "Client"},

Pembayaran untuk booking ${booking.bookingCode || booking.id} sudah terverifikasi dan seluruh tagihan telah lunas.

Total pembayaran: Rp ${new Intl.NumberFormat("id-ID").format(bookingTotal)}
DP: Rp ${new Intl.NumberFormat("id-ID").format(depositPaid)}
Pelunasan: Rp ${new Intl.NumberFormat("id-ID").format(paymentAmount)}

Kuitansi pembayaran 100% terlampir pada email ini.

Terima kasih,
Rafi Picture`;

    const email =
      await sendBookingDocumentEmail({
        booking,
        sentBy:
          admin.uid,
        templateKey:
          "full_payment_receipt",
        subject:
          `Kuitansi Pembayaran ${receiptNumber}`,
        message,
        attachment: {
          fileName:
            uploadedReceipt
              .fileName,
          mimeType:
            "application/pdf",
          bytes:
            uploadedReceipt
              .bytes,
          publicId:
            uploadedReceipt
              .publicId,
          url:
            uploadedReceipt
              .secureUrl,
          content:
            receiptPdfBuffer,
        },
      });

    try {
      await receiptRef.update({
        email: {
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
              ? FieldValue
                  .serverTimestamp()
              : null,
          error:
            email.error ||
            null,
        },
        updatedAt:
          FieldValue
            .serverTimestamp(),
      });
    } catch (
      metadataError
    ) {
      console.error(
        "RECEIPT EMAIL METADATA ERROR:",
        metadataError,
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        email.sent
          ? "Pelunasan berhasil diverifikasi. Kuitansi 100% sudah dibuat dan dikirim ke client."
          : "Pelunasan berhasil diverifikasi dan kuitansi sudah dibuat, tetapi email belum terkirim.",
      data: {
        paymentId,
        bookingId,
        invoiceId,
        invoiceType:
          "final",

        paymentStatus:
          "verified",

        invoiceStatus:
          "paid",

        bookingStatus:
          "in_progress",

        financialStatus:
          "paid_full",

        receipt: {
          id:
            receiptId,
          receiptNumber,
          amount:
            bookingTotal,
          url:
            uploadedReceipt
              .secureUrl,
          fileName:
            uploadedReceipt
              .fileName,
        },

        email,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN PAYMENT REVIEW ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Payment review failed.",
      Number(
        error?.status,
      ) || 500,
    );
  }
}

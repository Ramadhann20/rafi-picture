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
  buildDepositInvoiceFileName,
  buildDepositInvoiceNumber,
} from "@/lib/pdf/invoiceIdentity";

import {
  generateDepositInvoicePdf,
} from "@/lib/pdf/depositInvoicePdf";

import {
  deletePdfAsset,
  uploadPdfBuffer,
} from "@/lib/cloudinary";

import {
  buildBookingEmailTemplate,
} from "@/lib/email/bookingEmailTemplates";

import {
  buildNotificationHtml,
} from "@/lib/email/notificationHtml";

import {
  sendEmail,
} from "@/lib/email/sendEmail";

import {
  getDefaultJakartaDueDate,
  getJakartaDateKey,
} from "@/lib/jakartaDate";

export const runtime =
  "nodejs";

const REQUIRED_CREW_COUNT =
  1;

function jsonError(
  message,
  status = 400,
  extra = {},
) {
  return Response.json(
    {
      ok: false,
      message,
      ...extra,
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

function createInvoiceItems(
  booking,
) {
  const {
    packageAmount,
    travelCharge,
  } = getBookingAmounts(
    booking,
  );

  const items = [
    {
      id:
        "package-service",
      label:
        booking?.package
          ?.name ||
        "Package Service",
      amount:
        packageAmount,
    },
  ];

  if (
    travelCharge > 0
  ) {
    items.push({
      id:
        "travel-charge",
      label:
        "Travel Charge",
      amount:
        travelCharge,
    });
  }

  return items;
}

function normalizeCrewAssignment({
  booking,
  value,
}) {
  const crewIds =
    Array.isArray(
      value?.crewIds,
    )
      ? Array.from(
          new Set(
            value.crewIds
              .map(
                (id) =>
                  String(
                    id || "",
                  ).trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        )
      : [];

  if (
    crewIds.length <
    REQUIRED_CREW_COUNT
  ) {
    throw new Error(
      `Minimal ${REQUIRED_CREW_COUNT} kru harus dipilih.`,
    );
  }

  return {
    bookingId:
      booking.id,
    bookingCode:
      booking.bookingCode ||
      null,
    packageName:
      booking?.package
        ?.name || null,

    type:
      String(
        value?.type ||
          "photo",
      ).slice(
        0,
        80,
      ),

    title:
      String(
        value?.title ||
          `${
            booking?.package
              ?.name ||
            "Booking"
          }: ${
            booking?.client
              ?.fullName ||
            "Client"
          }`,
      ).slice(
        0,
        180,
      ),

    eventDate:
      booking?.event
        ?.preferredDate ||
      null,

    startTime:
      booking?.event
        ?.startTime ||
      null,

    endTime:
      booking?.event
        ?.endTime ||
      null,

    endTimeDayOffset:
      Number(
        booking?.event
          ?.endTimeDayOffset,
      ) || 0,

    location:
      booking?.event
        ?.location ||
      null,

    crewIds,

    status:
      "published",
  };
}

async function createEmailLog({
  booking,
  adminUid,
  subject,
  recipient,
  attachment,
  status,
  gmailMessageId = null,
  gmailThreadId = null,
  errorMessage = null,
}) {
  const ref =
    adminDb
      .collection(
        "EmailNotifications",
      )
      .doc();

  const timestamp =
    FieldValue.serverTimestamp();

  await ref.set({
    bookingId:
      booking.id,
    bookingCode:
      booking.bookingCode ||
      null,

    recipient: {
      email:
        recipient,
      name:
        booking?.client
          ?.fullName ||
        null,
    },

    templateKey:
      "booking_approved",

    subject,

    attachments:
      attachment
        ? [
            {
              fileName:
                attachment.fileName,
              mimeType:
                "application/pdf",
              size:
                attachment.bytes ||
                null,
              publicId:
                attachment.publicId ||
                null,
              url:
                attachment.url ||
                null,
            },
          ]
        : [],

    status,

    gmailMessageId,
    gmailThreadId,

    errorMessage,

    sentBy:
      adminUid,

    createdAt:
      timestamp,

    ...(status === "sent"
      ? {
          sentAt:
            timestamp,
        }
      : {
          failedAt:
            timestamp,
        }),
  });

  return ref.id;
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

    const bookingRef =
      adminDb
        .collection(
          "Bookings",
        )
        .doc(bookingId);

    const bookingSnapshot =
      await bookingRef.get();

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
        "Booking sudah tidak berada pada status pending.",
        409,
      );
    }

    const preparation =
      body?.preparation ||
      {};

    if (
      preparation
        .reviewCompleted !==
        true ||
      preparation
        .crewCompleted !==
        true ||
      preparation
        .billingCompleted !==
        true ||
      body?.pdfReviewed !==
        true
    ) {
      return jsonError(
        "Review, crew, billing, dan review PDF harus selesai sebelum finalisasi.",
      );
    }

    const assignment =
      normalizeCrewAssignment({
        booking,
        value:
          body
            ?.crewAssignment,
      });

    const {
      packageAmount,
      travelCharge,
      bookingTotal,
    } = getBookingAmounts(
      booking,
    );

    const requestedAmount =
      Number(
        body?.depositInvoice
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

    const invoiceId =
      `${bookingId}_deposit_v1`;

    const assignmentId =
      String(
        body
          ?.crewAssignment
          ?.id ||
          `${bookingId}_crew_assignment`,
      )
        .trim()
        .replace(
          /[\/]+/g,
          "_",
        )
        .slice(
          0,
          240,
        );

    const dueAt =
      normalizeDueDate(
        body?.depositInvoice
          ?.dueAt,
      );

    const note =
      String(
        body?.depositInvoice
          ?.note ||
          "30% booking deposit",
      )
        .trim()
        .slice(
          0,
          1000,
        );

    const invoiceDate =
      getJakartaDateKey();

    const invoice = {
      id:
        invoiceId,
      bookingId,
      clientId:
        booking?.client
          ?.uid ||
        null,

      type:
        "deposit",

      revision: 1,
      invoiceNumber,
      rootInvoiceId:
        invoiceId,
      rootInvoiceNumber:
        invoiceNumber,

      /*
       * packageTotal tetap alias bookingTotal agar client payment
       * page lama tidak rusak.
       */
      packageTotal:
        bookingTotal,
      packageAmount,
      travelCharge,
      bookingTotal,

      items:
        createInvoiceItems(
          booking,
        ),

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
      invoiceDate,
      note,

      status:
        "issued",
    };

    /*
     * Generate ulang dari source-of-truth server.
     * Jadi file final tidak mempercayai Blob preview dari browser.
     */
    const pdfBuffer =
      await generateDepositInvoicePdf({
        booking,
        invoice,
        invoiceNumber,
        invoiceDate,
        totalPaid: 0,
      });

    /*
     * Upload terlebih dahulu.
     * Jika upload gagal, tidak ada write Firestore yang dilakukan.
     */
    uploadedPdf =
      await uploadPdfBuffer({
        buffer:
          pdfBuffer,

        publicId:
          invoiceNumber,

        fileName,

        tags: [
          "deposit",
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
            "deposit",
        },
      });

    const assignmentRef =
      adminDb
        .collection(
          "CrewAssignments",
        )
        .doc(
          assignmentId,
        );

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

    /*
     * Seluruh database write dilakukan satu batch:
     * assignment + invoice + booking approved.
     */
    const batch =
      adminDb.batch();

    batch.set(
      assignmentRef,
      {
        ...assignment,

        publishedAt:
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
        status:
          "approved",

        preparation: {
          reviewCompleted:
            true,
          crewCompleted:
            true,
          billingCompleted:
            true,
          pdfReviewed:
            true,
          completedAt:
            timestamp,
        },

        approvedAt:
          timestamp,

        updatedAt:
          timestamp,
      },
    );

    try {
      await batch.commit();
    } catch (error) {
      /*
       * Firestore gagal setelah Cloudinary sukses.
       * Hapus asset supaya tidak meninggalkan invoice orphan.
       */
      try {
        await deletePdfAsset(
          uploadedPdf.publicId,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "CLOUDINARY CLEANUP ERROR:",
          cleanupError,
        );
      }

      uploadedPdf = null;

      throw error;
    }

    /*
     * Email dijalankan SETELAH database commit.
     * Kegagalan email tidak membatalkan approval yang sudah valid.
     */
    const recipient =
      String(
        booking?.client
          ?.email || "",
      )
        .trim()
        .toLowerCase();

    let emailResult = {
      sent: false,
      logId: null,
      error: null,
    };

    if (recipient) {
      const template =
        buildBookingEmailTemplate(
          "booking_approved",
          booking,
        );

      const finalMessage =
        `${template.message}\n\nInvoice DP ${invoiceNumber} terlampir pada email ini.`;

      try {
        const gmail =
          await sendEmail({
            to:
              recipient,

            subject:
              template.subject,

            text:
              finalMessage,

            html:
              buildNotificationHtml({
                message:
                  finalMessage,
                bookingCode:
                  booking.bookingCode ||
                  booking.id,
              }),

            attachment: {
              filename:
                uploadedPdf.fileName,
              contentType:
                "application/pdf",
              content:
                pdfBuffer,
            },
          });

        emailResult = {
          sent: true,
          logId: null,
          gmailMessageId:
            gmail.id,
          gmailThreadId:
            gmail.threadId,
          error: null,
        };

        /*
         * Logging tidak boleh mengubah fakta bahwa Gmail sudah sukses.
         * Jika log/update metadata gagal, email tetap dianggap sent.
         */
        try {
          const logId =
            await createEmailLog({
              booking,
              adminUid:
                admin.uid,
              subject:
                template.subject,
              recipient,
              attachment: {
                ...uploadedPdf,
                url:
                  uploadedPdf.secureUrl,
              },
              status:
                "sent",
              gmailMessageId:
                gmail.id,
              gmailThreadId:
                gmail.threadId,
            });

          emailResult.logId =
            logId;

          await bookingRef.update({
            approvalEmail: {
              status:
                "sent",
              recipient,
              notificationId:
                logId,
              sentAt:
                FieldValue.serverTimestamp(),
            },
          });
        } catch (
          logError
        ) {
          console.error(
            "EMAIL SUCCESS LOG ERROR:",
            logError,
          );
        }
      } catch (error) {
        console.error(
          "APPROVAL EMAIL ERROR:",
          error,
        );

        const errorMessage =
          error?.message ||
          "Email gagal dikirim.";

        emailResult = {
          sent: false,
          logId: null,
          error:
            errorMessage,
        };

        try {
          const logId =
            await createEmailLog({
              booking,
              adminUid:
                admin.uid,
              subject:
                template.subject,
              recipient,
              attachment: {
                ...uploadedPdf,
                url:
                  uploadedPdf.secureUrl,
              },
              status:
                "failed",
              errorMessage,
            });

          emailResult.logId =
            logId;

          await bookingRef.update({
            approvalEmail: {
              status:
                "failed",
              recipient,
              notificationId:
                logId,
              error:
                errorMessage,
              failedAt:
                FieldValue.serverTimestamp(),
            },
          });
        } catch (
          logError
        ) {
          console.error(
            "EMAIL FAILURE LOG ERROR:",
            logError,
          );
        }
      }
    }


    return Response.json({
      ok: true,

      message:
        emailResult.sent
          ? "Booking berhasil di-approve, invoice tersimpan, dan email terkirim."
          : "Booking berhasil di-approve dan invoice tersimpan, tetapi email belum terkirim.",

      data: {
        bookingId,
        assignmentId,
        invoiceId,
        invoiceNumber,

        pdf: {
          publicId:
            uploadedPdf.publicId,
          url:
            uploadedPdf.secureUrl,
          fileName:
            uploadedPdf.fileName,
          bytes:
            uploadedPdf.bytes,
          version:
            uploadedPdf.version,
        },

        email:
          emailResult,
      },
    });
  } catch (error) {
    console.error(
      "FINALIZE BOOKING ERROR:",
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
        "Booking gagal difinalisasi.",
      500,
    );
  }
}

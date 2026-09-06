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

function getRequiredCrewCount(booking, assignment) {
  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];
  const packageItem = packageItems.find(
    (item) => item?.id === assignment?.packageId,
  ) ?? booking?.package ?? {};
  const serviceId = String(assignment?.serviceId ?? "").toLowerCase();
  const serviceName = String(assignment?.serviceName ?? "").toLowerCase();
  const packageName = String(
    packageItem?.name ?? packageItem?.packageName ?? packageItem?.title ?? "",
  ).toLowerCase();
  const normalizedPackageName = packageName
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const normalizedPackageId = String(packageItem?.id ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const isBundle = packageItem?.packageCategoryId === "bundle"
    || (normalizedPackageName.includes("prewedding") &&
      normalizedPackageName.includes("wedding") &&
      normalizedPackageName.includes("bundle"));

  if (isBundle && (serviceId.includes("pre-wedding") || serviceName.includes("pre-wedding"))) {
    return 2;
  }

  if (isBundle && (serviceId === "wedding" || serviceName === "wedding")) {
    return 3;
  }

  const packageEvent = Array.isArray(booking?.events)
    ? booking.events.find(
        (eventItem) =>
          eventItem.packageId === assignment?.packageId &&
          (!assignment?.serviceId || eventItem.sessionId === assignment.serviceId),
      )
    : booking?.event;
  const defaultCounts = {
    "classic a wedding package": 2,
    "classic b wedding package": 2,
    "bronze wedding package": 3,
    "silver wedding package": 4,
    "gold wedding package": 4,
    "platinum wedding package": 4,
    "prewedding bronze": 1,
    "prewedding silver": 2,
    "engagement bronze": 1,
    "engagement silver": 2,
    "bronze pengajian siraman": 1,
    "silver pengajian siraman": 2,
  };
  const defaultCount =
    defaultCounts[normalizedPackageName] ??
    defaultCounts[normalizedPackageId];
  const eventCount = Number(
    packageEvent?.requiredCrewCount ?? packageEvent?.crewCount,
  );
  if (Number.isInteger(eventCount) && eventCount > 0) {
    if (eventCount === 1 && defaultCount > 1) {
      return defaultCount;
    }

    return eventCount;
  }

  const packageCount = Number(
    packageItem?.requiredCrewCount ?? packageItem?.crewCount,
  );
  if (Number.isInteger(packageCount) && packageCount > 0) {
    return packageCount;
  }

  return defaultCount ?? 1;
}

function getExpectedAssignmentKeys(booking) {
  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];
  const events = Array.isArray(booking?.events) && booking.events.length
    ? booking.events
    : booking?.event
      ? [booking.event]
      : [];

  return packageItems.map((packageItem) => {
    const packageEvents = events.filter(
      (eventItem) => eventItem.packageId === packageItem.id,
    );
    const serviceEvents = packageEvents.length ? packageEvents : [{}];

    return serviceEvents.map(
      (eventItem, index) =>
        `${packageItem.id}:${eventItem.sessionId ?? `service-${index + 1}`}`,
    );
  }).flat();
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
  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];

  const packageAmount = packageItems.reduce(
    (total, packageItem) => total + Math.max(Number(packageItem?.price) || 0, 0),
    0,
  );

  const eventItems = Array.isArray(booking?.events) && booking.events.length
    ? booking.events
    : booking?.event
      ? [booking.event]
      : [];

  const travelCharge = eventItems.reduce(
    (total, eventItem) =>
      total + Math.max(Number(eventItem?.location?.distanceCharge?.amount) || 0, 0),
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

  const packageItems = Array.isArray(booking?.packages) && booking.packages.length
    ? booking.packages
    : booking?.package
      ? [booking.package]
      : [];
  const eventItems = Array.isArray(booking?.events) && booking.events.length
    ? booking.events
    : booking?.event
      ? [booking.event]
      : [];

  const items = packageItems.map((packageItem, index) => ({
    id: `package-service-${packageItem.id ?? index}`,
    label: packageItem.name || "Package Service",
    amount: Math.max(Number(packageItem.price) || 0, 0),
  }));

  const travelItems = eventItems.reduce((result, eventItem, index) => {
    const amount = Math.max(Number(eventItem?.location?.distanceCharge?.amount) || 0, 0);
    if (amount > 0) {
      result.push({
        id: `travel-charge-${index}`,
        label: `Travel Charge ${index + 1}`,
        amount,
      });
    }
    return result;
  }, []);

  items.push(...travelItems);

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

  const requiredCrewCount = getRequiredCrewCount(booking, value);

  if (crewIds.length !== requiredCrewCount) {
    throw new Error(
      `Tepat ${requiredCrewCount} kru harus dipilih untuk assignment ini.`,
    );
  }

  const packageEvent = Array.isArray(booking?.events)
    ? booking.events.find(
        (eventItem) =>
          eventItem.packageId === value?.packageId &&
          (!value?.serviceId || eventItem.sessionId === value.serviceId),
      )
    : booking?.event;

  return {
    bookingId:
      booking.id,
    packageId:
      value?.packageId ??
      booking?.package?.id ??
      null,
    serviceId:
      value?.serviceId ??
      null,
    serviceName:
      value?.serviceName ??
      null,
    requiredCrewCount,
    bookingCode:
      booking.bookingCode ||
      null,
    packageName:
      (packageEvent?.packageName ??
        booking?.package?.name) || null,

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
      packageEvent?.preferredDate ??
      booking?.event?.preferredDate ??
      null,

    startTime:
      packageEvent?.startTime ??
      booking?.event?.startTime ??
      null,

    endTime:
      packageEvent?.endTime ??
      booking?.event?.endTime ??
      null,

    endTimeDayOffset:
      Number(
        packageEvent?.endTimeDayOffset ??
        booking?.event
          ?.endTimeDayOffset,
      ) || 0,

    location:
      packageEvent?.location ??
      booking?.event?.location ??
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

    const requestedAssignments = Array.isArray(body?.crewAssignments) && body.crewAssignments.length
      ? body.crewAssignments
      : [body?.crewAssignment];

    const assignments = requestedAssignments.map((value) =>
      normalizeCrewAssignment({ booking, value }),
    );

    const assignmentKeys = assignments.map(
      (item) => `${item.packageId}:${item.serviceId ?? "service-1"}`,
    );
    const expectedAssignmentKeys = getExpectedAssignmentKeys(booking);

    if (
      new Set(assignmentKeys).size !== assignmentKeys.length ||
      expectedAssignmentKeys.some((key) => !assignmentKeys.includes(key))
    ) {
      return jsonError("Setiap paket dan bagian layanan harus memiliki assignment kru sendiri.");
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

    const assignmentEntries = assignments.map((item, index) => ({
      assignment: item,
      id: String(
        requestedAssignments[index]?.id ||
          `${bookingId}_${item.packageId || `package_${index + 1}`}_crew_assignment`,
      )
        .trim()
        .replace(/[\/]+/g, "_")
        .slice(0, 240),
    }));

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

      packageId:
        booking?.package?.id ||
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

    assignmentEntries.forEach(({ assignment: assignmentItem, id }) => {
      const assignmentRef = adminDb
        .collection("CrewAssignments")
        .doc(id);

      batch.set(
        assignmentRef,
        {
          ...assignmentItem,
          publishedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        { merge: true },
      );
    });

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
        assignmentId: assignmentEntries[0]?.id ?? null,
        assignmentIds: assignmentEntries.map((entry) => entry.id),
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

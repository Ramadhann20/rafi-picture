import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import {
  AdminRequestError,
  requireAdminRequest,
} from "@/lib/require-admin";

import {
  buildPaymentTimer,
  getInvoicePenaltyAmount,
  getInvoicePrincipalAmount,
  LATE_PAYMENT_CONFIG,
} from "@/lib/bookingCountdown";

import {
  buildDepositInvoiceFileName,
  buildMainInvoiceFileName,
} from "@/lib/pdf/invoiceIdentity";
import { generateDepositInvoicePdf } from "@/lib/pdf/depositInvoicePdf";
import { generateMainInvoicePdf } from "@/lib/pdf/mainInvoicePdf";
import { deletePdfAsset, uploadPdfBuffer } from "@/lib/cloudinary";
import { sendBookingDocumentEmail } from "@/lib/email/systemEmail";

export const runtime = "nodejs";

function jsonError(message, status = 400) {
  return Response.json(
    { ok: false, message },
    { status },
  );
}

function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase();
}

function stripRevisionSuffix(invoiceNumber) {
  return String(invoiceNumber || "")
    .replace(/-R\d+$/i, "")
    .trim();
}

function getTimestamp(value) {
  if (!value) return 0;

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : typeof value === "object" && Number.isFinite(Number(value?._seconds))
          ? new Date(Number(value._seconds) * 1000)
          : new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getLatestPaidDeposit(invoices) {
  return (
    [...invoices]
      .filter(
        (invoice) =>
          invoice?.type === "deposit" &&
          normalizeStatus(invoice?.status) === "paid",
      )
      .sort((first, second) => {
        const revisionDiff =
          (Number(second?.revision) || 1) -
          (Number(first?.revision) || 1);

        if (revisionDiff !== 0) return revisionDiff;

        return (
          getTimestamp(second?.paidAt ?? second?.updatedAt) -
          getTimestamp(first?.paidAt ?? first?.updatedAt)
        );
      })[0] ?? null
  );
}

function buildRevisionIdentity(invoice) {
  const currentRevision = Math.max(Number(invoice?.revision) || 1, 1);
  const nextRevision = currentRevision + 1;

  const rootInvoiceId =
    String(invoice?.rootInvoiceId || invoice?.id || "").trim();

  const rootInvoiceNumber =
    String(
      invoice?.rootInvoiceNumber ||
        stripRevisionSuffix(invoice?.invoiceNumber),
    ).trim();

  if (!rootInvoiceId || !rootInvoiceNumber) {
    throw new Error("Identitas invoice utama tidak tersedia.");
  }

  return {
    currentRevision,
    nextRevision,
    rootInvoiceId,
    rootInvoiceNumber,
    invoiceId: `${rootInvoiceId}_r${nextRevision}`,
    invoiceNumber: `${rootInvoiceNumber}-R${nextRevision}`,
  };
}

function buildItems(invoice, penaltyAmount) {
  const baseItems = Array.isArray(invoice?.items)
    ? invoice.items.filter((item) => item?.id !== "late-payment-fee")
    : [];

  return [
    ...baseItems,
    ...(penaltyAmount > 0
      ? [
          {
            id: "late-payment-fee",
            label: "Late Payment Fee",
            amount: penaltyAmount,
          },
        ]
      : []),
  ];
}

export async function POST(request) {
  let uploadedPdf = null;

  try {
    const admin = await requireAdminRequest(request);
    const body = await request.json();

    const bookingId = String(body?.bookingId || "").trim();
    const invoiceId = String(body?.invoiceId || "").trim();

    if (!bookingId || !invoiceId) {
      return jsonError("Booking ID dan Invoice ID wajib tersedia.");
    }

    const bookingRef = adminDb.collection("Bookings").doc(bookingId);
    const invoiceRef = adminDb.collection("Invoices").doc(invoiceId);

    const [bookingSnapshot, invoiceSnapshot, paymentsSnapshot, invoicesSnapshot] =
      await Promise.all([
        bookingRef.get(),
        invoiceRef.get(),
        adminDb
          .collection("Payments")
          .where("bookingId", "==", bookingId)
          .get(),
        adminDb
          .collection("Invoices")
          .where("bookingId", "==", bookingId)
          .get(),
      ]);

    if (!bookingSnapshot.exists) {
      return jsonError("Booking tidak ditemukan.", 404);
    }

    if (!invoiceSnapshot.exists) {
      return jsonError("Invoice tidak ditemukan.", 404);
    }

    const booking = {
      id: bookingSnapshot.id,
      ...bookingSnapshot.data(),
    };

    const invoice = {
      id: invoiceSnapshot.id,
      ...invoiceSnapshot.data(),
    };

    if (invoice?.bookingId !== bookingId) {
      return jsonError("Invoice tidak terkait dengan booking ini.", 409);
    }

    const invoiceStatus = normalizeStatus(invoice?.status);

    if (!["issued", "overdue"].includes(invoiceStatus)) {
      return jsonError(
        "Denda hanya dapat diterapkan pada invoice aktif yang belum dibayar.",
        409,
      );
    }

    if (!["deposit", "final"].includes(invoice?.type)) {
      return jsonError("Tipe invoice tidak mendukung denda.", 409);
    }

    const payments = paymentsSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const timer = buildPaymentTimer({
      invoice,
      payments,
      nowMs: Date.now(),
    });

    if (!timer) {
      return jsonError("Countdown invoice tidak tersedia.", 409);
    }

    if (!timer.overdue) {
      return jsonError("Invoice belum melewati tenggat pembayaran.", 409);
    }

    if (timer.frozen) {
      return jsonError(
        "Bukti pembayaran sedang menunggu verifikasi. Timer dan denda masih dibekukan.",
        409,
      );
    }

    if (timer.penaltyDays <= 0 || timer.suggestedPenaltyAmount <= 0) {
      return jsonError(
        "Keterlambatan belum mencapai satu hari penuh sehingga denda masih Rp0.",
        409,
      );
    }

    const currentPenaltyAmount = getInvoicePenaltyAmount(invoice);
    const targetPenaltyAmount = timer.suggestedPenaltyAmount;
    const incrementAmount = Math.max(
      0,
      targetPenaltyAmount - currentPenaltyAmount,
    );

    if (incrementAmount <= 0) {
      return jsonError("Nominal denda invoice sudah sesuai dengan keterlambatan saat ini.", 409);
    }

    const principalAmount = getInvoicePrincipalAmount(invoice);

    if (principalAmount <= 0) {
      return jsonError("Nominal pokok invoice tidak valid.", 409);
    }

    const identity = buildRevisionIdentity(invoice);
    const nextInvoiceRef = adminDb.collection("Invoices").doc(identity.invoiceId);
    const nextExisting = await nextInvoiceRef.get();

    if (nextExisting.exists) {
      return jsonError("Invoice revision berikutnya sudah tersedia. Refresh data lalu coba lagi.", 409);
    }

    const invoices = invoicesSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const depositInvoice =
      invoice.type === "final" ? getLatestPaidDeposit(invoices) : null;

    if (invoice.type === "final" && !depositInvoice) {
      return jsonError("Invoice DP paid tidak ditemukan.", 409);
    }

    const amount = principalAmount + targetPenaltyAmount;

    const penalty = {
      status: "applied",
      ratePerDay: LATE_PAYMENT_CONFIG.AMOUNT_PER_DAY,
      dayRounding: LATE_PAYMENT_CONFIG.DAY_ROUNDING,
      overdueDays: timer.penaltyDays,
      overdueMs: timer.overdueMs,
      suggestedAmount: targetPenaltyAmount,
      appliedAmount: targetPenaltyAmount,
      previousAppliedAmount: currentPenaltyAmount,
      incrementAmount,
      carriedReviewPauseMs: timer.totalReviewPauseMs,
      baseDueAt: invoice?.penalty?.baseDueAt ?? invoice?.dueAt ?? null,
      appliedBy: admin.uid,
    };

    const revisedInvoice = {
      ...invoice,

      id: identity.invoiceId,
      revision: identity.nextRevision,
      rootInvoiceId: identity.rootInvoiceId,
      rootInvoiceNumber: identity.rootInvoiceNumber,
      previousInvoiceId: invoice.id,
      invoiceNumber: identity.invoiceNumber,

      principalAmount,
      penaltyAmount: targetPenaltyAmount,
      penalty,

      items: buildItems(invoice, targetPenaltyAmount),

      amount,
      totalPaid: 0,
      amountDue: amount,
      status: "issued",

      pdfUrl: null,
      pdf: null,
      paidAt: null,
      supersededAt: null,
      supersededByInvoiceId: null,
    };

    const fileName =
      invoice.type === "deposit"
        ? buildDepositInvoiceFileName(identity.invoiceNumber)
        : buildMainInvoiceFileName(identity.invoiceNumber);

    const pdfBuffer =
      invoice.type === "deposit"
        ? await generateDepositInvoicePdf({
            booking,
            invoice: revisedInvoice,
            invoiceNumber: identity.invoiceNumber,
            invoiceDate: new Date(),
            totalPaid: 0,
          })
        : await generateMainInvoicePdf({
            booking,
            invoice: revisedInvoice,
            invoiceNumber: identity.invoiceNumber,
            invoiceDate: new Date(),
            depositInvoice,
          });

    uploadedPdf = await uploadPdfBuffer({
      buffer: pdfBuffer,
      fileName,
      publicId: identity.invoiceNumber,
      folder: "rafi-picture/invoices",
      overwrite: true,
      tags: [
        invoice.type === "deposit" ? "deposit-invoice" : "final-invoice",
        "penalty-revision",
        `revision-${identity.nextRevision}`,
        bookingId,
      ],
      context: {
        booking_id: bookingId,
        booking_code: booking?.bookingCode || "",
        invoice_number: identity.invoiceNumber,
        invoice_type: invoice.type,
        penalty_amount: String(targetPenaltyAmount),
        penalty_days: String(timer.penaltyDays),
      },
    });

    const timestamp = FieldValue.serverTimestamp();
    const batch = adminDb.batch();

    batch.set(
      nextInvoiceRef,
      {
        ...revisedInvoice,
        penalty: {
          ...penalty,
          appliedAt: timestamp,
        },
        pdfUrl: uploadedPdf.secureUrl,
        pdf: {
          publicId: uploadedPdf.publicId,
          assetId: uploadedPdf.assetId,
          url: uploadedPdf.secureUrl,
          fileName: uploadedPdf.fileName,
          bytes: uploadedPdf.bytes,
          version: uploadedPdf.version,
          resourceType: uploadedPdf.resourceType,
        },
        issuedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );

    batch.update(invoiceRef, {
      status: "superseded",
      supersededAt: timestamp,
      supersededByInvoiceId: identity.invoiceId,
      updatedAt: timestamp,
    });

    batch.update(bookingRef, {
      ...(invoice.type === "deposit"
        ? { depositInvoiceId: identity.invoiceId }
        : { finalInvoiceId: identity.invoiceId }),
      latestPenaltyInvoiceId: identity.invoiceId,
      latestPenaltyAppliedAt: timestamp,
      updatedAt: timestamp,
    });

    try {
      await batch.commit();
    } catch (error) {
      try {
        await deletePdfAsset(uploadedPdf.publicId);
      } catch (cleanupError) {
        console.error("PENALTY PDF CLEANUP ERROR:", cleanupError);
      }

      uploadedPdf = null;
      throw error;
    }

    const paymentLabel = invoice.type === "final" ? "pelunasan" : "DP";

    const message = `Halo ${booking?.client?.fullName || "Client"},\n\nInvoice ${paymentLabel} untuk booking ${booking?.bookingCode || booking.id} telah direvisi karena keterlambatan pembayaran.\n\nInvoice: ${identity.invoiceNumber}\nPokok tagihan: Rp ${new Intl.NumberFormat("id-ID").format(principalAmount)}\nDenda keterlambatan: Rp ${new Intl.NumberFormat("id-ID").format(targetPenaltyAmount)}\nTotal yang harus dibayar: Rp ${new Intl.NumberFormat("id-ID").format(amount)}\nTenggat awal: ${invoice?.dueAt || "-"}\n\nSilakan gunakan invoice revisi terbaru yang terlampir untuk melakukan pembayaran.\n\nTerima kasih,\nRafi Picture`;

    const email = await sendBookingDocumentEmail({
      booking,
      sentBy: admin.uid,
      templateKey: "penalty_invoice_revision",
      subject: `Invoice Revisi ${identity.invoiceNumber}`,
      message,
      attachment: {
        fileName: uploadedPdf.fileName,
        mimeType: "application/pdf",
        bytes: uploadedPdf.bytes,
        publicId: uploadedPdf.publicId,
        url: uploadedPdf.secureUrl,
        content: pdfBuffer,
      },
    });

    try {
      await nextInvoiceRef.update({
        penaltyEmail: {
          status: email.sent ? "sent" : "failed",
          recipient: email.recipient || null,
          logId: email.logId || null,
          sentAt: email.sent ? FieldValue.serverTimestamp() : null,
          error: email.error || null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (metadataError) {
      console.error("PENALTY EMAIL METADATA ERROR:", metadataError);
    }

    return Response.json({
      ok: true,
      message: email.sent
        ? "Denda diterapkan dan invoice revisi dikirim ke client."
        : "Denda diterapkan dan invoice revisi dibuat, tetapi email belum terkirim.",
      data: {
        invoiceId: identity.invoiceId,
        invoiceNumber: identity.invoiceNumber,
        revision: identity.nextRevision,
        principalAmount,
        penaltyDays: timer.penaltyDays,
        penaltyAmount: targetPenaltyAmount,
        incrementAmount,
        amount,
        email,
      },
    });
  } catch (error) {
    console.error("APPLY INVOICE PENALTY ERROR:", error);

    return jsonError(
      error?.message || "Denda invoice gagal diterapkan.",
      error instanceof AdminRequestError
        ? error.status
        : Number(error?.status) || 500,
    );
  }
}

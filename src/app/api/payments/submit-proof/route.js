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
  deleteImageAsset,
  uploadImageBuffer,
} from "@/lib/cloudinary";

import {
  notifyAdmins,
} from "@/lib/adminNotifications";

export const runtime =
  "nodejs";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES =
  new Set([
    "image/png",
    "image/jpeg",
  ]);

const ACTIVE_PAYMENT_STATUSES =
  new Set([
    "pending",
    "pending_verification",
    "verified",
    "paid",
  ]);

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
  const value =
    request.headers.get(
      "authorization",
    ) || "";

  if (
    !value.startsWith(
      "Bearer ",
    )
  ) {
    return "";
  }

  return value
    .slice(7)
    .trim();
}

function normalizeBookingStatus(
  status,
) {
  const value =
    String(
      status || "",
    ).toLowerCase();

  if (
    value ===
    "awaiting_payment"
  ) {
    return "approved";
  }

  return value;
}

function normalizePaymentStatus(
  status,
) {
  return String(
    status ||
      "pending_verification",
  ).toLowerCase();
}

function sanitizeSegment(
  value,
  fallback,
) {
  const normalized =
    String(value || "")
      .trim()
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "");

  return (
    normalized ||
    fallback
  );
}

function createPaymentReference() {
  const year =
    new Date()
      .getFullYear();

  const suffix =
    `${Date.now()}${Math.random()
      .toString()
      .slice(2, 6)}`
      .slice(-10);

  return `PAY-${year}-${suffix}`;
}

function getFileSignature(
  buffer,
) {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  return null;
}

function formatCurrency(
  value,
  currency = "IDR",
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",
      currency,
      maximumFractionDigits:
        0,
    },
  ).format(
    Number(value) ||
      0,
  );
}

export async function POST(
  request,
) {
  let uploadedProof =
    null;

  try {
    const idToken =
      getBearerToken(
        request,
      );

    if (!idToken) {
      return jsonError(
        "Sesi pengguna tidak tersedia.",
        401,
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
      return jsonError(
        "Sesi pengguna tidak valid atau sudah berakhir.",
        401,
      );
    }

    const formData =
      await request.formData();

    const bookingId =
      String(
        formData.get(
          "bookingId",
        ) || "",
      ).trim();

    const invoiceId =
      String(
        formData.get(
          "invoiceId",
        ) || "",
      ).trim();

    const proof =
      formData.get(
        "proof",
      );

    if (
      !bookingId ||
      !invoiceId
    ) {
      return jsonError(
        "Booking atau invoice tidak tersedia.",
      );
    }

    if (
      !proof ||
      typeof proof.arrayBuffer !==
        "function" ||
      Number(
        proof.size,
      ) <= 0
    ) {
      return jsonError(
        "Foto bukti pembayaran belum dipilih.",
      );
    }

    if (
      !ALLOWED_TYPES.has(
        proof.type,
      )
    ) {
      return jsonError(
        "Bukti pembayaran harus berupa PNG, JPG, atau JPEG.",
      );
    }

    if (
      Number(
        proof.size,
      ) >
      MAX_FILE_SIZE
    ) {
      return jsonError(
        "Ukuran bukti pembayaran maksimal 5 MB.",
      );
    }

    const [
      bookingSnapshot,
      invoiceSnapshot,
    ] = await Promise.all([
      adminDb
        .collection(
          "Bookings",
        )
        .doc(
          bookingId,
        )
        .get(),

      adminDb
        .collection(
          "Invoices",
        )
        .doc(
          invoiceId,
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

    if (
      !invoiceSnapshot.exists
    ) {
      return jsonError(
        "Invoice pembayaran tidak ditemukan.",
        404,
      );
    }

    const booking =
      bookingSnapshot.data();

    const invoice =
      invoiceSnapshot.data();

    if (
      booking?.client?.uid !==
      decodedToken.uid
    ) {
      return jsonError(
        "Booking ini bukan milik akun yang sedang login.",
        403,
      );
    }

    const bookingStatus =
      normalizeBookingStatus(
        booking?.status,
      );

    const invoiceType =
      String(
        invoice?.type || "",
      ).toLowerCase();

    const allowedBookingStatus =
      invoiceType === "deposit"
        ? bookingStatus ===
          "approved"
        : invoiceType === "final"
          ? bookingStatus ===
            "in_progress"
          : false;

    if (
      !allowedBookingStatus
    ) {
      return jsonError(
        invoiceType === "final"
          ? "Bukti pelunasan hanya dapat dikirim setelah invoice pelunasan diterbitkan."
          : "Bukti DP hanya dapat dikirim saat booking menunggu pembayaran DP.",
        409,
      );
    }

    if (
      invoice?.bookingId !==
        bookingId ||
      ![
        "deposit",
        "final",
      ].includes(
        invoiceType,
      ) ||
      invoice?.status ===
        "void"
    ) {
      return jsonError(
        "Invoice pembayaran tidak sesuai dengan booking.",
        409,
      );
    }

    if (
      ![
        "issued",
        "overdue",
      ].includes(
        String(
          invoice?.status ||
            "",
        ).toLowerCase(),
      )
    ) {
      return jsonError(
        "Invoice ini sudah tidak menerima pembayaran baru.",
        409,
      );
    }

    const existingPayments =
      await adminDb
        .collection(
          "Payments",
        )
        .where(
          "invoiceId",
          "==",
          invoiceId,
        )
        .get();

    const hasActivePayment =
      existingPayments.docs
        .map(
          (document) =>
            document.data(),
        )
        .some(
          (payment) =>
            payment?.bookingId ===
              bookingId &&
            ACTIVE_PAYMENT_STATUSES.has(
              normalizePaymentStatus(
                payment?.status,
              ),
            ),
        );

    if (
      hasActivePayment
    ) {
      return jsonError(
        "Bukti pembayaran untuk invoice ini sudah pernah dikirim.",
        409,
      );
    }

    const proofBuffer =
      Buffer.from(
        await proof.arrayBuffer(),
      );

    const detectedType =
      getFileSignature(
        proofBuffer,
      );

    if (
      !detectedType ||
      detectedType !==
        proof.type
    ) {
      return jsonError(
        "Isi file tidak sesuai dengan format gambar yang dipilih.",
      );
    }

    const referenceNumber =
      createPaymentReference();

    const bookingReference =
      booking?.bookingCode ||
      bookingId;

    const publicId =
      [
        sanitizeSegment(
          bookingReference,
          "booking",
        ),
        sanitizeSegment(
          referenceNumber,
          "payment",
        ),
      ].join("-");

    uploadedProof =
      await uploadImageBuffer({
        buffer:
          proofBuffer,
        fileName:
          proof.name,
        contentType:
          detectedType,
        publicId,
        folder:
          `rafi-picture/payment-proofs/${sanitizeSegment(
            bookingReference,
            "booking",
          )}`,
        overwrite:
          false,
        tags: [
          "bank-transfer",
          invoiceType,
          bookingId,
          invoiceId,
        ],
        context: {
          booking_id:
            bookingId,
          booking_code:
            booking?.bookingCode ||
            "",
          invoice_id:
            invoiceId,
          invoice_number:
            invoice?.invoiceNumber ||
            "",
          invoice_type:
            invoiceType,
          client_uid:
            decodedToken.uid,
          payment_reference:
            referenceNumber,
        },
      });

    const paymentRef =
      adminDb
        .collection(
          "Payments",
        )
        .doc();

    const serverTimestamp =
      FieldValue.serverTimestamp();

    const amount =
      Number(
        invoice?.amount,
      ) || 0;

    const currency =
      invoice?.currency ??
      booking?.package?.currency ??
      "IDR";

    const paymentPayload = {
      bookingId,
      invoiceId,
      invoiceType,
      paymentStage:
        invoiceType ===
          "final"
          ? "settlement"
          : "deposit",
      clientId:
        decodedToken.uid,

      amount,
      currency,

      method:
        "bank_transfer",

      referenceNumber,

      proofStorageType:
        "cloudinary",

      proofUrl:
        uploadedProof.secureUrl,

      proofPublicId:
        uploadedProof.publicId,

      proofAssetId:
        uploadedProof.assetId,

      proofFileName:
        uploadedProof.fileName,

      proofMimeType:
        uploadedProof.contentType,

      proofFileSize:
        uploadedProof.bytes,

      proof: {
        provider:
          "cloudinary",
        resourceType:
          "image",
        publicId:
          uploadedProof.publicId,
        assetId:
          uploadedProof.assetId,
        url:
          uploadedProof.secureUrl,
        fileName:
          uploadedProof.fileName,
        mimeType:
          uploadedProof.contentType,
        bytes:
          uploadedProof.bytes,
        width:
          uploadedProof.width,
        height:
          uploadedProof.height,
        version:
          uploadedProof.version,
      },

      status:
        "pending_verification",

      submittedAt:
        serverTimestamp,

      createdAt:
        serverTimestamp,

      updatedAt:
        serverTimestamp,
    };

    const batch =
      adminDb.batch();

    batch.set(
      paymentRef,
      paymentPayload,
    );

    batch.update(
      bookingSnapshot.ref,
      invoiceType ===
        "final"
        ? {
            status:
              "in_progress",

            paymentStatus:
              "final_pending_verification",

            latestPaymentId:
              paymentRef.id,

            finalPaymentProofSubmittedAt:
              serverTimestamp,

            updatedAt:
              serverTimestamp,
          }
        : {
            status:
              "confirmed",

            paymentStatus:
              "deposit_pending_verification",

            latestPaymentId:
              paymentRef.id,

            paymentProofSubmittedAt:
              serverTimestamp,

            updatedAt:
              serverTimestamp,
          },
    );

    try {
      await batch.commit();
    } catch (error) {
      try {
        await deleteImageAsset(
          uploadedProof.publicId,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "DELETE ORPHAN CLOUDINARY PAYMENT PROOF ERROR:",
          cleanupError,
        );
      }

      uploadedProof =
        null;

      throw error;
    }

    /*
     * Notifikasi admin tidak membatalkan payment submission jika
     * Gmail gagal. Firestore notification tetap menjadi audit log.
     */
    try {
      const isFinal =
        invoiceType ===
        "final";

      const bookingCode =
        booking?.bookingCode ||
        bookingId;

      const clientName =
        booking?.client
          ?.fullName ||
        "Client";

      const paymentLabel =
        isFinal
          ? "Pelunasan"
          : "DP";

      const title =
        `Bukti ${paymentLabel} Baru ${bookingCode}`;

      const message =
`${clientName} mengirim bukti pembayaran ${paymentLabel}.

Booking: ${bookingCode}
Invoice: ${invoice?.invoiceNumber || invoiceId}
Reference: ${referenceNumber}
Nominal: ${formatCurrency(amount, currency)}`;

      await notifyAdmins({
        eventKey:
          `payment-submitted-${paymentRef.id}`,

        type:
          isFinal
            ? "final_payment_submitted"
            : "deposit_payment_submitted",

        title,
        message,

        bookingId,
        bookingCode,

        paymentId:
          paymentRef.id,

        invoiceId,

        invoiceType,

        route:
          `/admin/payments?paymentId=${encodeURIComponent(
            paymentRef.id,
          )}`,

        metadata: {
          paymentStage:
            isFinal
              ? "settlement"
              : "deposit",
          amount,
          currency,
          referenceNumber,
          clientName,
          invoiceNumber:
            invoice?.invoiceNumber ||
            null,
        },
      });
    } catch (
      notificationError
    ) {
      console.error(
        "PAYMENT ADMIN NOTIFICATION ERROR:",
        notificationError,
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Bukti pembayaran berhasil dikirim.",
      data: {
        paymentId:
          paymentRef.id,
        referenceNumber,
        status:
          "pending_verification",
        invoiceType,
        proof: {
          url:
            uploadedProof.secureUrl,
          publicId:
            uploadedProof.publicId,
          fileName:
            uploadedProof.fileName,
          mimeType:
            uploadedProof.contentType,
          bytes:
            uploadedProof.bytes,
        },
      },
    });
  } catch (error) {
    console.error(
      "SUBMIT PAYMENT PROOF ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Bukti pembayaran gagal dikirim.",
      500,
    );
  }
}

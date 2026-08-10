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
        "Invoice deposit tidak ditemukan.",
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

    if (
      normalizeBookingStatus(
        booking?.status,
      ) !== "approved"
    ) {
      return jsonError(
        "Bukti pembayaran hanya dapat dikirim saat booking berstatus approved.",
        409,
      );
    }

    if (
      invoice?.bookingId !==
        bookingId ||
      invoice?.type !==
        "deposit" ||
      invoice?.status ===
        "void"
    ) {
      return jsonError(
        "Invoice deposit tidak sesuai dengan booking.",
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
      {
        status:
          "confirmed",

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

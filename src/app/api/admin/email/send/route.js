import {
  NextResponse,
} from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

import {
  buildNotificationHtml,
} from "@/lib/email/notificationHtml";

import {
  sendEmail,
} from "@/lib/email/sendEmail";

export const runtime = "nodejs";

const MAX_PDF_SIZE =
  10 * 1024 * 1024;

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

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || ""),
  );
}

function hasFile(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.arrayBuffer === "function" &&
      Number(value.size) > 0,
  );
}

export async function POST(
  request,
) {
  try {
    const idToken =
      getBearerToken(
        request,
      );

    if (!idToken) {
      return jsonError(
        "Sesi admin tidak tersedia.",
        401,
      );
    }

    let decodedToken;

    try {
      decodedToken =
        await adminAuth.verifyIdToken(
          idToken,
        );
    } catch {
      return jsonError(
        "Sesi admin tidak valid atau sudah berakhir.",
        401,
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
      adminUser?.role !== "admin"
    ) {
      return jsonError(
        "Akses hanya tersedia untuk admin.",
        403,
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

    const subject =
      String(
        formData.get(
          "subject",
        ) || "",
      ).trim();

    const message =
      String(
        formData.get(
          "message",
        ) || "",
      ).trim();

    const templateKey =
      String(
        formData.get(
          "templateKey",
        ) || "blank",
      ).trim();

    const attachment =
      formData.get(
        "attachment",
      );

    if (!bookingId) {
      return jsonError(
        "Booking ID tidak tersedia.",
      );
    }

    if (!subject) {
      return jsonError(
        "Subject email wajib diisi.",
      );
    }

    if (
      subject.length > 180
    ) {
      return jsonError(
        "Subject email maksimal 180 karakter.",
      );
    }

    if (!message) {
      return jsonError(
        "Message email wajib diisi.",
      );
    }

    if (
      message.length > 10000
    ) {
      return jsonError(
        "Message email maksimal 10.000 karakter.",
      );
    }

    const bookingSnapshot =
      await adminDb
        .collection("Bookings")
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

    const booking =
      bookingSnapshot.data();

    // Recipient selalu berasal dari booking.
    // Browser tidak boleh menentukan email tujuan sendiri.
    const recipientEmail =
      String(
        booking?.client?.email ||
          "",
      )
        .trim()
        .toLowerCase();

    if (
      !isEmail(
        recipientEmail,
      )
    ) {
      return jsonError(
        "Email client pada booking tidak valid.",
      );
    }

    let normalizedAttachment =
      null;

    if (
      hasFile(
        attachment,
      )
    ) {
      const fileName =
        String(
          attachment.name ||
            "",
        ).toLowerCase();

      const isPdf =
        attachment.type ===
          "application/pdf" ||
        fileName.endsWith(
          ".pdf",
        );

      if (!isPdf) {
        return jsonError(
          "Attachment harus berupa file PDF.",
        );
      }

      if (
        Number(
          attachment.size,
        ) > MAX_PDF_SIZE
      ) {
        return jsonError(
          "Ukuran PDF maksimal 10 MB.",
        );
      }

      normalizedAttachment = {
        filename:
          attachment.name ||
          `invoice-${booking.bookingCode || bookingId}.pdf`,
        contentType:
          "application/pdf",
        content:
          Buffer.from(
            await attachment.arrayBuffer(),
          ),
      };
    }

    const emailResult =
      await sendEmail({
        to:
          recipientEmail,
        subject,
        text: message,
        html:
          buildNotificationHtml({
            message,
            bookingCode:
              booking.bookingCode ||
              bookingId,
          }),
        attachment:
          normalizedAttachment,
      });

    return NextResponse.json({
      ok: true,
      message:
        "Email berhasil dikirim.",
      data: {
        recipient:
          recipientEmail,
        templateKey,
        attachment:
          normalizedAttachment
            ? {
                fileName:
                  normalizedAttachment.filename,
                mimeType:
                  normalizedAttachment.contentType,
                size:
                  Number(
                    attachment.size,
                  ),
              }
            : null,
        gmailMessageId:
          emailResult.id,
        gmailThreadId:
          emailResult.threadId,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN BOOKING EMAIL ERROR:",
      error,
    );

    return jsonError(
      error?.message ||
        "Email gagal dikirim. Silakan coba kembali.",
      500,
    );
  }
}

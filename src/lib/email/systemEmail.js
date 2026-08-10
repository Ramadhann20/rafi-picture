import {
  FieldValue,
} from "firebase-admin/firestore";

import {
  adminDb,
} from "@/lib/firebase-admin";

import {
  buildNotificationHtml,
} from "@/lib/email/notificationHtml";

import {
  sendEmail,
} from "@/lib/email/sendEmail";

async function writeEmailLog({
  booking,
  sentBy,
  templateKey,
  recipient,
  subject,
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
      booking?.id ||
      null,

    bookingCode:
      booking?.bookingCode ||
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
      templateKey ||
      "system",

    subject,

    attachments:
      attachment
        ? [
            {
              fileName:
                attachment.fileName ||
                attachment.filename ||
                null,
              mimeType:
                attachment.mimeType ||
                attachment.contentType ||
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
      sentBy ||
      null,

    createdAt:
      timestamp,

    ...(status ===
    "sent"
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

/**
 * Sistem email yang tidak melempar error delivery ke caller.
 * Database/business transaction tidak boleh rollback hanya karena
 * Gmail gagal setelah transaction sudah valid.
 */
export async function sendBookingDocumentEmail({
  booking,
  sentBy,
  templateKey,
  subject,
  message,
  attachment = null,
}) {
  const recipient =
    String(
      booking?.client
        ?.email ||
        "",
    )
      .trim()
      .toLowerCase();

  if (!recipient) {
    return {
      sent: false,
      recipient: null,
      logId: null,
      error:
        "Email client tidak tersedia.",
    };
  }

  try {
    const gmail =
      await sendEmail({
        to:
          recipient,
        subject,
        text:
          message,
        html:
          buildNotificationHtml({
            message,
            bookingCode:
              booking?.bookingCode ||
              booking?.id ||
              "-",
          }),
        attachment:
          attachment
            ? {
                filename:
                  attachment.fileName,
                contentType:
                  attachment.mimeType ||
                  "application/pdf",
                content:
                  attachment.content,
              }
            : null,
      });

    let logId =
      null;

    try {
      logId =
        await writeEmailLog({
          booking,
          sentBy,
          templateKey,
          recipient,
          subject,
          attachment,
          status:
            "sent",
          gmailMessageId:
            gmail.id,
          gmailThreadId:
            gmail.threadId,
        });
    } catch (
      logError
    ) {
      console.error(
        "EMAIL LOG SUCCESS WRITE ERROR:",
        logError,
      );
    }

    return {
      sent: true,
      recipient,
      logId,
      gmailMessageId:
        gmail.id,
      gmailThreadId:
        gmail.threadId,
      error: null,
    };
  } catch (error) {
    let logId =
      null;

    try {
      logId =
        await writeEmailLog({
          booking,
          sentBy,
          templateKey,
          recipient,
          subject,
          attachment,
          status:
            "failed",
          errorMessage:
            error?.message ||
            "Email delivery failed.",
        });
    } catch (
      logError
    ) {
      console.error(
        "EMAIL LOG FAILURE WRITE ERROR:",
        logError,
      );
    }

    return {
      sent: false,
      recipient,
      logId,
      error:
        error?.message ||
        "Email delivery failed.",
    };
  }
}
